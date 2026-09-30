import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileCheck2,
    Info,
    LockKeyhole,
    Search,
    ShieldCheck,
    Sparkles,
    UserRound,
    X,
    XCircle,
} from "lucide-react";

import {
    createRefundRequest,
    getCustomers,
    getOrders,
    getRefundRequestById,
} from "../services/refund.service.js";

import "../styles/CustomerRefund.css";

const initialForm = {
    customerId: "",
    orderId: "",
    requestedAmount: "",
    reason: "",
};

const initialLookup = {
    reference: "",
    loading: false,
    error: "",
    result: null,
};

const formatCurrency = (amount, currency = "USD") => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "—";
    }

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    } catch {
        return `$${numericAmount.toFixed(2)}`;
    }
};

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
};

const normalizeCollection = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    return [];
};

const getCustomerName = (customer) => {
    if (!customer) {
        return "";
    }

    if (customer.name) {
        return customer.name;
    }

    const fullName = [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || customer.email || customer.customerId || "Customer";
};

const getInitials = (customer) => {
    const name = getCustomerName(customer);

    if (!name) {
        return "CU";
    }

    const parts = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2);

    return parts
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
};

const normalizeRefundResponse = (response) => {
    const data = response?.data ?? response;

    const request = data?.request ?? data;
    const result = data?.result ?? data?.decision ?? data;

    if (!request || typeof request !== "object") {
        return null;
    }

    const requestId =
        request.requestId ||
        request.reference ||
        request.refundReference ||
        data?.requestId ||
        data?.reference;

    const status =
        request.status ||
        result?.status ||
        result?.decision ||
        data?.status ||
        "PENDING";

    const requestedAmount =
        request.requestedAmount ??
        request.amount ??
        result?.requestedAmount ??
        result?.amount ??
        data?.requestedAmount ??
        data?.amount;

    const currency =
        request.currency ||
        result?.currency ||
        data?.currency ||
        "USD";

    const customerResponse =
        request.aiAnalysis?.customerResponse ||
        request.customerResponse ||
        result?.aiAnalysis?.customerResponse ||
        result?.customerResponse ||
        data?.aiAnalysis?.customerResponse ||
        data?.customerResponse ||
        "";

    return {
        request,
        result,
        requestId,
        status: String(status).toUpperCase(),
        requestedAmount,
        currency,
        customerResponse,
        createdAt:
            request.createdAt ||
            request.submittedAt ||
            data?.createdAt ||
            data?.submittedAt,
        updatedAt:
            request.updatedAt ||
            data?.updatedAt,
    };
};

const getStatusConfig = (status) => {
    switch (String(status || "").toUpperCase()) {
        case "APPROVED":
            return {
                label: "Approved",
                eyebrow: "Refund decision",
                description:
                    "Your refund request has been approved and can proceed.",
                nextStep:
                    "Your refund request has passed the review process. Please follow any instructions provided by support.",
                icon: CheckCircle2,
                tone: "approved",
            };

        case "DENIED":
            return {
                label: "Not approved",
                eyebrow: "Refund decision",
                description:
                    "Your refund request was not approved under the applicable refund policy.",
                nextStep:
                    "If you believe this decision is incorrect, contact support and provide your refund reference.",
                icon: XCircle,
                tone: "denied",
            };

        case "ESCALATED":
            return {
                label: "Under support review",
                eyebrow: "Refund decision",
                description:
                    "Your refund request has been escalated for additional support review.",
                nextStep:
                    "A support specialist needs to review this request before a final outcome can be confirmed.",
                icon: AlertCircle,
                tone: "escalated",
            };

        case "PROCESSING":
        case "PENDING":
        default:
            return {
                label: "Still being reviewed",
                eyebrow: "Refund status",
                description:
                    "Your refund request is still being reviewed.",
                nextStep:
                    "No further action is required right now. Check this page again later using your refund reference.",
                icon: Clock3,
                tone: "pending",
            };
    }
};

