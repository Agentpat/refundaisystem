import { RefreshCw } from "lucide-react";

const CONTEXT = {
    refunds: {
        label: "Refund management",
    },

    customers: {
        label: "Customer directory",
    },

    orders: {
        label: "Order directory",
    },
};

export default function SupportTopbar({
    activeTab,
    refreshing,
    onRefresh,
}) {
    const context =
        CONTEXT[activeTab] ||
        CONTEXT.refunds;

    return (
        <header className="support-topbar">
            <div className="support-topbar__context">
                <span>OPERATIONS</span>

                <strong>
                    {context.label}
                </strong>
            </div>

            <div className="support-topbar__actions">
                <div className="support-live">
                    <span />
                    Live system
                </div>

                <button
                    type="button"
                    className="topbar-refresh"
                    onClick={onRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={15}
                        className={
                            refreshing
                                ? "is-spinning"
                                : ""
                        }
                    />

                    <span>
                        Refresh
                    </span>
                </button>
            </div>
        </header>
    );
}