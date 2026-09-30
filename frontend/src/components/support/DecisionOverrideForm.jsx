import {
    Check,
    ChevronDown,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";

import { useState } from "react";

import {
    MANUAL_DECISION_OPTIONS,
} from "../../constants/refundSupport.js";

export default function DecisionOverrideForm({
    request,
    onCancel,
    onSubmit,
}) {
    const [decision, setDecision] =
        useState(
            request.status === "APPROVED"
                ? "DENIED"
                : "APPROVED",
        );

    const [reason, setReason] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const handleSubmit = async (
        event,
    ) => {
        event.preventDefault();

        if (!reason.trim()) {
            return;
        }

        try {
            setSubmitting(true);

            await onSubmit(
                decision,
                reason.trim(),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="override-form"
            onSubmit={handleSubmit}
        >
            <div className="override-form__notice">
                <ShieldAlert size={16} />

                <div>
                    <strong>
                        Manual decision override
                    </strong>

                    <span>
                        This will replace the
                        current operational
                        decision.
                    </span>
                </div>
            </div>

            <div className="override-form__field">
                <label htmlFor="override-decision">
                    New decision
                </label>

                <div className="override-select">
                    <select
                        id="override-decision"
                        value={decision}
                        onChange={(event) =>
                            setDecision(
                                event.target
                                    .value,
                            )
                        }
                    >
                        {MANUAL_DECISION_OPTIONS.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    <ChevronDown size={15} />
                </div>
            </div>

            <div className="override-form__field">
                <label htmlFor="override-reason">
                    Internal reason
                </label>

                <textarea
                    id="override-reason"
                    value={reason}
                    onChange={(event) =>
                        setReason(
                            event.target
                                .value,
                        )
                    }
                    placeholder="Explain why the automated decision is being overridden…"
                    rows={4}
                    maxLength={1000}
                    required
                />

                <span>
                    {reason.length}/1000
                </span>
            </div>

            <div className="override-form__actions">
                <button
                    type="button"
                    className="button button--secondary"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="button button--primary"
                    disabled={
                        submitting ||
                        !reason.trim()
                    }
                >
                    {submitting ? (
                        <>
                            <RefreshCw
                                size={14}
                                className="is-spinning"
                            />

                            Saving…
                        </>
                    ) : (
                        <>
                            <Check size={14} />

                            Apply decision
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}