import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function PolicyCheck({ check }) {
    const passed = Boolean(check?.passed);

    return (
        <div
            className={`policy-check ${passed
                    ? "policy-check--passed"
                    : "policy-check--failed"
                }`}
        >
            <div className="policy-check__icon">
                {passed ? (
                    <CheckCircle2 size={14} strokeWidth={2.2} />
                ) : (
                    <AlertCircle size={14} strokeWidth={2.2} />
                )}
            </div>

            <div className="policy-check__body">
                <strong>
                    {check?.rule || "Policy rule"}
                </strong>

                <p>
                    {check?.explanation ||
                        "No explanation provided."}
                </p>
            </div>

            <span className="policy-check__result">
                {passed ? "PASS" : "FAIL"}
            </span>
        </div>
    );
}