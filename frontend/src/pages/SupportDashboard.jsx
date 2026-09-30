import {
    AlertCircle,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getCustomers,
    getOrders,
    getRefundRequestById,
    getRefundRequests,
    approveRefund,
    denyRefund,
    escalateRefund,
} from "../services/refund.service.js";

import {
    REFUND_STATUS_OPTIONS,
} from "../constants/refundSupport.js";

import {
    getCustomerName,
    normalizeCollection,
    normalizeDetailResponse,
    normalizeListResponse,
} from "../utils/support/supportFormatters.js";

import SupportSidebar from "../components/support/SupportSidebar.jsx";
import SupportTopbar from "../components/support/SupportTopbar.jsx";
import RefundOverview from "../components/support/RefundOverview.jsx";
import RefundKpis from "../components/support/RefundKpis.jsx";
import RefundWorkspace from "../components/support/RefundWorkspace.jsx";
import CustomersView from "../components/support/CustomersView.jsx";
import OrdersView from "../components/support/OrderdView.jsx";

import "../styles/SupportDashboard.css";

export default function SupportDashboard() {
    /* ---------------------------------------------------------------------- */
    /* WORKSPACE                                                              */
    /* ---------------------------------------------------------------------- */

    const [activeTab, setActiveTab] =
        useState("refunds");

    /* ---------------------------------------------------------------------- */
    /* REFUNDS                                                                */
    /* ---------------------------------------------------------------------- */

    const [requests, setRequests] =
        useState([]);

    const [selectedRequest, setSelectedRequest] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [detailError, setDetailError] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [search, setSearch] =
        useState("");

    /* ---------------------------------------------------------------------- */
    /* MANUAL ACTION STATE                                                    */
    /* ---------------------------------------------------------------------- */

    const [actionLoading, setActionLoading] =
        useState(false);

    const [actionError, setActionError] =
        useState("");

    const [actionSuccess, setActionSuccess] =
        useState("");

    /* ---------------------------------------------------------------------- */
    /* DIRECTORIES                                                            */
    /* ---------------------------------------------------------------------- */

    const [customers, setCustomers] =
        useState([]);

    const [orders, setOrders] =
        useState([]);

    const [directoryLoading, setDirectoryLoading] =
        useState(false);

    const [directorySearch, setDirectorySearch] =
        useState("");

    /* ---------------------------------------------------------------------- */
    /* GLOBAL REFRESH                                                         */
    /* ---------------------------------------------------------------------- */

    const [refreshing, setRefreshing] =
        useState(false);

    /* ---------------------------------------------------------------------- */
    /* LOAD REFUNDS                                                           */
    /* ---------------------------------------------------------------------- */

    const loadRequests = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true);
                }

                setError("");

                const response =
                    await getRefundRequests({
                        limit: 100,
                    });

                setRequests(
                    normalizeListResponse(
                        response,
                    ),
                );
            } catch (err) {
                console.error(
                    "Unable to load refund requests:",
                    err,
                );

                setError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "Unable to load refund requests.",
                );
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    /* ---------------------------------------------------------------------- */
    /* LOAD DIRECTORY                                                         */
    /* ---------------------------------------------------------------------- */

    const loadDirectory = useCallback(
        async (type) => {
            try {
                setDirectoryLoading(true);

                if (
                    type ===
                    "customers"
                ) {
                    const response =
                        await getCustomers();

                    setCustomers(
                        normalizeCollection(
                            response,
                        ),
                    );
                }

                if (
                    type ===
                    "orders"
                ) {
                    const response =
                        await getOrders();

                    setOrders(
                        normalizeCollection(
                            response,
                        ),
                    );
                }
            } catch (err) {
                console.error(
                    `Unable to load ${type}:`,
                    err,
                );
            } finally {
                setDirectoryLoading(
                    false,
                );
            }
        },
        [],
    );

    /* ---------------------------------------------------------------------- */
    /* INITIAL LOAD                                                           */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        loadRequests(true);
    }, [loadRequests]);

    /* ---------------------------------------------------------------------- */
    /* DIRECTORY LOAD                                                         */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (
            activeTab ===
            "customers" &&
            customers.length === 0
        ) {
            loadDirectory(
                "customers",
            );
        }

        if (
            activeTab ===
            "orders" &&
            orders.length === 0
        ) {
            loadDirectory("orders");
        }
    }, [
        activeTab,
        customers.length,
        orders.length,
        loadDirectory,
    ]);

    /* ---------------------------------------------------------------------- */
    /* OPEN REFUND                                                            */
    /* ---------------------------------------------------------------------- */

    const openRequest = useCallback(
        async (requestId) => {
            try {
                setDetailLoading(true);
                setDetailError("");
                setActionError("");
                setActionSuccess("");

                const response =
                    await getRefundRequestById(
                        requestId,
                    );

                const detail =
                    normalizeDetailResponse(
                        response,
                    );

                if (!detail?.request) {
                    throw new Error(
                        "Invalid refund request detail response.",
                    );
                }

                setSelectedRequest(detail);
            } catch (err) {
                console.error(
                    "Unable to load refund request:",
                    err,
                );

                setDetailError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "Unable to load request details.",
                );
            } finally {
                setDetailLoading(false);
            }
        },
        [],
    );

    /* ---------------------------------------------------------------------- */
    /* CLOSE DETAIL                                                           */
    /* ---------------------------------------------------------------------- */

    const closeDetail = useCallback(() => {
        setSelectedRequest(null);
        setDetailError("");
        setActionError("");
        setActionSuccess("");
    }, []);

    /* ---------------------------------------------------------------------- */
    /* REFRESH                                                                */
    /* ---------------------------------------------------------------------- */

    const handleRefresh =
        useCallback(async () => {
            try {
                setRefreshing(true);

                if (
                    activeTab ===
                    "refunds"
                ) {
                    await loadRequests(
                        false,
                    );

                    const requestId =
                        selectedRequest
                            ?.request
                            ?.requestId;

                    if (requestId) {
                        await openRequest(
                            requestId,
                        );
                    }

                    return;
                }

                if (
                    activeTab ===
                    "customers"
                ) {
                    await loadDirectory(
                        "customers",
                    );

                    return;
                }

                if (
                    activeTab ===
                    "orders"
                ) {
                    await loadDirectory(
                        "orders",
                    );
                }
            } finally {
                setRefreshing(false);
            }
        }, [
            activeTab,
            loadDirectory,
            loadRequests,
            openRequest,
            selectedRequest,
        ]);

    /* ---------------------------------------------------------------------- */
    /* FILTERED REQUESTS                                                      */
    /* ---------------------------------------------------------------------- */

    const filteredRequests =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return requests.filter(
                (request) => {
                    const customer =
                        request?.customerId;

                    const order =
                        request?.orderId;

                    const customerName =
                        getCustomerName(
                            customer,
                        );

                    const matchesStatus =
                        statusFilter ===
                        "ALL" ||
                        request.status ===
                        statusFilter;

                    if (
                        !matchesStatus
                    ) {
                        return false;
                    }

                    if (!query) {
                        return true;
                    }

                    return [
                        request.requestId,
                        request.reason,
                        request.status,
                        customer?.customerId,
                        customer?.email,
                        customerName,
                        order?.orderId,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(query);
                },
            );
        }, [
            requests,
            search,
            statusFilter,
        ]);

    /* ---------------------------------------------------------------------- */
    /* STATS                                                                  */
    /* ---------------------------------------------------------------------- */

    const stats = useMemo(
        () => ({
            total: requests.length,

            approved:
                requests.filter(
                    (item) =>
                        item.status ===
                        "APPROVED",
                ).length,

            denied:
                requests.filter(
                    (item) =>
                        item.status ===
                        "DENIED",
                ).length,

            escalated:
                requests.filter(
                    (item) =>
                        item.status ===
                        "ESCALATED",
                ).length,

            pending:
                requests.filter(
                    (item) =>
                        item.status ===
                        "PENDING",
                ).length,
        }),
        [requests],
    );

    /* ---------------------------------------------------------------------- */
    /* MANUAL OVERRIDE                                                        */
    /* ---------------------------------------------------------------------- */

    const handleOverride =
        useCallback(
            async (
                decision,
                reason,
            ) => {
                const requestId =
                    selectedRequest
                        ?.request
                        ?.requestId;

                if (!requestId) {
                    throw new Error(
                        "Refund request ID is missing.",
                    );
                }

                if (actionLoading) {
                    return;
                }

                try {
                    setActionLoading(true);
                    setActionError("");
                    setActionSuccess("");

                    console.info(
                        "Manual refund decision requested:",
                        {
                            requestId,
                            decision,
                            reason,
                        },
                    );

                    let response;

                    /*
                    |--------------------------------------------------------------------------
                    | APPROVE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        decision ===
                        "APPROVED"
                    ) {
                        response =
                            await approveRefund(
                                requestId,
                            );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | DENY
                    |--------------------------------------------------------------------------
                    */

                    else if (
                        decision ===
                        "DENIED"
                    ) {
                        response =
                            await denyRefund(
                                requestId,
                                reason,
                            );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | ESCALATE
                    |--------------------------------------------------------------------------
                    */

                    else if (
                        decision ===
                        "ESCALATED"
                    ) {
                        response =
                            await escalateRefund(
                                requestId,
                                reason,
                            );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UNKNOWN DECISION
                    |--------------------------------------------------------------------------
                    */

                    else {
                        throw new Error(
                            `Unsupported refund decision: ${decision}`,
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | NORMALIZE UPDATED REQUEST
                    |--------------------------------------------------------------------------
                    */

                    const updatedRequest =
                        response?.request ||
                        response?.data
                            ?.request ||
                        null;

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE SELECTED DETAIL IMMEDIATELY
                    |--------------------------------------------------------------------------
                    */

                    if (
                        updatedRequest
                    ) {
                        setSelectedRequest(
                            (current) => {
                                if (
                                    !current
                                ) {
                                    return current;
                                }

                                return {
                                    ...current,

                                    request:
                                        updatedRequest,

                                    /*
                                     * The action endpoint
                                     * may return the updated
                                     * request without the
                                     * complete audit timeline.
                                     *
                                     * We reload the complete
                                     * detail below, so this
                                     * gives the UI an immediate
                                     * state update while the
                                     * full detail is fetched.
                                     */
                                };
                            },
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | REFRESH QUEUE
                    |--------------------------------------------------------------------------
                    */

                    await loadRequests(
                        false,
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | RELOAD COMPLETE DETAIL
                    |--------------------------------------------------------------------------
                    |
                    | This is what gives us the fresh:
                    |
                    | - status
                    | - processedAt
                    | - auditTimeline
                    | - populated customer
                    | - populated order
                    |
                    */

                    await openRequest(
                        requestId,
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | SUCCESS MESSAGE
                    |--------------------------------------------------------------------------
                    */

                    const successLabel =
                        decision ===
                            "APPROVED"
                            ? "approved"
                            : decision ===
                                "DENIED"
                                ? "denied"
                                : "escalated";

                    setActionSuccess(
                        `Refund decision updated successfully — request ${successLabel}.`,
                    );
                } catch (err) {
                    console.error(
                        "Unable to apply refund decision:",
                        err,
                    );

                    const message =
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Unable to update refund decision.";

                    setActionError(
                        message,
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | IMPORTANT
                    |--------------------------------------------------------------------------
                    |
                    | Throw again so DecisionActions knows
                    | the action failed and can keep the
                    | override form open.
                    |
                    */

                    throw err;
                } finally {
                    setActionLoading(
                        false,
                    );
                }
            },
            [
                selectedRequest,
                actionLoading,
                loadRequests,
                openRequest,
            ],
        );

    /* ---------------------------------------------------------------------- */
    /* TAB CHANGE                                                             */
    /* ---------------------------------------------------------------------- */

    const handleTabChange =
        useCallback((tab) => {
            setActiveTab(tab);

            setSearch("");

            setDirectorySearch("");

            setStatusFilter("ALL");

            setDetailError("");
            setActionError("");
            setActionSuccess("");

            if (
                tab !==
                "refunds"
            ) {
                setSelectedRequest(
                    null,
                );
            }
        }, []);

    /* ---------------------------------------------------------------------- */
    /* RETRY DETAIL                                                           */
    /* ---------------------------------------------------------------------- */

    const retryDetail =
        useCallback(() => {
            const requestId =
                selectedRequest
                    ?.request
                    ?.requestId;

            if (requestId) {
                openRequest(
                    requestId,
                );
            }
        }, [
            openRequest,
            selectedRequest,
        ]);

    /* ---------------------------------------------------------------------- */
    /* RENDER                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <main className="support-dashboard">
            <div className="support-app-shell">
                <SupportSidebar
                    activeTab={activeTab}
                    onTabChange={
                        handleTabChange
                    }
                    stats={stats}
                />

                <section className="support-main">
                    <SupportTopbar
                        activeTab={activeTab}
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            handleRefresh
                        }
                    />

                    {/* ====================================================== */}
                    {/* REFUNDS                                                 */}
                    {/* ====================================================== */}

                    {activeTab ===
                        "refunds" && (
                            <>
                                <RefundOverview />

                                <RefundKpis
                                    stats={stats}
                                />

                                {error && (
                                    <div className="support-error">
                                        <AlertCircle
                                            size={16}
                                        />

                                        <div>
                                            <strong>
                                                Request
                                                queue
                                                unavailable
                                            </strong>

                                            <span>
                                                {error}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                loadRequests(
                                                    true,
                                                )
                                            }
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {actionError && (
                                    <div className="support-error support-error--action">
                                        <AlertCircle
                                            size={16}
                                        />

                                        <div>
                                            <strong>
                                                Decision
                                                update
                                                failed
                                            </strong>

                                            <span>
                                                {
                                                    actionError
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {actionSuccess && (
                                    <div className="support-success">
                                        <ShieldCheck
                                            size={16}
                                        />

                                        <div>
                                            <strong>
                                                Decision
                                                updated
                                            </strong>

                                            <span>
                                                {
                                                    actionSuccess
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <RefundWorkspace
                                    requests={
                                        filteredRequests
                                    }
                                    loading={
                                        loading
                                    }
                                    selectedRequest={
                                        selectedRequest
                                    }
                                    detailLoading={
                                        detailLoading
                                    }
                                    detailError={
                                        detailError
                                    }
                                    search={search}
                                    statusFilter={
                                        statusFilter
                                    }
                                    filteredCount={
                                        filteredRequests.length
                                    }
                                    statusOptions={
                                        REFUND_STATUS_OPTIONS
                                    }
                                    onSearchChange={
                                        setSearch
                                    }
                                    onStatusChange={
                                        setStatusFilter
                                    }
                                    onClearSearch={() =>
                                        setSearch(
                                            "",
                                        )
                                    }
                                    onOpenRequest={
                                        openRequest
                                    }
                                    onCloseDetail={
                                        closeDetail
                                    }
                                    onRetryDetail={
                                        retryDetail
                                    }
                                    onOverride={
                                        handleOverride
                                    }
                                    actionLoading={
                                        actionLoading
                                    }
                                />
                            </>
                        )}

                    {/* ====================================================== */}
                    {/* CUSTOMERS                                               */}
                    {/* ====================================================== */}

                    {activeTab ===
                        "customers" && (
                            <CustomersView
                                customers={
                                    customers
                                }
                                loading={
                                    directoryLoading
                                }
                                search={
                                    directorySearch
                                }
                                setSearch={
                                    setDirectorySearch
                                }
                            />
                        )}

                    {/* ====================================================== */}
                    {/* ORDERS                                                  */}
                    {/* ====================================================== */}

                    {activeTab ===
                        "orders" && (
                            <OrdersView
                                orders={
                                    orders
                                }
                                loading={
                                    directoryLoading
                                }
                                search={
                                    directorySearch
                                }
                                setSearch={
                                    setDirectorySearch
                                }
                            />
                        )}

                    {/* ====================================================== */}
                    {/* FOOTER                                                  */}
                    {/* ====================================================== */}

                    <footer className="support-footer">
                        <div>
                            <ShieldCheck
                                size={14}
                            />

                            <span>
                                Policy engine
                                remains
                                authoritative
                            </span>
                        </div>

                        <div>
                            <Sparkles
                                size={13}
                            />

                            <span>
                                AI is assistive,
                                not
                                authoritative
                            </span>
                        </div>

                        <span className="support-footer__version">
                            RefundAI Support
                            Console
                        </span>
                    </footer>
                </section>
            </div>
        </main>
    );
}