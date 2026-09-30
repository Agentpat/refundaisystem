import { RefreshCw } from "lucide-react";

export default function LoadingState({ label = "Loading…" }) {
    return (
        <div className="support-loading" role="status" aria-live="polite">
            <div className="support-loading__spinner">
                <RefreshCw size={17} strokeWidth={2} />
            </div>

            <span>{label}</span>
        </div>
    );
}