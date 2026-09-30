import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    refundRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefundRequest",
      required: true,
      index: true,
    },

    event: {
      type: String,
      enum: [
        "REQUEST_CREATED",
        "POLICY_EVALUATED",
        "AI_ANALYZED",
        "AI_ANALYSIS_FAILED",
        "SECURITY_FLAGGED",
        "DECISION_MADE",
      ],
      required: true,
    },

    actor: {
      type: String,
      enum: ["SYSTEM", "AI", "SUPPORT"],
      required: true,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
