import Customer from "../../models/Customer.js";
import Order from "../../models/Order.js";
import RefundPolicy from "../../models/RefundPolicy.js";

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(the\s+)?refund\s+policy/i,
  /ignore\s+(the\s+)?system\s+prompt/i,
  /ignore\s+(the\s+)?developer\s+message/i,
  /bypass\s+(the\s+)?policy/i,
  /override\s+(the\s+)?policy/i,
  /override\s+(the\s+)?rules/i,
  /approve\s+(this\s+)?regardless/i,
  /approve\s+my\s+refund\s+regardless/i,
  /jailbreak/i,
  /system\s+prompt/i,
  /developer\s+instructions/i,
  /do\s+not\s+follow\s+(the\s+)?policy/i,
];

const CONFLICTING_PATTERNS = [
  /never\s+received/i,
  /didn'?t\s+receive/i,
  /did\s+not\s+receive/i,
  /already\s+refunded/i,
  /already\s+got\s+my\s+money\s+back/i,
];

const detectSecuritySignals = (reason, order) => {
  const normalizedReason = reason.trim();

  const injectionDetected = INJECTION_PATTERNS.some((pattern) =>
    pattern.test(normalizedReason)
  );

  const flags = [];

  if (injectionDetected) {
    flags.push("PROMPT_INJECTION_ATTEMPT");
  }

  const conflictingClaim =
    order.status === "DELIVERED" &&
    CONFLICTING_PATTERNS.slice(0, 3).some((pattern) =>
      pattern.test(normalizedReason)
    );

  const refundConflict =
    order.refundedAmount === 0 &&
    CONFLICTING_PATTERNS.slice(3).some((pattern) =>
      pattern.test(normalizedReason)
    );

  if (conflictingClaim) {
    flags.push("DELIVERY_STATUS_CONFLICT");
  }

  if (refundConflict) {
    flags.push("REFUND_STATUS_CONFLICT");
  }

  return {
    promptInjectionDetected: injectionDetected,
    suspiciousRequest: flags.length > 0,
    flags,
  };
};

const createCheck = (rule, passed, explanation) => ({
  rule,
  passed,
  explanation,
});

