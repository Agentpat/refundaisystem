import { useState } from "react";

import CustomerRefund from "./pages/CustomerRefund.jsx";
import SupportDashboard from "./pages/SupportDashboard.jsx";

import "./styles/globals.css";

function App() {
  const [view, setView] = useState("customer");

  const isCustomerView = view === "customer";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>

          <div className="brand-copy">
            <strong>RefundAI</strong>
            <span>Customer Support System</span>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-button ${isCustomerView ? "active" : ""
              }`}
            onClick={() => setView("customer")}
          >
            Customer
          </button>

          <button
            type="button"
            className={`nav-button ${!isCustomerView ? "active" : ""
              }`}
            onClick={() => setView("support")}
          >
            Support Workspace
          </button>
        </nav>
      </header>

      <main className="app-content">
        {isCustomerView ? (
          <CustomerRefund />
        ) : (
          <SupportDashboard />
        )}
      </main>
    </div>
  );
}

export default App;