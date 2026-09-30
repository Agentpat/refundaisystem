import { useState } from "react";

import {
    History,
    ShieldAlert,
    Zap,
} from "lucide-react";

import StatusBadge from "./StatusBadge.jsx";
import DecisionOverrideForm from "./DecisionOverrideForm.jsx";

export default function DecisionActions({
    request,
    onOverride,
    processing = false,
}) {
    const [open, setOpen] = useState(false);

    if (!request) {
        return null;
    }

    const currentStatus =
        request.status || "PENDING";

    const handleSubmit = async (
        decision,
        reason,
    ) => {
        if (!onOverride || processing) {
            return;
        }

        try {
            await onOverride(
                decision,
                reason,
            );

            setOpen(false);
        } catch {
            // Parent owns the error state.
            // Keep the form open so the operator
            // can review or retry the action.
        }
    };

    return (
        <section className="support-action-card">
            <div className="support-action-card__header">
                <div>
                    <span className="section-kicker">
                        SUPPORT ACTION
                    </span>

                    <h3>
                        Decision controls
                    </h3>

                    <p>
                        Review the automated decision
                        and take a manual action when
                        required.
                    </p>
                </div>

                <div className="support-action-card__header-icon">
                    <Zap
                        size={17}
                        strokeWidth={2}
                    />
                </div>
            </div>

            <div className="support-action-card__current">
                <div className="support-action-card__current-copy">
                    <span>
                        Current system decision
                    </span>

                    <strong>
                        {currentStatus === "APPROVED"
                            ? "Refund approved"
                            : currentStatus === "DENIED"
                                ? "Refund denied"
                                : currentStatus === "ESCALATED"
                                    ? "Manual review required"
                                    : "Refund pending"}
                    </strong>
                </div>

                <StatusBadge
                    status={currentStatus}
                />
            </div>

            <div className="support-action-card__notice">
                <ShieldAlert size={15} />

                <p>
                    Manual actions override the
                    current operational decision and
                    are permanently recorded in the
                    refund audit trail.
                </p>
            </div>

            {!open ? (
                <button
                    type="button"
                    className="override-trigger"
                    onClick={() => setOpen(true)}
                    disabled={processing}
                >
                    <ShieldAlert size={15} />

                    Review / override decision
                </button>
            ) : (
                <DecisionOverrideForm
                    request={request}
                    processing={processing}
                    onCancel={() => {
                        if (!processing) {
                            setOpen(false);
                        }
                    }}
                    onSubmit={handleSubmit}
                />
            )}

            <div className="support-action-card__audit">
                <History size={13} />

                <span>
                    Every manual decision records the
                    operator action, reason, previous
                    status, and new status.
                </span>
            </div>
        </section>
    );
}