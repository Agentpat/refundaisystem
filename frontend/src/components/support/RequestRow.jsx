import { ArrowUpRight } from "lucide-react";

import StatusBadge from "./StatusBadge.jsx";
import "./RequestRow.css";

import {
    formatCurrency,
    getCustomerName,
    getInitials,
    truncate,
} from "../../utils/refundSupport.js";

export default function RequestRow({
    request,
    active = false,
    onClick,
}) {
    /*
    |--------------------------------------------------------------------------
    | Populated relationships
    |--------------------------------------------------------------------------
    |
    | The refund API returns the populated customer and order through:
    |
    | request.customerId
    | request.orderId
    |
    */

    const customer = request?.customerId;
    const order = request?.orderId;

    /*
    |--------------------------------------------------------------------------
    | Customer identity
    |--------------------------------------------------------------------------
    */

    const customerName =
        getCustomerName(customer);

    const customerInitials =
        getInitials(customer);

    /*
    |--------------------------------------------------------------------------
    | Request reference
    |--------------------------------------------------------------------------
    */

    const requestReference =
        request?.requestId ||
        request?._id ||
        "Unknown request";

    /*
    |--------------------------------------------------------------------------
    | Refund reason
    |--------------------------------------------------------------------------
    */

    const reason =
        request?.reason ||
        request?.refundReason ||
        "No refund reason provided.";

    /*
    |--------------------------------------------------------------------------
    | Final operational decision
    |--------------------------------------------------------------------------
    |
    | `status` is the actual final decision.
    |
    | Do NOT use policyDecision here.
    |
    */

    const decision =
        request?.status ||
        "PENDING";

    /*
    |--------------------------------------------------------------------------
    | Refund amount
    |--------------------------------------------------------------------------
    */

    const amount =
        request?.requestedAmount ??
        request?.amount ??
        request?.refundAmount ??
        0;

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    */

    const currency =
        request?.currency ||
        order?.currency ||
        "USD";

    /*
    |--------------------------------------------------------------------------
    | Open request
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Pass only the ID to the parent.
    |
    | Passing the entire request object causes:
    |
    | /refunds/[object Object]
    |
    | which results in a 404.
    |
    */

    const handleOpen = () => {
        if (!onClick) {
            return;
        }

        const id =
            request?.requestId ||
            request?._id;

        if (!id) {
            return;
        }

        onClick(id);
    };

    return (
        <button
            type="button"
            className={`request-row ${active
                    ? "request-row--active"
                    : ""
                }`}
            onClick={handleOpen}
        >
            {/* =========================================================
                CUSTOMER
            ========================================================= */}

            <div className="request-row__customer">
                <div className="request-row__avatar">
                    {customerInitials}
                </div>

                <div className="request-row__identity">
                    <strong
                        title={customerName}
                    >
                        {customerName}
                    </strong>

                    <span
                        title={requestReference}
                    >
                        {requestReference}
                    </span>
                </div>
            </div>

            {/* =========================================================
                REFUND REASON
            ========================================================= */}

            <div className="request-row__reason">
                <span className="request-row__reason-label">
                    Reason for refund
                </span>

                <p title={reason}>
                    {truncate(
                        reason,
                        82,
                    )}
                </p>
            </div>

            {/* =========================================================
                AMOUNT + FINAL DECISION
            ========================================================= */}

            <div className="request-row__decision">
                <div className="request-row__amount">
                    {formatCurrency(
                        amount,
                        currency,
                    )}
                </div>

                <StatusBadge
                    status={decision}
                    compact
                />
            </div>

            {/* =========================================================
                OPEN REQUEST
            ========================================================= */}

            <div
                className="request-row__arrow"
                aria-hidden="true"
            >
                <ArrowUpRight
                    size={16}
                    strokeWidth={1.8}
                />
            </div>
        </button>
    );
}