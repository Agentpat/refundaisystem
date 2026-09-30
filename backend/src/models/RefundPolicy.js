import mongoose from "mongoose";

const refundPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    version: {
      type: String,
      required: true,
      trim: true,
    },

    refundWindowDays: {
      type: Number,
      required: true,
      min: 1,
    },

    humanReviewThreshold: {
      type: Number,
      required: true,
      min: 0,
    },

    finalSaleEligible: {
      type: Boolean,
      default: false,
    },

    damagedItemEligible: {
      type: Boolean,
      default: true,
    },

    incorrectItemEligible: {
      type: Boolean,
      default: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const RefundPolicy = mongoose.model("RefundPolicy", refundPolicySchema);

export default RefundPolicy;
