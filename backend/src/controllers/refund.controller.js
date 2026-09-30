import { randomUUID } from "crypto";
import { z } from "zod";

import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import RefundRequest from "../models/RefundRequest.js";
import AuditLog from "../models/AuditLog.js";

import evaluateRefundPolicy from "../services/policy/refundPolicy.service.js";
import analyzeRefundReason from "../services/ai/refundAI.service.js";

/*
|--------------------------------------------------------------------------
| CREATE REFUND REQUEST VALIDATION
|--------------------------------------------------------------------------
*/

const refundRequestSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),

  orderId: z.string().min(1, "orderId is required"),

  requestedAmount: z
    .number()
    .positive("requestedAmount must be greater than 0"),

  reason: z
    .string()
    .trim()
    .min(3, "reason must be at least 3 characters")
    .max(2000, "reason cannot exceed 2000 characters"),
});

/*
|--------------------------------------------------------------------------
| SUPPORT ACTION VALIDATION
|--------------------------------------------------------------------------
*/

const supportActionSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(2000, "Reason cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
});

/*
|--------------------------------------------------------------------------
| SAFE AUDIT LOGGER
|--------------------------------------------------------------------------
|
| Audit failures should never silently break an already completed support
| status change.
|
| The support action itself is the important operational mutation.
| If the audit schema has an issue, we log the exact problem on the
| backend and return the audit warning to the caller.
|
|--------------------------------------------------------------------------
*/

const createAuditLogSafely = async ({
  refundRequestId,
  event,
  actor,
  details,
}) => {
  try {
    const audit = await AuditLog.create({
      refundRequestId,
      event,
      actor,
      details,
    });

    return {
      success: true,
      audit,
      error: null,
    };
  } catch (error) {
    console.error(`Refund audit log failed [${event}]:`, {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      errors: error?.errors,
    });

    return {
      success: false,
      audit: null,
      error,
    };
  }
};

/*
|--------------------------------------------------------------------------
| CREATE REFUND REQUEST
|--------------------------------------------------------------------------
*/

