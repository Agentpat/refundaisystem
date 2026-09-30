import {
    AlertCircle,
    ChevronDown,
    Filter,
    Search,
    X,
} from "lucide-react";

import RequestQueue from "./RequestQueue.jsx";
import RequestDetail from "./RequestDetail.jsx";

import "./RefundWorkspace.css";

export default function RefundWorkspace({
    requests = [],
    loading = false,
    selectedRequest = null,
    detailLoading = false,
    detailError = "",
    search = "",
    statusFilter = "ALL",
    filteredCount = 0,
    statusOptions = [],
    onSearchChange,
    onStatusChange,
    onClearSearch,
    onOpenRequest,
    onCloseDetail,
    onRetryDetail,
    onOverride,
    actionLoading = false,
}) {
    return (
        <section className="refund-workspace">
            {/* ============================================================
                WORKSPACE TOOLBAR
            ============================================================ */}

            <div className="workspace-toolbar">
                <div className="workspace-toolbar__title">
                    <span className="section-kicker">
                        LIVE QUEUE
                    </span>

                    <div>
                        <h2>
                            Incoming requests
                        </h2>

                        <span>
                            {filteredCount} visible
                        </span>
                    </div>
                </div>

                <div className="workspace-toolbar__controls">
                    {/* ====================================================
                        SEARCH
                    ==================================================== */}

                    <div className="search-field">
                        <Search
                            size={15}
                            strokeWidth={1.9}
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                onSearchChange?.(
                                    event.target.value,
                                )
                            }
                            placeholder="Search request, customer or order…"
                            aria-label="Search refund requests"
                        />

                        {search && (
                            <button
                                type="button"
                                className="search-clear"
                                onClick={
                                    onClearSearch
                                }
                                aria-label="Clear search"
                            >
                                <X
                                    size={13}
                                    strokeWidth={2}
                                />
                            </button>
                        )}
                    </div>

                    {/* ====================================================
                        STATUS FILTER
                    ==================================================== */}

                    <label className="filter-field">
                        <Filter
                            size={14}
                            strokeWidth={1.9}
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                onStatusChange?.(
                                    event.target.value,
                                )
                            }
                            aria-label="Filter refund requests"
                        >
                            {statusOptions.map(
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

                        <ChevronDown
                            size={13}
                            strokeWidth={1.9}
                        />
                    </label>
                </div>
            </div>

            {/* ============================================================
                QUEUE + DETAIL
            ============================================================ */}

            <div className="refund-workspace__grid">
                {/* ========================================================
                    REQUEST QUEUE
                ======================================================== */}

                <RequestQueue
                    requests={requests}
                    loading={loading}
                    selectedRequest={
                        selectedRequest
                    }
                    search={search}
                    statusFilter={
                        statusFilter
                    }
                    onOpenRequest={
                        onOpenRequest
                    }
                />

                {/* ========================================================
                    REQUEST DETAIL
                ======================================================== */}

                <div
                    className={`request-detail-shell ${selectedRequest
                            ? "request-detail-shell--open"
                            : ""
                        }`}
                >
                    {detailError && (
                        <div className="detail-error">
                            <AlertCircle
                                size={16}
                                strokeWidth={1.9}
                            />

                            <span>
                                {detailError}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    onRetryDetail
                                }
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <RequestDetail
                        data={
                            selectedRequest
                        }
                        loading={
                            detailLoading
                        }
                        onClose={
                            onCloseDetail
                        }
                        onOverride={
                            onOverride
                        }
                        actionLoading={
                            actionLoading
                        }
                    />
                </div>
            </div>
        </section>
    );
}