export default function CustomerRefund() {
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const [lookup, setLookup] = useState(initialLookup);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                const [customerResponse, orderResponse] = await Promise.all([
                    getCustomers(),
                    getOrders(),
                ]);

                if (!mounted) {
                    return;
                }

                setCustomers(normalizeCollection(customerResponse));
                setOrders(normalizeCollection(orderResponse));
            } catch (loadError) {
                console.error("Unable to load refund data:", loadError);

                if (mounted) {
                    setError(
                        loadError?.response?.data?.message ||
                            "We couldn't load the refund request form. Please try again."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, []);

    const selectedCustomer = useMemo(() => {
        return customers.find(
            (customer) =>
                String(customer._id || customer.id || customer.customerId) ===
                String(form.customerId)
        );
    }, [customers, form.customerId]);

    const customerOrders = useMemo(() => {
        if (!form.customerId) {
            return [];
        }

        return orders.filter((order) => {
            const orderCustomerId =
                order.customerId?._id ||
                order.customerId?.id ||
                order.customerId?.customerId ||
                order.customerId;

            return String(orderCustomerId) === String(form.customerId);
        });
    }, [orders, form.customerId]);

    const selectedOrder = useMemo(() => {
        return orders.find(
            (order) =>
                String(order._id || order.id || order.orderId) ===
                String(form.orderId)
        );
    }, [orders, form.orderId]);

    const orderAmount = Number(
        selectedOrder?.totalAmount ??
            selectedOrder?.amount ??
            selectedOrder?.total ??
            0
    );

    const amountEntered = Number(form.requestedAmount || 0);

    const amountExceedsOrder =
        Boolean(form.requestedAmount) &&
        Number.isFinite(orderAmount) &&
        amountEntered > orderAmount;

    const canSubmit =
        Boolean(form.customerId) &&
        Boolean(form.orderId) &&
        Boolean(form.requestedAmount) &&
        amountEntered > 0 &&
        Boolean(form.reason.trim()) &&
        !amountExceedsOrder &&
        !submitting;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
        setResult(null);
    };

    const handleCustomerChange = (event) => {
        const customerId = event.target.value;

        setForm((current) => ({
            ...current,
            customerId,
            orderId: "",
            requestedAmount: "",
            reason: "",
        }));

        setError("");
        setResult(null);
    };

    const handleOrderChange = (event) => {
        setForm((current) => ({
            ...current,
            orderId: event.target.value,
            requestedAmount: "",
            reason: "",
        }));

        setError("");
        setResult(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setResult(null);

        if (!form.customerId) {
            setError("Select the customer associated with this refund request.");
            return;
        }

        if (!form.orderId) {
            setError("Select the order you want to request a refund for.");
            return;
        }

        if (!form.requestedAmount || amountEntered <= 0) {
            setError("Enter a valid refund amount.");
            return;
        }

        if (amountExceedsOrder) {
            setError(
                "The requested refund cannot be greater than the order amount."
            );
            return;
        }

        if (!form.reason.trim()) {
            setError("Tell us why you are requesting this refund.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await createRefundRequest({
                customerId: form.customerId,
                orderId: form.orderId,
                requestedAmount: amountEntered,
                reason: form.reason.trim(),
            });

            const normalized = normalizeRefundResponse(response);

            if (!normalized) {
                throw new Error(
                    "The refund request was submitted but the response could not be read."
                );
            }

            setResult(normalized);

            if (normalized.requestId) {
                setLookup((current) => ({
                    ...current,
                    reference: normalized.requestId,
                    error: "",
                }));
            }
        } catch (submitError) {
            console.error("Unable to submit refund request:", submitError);

            setError(
                submitError?.response?.data?.message ||
                    submitError?.message ||
                    "We couldn't submit your refund request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleLookupChange = (event) => {
        setLookup((current) => ({
            ...current,
            reference: event.target.value.toUpperCase(),
            error: "",
            result: null,
        }));
    };

    const handleLookup = async (event) => {
        event.preventDefault();

        const reference = lookup.reference.trim().toUpperCase();

        if (!reference) {
            setLookup((current) => ({
                ...current,
                error: "Enter your refund reference number.",
                result: null,
            }));

            return;
        }

        setLookup((current) => ({
            ...current,
            loading: true,
            error: "",
            result: null,
        }));

        try {
            const response = await getRefundRequestById(reference);
            const normalized = normalizeRefundResponse(response);

            if (!normalized || !normalized.requestId) {
                throw new Error(
                    "We couldn't read the refund request associated with that reference."
                );
            }

            setLookup((current) => ({
                ...current,
                loading: false,
                error: "",
                result: normalized,
            }));
        } catch (lookupError) {
            console.error("Unable to look up refund request:", lookupError);

            setLookup((current) => ({
                ...current,
                loading: false,
                result: null,
                error:
                    lookupError?.response?.data?.message ||
                    "We couldn't find a refund request with that reference.",
            }));
        }
    };

    const clearLookup = () => {
        setLookup(initialLookup);
    };

    if (loading) {
        return (
            <main className="refund-page">
                <div className="refund-shell">
                    <div className="refund-loading">
                        <div className="refund-loading__spinner">
                            <Sparkles size={17} className="refund-spin" />
                        </div>

                        <div>
                            <strong>Preparing refund support</strong>
                            <span>
                                Loading your customer and order information…
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="refund-page">
            <div className="refund-shell">
                <header className="refund-header">
                    <div className="refund-brand">
                        <div className="refund-brand__mark">R</div>

                        <div>
                            <strong>Refund Support</strong>
                            <span>Customer service workspace</span>
                        </div>
                    </div>

                    <div className="refund-header__security">
                        <LockKeyhole size={14} />
                        <span>Secure request handling</span>
                    </div>
                </header>

                <section className="refund-intro">
                    <div className="refund-intro__copy">
                        <span className="refund-kicker">
                            REFUND SUPPORT
                            <ChevronRight size={12} />
                        </span>

                        <h1>Request a refund</h1>

                        <p>
                            Tell us about the order and the reason for your
                            request. Your request will be reviewed against the
                            applicable refund policy.
                        </p>
                    </div>

                    <div className="refund-intro__note">
                        <ShieldCheck size={17} />

                        <div>
                            <strong>Secure review process</strong>
                            <span>
                                Your request is checked against your order
                                details and refund eligibility rules.
                            </span>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="refund-alert" role="alert">
                        <div className="refund-alert__icon">
                            <AlertCircle size={15} />
                        </div>

                        <div>
                            <strong>We couldn't submit your request</strong>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <section className="refund-lookup">
                    <div className="refund-lookup__copy">
                        <div className="refund-lookup__icon">
                            <Search size={17} />
                        </div>

                        <div>
                            <span className="refund-lookup__eyebrow">
                                ALREADY SUBMITTED A REQUEST?
                            </span>

                            <h2>Check your refund status</h2>

                            <p>
                                Enter the refund reference you received after
                                submitting your request to see its latest
                                status.
                            </p>
                        </div>
                    </div>

                    <form
                        className="refund-lookup__form"
                        onSubmit={handleLookup}
                    >
                        <label htmlFor="refund-reference">
                            Refund reference
                        </label>

                        <div className="refund-lookup__input-row">
                            <div className="refund-lookup__input">
                                <Search size={15} />

                                <input
                                    id="refund-reference"
                                    type="text"
                                    value={lookup.reference}
                                    onChange={handleLookupChange}
                                    placeholder="e.g. REF-602522938603"
                                    autoComplete="off"
                                    spellCheck="false"
                                    aria-describedby={
                                        lookup.error
                                            ? "refund-lookup-error"
                                            : undefined
                                    }
                                />

                                {lookup.reference && (
                                    <button
                                        type="button"
                                        className="refund-lookup__clear"
                                        onClick={clearLookup}
                                        aria-label="Clear reference"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="refund-lookup__button"
                                disabled={lookup.loading}
                            >
                                {lookup.loading ? (
                                    <>
                                        <Sparkles
                                            size={15}
                                            className="refund-spin"
                                        />
                                        Checking
                                    </>
                                ) : (
                                    <>
                                        Check status
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </div>

                        {lookup.error && (
                            <div
                                id="refund-lookup-error"
                                className="refund-lookup__error"
                                role="alert"
                            >
                                <AlertCircle size={13} />
                                <span>{lookup.error}</span>
                            </div>
                        )}
                    </form>
                </section>

                <div className="refund-layout">
                    <section className="refund-card">
                        <div className="refund-card__header">
                            <div>
                                <span>01</span>
                                <h2>Refund request details</h2>
                            </div>

                            <small>Required information</small>
                        </div>

                        <form
                            className="refund-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="refund-field">
                                <label htmlFor="customerId">
                                    <span>Customer</span>
                                    <span>Required</span>
                                </label>

                                <div className="refund-select">
                                    <UserRound size={16} />

                                    <select
                                        id="customerId"
                                        name="customerId"
                                        value={form.customerId}
                                        onChange={handleCustomerChange}
                                        required
                                    >
                                        <option value="">
                                            Select your account
                                        </option>

                                        {customers.map((customer) => {
                                            const customerId =
                                                customer._id ||
                                                customer.id ||
                                                customer.customerId;

                                            return (
                                                <option
                                                    key={customerId}
                                                    value={customerId}
                                                >
                                                    {getCustomerName(customer)}
                                                    {customer.email
                                                        ? ` — ${customer.email}`
                                                        : ""}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <ChevronRight size={15} />
                                </div>
                            </div>

                            {selectedCustomer && (
                                <div className="account-confirmation">
                                    <div className="account-confirmation__avatar">
                                        {getInitials(selectedCustomer)}
                                    </div>

                                    <div className="account-confirmation__details">
                                        <span>Selected account</span>
                                        <strong>
                                            {getCustomerName(selectedCustomer)}
                                        </strong>

                                        {selectedCustomer.email && (
                                            <small>
                                                {selectedCustomer.email}
                                            </small>
                                        )}
                                    </div>

                                    <CheckCircle2 size={16} />
                                </div>
                            )}

                            <div className="refund-field">
                                <label htmlFor="orderId">
                                    <span>Order</span>
                                    <span>Required</span>
                                </label>

                                <div className="refund-select">
                                    <FileCheck2 size={16} />

                                    <select
                                        id="orderId"
                                        name="orderId"
                                        value={form.orderId}
                                        onChange={handleOrderChange}
                                        disabled={!form.customerId}
                                        required
                                    >
                                        <option value="">
                                            {form.customerId
                                                ? "Select the order"
                                                : "Select a customer first"}
                                        </option>

                                        {customerOrders.map((order) => {
                                            const orderId =
                                                order._id ||
                                                order.id ||
                                                order.orderId;

                                            const displayOrderId =
                                                order.orderNumber ||
                                                order.orderId ||
                                                orderId;

                                            return (
                                                <option
                                                    key={orderId}
                                                    value={orderId}
                                                >
                                                    {displayOrderId}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <ChevronRight size={15} />
                                </div>

                                {form.customerId &&
                                    customerOrders.length === 0 && (
                                        <p className="refund-field__hint">
                                            No orders were found for this
                                            customer.
                                        </p>
                                    )}
                            </div>

                            {selectedOrder && (
                                <div className="order-summary">
                                    <div className="order-summary__heading">
                                        <div>
                                            <span>Selected order</span>

                                            <strong>
                                                {selectedOrder.orderNumber ||
                                                    selectedOrder.orderId ||
                                                    selectedOrder._id}
                                            </strong>
                                        </div>

                                        {selectedOrder.status && (
                                            <span
                                                className={`order-status order-status--${String(
                                                    selectedOrder.status
                                                ).toLowerCase()}`}
                                            >
                                                {selectedOrder.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="order-summary__grid">
                                        <div>
                                            <span>Order date</span>
                                            <strong>
                                                {formatDate(
                                                    selectedOrder.orderDate ||
                                                        selectedOrder.createdAt
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Order total</span>
                                            <strong>
                                                {formatCurrency(
                                                    selectedOrder.totalAmount ??
                                                        selectedOrder.amount ??
                                                        selectedOrder.total,
                                                    selectedOrder.currency ||
                                                        "USD"
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="refund-form-divider">
                                Refund details
                            </div>

                            <div className="refund-field">
                                <label htmlFor="requestedAmount">
                                    <span>Requested refund amount</span>
                                    <span>Required</span>
                                </label>

                                <div
                                    className={`refund-amount ${
                                        amountExceedsOrder
                                            ? "refund-amount--error"
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {selectedOrder?.currency || "USD"}
                                    </span>

                                    <input
                                        id="requestedAmount"
                                        name="requestedAmount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.requestedAmount}
                                        onChange={handleChange}
                                        disabled={!form.orderId}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="refund-field__meta">
                                    <span>
                                        {selectedOrder
                                            ? `Order total: ${formatCurrency(
                                                  orderAmount,
                                                  selectedOrder.currency ||
                                                      "USD"
                                              )}`
                                            : "Select an order to continue"}
                                    </span>

                                    {form.requestedAmount && (
                                        <strong>
                                            {formatCurrency(
                                                amountEntered,
                                                selectedOrder?.currency ||
                                                    "USD"
                                            )}
                                        </strong>
                                    )}
                                </div>

                                {amountExceedsOrder && (
                                    <div className="refund-field__error">
                                        <AlertCircle size={12} />
                                        <span>
                                            Refund amount cannot exceed the
                                            order total.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="refund-field">
                                <label htmlFor="reason">
                                    <span>Reason for refund</span>
                                    <span>Required</span>
                                </label>

                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleChange}
                                    placeholder="Briefly explain why you are requesting this refund."
                                    maxLength={1000}
                                    disabled={!form.orderId}
                                    required
                                />

                                <div className="refund-textarea-meta">
                                    <span>
                                        Please provide enough detail to help
                                        us review the request.
                                    </span>

                                    <span>
                                        {form.reason.length}/1000
                                    </span>
                                </div>
                            </div>

                            <div className="refund-policy-note">
                                <div className="refund-policy-note__icon">
                                    <Info size={14} />
                                </div>

                                <div>
                                    <strong>
                                        What happens after you submit
                                    </strong>

                                    <p>
                                        Your order details and refund request
                                        are checked against the active refund
                                        policy. Some requests may require
                                        additional support review.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="refund-submit"
                                disabled={!canSubmit}
                            >
                                {submitting ? (
                                    <>
                                        <Sparkles
                                            size={15}
                                            className="refund-spin"
                                        />
                                        Reviewing request…
                                    </>
                                ) : (
                                    <>
                                        Submit refund request
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>

                            <div className="refund-submit-note">
                                <LockKeyhole size={11} />
                                <span>
                                    Your request is handled securely and linked
                                    to a unique refund reference.
                                </span>
                            </div>
                        </form>
                    </section>

                    <aside className="refund-sidebar">
                        {result ? (
                            <DecisionResult
                                result={result}
                                title="Request received"
                                subtitle="Keep your refund reference so you can check this request again later."
                            />
                        ) : lookup.result ? (
                            <DecisionResult
                                result={lookup.result}
                                title="Latest refund status"
                                subtitle="This is the current status recorded for your refund request."
                            />
                        ) : (
                            <RefundGuidance />
                        )}
                    </aside>
                </div>

                <footer className="refund-footer">
                    <span>Refund Support</span>

                    <div>
                        <ShieldCheck size={11} />
                        <span>Protected customer service flow</span>
                    </div>

                    <span>
                        Keep your refund reference available for future status
                        checks.
                    </span>
                </footer>
            </div>
        </main>
    );
}

function RefundGuidance() {
    return (
        <div className="refund-guidance">
            <div className="refund-guidance__icon">
                <Sparkles size={16} />
            </div>

            <span className="refund-sidebar__eyebrow">
                HOW IT WORKS
            </span>

            <h3>Simple, secure review</h3>

            <p>
                We use your order information and the applicable refund policy
                to determine the next step for your request.
            </p>

            <div className="refund-steps">
                <div className="refund-step">
                    <span className="refund-step__number">01</span>

                    <div>
                        <strong>Submit your request</strong>
                        <span>
                            Choose your account and order, then tell us why you
                            need the refund.
                        </span>
                    </div>
                </div>

                <div className="refund-step">
                    <span className="refund-step__number">02</span>

                    <div>
                        <strong>Request is reviewed</strong>
                        <span>
                            Your request is checked against the refund policy
                            and order information.
                        </span>
                    </div>
                </div>

                <div className="refund-step">
                    <span className="refund-step__number">03</span>

                    <div>
                        <strong>Check your status</strong>
                        <span>
                            Save your reference and return here anytime to see
                            the latest update.
                        </span>
                    </div>
                </div>
            </div>

            <div className="refund-ai-note">
                <ShieldCheck size={14} />

                <div>
                    <strong>Additional review may apply</strong>
                    <span>
                        Requests that need further verification can be reviewed
                        by a support specialist.
                    </span>
                </div>
            </div>
        </div>
    );
}

function DecisionResult({ result, title, subtitle }) {
    const statusConfig = getStatusConfig(result?.status);

    const StatusIcon = statusConfig.icon;

    const customerResponse =
        result?.customerResponse ||
        result?.request?.aiAnalysis?.customerResponse ||
        "";

    const displayReference =
        result?.requestId ||
        result?.request?.requestId ||
        result?.request?.reference ||
        "—";

    const displayAmount =
        result?.requestedAmount ??
        result?.request?.requestedAmount ??
        result?.request?.amount;

    const displayCurrency =
        result?.currency ||
        result?.request?.currency ||
        "USD";

    const statusLabel = statusConfig.label;

    return (
        <div className="decision-panel">
            <div
                className={`decision-header decision-header--${statusConfig.tone}`}
            >
                <div className="decision-header__icon">
                    <StatusIcon size={24} />
                </div>

                <span>{title || statusConfig.eyebrow}</span>

                <h2>{statusLabel}</h2>

                <p>{subtitle || statusConfig.description}</p>
            </div>

            <div className="decision-reference">
                <div>
                    <span>Refund reference</span>
                    <strong>{displayReference}</strong>
                </div>

                <FileCheck2 size={15} />
            </div>

            {displayAmount !== undefined &&
                displayAmount !== null && (
                    <div className="decision-amount">
                        <span>Requested amount</span>

                        <strong>
                            {formatCurrency(
                                displayAmount,
                                displayCurrency
                            )}
                        </strong>
                    </div>
                )}

            <div
                className={`decision-next decision-next--${statusConfig.tone}`}
            >
                <div className="decision-next__icon">
                    <ArrowRight size={13} />
                </div>

                <div>
                    <span>What happens next</span>
                    <strong>{statusConfig.nextStep}</strong>
                </div>
            </div>

            {customerResponse && (
                <div className="decision-section">
                    <div className="decision-section__heading">
                        <div>
                            <Sparkles size={12} />
                        </div>

                        <span>Support response</span>
                    </div>

                    <div
                        className={`customer-status-card customer-status-card--${statusConfig.tone}`}
                    >
                        <StatusIcon size={14} />

                        <div>
                            <strong>{statusLabel}</strong>
                            <span>{customerResponse}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="decision-customer-note">
                <Info size={11} />

                <span>
                    {result?.updatedAt
                        ? `Last updated ${formatDate(result.updatedAt)}.`
                        : result?.createdAt
                        ? `Submitted ${formatDate(result.createdAt)}.`
                        : "Keep this reference to check your request again later."}
                </span>
            </div>

            <div className="decision-footer">
                <ShieldCheck size={11} />

                <span>
                    This status reflects the latest decision recorded for this
                    refund request.
                </span>
            </div>
        </div>
    );
}