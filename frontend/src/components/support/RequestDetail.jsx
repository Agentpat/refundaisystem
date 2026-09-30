import {
    AlertCircle,
    Bot,
    CheckCircle2,
    Database,
    Mail,
    Package,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserRound,
    X,
} from "lucide-react";

import StatusBadge from "./StatusBadge.jsx";
import LoadingState from "./LoadingState.jsx";
import EmptyState from "./EmptyState.jsx";
import PolicyCheck from "./PolicyCheck.jsx";
import DecisionAction from "./DecisionAction.jsx";

import {
    STATUS_CONFIG,
} from "../../constants/refundSupport.js";

import {
    formatCurrency,
    formatDate,
    formatDateTime,
    getCustomerName,
    normalizeAiStatus,
} from "../../utils/refundSupport.js";

export default function RequestDetail({
    data,
    loading,
    onClose,
    onOverride,
    actionLoading = false,
}) {
    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <aside className="request-detail request-detail--loading">
                <LoadingState label="Loading request…" />
            </aside>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (!data?.request) {
        return (
            <aside className="request-detail request-detail--empty">
                <EmptyState
                    icon={Package}
                    title="Select a refund request"
                    description="Choose a request from the queue to inspect the decision, evidence, AI analysis and support actions."
                />
            </aside>
        );
    }

    const request = data.request;

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    const customer =
        request.customerId &&
            typeof request.customerId === "object"
            ? request.customerId
            : null;

    /*
    |--------------------------------------------------------------------------
    | ORDER
    |--------------------------------------------------------------------------
    */

    const order =
        request.orderId &&
            typeof request.orderId === "object"
            ? request.orderId
            : null;

    /*
    |--------------------------------------------------------------------------
    | AUDIT
    |--------------------------------------------------------------------------
    */

    const auditTimeline =
        data.auditTimeline || [];

    /*
    |--------------------------------------------------------------------------
    | POLICY
    |--------------------------------------------------------------------------
    */

    const policyEvaluation =
        request.policyEvaluation || [];

    /*
    |--------------------------------------------------------------------------
    | SECURITY
    |--------------------------------------------------------------------------
    */

    const securityFlags =
        request.securityFlags || {};

    const flags =
        securityFlags.flags || [];

    /*
    |--------------------------------------------------------------------------
    | AI
    |--------------------------------------------------------------------------
    */

    const aiAnalysis =
        request.aiAnalysis ||
        data.aiAnalysis ||
        null;

    const aiStatus =
        normalizeAiStatus(
            data.aiStatus ||
            request.aiStatus ||
            (
                securityFlags.promptInjectionDetected ||
                    securityFlags.suspiciousRequest
                    ? "SKIPPED"
                    : null
            ),
        );

    const aiErrorCode =
        data.aiErrorCode ||
        request.aiErrorCode ||
        null;

    /*
    |--------------------------------------------------------------------------
    | FINAL OPERATIONAL DECISION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | request.status is the authoritative CURRENT decision.
    |
    | policyDecision is only the automated policy engine's
    | original decision.
    |
    | If support manually overrides a request:
    |
    |     policyDecision = original automated decision
    |     status          = current support decision
    |
    */

    const finalDecision =
        request.status || "PENDING";

    /*
    |--------------------------------------------------------------------------
    | AUTOMATED POLICY DECISION
    |--------------------------------------------------------------------------
    */

    const policyDecision =
        request.policyDecision ||
        "PENDING";

    const decisionConfig =
        STATUS_CONFIG[finalDecision] ||
        STATUS_CONFIG.PENDING;

    const DecisionIcon =
        decisionConfig.icon;

    return (
        <aside className="request-detail">

            {/* ============================================================
                HEADER
            ============================================================ */}

            <div className="request-detail__header">
                <div>
                    <div className="request-detail__eyebrow">
                        REFUND REQUEST
                    </div>

                    <h2>
                        {request.requestId}
                    </h2>

                    <span className="request-detail__created">
                        Submitted{" "}
                        {formatDateTime(
                            request.createdAt,
                        )}
                    </span>
                </div>

                <div className="request-detail__header-actions">
                    <StatusBadge
                        status={finalDecision}
                    />

                    <button
                        type="button"
                        className="mobile-close-button"
                        onClick={onClose}
                        aria-label="Close request details"
                    >
                        <X size={17} />
                    </button>
                </div>
            </div>

            {/* ============================================================
                SUPPORT ACTIONS
            ============================================================ */}

            <DecisionAction
                request={request}
                onOverride={onOverride}
                processing={actionLoading}
            />

            {/* ============================================================
                CURRENT DECISION
            ============================================================ */}

            <section
                className={`decision-card decision-card--${String(
                    finalDecision,
                ).toLowerCase()}`}
            >
                <div className="decision-card__top">
                    <div className="decision-card__icon">
                        <DecisionIcon size={20} />
                    </div>

                    <div>
                        <span className="decision-card__label">
                            Current final decision
                        </span>

                        <h3>
                            {decisionConfig.label}
                        </h3>
                    </div>
                </div>

                <p className="decision-card__summary">
                    {request.policySummary ||
                        "The request was evaluated against the active refund policy."}
                </p>

                <div className="decision-card__meta">
                    <div>
                        <span>
                            Requested
                        </span>

                        <strong>
                            {formatCurrency(
                                request.requestedAmount,
                                order?.currency ||
                                "USD",
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Policy decision
                        </span>

                        <strong>
                            {
                                STATUS_CONFIG[
                                    policyDecision
                                ]?.label ||
                                policyDecision
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Processed
                        </span>

                        <strong>
                            {formatDateTime(
                                request.processedAt,
                            )}
                        </strong>
                    </div>
                </div>
            </section>

            {/* ============================================================
                DECISION INTEGRITY
            ============================================================ */}

            <section className="detail-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            SYSTEM
                        </span>

                        <h3>
                            Decision integrity
                        </h3>
                    </div>

                    <ShieldCheck size={17} />
                </div>

                <div className="integrity-grid">
                    <div className="integrity-item">
                        <div className="integrity-item__icon">
                            <Database size={14} />
                        </div>

                        <div>
                            <strong>
                                Policy engine
                            </strong>

                            <span>
                                Authoritative
                            </span>
                        </div>

                        <CheckCircle2 size={14} />
                    </div>

                    <div className="integrity-item">
                        <div className="integrity-item__icon">
                            <Bot size={14} />
                        </div>

                        <div>
                            <strong>
                                AI analysis
                            </strong>

                            <span>
                                {aiAnalysis
                                    ? "Assistive"
                                    : aiStatus === "SKIPPED"
                                        ? "Skipped"
                                        : aiStatus === "UNAVAILABLE"
                                            ? "Unavailable"
                                            : "Not available"}
                            </span>
                        </div>

                        {aiAnalysis ? (
                            <CheckCircle2 size={14} />
                        ) : (
                            <AlertCircle size={14} />
                        )}
                    </div>
                </div>
            </section>

            {/* ============================================================
                SECURITY ALERT
            ============================================================ */}

            {(
                securityFlags.promptInjectionDetected ||
                securityFlags.suspiciousRequest ||
                flags.length > 0
            ) && (
                    <section className="security-alert">
                        <div className="security-alert__icon">
                            <ShieldAlert size={17} />
                        </div>

                        <div className="security-alert__content">
                            <strong>
                                Security review triggered
                            </strong>

                            <p>
                                Automated processing detected
                                signals that require additional
                                scrutiny.
                            </p>

                            {flags.length > 0 && (
                                <div className="security-alert__flags">
                                    {flags.map(
                                        (flag) => (
                                            <span
                                                key={flag}
                                            >
                                                {flag}
                                            </span>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            {/* ============================================================
                CUSTOMER + ORDER
            ============================================================ */}

            <section className="detail-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            CONTEXT
                        </span>

                        <h3>
                            Customer & order
                        </h3>
                    </div>
                </div>

                <div className="context-grid">
                    <div className="context-card">
                        <div className="context-card__icon">
                            <UserRound size={15} />
                        </div>

                        <div className="context-card__body">
                            <span>
                                Customer
                            </span>

                            <strong>
                                {getCustomerName(
                                    customer,
                                )}
                            </strong>

                            <small>
                                {customer?.email ||
                                    "No email available"}
                            </small>

                            <small>
                                {customer?.customerId ||
                                    "No customer ID"}
                            </small>
                        </div>
                    </div>

                    <div className="context-card">
                        <div className="context-card__icon">
                            <Package size={15} />
                        </div>

                        <div className="context-card__body">
                            <span>
                                Order
                            </span>

                            <strong>
                                {order?.orderId ||
                                    "—"}
                            </strong>

                            <small>
                                {order?.status ||
                                    "Unknown status"}
                            </small>

                            <small>
                                Placed{" "}
                                {formatDate(
                                    order?.orderDate,
                                )}
                            </small>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================
                ORDER ITEMS
            ============================================================ */}

            {Array.isArray(order?.items) &&
                order.items.length > 0 && (
                    <section className="detail-section">
                        <div className="section-heading">
                            <div>
                                <span className="section-kicker">
                                    ORDER
                                </span>

                                <h3>
                                    Items
                                </h3>
                            </div>

                            <span className="section-count">
                                {order.items.length}
                            </span>
                        </div>

                        <div className="order-items">
                            {order.items.map(
                                (
                                    item,
                                    index,
                                ) => (
                                    <div
                                        className="order-item"
                                        key={`${item.productId || item.name}-${index}`}
                                    >
                                        <div className="order-item__main">
                                            <strong>
                                                {
                                                    item.name
                                                }
                                            </strong>

                                            <span>
                                                Qty{" "}
                                                {
                                                    item.quantity
                                                }{" "}
                                                ×{" "}
                                                {formatCurrency(
                                                    item.unitPrice,
                                                    order.currency ||
                                                    "USD",
                                                )}
                                            </span>
                                        </div>

                                        {item.finalSale && (
                                            <span className="final-sale-badge">
                                                FINAL SALE
                                            </span>
                                        )}

                                        <strong className="order-item__total">
                                            {formatCurrency(
                                                Number(
                                                    item.quantity ||
                                                    0,
                                                ) *
                                                Number(
                                                    item.unitPrice ||
                                                    0,
                                                ),
                                                order.currency ||
                                                "USD",
                                            )}
                                        </strong>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className="order-total">
                            <span>
                                Order total
                            </span>

                            <strong>
                                {formatCurrency(
                                    order.totalAmount,
                                    order.currency ||
                                    "USD",
                                )}
                            </strong>
                        </div>
                    </section>
                )}

            {/* ============================================================
                CUSTOMER REASON
            ============================================================ */}

            <section className="detail-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            CUSTOMER MESSAGE
                        </span>

                        <h3>
                            Refund reason
                        </h3>
                    </div>

                    <Mail size={17} />
                </div>

                <div className="customer-reason">
                    {request.reason ||
                        "No reason provided."}
                </div>
            </section>

            {/* ============================================================
                POLICY EVALUATION
            ============================================================ */}

            <section className="detail-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            POLICY ENGINE
                        </span>

                        <h3>
                            Evaluation
                        </h3>
                    </div>

                    <span className="section-count">
                        {policyEvaluation.length}
                    </span>
                </div>

                {policyEvaluation.length > 0 ? (
                    <div className="policy-list">
                        {policyEvaluation.map(
                            (
                                check,
                                index,
                            ) => (
                                <PolicyCheck
                                    key={`${check.rule || "rule"}-${index}`}
                                    check={check}
                                />
                            ),
                        )}
                    </div>
                ) : (
                    <div className="inline-empty">
                        No policy evaluation
                        records available.
                    </div>
                )}
            </section>

            {/* ============================================================
                AI ANALYSIS
            ============================================================ */}

            <section className="detail-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            AI ASSIST
                        </span>

                        <h3>
                            Reason analysis
                        </h3>
                    </div>

                    <Sparkles size={17} />
                </div>

                {aiAnalysis ? (
                    <div className="ai-card">
                        <div className="ai-card__header">
                            <div className="ai-card__classification">
                                <Bot size={15} />

                                <span>
                                    {aiAnalysis.classification ||
                                        "UNCLEAR"}
                                </span>
                            </div>

                            <span className="ai-confidence">
                                {Math.round(
                                    Number(
                                        aiAnalysis.confidence ||
                                        0,
                                    ) * 100,
                                )}
                                % confidence
                            </span>
                        </div>

                        <p className="ai-card__explanation">
                            {aiAnalysis.explanation ||
                                "No AI explanation available."}
                        </p>

                        {aiAnalysis.customerResponse && (
                            <div className="ai-response">
                                <span>
                                    Suggested customer
                                    response
                                </span>

                                <p>
                                    {
                                        aiAnalysis.customerResponse
                                    }
                                </p>
                            </div>
                        )}

                        {aiAnalysis.suspicious && (
                            <div className="ai-warning">
                                <ShieldAlert size={14} />

                                AI marked this message
                                as potentially
                                suspicious.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="ai-unavailable">
                        <div className="ai-unavailable__icon">
                            {aiStatus === "SKIPPED" ? (
                                <ShieldAlert size={17} />
                            ) : (
                                <Bot size={17} />
                            )}
                        </div>

                        <div>
                            <strong>
                                {aiStatus === "SKIPPED"
                                    ? "AI analysis skipped"
                                    : "AI analysis unavailable"}
                            </strong>

                            <p>
                                {aiStatus === "SKIPPED"
                                    ? "The security layer prevented AI processing."
                                    : "The deterministic policy engine remains authoritative."}
                            </p>

                            {aiErrorCode && (
                                <span className="ai-error-code">
                                    {aiErrorCode}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* ============================================================
                AUDIT TIMELINE
            ============================================================ */}

            <section className="detail-section detail-section--last">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">
                            AUDIT
                        </span>

                        <h3>
                            Activity history
                        </h3>
                    </div>

                    <span className="section-count">
                        {auditTimeline.length}
                    </span>
                </div>

                {auditTimeline.length > 0 ? (
                    <div className="audit-timeline">
                        {auditTimeline.map(
                            (
                                event,
                                index,
                            ) => (
                                <div
                                    className="audit-event"
                                    key={
                                        event._id ||
                                        `${event.event}-${index}`
                                    }
                                >
                                    <div className="audit-event__rail">
                                        <div className="audit-event__dot" />

                                        {index !==
                                            auditTimeline.length -
                                            1 && (
                                                <div className="audit-event__line" />
                                            )}
                                    </div>

                                    <div className="audit-event__body">
                                        <div className="audit-event__top">
                                            <strong>
                                                {event.event?.replaceAll(
                                                    "_",
                                                    " ",
                                                ) ||
                                                    "SYSTEM EVENT"}
                                            </strong>

                                            <span>
                                                {formatDateTime(
                                                    event.createdAt,
                                                )}
                                            </span>
                                        </div>

                                        <span className="audit-event__actor">
                                            {event.actor ||
                                                "SYSTEM"}
                                        </span>

                                        {event.details &&
                                            Object.keys(
                                                event.details,
                                            ).length > 0 && (
                                                <pre>
                                                    {JSON.stringify(
                                                        event.details,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            )}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <div className="inline-empty">
                        No audit activity
                        available.
                    </div>
                )}
            </section>
        </aside>
    );
}