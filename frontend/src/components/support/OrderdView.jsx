import {
    Package,
    Search,
} from "lucide-react";

import { useMemo } from "react";

import EmptyState from "./EmptyState.jsx";
import LoadingState from "./LoadingState.jsx";

import {
    formatCurrency,
    formatDate,
    getCustomerName,
} from "../../utils/refundSupport.js";

export default function OrdersView({
    orders,
    loading,
    search,
    setSearch,
}) {
    const filtered =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return orders;
            }

            return orders.filter(
                (order) =>
                    [
                        order.orderId,
                        order.status,
                        order.currency,
                        order.customerId,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(
                            query,
                        ),
            );
        }, [orders, search]);

    return (
        <section className="directory-view">
            <div className="directory-header">
                <div>
                    <span className="section-kicker">
                        ORDER DIRECTORY
                    </span>

                    <h2>Orders</h2>

                    <p>
                        Order records available to
                        the support team.
                    </p>
                </div>

                <div className="directory-search">
                    <Search size={15} />

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search orders…"
                    />
                </div>
            </div>

            {loading ? (
                <LoadingState label="Loading orders…" />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No orders found"
                    description="There are no order records matching this search."
                />
            ) : (
                <div className="directory-table">
                    <div className="directory-table__head directory-table__head--orders">
                        <span>Order</span>
                        <span>Customer</span>
                        <span>Total</span>
                        <span>Status</span>
                        <span>Date</span>
                    </div>

                    {filtered.map(
                        (order) => (
                            <div
                                className="directory-row directory-row--orders"
                                key={
                                    order._id ||
                                    order.orderId
                                }
                            >
                                <div className="directory-order-id">
                                    <Package
                                        size={14}
                                    />

                                    <strong>
                                        {order.orderId ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="directory-cell directory-cell--mono">
                                    {typeof order.customerId ===
                                        "object"
                                        ? getCustomerName(
                                            order.customerId,
                                        )
                                        : order.customerId ||
                                        "—"}
                                </div>

                                <div className="directory-cell">
                                    <strong>
                                        {formatCurrency(
                                            order.totalAmount,
                                            order.currency ||
                                            "USD",
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span className="directory-status">
                                        {order.status ||
                                            "UNKNOWN"}
                                    </span>
                                </div>

                                <div className="directory-cell">
                                    {formatDate(
                                        order.orderDate,
                                    )}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </section>
    );
}