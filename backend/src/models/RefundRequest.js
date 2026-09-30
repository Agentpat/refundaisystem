import mongoose from "mongoose";

const policyCheckSchema = new mongoose.Schema(
  {
    rule: {
      type: String,
      required: true,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    explanation: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const refundRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED", "ESCALATED"],
      default: "PENDING",
      index: true,
    },

    policyEvaluation: {
      type: [policyCheckSchema],
      default: [],
    },

    policyDecision: {
      type: String,
      enum: ["APPROVED", "DENIED", "ESCALATED"],
    },

    policySummary: {
      type: String,
      trim: true,
    },

    aiAnalysis: {
      classification: {
        type: String,
        trim: true,
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },

      explanation: {
        type: String,
        trim: true,
      },

      customerResponse: {
        type: String,
        trim: true,
      },
    },

    securityFlags: {
      promptInjectionDetected: {
        type: Boolean,
        default: false,
      },

      suspiciousRequest: {
        type: Boolean,
        default: false,
      },

      flags: {
        type: [String],
        default: [],
      },
    },

    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);

export default RefundRequest;
