
import {
  Package,
  RefreshCw,
  Users,
} from "lucide-react";

import "./SupportSidebar.css";

const NAV_ITEMS = [
  {
    id: "refunds",
    label: "Refund requests",
    icon: RefreshCw,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
  },
  {
    id: "orders",
    label: "Orders",
    icon: Package,
  },
];

export default function SupportSidebar({
  activeTab = "refunds",
  onTabChange,
}) {
  return (
    <aside className="support-sidebar">
      {/* ================================================================
                BRAND
            ================================================================= */}

      <div className="support-sidebar__brand">
        <div className="support-sidebar__brand-mark">
          <RefreshCw
            size={17}
            strokeWidth={2.2}
          />
        </div>

        <div className="support-sidebar__brand-copy">
          <strong>
            RefundAI
          </strong>

          <span>
            Support Console
          </span>
        </div>
      </div>

      <div className="support-sidebar__divider" />

      {/* ================================================================
                NAVIGATION
            ================================================================= */}

      <nav
        className="support-sidebar__nav"
        aria-label="Support workspace navigation"
      >
        <span className="support-sidebar__section-label">
          WORKSPACE
        </span>

        {NAV_ITEMS.map((item) => {
          const Icon =
            item.icon;

          const isActive =
            activeTab ===
            item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`support-sidebar__item ${isActive
                  ? "support-sidebar__item--active"
                  : ""
                }`}
              onClick={() =>
                onTabChange?.(
                  item.id,
                )
              }
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
            >
              <Icon
                size={16}
                strokeWidth={1.9}
              />

              <span>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
