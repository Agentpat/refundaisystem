import {
    CheckCircle2,
    FileText,
    ShieldAlert,
    X,
} from "lucide-react";

function SupportKpi({
    label,
    value,
    tone = "",
    icon: Icon,
}) {
    return (
        <div
            className={`support-kpi ${tone
                    ? `support-kpi--${tone}`
                    : ""
                }`}
        >
            <div className="support-kpi__icon">
                <Icon size={15} />
            </div>

            <div className="support-kpi__body">
                <span>{label}</span>

                <strong>{value}</strong>
            </div>
        </div>
    );
}

export default function RefundKpis({
    stats,
}) {
    return (
        <section className="support-kpis">
            <SupportKpi
                label="All requests"
                value={stats.total}
                icon={FileText}
            />

            <SupportKpi
                label="Approved"
                value={stats.approved}
                tone="approved"
                icon={CheckCircle2}
            />

            <SupportKpi
                label="Needs review"
                value={
                    stats.escalated +
                    stats.pending
                }
                tone="attention"
                icon={ShieldAlert}
            />

            <SupportKpi
                label="Denied"
                value={stats.denied}
                tone="denied"
                icon={X}
            />
        </section>
    );
}