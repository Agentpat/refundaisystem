import { Search } from "lucide-react";

import RequestRow from "./RequestRow.jsx";
import EmptyState from "./EmptyState.jsx";
import LoadingState from "./LoadingState.jsx";

export default function RequestQueue({
    requests = [],
    loading = false,
    selectedRequest = null,
    search = "",
    statusFilter = "ALL",
    onOpenRequest,
}) {
    /*
    |--------------------------------------------------------------------------
    | SAFE REQUEST COLLECTION
    |--------------------------------------------------------------------------
    |
    | The API normally returns an array, but keeping this defensive prevents
    | the support console from crashing if the response is temporarily
    | undefined/null during loading or after an API error.
    |
    */

    const safeRequests = Array.isArray(requests)
        ? requests
        : [];

    return (
        <section className="request-queue">
            {/* ============================================================
                HEADER
            ============================================================ */}

            <div className="request-queue__header">
                <div className="request-queue__title">
                    <strong>
                        Request queue
                    </strong>

                    <span>
                        Latest customer activity
                    </span>
                </div>

                <div className="request-queue__live">
                    <span />
                    Live
                </div>
            </div>

            {/* ============================================================
                BODY
            ============================================================ */}

            <div className="request-queue__body">
                {loading ? (
                    <LoadingState
                        label="Loading refund queue…"
                    />
                ) : safeRequests.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No requests found"
                        description={
                            search ||
                                statusFilter !== "ALL"
                                ? "Try adjusting your search or status filter."
                                : "Refund requests will appear here when customers submit them."
                        }
                    />
                ) : (
                    <div className="request-list">
                        {safeRequests.map(
                            (request) => {
                                const requestId =
                                    request?.requestId ||
                                    request?._id;

                                if (!requestId) {
                                    return null;
                                }

                                const selectedId =
                                    selectedRequest?.request
                                        ?.requestId ||
                                    selectedRequest?.requestId ||
                                    selectedRequest?._id;

                                return (
                                    <RequestRow
                                        key={requestId}
                                        request={
                                            request
                                        }
                                        active={
                                            selectedId ===
                                            requestId
                                        }
                                        onClick={
                                            onOpenRequest
                                        }
                                    />
                                );
                            },
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}