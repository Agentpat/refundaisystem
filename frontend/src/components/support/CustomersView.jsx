import { Search, Users } from "lucide-react";

import EmptyState from "./EmptyState.jsx";
import LoadingState from "./LoadingState.jsx";

import {
    getCustomerName,
    getInitials,
} from "../../utils/refundSupport.js";

import { useMemo } from "react";

export default function CustomersView({
    customers,
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
                return customers;
            }

            return customers.filter(
                (customer) => {
                    const name =
                        getCustomerName(
                            customer,
                        );

                    return [
                        name,
                        customer.email,
                        customer.customerId,
                        customer.phone,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(
                            query,
                        );
                },
            );
        }, [customers, search]);

    return (
        <section className="directory-view">
            <div className="directory-header">
                <div>
                    <span className="section-kicker">
                        CUSTOMER DIRECTORY
                    </span>

                    <h2>Customers</h2>

                    <p>
                        Customer records available
                        to the support team.
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
                        placeholder="Search customers…"
                    />
                </div>
            </div>

            {loading ? (
                <LoadingState label="Loading customers…" />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No customers found"
                    description="There are no customer records matching this search."
                />
            ) : (
                <div className="directory-table">
                    <div className="directory-table__head">
                        <span>Customer</span>
                        <span>Contact</span>
                        <span>Customer ID</span>
                        <span>Status</span>
                    </div>

                    {filtered.map(
                        (customer) => (
                            <div
                                className="directory-row"
                                key={
                                    customer._id ||
                                    customer.customerId
                                }
                            >
                                <div className="directory-customer">
                                    <div className="customer-avatar">
                                        {getInitials(
                                            customer,
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            {getCustomerName(
                                                customer,
                                            )}
                                        </strong>

                                        <span>
                                            Customer
                                        </span>
                                    </div>
                                </div>

                                <div className="directory-cell">
                                    <strong>
                                        {customer.email ||
                                            "—"}
                                    </strong>

                                    <span>
                                        {customer.phone ||
                                            "No phone"}
                                    </span>
                                </div>

                                <div className="directory-cell directory-cell--mono">
                                    {customer.customerId ||
                                        customer._id ||
                                        "—"}
                                </div>

                                <div>
                                    <span className="directory-status">
                                        {customer.accountStatus ||
                                            "ACTIVE"}
                                    </span>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </section>
    );
}