export const createRefundRequest = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Validate incoming request
    |--------------------------------------------------------------------------
    */

    const validation = refundRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund request.",
        errors: validation.error.flatten(),
      });
    }

    const { customerId, orderId, requestedAmount, reason } = validation.data;

    /*
    |--------------------------------------------------------------------------
    | 2. Resolve customer and order
    |--------------------------------------------------------------------------
    */

    const [customer, order] = await Promise.all([
      Customer.findById(customerId),
      Order.findById(orderId),
    ]);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Run deterministic refund policy
    |--------------------------------------------------------------------------
    */

    const policyResult = await evaluateRefundPolicy({
      customerId,
      orderId,
      requestedAmount,
      reason,
    });

    const policyDecision = String(
      policyResult?.decision || "ESCALATED",
    ).toUpperCase();

    const policySecurityFlags = policyResult?.securityFlags || {};

    const securityAlreadyTriggered =
      Boolean(policySecurityFlags.promptInjectionDetected) ||
      Boolean(policySecurityFlags.suspiciousRequest);

    /*
    |--------------------------------------------------------------------------
    | 4. Initialize AI state
    |--------------------------------------------------------------------------
    */

    let aiAnalysis = null;

    let aiStatus = securityAlreadyTriggered ? "SKIPPED_SECURITY" : "PENDING";

    let aiErrorCode = null;

    /*
    |--------------------------------------------------------------------------
    | 5. Run AI analysis
    |--------------------------------------------------------------------------
    */

    if (!securityAlreadyTriggered) {
      try {
        aiAnalysis = await analyzeRefundReason({
          reason,
          order,
          requestedAmount,
        });

        aiStatus = "AVAILABLE";
      } catch (aiError) {
        aiStatus = "UNAVAILABLE";

        aiErrorCode = aiError?.code || "AI_PROVIDER_ERROR";

        console.error(`AI analysis failed [${aiErrorCode}]:`, aiError?.message);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Analyze AI result
    |--------------------------------------------------------------------------
    */

    const aiDetectedSuspicious = Boolean(aiAnalysis?.suspicious);

    /*
    |--------------------------------------------------------------------------
    | 7. Determine FINAL operational decision
    |--------------------------------------------------------------------------
    */

    let finalDecision = "ESCALATED";

    let finalSummary = "Refund request requires additional review.";

    /*
    |--------------------------------------------------------------------------
    | POLICY DENIED
    |--------------------------------------------------------------------------
    */

    if (policyDecision === "DENIED") {
      finalDecision = "DENIED";

      finalSummary =
        policyResult?.summary ||
        "Your request does not meet one or more refund policy requirements.";
    } else if (policyDecision === "ESCALATED") {

    /*
    |--------------------------------------------------------------------------
    | POLICY ESCALATED
    |--------------------------------------------------------------------------
    */
      finalDecision = "ESCALATED";

      finalSummary =
        policyResult?.summary || "Your request requires additional review.";
    } else if (policyDecision === "APPROVED") {

    /*
    |--------------------------------------------------------------------------
    | POLICY APPROVED
    |--------------------------------------------------------------------------
    */
      if (aiStatus === "UNAVAILABLE") {
        finalDecision = "ESCALATED";

        finalSummary =
          "Refund request was not automatically approved because AI analysis was unavailable. A support specialist must review the request before the refund can proceed.";
      } else if (aiStatus === "SKIPPED_SECURITY") {
        finalDecision = "ESCALATED";

        finalSummary =
          "Refund request was not automatically approved because automated AI analysis was blocked by the security checks. A support specialist must review the request.";
      } else if (aiDetectedSuspicious) {
        finalDecision = "ESCALATED";

        finalSummary =
          "Refund request was escalated because AI analysis detected potentially suspicious or conflicting information that requires human review.";
      } else if (aiStatus === "AVAILABLE") {
        finalDecision = "APPROVED";

        finalSummary =
          policyResult?.summary ||
          "Your request meets the configured refund policy.";
      } else {
        finalDecision = "ESCALATED";

        finalSummary =
          "Refund request was not automatically approved because automated analysis could not be completed. A support specialist must review the request.";
      }
    } else {

    /*
    |--------------------------------------------------------------------------
    | UNKNOWN POLICY STATE
    |--------------------------------------------------------------------------
    */
      finalDecision = "ESCALATED";

      finalSummary =
        "Refund request was not automatically approved because the policy engine returned an unexpected decision. A support specialist must review the request.";
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Merge security flags
    |--------------------------------------------------------------------------
    */

    const existingFlags = Array.isArray(policySecurityFlags.flags)
      ? policySecurityFlags.flags
      : [];

    const securityFlags = {
      promptInjectionDetected: Boolean(
        policySecurityFlags.promptInjectionDetected,
      ),

      suspiciousRequest:
        Boolean(policySecurityFlags.suspiciousRequest) || aiDetectedSuspicious,

      flags: [
        ...new Set([
          ...existingFlags,

          ...(aiDetectedSuspicious ? ["AI_SUSPICIOUS_CLASSIFICATION"] : []),

          ...(aiStatus === "UNAVAILABLE" ? ["AI_ANALYSIS_UNAVAILABLE"] : []),

          ...(aiStatus === "SKIPPED_SECURITY"
            ? ["AI_ANALYSIS_SKIPPED_SECURITY"]
            : []),
        ]),
      ],
    };

    /*
    |--------------------------------------------------------------------------
    | 9. Generate request ID
    |--------------------------------------------------------------------------
    */

    const requestId = `REF-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

    /*
    |--------------------------------------------------------------------------
    | 10. Persist refund request
    |--------------------------------------------------------------------------
    */

    const refundRequest = await RefundRequest.create({
      requestId,

      customerId: customer._id,

      orderId: order._id,

      requestedAmount,

      reason,

      status: finalDecision,

      policyDecision,

      policyEvaluation: policyResult?.checks || [],

      policySummary: finalSummary,

      securityFlags,

      aiAnalysis: aiAnalysis
        ? {
            classification: aiAnalysis.classification,

            confidence: aiAnalysis.confidence,

            explanation: aiAnalysis.explanation,

            customerResponse: aiAnalysis.customerResponse,
          }
        : undefined,

      processedAt: new Date(),
    });

    /*
    |--------------------------------------------------------------------------
    | 11. Audit: request created
    |--------------------------------------------------------------------------
    */

    await createAuditLogSafely({
      refundRequestId: refundRequest._id,

      event: "REQUEST_CREATED",

      actor: "SYSTEM",

      details: {
        requestId,

        customerId: customer.customerId,

        orderId: order.orderId,

        requestedAmount,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | 12. Audit: policy evaluated
    |--------------------------------------------------------------------------
    */

    await createAuditLogSafely({
      refundRequestId: refundRequest._id,

      event: "POLICY_EVALUATED",

      actor: "SYSTEM",

      details: {
        decision: policyDecision,

        checks: policyResult?.checks || [],

        summary: policyResult?.summary || null,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | 13. Audit: AI analyzed
    |--------------------------------------------------------------------------
    */

    if (aiAnalysis) {
      await createAuditLogSafely({
        refundRequestId: refundRequest._id,

        event: "AI_ANALYZED",

        actor: "AI",

        details: {
          status: "AVAILABLE",

          classification: aiAnalysis.classification,

          confidence: aiAnalysis.confidence,

          suspicious: aiAnalysis.suspicious,

          explanation: aiAnalysis.explanation,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 14. Audit: AI unavailable
    |--------------------------------------------------------------------------
    */

    if (aiStatus === "UNAVAILABLE") {
      await createAuditLogSafely({
        refundRequestId: refundRequest._id,

        event: "AI_ANALYSIS_FAILED",

        actor: "SYSTEM",

        details: {
          status: "UNAVAILABLE",

          errorCode: aiErrorCode,

          message:
            "AI analysis was unavailable. Automatic approval was blocked and the refund request was escalated for human review.",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 15. Audit: AI skipped because of security
    |--------------------------------------------------------------------------
    */

    if (aiStatus === "SKIPPED_SECURITY") {
      await createAuditLogSafely({
        refundRequestId: refundRequest._id,

        event: "AI_ANALYSIS_FAILED",

        actor: "SYSTEM",

        details: {
          status: "SKIPPED_SECURITY",

          message:
            "AI analysis was skipped because the deterministic security layer detected suspicious or conflicting request content. Automatic approval was blocked and the refund request was escalated for human review.",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 16. Audit: security flag
    |--------------------------------------------------------------------------
    */

    if (securityFlags.suspiciousRequest) {
      await createAuditLogSafely({
        refundRequestId: refundRequest._id,

        event: "SECURITY_FLAGGED",

        actor: "SYSTEM",

        details: {
          flags: securityFlags.flags,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 17. Audit: final decision
    |--------------------------------------------------------------------------
    */

    await createAuditLogSafely({
      refundRequestId: refundRequest._id,

      event: "DECISION_MADE",

      actor: "SYSTEM",

      details: {
        decision: finalDecision,

        policyDecision,

        source:
          finalDecision === "ESCALATED"
            ? "human-review-required"
            : "policy-and-ai",

        aiStatus,

        aiUsed: Boolean(aiAnalysis),

        escalatedByAI: aiDetectedSuspicious,

        escalatedByAIUnavailable: aiStatus === "UNAVAILABLE",

        escalatedBySecurity: aiStatus === "SKIPPED_SECURITY",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | 18. Return API response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        finalDecision === "ESCALATED"
          ? "Refund request received and routed for human review."
          : "Refund request processed successfully.",

      data: {
        requestId: refundRequest.requestId,

        decision: finalDecision,

        status: refundRequest.status,

        policyDecision,

        customer: {
          customerId: customer.customerId,

          name: `${customer.firstName} ${customer.lastName}`,
        },

        order: {
          orderId: order.orderId,

          totalAmount: order.totalAmount,

          currency: order.currency,
        },

        requestedAmount,

        reason,

        policyChecks: policyResult?.checks || [],

        summary: finalSummary,

        securityFlags,

        aiStatus,

        aiErrorCode,

        aiAnalysis,

        processedAt: refundRequest.processedAt,
      },
    });
  } catch (error) {
    console.error(
      "============================================================",
    );

    console.error("CREATE REFUND REQUEST FAILED");

    console.error(
      "============================================================",
    );

    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Errors:", error?.errors);
    console.error("Stack:", error?.stack);

    console.error(
      "============================================================",
    );

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to process refund request.",
      errorName: error?.name,
      errorCode: error?.code,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL REFUND REQUESTS
|--------------------------------------------------------------------------
*/

export const getRefundRequests = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const skip = (page - 1) * limit;

    const { status } = req.query;

    const filter = {};

    /*
    |--------------------------------------------------------------------------
    | Status filter
    |--------------------------------------------------------------------------
    */

    if (status) {
      const allowedStatuses = ["PENDING", "APPROVED", "DENIED", "ESCALATED"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter.",
          allowedStatuses,
        });
      }

      filter.status = status;
    }

    /*
    |--------------------------------------------------------------------------
    | Query
    |--------------------------------------------------------------------------
    */

    const [requests, total] = await Promise.all([
      RefundRequest.find(filter)
        .populate("customerId", "customerId firstName lastName email")
        .populate("orderId", "orderId totalAmount currency status orderDate")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      RefundRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      data: requests,

      pagination: {
        page,

        limit,

        total,

        totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get refund requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve refund requests.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE REFUND REQUEST
|--------------------------------------------------------------------------
*/

export const getRefundRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const refundRequest = await RefundRequest.findOne({
      requestId,
    })
      .populate(
        "customerId",
        "customerId firstName lastName email phone accountStatus",
      )
      .populate(
        "orderId",
        "orderId items totalAmount currency status orderDate refundedAmount",
      )
      .lean();

    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Audit history
    |--------------------------------------------------------------------------
    */

    const auditLogs = await AuditLog.find({
      refundRequestId: refundRequest._id,
    })
      .sort({
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      data: {
        request: refundRequest,

        auditTimeline: auditLogs,
      },
    });
  } catch (error) {
    console.error("Get refund request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve refund request.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| SUPPORT ACTION
|--------------------------------------------------------------------------
|
| APPROVE
| DENY
| ESCALATE
|
| This changes the operational decision.
|
| It does NOT modify:
|
| - policyDecision
| - policyEvaluation
| - aiAnalysis
| - securityFlags
|
|--------------------------------------------------------------------------
*/

export const takeRefundAction = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Resolve request/action
    |--------------------------------------------------------------------------
    */

    const { requestId, action } = req.params;

    const normalizedAction = String(action || "")
      .trim()
      .toUpperCase();

    const allowedActions = ["APPROVE", "DENY", "ESCALATE"];

    if (!allowedActions.includes(normalizedAction)) {
      return res.status(400).json({
        success: false,

        message: "Invalid refund action.",

        allowedActions,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Validate body
    |--------------------------------------------------------------------------
    */

    const validation = supportActionSchema.safeParse(req.body || {});

    if (!validation.success) {
      return res.status(400).json({
        success: false,

        message: "Invalid support action.",

        errors: validation.error.flatten(),
      });
    }

    const actionReason = validation.data.reason?.trim() || "";

    /*
    |--------------------------------------------------------------------------
    | 3. DENY / ESCALATE require reason
    |--------------------------------------------------------------------------
    */

    if (
      (normalizedAction === "DENY" || normalizedAction === "ESCALATE") &&
      actionReason.length < 3
    ) {
      return res.status(400).json({
        success: false,

        message:
          normalizedAction === "DENY"
            ? "A reason is required when denying a refund."
            : "A reason is required when escalating a refund.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Resolve target status
    |--------------------------------------------------------------------------
    */

    const targetStatusMap = {
      APPROVE: "APPROVED",
      DENY: "DENIED",
      ESCALATE: "ESCALATED",
    };

    const targetStatus = targetStatusMap[normalizedAction];

    /*
    |--------------------------------------------------------------------------
    | 5. Find refund request
    |--------------------------------------------------------------------------
    */

    const refundRequest = await RefundRequest.findOne({
      requestId,
    });

    if (!refundRequest) {
      return res.status(404).json({
        success: false,

        message: "Refund request not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Capture previous status
    |--------------------------------------------------------------------------
    */

    const previousStatus = refundRequest.status;

    /*
    |--------------------------------------------------------------------------
    | 7. Prevent duplicate action
    |--------------------------------------------------------------------------
    */

    if (previousStatus === targetStatus) {
      return res.status(409).json({
        success: false,

        message: `Refund request is already ${targetStatus.toLowerCase()}.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Resolve support actor
    |--------------------------------------------------------------------------
    */

    const actor =
      req.user?.email || req.user?.userId || req.user?.id || "SUPPORT";

    /*
    |--------------------------------------------------------------------------
    | 9. UPDATE THE ACTUAL REFUND STATUS
    |--------------------------------------------------------------------------
    |
    | THIS is the authoritative operational update.
    |
    | Example:
    |
    | PENDING -> APPROVED
    | PENDING -> DENIED
    | ESCALATED -> APPROVED
    |
    | policyDecision remains untouched.
    |
    */

    refundRequest.status = targetStatus;

    refundRequest.processedAt = new Date();

    await refundRequest.save();

    /*
    |--------------------------------------------------------------------------
    | 10. Build audit details
    |--------------------------------------------------------------------------
    */

    const auditDetails = {
      requestId,

      action: normalizedAction,

      previousStatus,

      newStatus: targetStatus,

      reason: actionReason || null,

      policyDecision: refundRequest.policyDecision || null,

      aiClassification: refundRequest.aiAnalysis?.classification || null,

      aiConfidence: refundRequest.aiAnalysis?.confidence ?? null,

      securityFlags: refundRequest.securityFlags?.flags || [],
    };

    /*
    |--------------------------------------------------------------------------
    | 11. Audit support action
    |--------------------------------------------------------------------------
    */

    const actionAudit = await createAuditLogSafely({
      refundRequestId: refundRequest._id,

      event: "ACTION_TAKEN",

      actor,

      details: auditDetails,
    });

    /*
    |--------------------------------------------------------------------------
    | 12. Audit status transition
    |--------------------------------------------------------------------------
    */

    const statusAudit = await createAuditLogSafely({
      refundRequestId: refundRequest._id,

      event: "STATUS_CHANGED",

      actor,

      details: {
        from: previousStatus,

        to: targetStatus,

        reason: actionReason || null,

        source: "SUPPORT",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | 13. Reload updated request
    |--------------------------------------------------------------------------
    |
    | We deliberately reload from MongoDB instead of returning the
    | in-memory document. This guarantees the frontend receives the
    | actual persisted status.
    |
    */

    const updatedRequest = await RefundRequest.findById(refundRequest._id)
      .populate(
        "customerId",
        "customerId firstName lastName email phone accountStatus",
      )
      .populate(
        "orderId",
        "orderId items totalAmount currency status orderDate refundedAmount",
      )
      .lean();

    if (!updatedRequest) {
      return res.status(500).json({
        success: false,

        message:
          "Refund status was updated, but the updated request could not be loaded.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 14. Return updated request
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        normalizedAction === "APPROVE"
          ? "Refund approved successfully."
          : normalizedAction === "DENY"
            ? "Refund denied successfully."
            : "Refund escalated successfully.",

      data: {
        request: updatedRequest,

        action: {
          type: normalizedAction,

          previousStatus,

          newStatus: targetStatus,

          reason: actionReason || null,

          actor,
        },

        audit: {
          actionRecorded: actionAudit.success,

          statusChangeRecorded: statusAudit.success,

          warning:
            !actionAudit.success || !statusAudit.success
              ? "Refund status was updated, but one or more audit entries could not be recorded. Check the backend audit log."
              : null,
        },
      },
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | FULL SUPPORT ACTION ERROR
    |--------------------------------------------------------------------------
    |
    | Do not hide the actual Mongo/Mongoose error during development.
    |
    */

    console.error(
      "============================================================",
    );

    console.error("REFUND SUPPORT ACTION FAILED");

    console.error(
      "============================================================",
    );

    console.error("Request ID:", req.params?.requestId);

    console.error("Action:", req.params?.action);

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Code:", error?.code);

    console.error("Errors:", error?.errors);

    console.error("Stack:", error?.stack);

    console.error(
      "============================================================",
    );

    return res.status(500).json({
      success: false,

      message: error?.message || "Failed to process refund support action.",

      errorName: error?.name,

      errorCode: error?.code,
    });
  }
};
