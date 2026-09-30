import {
    Database,
    Sparkles,
} from "lucide-react";

export default function RefundOverview() {
    return (
        <section className="refund-overview">
            <div>
                <span className="page-kicker">
                    REFUND OPERATIONS
                </span>

                <h1>
                    Refund requests
                </h1>

                <p>
                    Review automated decisions,
                    inspect evidence and take
                    support action when human
                    intervention is required.
                </p>
            </div>

            <div className="overview-meta">
                <div>
                    <Database size={14} />

                    <span>
                        Policy engine
                        authoritative
                    </span>
                </div>

                <div>
                    <Sparkles size={14} />

                    <span>
                        AI assist enabled
                    </span>
                </div>
            </div>
        </section>
    );
}