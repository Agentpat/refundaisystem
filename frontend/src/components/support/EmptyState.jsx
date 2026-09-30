import { FileText } from "lucide-react";

export default function EmptyState({
    title = "Nothing here yet",
    description = "There are no records to display.",
    icon: Icon = FileText,
}) {
    return (
        <div className="support-empty">
            <div className="support-empty__icon">
                <Icon size={22} strokeWidth={1.8} />
            </div>

            <div className="support-empty__content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}