const evaluateRefundPolicy = async ({
  customerId,
  orderId,
  requestedAmount,
  reason,
}) => {
  const [customer, order, policy] = await Promise.all([
    Customer.findById(customerId),
    Order.findById(orderId),
    RefundPolicy.findOne({ active: true }).sort({ createdAt: -1 }),
  ]);

  const checks = [];

  if (!policy) {
    throw new Error("No active refund policy is configured.");
  }

  if (!customer) {
    return {
      decision: "DENIED",
      checks: [
        createCheck(
          "CUSTOMER_EXISTS",
          false,
          "The customer record could not be found."
        ),
      ],
      summary: "Refund denied because the customer record was not found.",
      securityFlags: {
        promptInjectionDetected: false,
        suspiciousRequest: false,
        flags: [],
      },
    };
  }

  checks.push(
    createCheck(
      "CUSTOMER_EXISTS",
      true,
      "The customer record exists."
    )
  );

  if (customer.accountStatus !== "ACTIVE") {
    checks.push(
      createCheck(
        "CUSTOMER_ACCOUNT_ACTIVE",
        false,
        `Customer account status is ${customer.accountStatus}.`
      )
    );

    return {
      decision: "DENIED",
      checks,
      summary: "Refund denied because the customer account is not active.",
      securityFlags: {
        promptInjectionDetected: false,
        suspiciousRequest: false,
        flags: [],
      },
    };
  }

  checks.push(
    createCheck(
      "CUSTOMER_ACCOUNT_ACTIVE",
      true,
      "The customer account is active."
    )
  );

  if (!order) {
    checks.push(
      createCheck(
        "ORDER_EXISTS",
        false,
        "The referenced order could not be found."
      )
    );

    return {
      decision: "DENIED",
      checks,
      summary: "Refund denied because the order was not found.",
      securityFlags: {
        promptInjectionDetected: false,
        suspiciousRequest: false,
        flags: [],
      },
    };
  }

  checks.push(
    createCheck(
      "ORDER_EXISTS",
      true,
      `Order ${order.orderId} exists.`
    )
  );

  const belongsToCustomer =
    order.customerId.toString() === customer._id.toString();

  checks.push(
    createCheck(
      "ORDER_BELONGS_TO_CUSTOMER",
      belongsToCustomer,
      belongsToCustomer
        ? "The order belongs to the requesting customer."
        : "The order does not belong to the requesting customer."
    )
  );

  if (!belongsToCustomer) {
    return {
      decision: "DENIED",
      checks,
      summary:
        "Refund denied because the order does not belong to the requesting customer.",
      securityFlags: {
        promptInjectionDetected: false,
        suspiciousRequest: false,
        flags: [],
      },
    };
  }

  const securityFlags = detectSecuritySignals(reason, order);

  checks.push(
    createCheck(
      "SECURITY_SCREENING",
      !securityFlags.suspiciousRequest,
      securityFlags.suspiciousRequest
        ? `Security screening detected: ${securityFlags.flags.join(", ")}.`
        : "No suspicious or conflicting request patterns were detected."
    )
  );

  if (securityFlags.promptInjectionDetected) {
    return {
      decision: "ESCALATED",
      checks,
      summary:
        "Refund request escalated because the customer message contains an apparent prompt injection attempt.",
      securityFlags,
    };
  }

  if (securityFlags.suspiciousRequest) {
    return {
      decision: "ESCALATED",
      checks,
      summary:
        "Refund request escalated because the request contains conflicting information that requires human review.",
      securityFlags,
    };
  }

  const isDelivered = order.status === "DELIVERED";

  checks.push(
    createCheck(
      "ORDER_STATUS",
      isDelivered,
      isDelivered
        ? "The order has been delivered and is eligible for refund evaluation."
        : `The order status is ${order.status}. Only delivered orders are eligible under the current assessment policy.`
    )
  );

  if (!isDelivered) {
    return {
      decision: "DENIED",
      checks,
      summary:
        "Refund denied because the order is not in a delivered state.",
      securityFlags,
    };
  }

  const remainingRefundableAmount =
    Math.max(order.totalAmount - order.refundedAmount, 0);

  const validAmount =
    Number.isFinite(requestedAmount) &&
    requestedAmount > 0 &&
    requestedAmount <= remainingRefundableAmount;

  checks.push(
    createCheck(
      "REFUND_AMOUNT",
      validAmount,
      validAmount
        ? `Requested refund of $${requestedAmount.toFixed(
            2
          )} is within the remaining refundable amount of $${remainingRefundableAmount.toFixed(
            2
          )}.`
        : `Requested refund of $${Number(requestedAmount || 0).toFixed(
            2
          )} exceeds the remaining refundable amount of $${remainingRefundableAmount.toFixed(
            2
          )} or is invalid.`
    )
  );

  if (!validAmount) {
    return {
      decision: "DENIED",
      checks,
      summary:
        "Refund denied because the requested amount is invalid or exceeds the remaining refundable amount.",
      securityFlags,
    };
  }

  const ageInDays =
    (Date.now() - new Date(order.orderDate).getTime()) /
    (1000 * 60 * 60 * 24);

  const withinRefundWindow =
    ageInDays <= policy.refundWindowDays;

  checks.push(
    createCheck(
      "REFUND_WINDOW",
      withinRefundWindow,
      withinRefundWindow
        ? `Order is ${Math.floor(
            ageInDays
          )} days old and is within the ${policy.refundWindowDays}-day refund window.`
        : `Order is ${Math.floor(
            ageInDays
          )} days old and exceeds the ${policy.refundWindowDays}-day refund window.`
    )
  );

  if (!withinRefundWindow) {
    return {
      decision: "DENIED",
      checks,
      summary:
        "Refund denied because the order is outside the allowed refund window.",
      securityFlags,
    };
  }

  const hasFinalSaleItem = order.items.some((item) => item.finalSale);

  const finalSaleEligible =
    !hasFinalSaleItem || policy.finalSaleEligible;

  checks.push(
    createCheck(
      "FINAL_SALE_RESTRICTION",
      finalSaleEligible,
      hasFinalSaleItem && !policy.finalSaleEligible
        ? "The order contains a final-sale item and final-sale items are not eligible for refunds."
        : "No applicable final-sale restriction prevents this refund."
    )
  );

  if (!finalSaleEligible) {
    return {
      decision: "DENIED",
      checks,
      summary:
        "Refund denied because the order contains an item marked as final sale.",
      securityFlags,
    };
  }

  const exceedsHumanReviewThreshold =
    requestedAmount > policy.humanReviewThreshold;

  checks.push(
    createCheck(
      "HUMAN_REVIEW_THRESHOLD",
      !exceedsHumanReviewThreshold,
      exceedsHumanReviewThreshold
        ? `Requested refund of $${requestedAmount.toFixed(
            2
          )} exceeds the $${policy.humanReviewThreshold.toFixed(
            2
          )} human-review threshold.`
        : `Requested refund is within the automatic approval threshold of $${policy.humanReviewThreshold.toFixed(
            2
          )}.`
    )
  );

  if (exceedsHumanReviewThreshold) {
    return {
      decision: "ESCALATED",
      checks,
      summary:
        "Refund request escalated because the requested amount exceeds the human-review threshold.",
      securityFlags,
    };
  }

  return {
    decision: "APPROVED",
    checks,
    summary:
      "Refund approved by the deterministic policy engine. The request is within the refund window, is not restricted by final-sale rules, and is below the human-review threshold.",
    securityFlags,
  };
};

export default evaluateRefundPolicy;