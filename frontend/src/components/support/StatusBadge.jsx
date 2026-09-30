import { STATUS_CONFIG } from "../../constants/refundSupport.js";

export default function StatusBadge({ status, compact = false }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const Icon = config.icon;

    return (
        <span
            className={`status-badge status-badge--${config.className}${compact ? " status-badge--compact" : ""
                }`}
        >
            <Icon
                size={compact ? 12 : 13}
                strokeWidth={2.2}
            />

            {config.label}
        </span>
    );
}