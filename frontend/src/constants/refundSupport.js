import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* STATUS CONFIG                                                              */
/* -------------------------------------------------------------------------- */

export const STATUS_CONFIG = {
  APPROVED: {
    label: "Approved",
    className: "approved",
    icon: CheckCircle2,
  },

  DENIED: {
    label: "Denied",
    className: "denied",
    icon: X,
  },

  ESCALATED: {
    label: "Escalated",
    className: "escalated",
    icon: ShieldAlert,
  },

  PENDING: {
    label: "Pending",
    className: "pending",
    icon: Clock3,
  },
};

/* -------------------------------------------------------------------------- */
/* SUPPORT NAVIGATION                                                         */
/* -------------------------------------------------------------------------- */

export const NAV_ITEMS = [
  {
    id: "refunds",
    label: "Refund requests",
    shortLabel: "Refunds",
    icon: RefreshCw,
  },

  {
    id: "customers",
    label: "Customers",
    shortLabel: "Customers",
    icon: null,
  },

  {
    id: "orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: null,
  },
];

/* -------------------------------------------------------------------------- */
/* REFUND STATUS OPTIONS                                                      */
/* -------------------------------------------------------------------------- */

export const REFUND_STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "All statuses",
  },

  {
    value: "PENDING",
    label: "Pending",
  },

  {
    value: "APPROVED",
    label: "Approved",
  },

  {
    value: "DENIED",
    label: "Denied",
  },

  {
    value: "ESCALATED",
    label: "Escalated",
  },
];

/* -------------------------------------------------------------------------- */
/* MANUAL DECISION OPTIONS                                                    */
/* -------------------------------------------------------------------------- */

export const MANUAL_DECISION_OPTIONS = [
  {
    value: "APPROVED",
    label: "Approve refund",
  },

  {
    value: "DENIED",
    label: "Deny refund",
  },

  {
    value: "ESCALATED",
    label: "Escalate for review",
  },
  
];
