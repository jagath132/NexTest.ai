import { useEffect, useState, useCallback } from "react";
import { useAdminStore } from "./store/useAdminStore";
import { api } from "./lib/api";
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { KeysPage } from "./pages/Keys";
import { CustomersPage } from "./pages/Customers";
import { EmailLogPage } from "./pages/EmailLog";
import { PaymentsPage } from "./pages/Payments";
import { VerificationsPage } from "./pages/Verifications";
import { PlansPage } from "./pages/Plans";
import { DeletedUsersPage } from "./pages/DeletedUsers";

export type Page = "dashboard" | "plans" | "keys" | "customers" | "email" | "payments" | "verifications" | "deleted-users";

const NAV_ITEMS: { key: Page; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { key: "plans", label: "Plans", icon: "M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { key: "verifications", label: "Verifications", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { key: "keys", label: "Product Keys", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { key: "customers", label: "Customers", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
  { key: "email", label: "Email Log", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { key: "payments", label: "Transactions", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "deleted-users", label: "Deleted Users", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function App() {
  const { isAuthenticated, loading, checkAuth, logout, admin, keyStats } = useAdminStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("lm_sidebar_collapsed") === "true");
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    function fetchPendingCount() {
      api.get<{ registrations: any[] }>("/api/admin/verifications?status=pending_verification")
        .then((r) => setPendingVerificationsCount(r.data.registrations.length))
        .catch(() => {});
    }
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getInitials = useCallback((email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  }, []);

  const navigate = useCallback((page: Page) => setCurrentPage(page), []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage onNavigate={navigate} />;
      case "plans": return <PlansPage />;
      case "verifications": return <VerificationsPage />;
      case "keys": return <KeysPage />;
      case "customers": return <CustomersPage />;
      case "email": return <EmailLogPage />;
      case "payments": return <PaymentsPage />;
      case "deleted-users": return <DeletedUsersPage />;
      default: return <DashboardPage onNavigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <div style={{ width: 28, height: 28, border: "2px solid var(--color-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "lm-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const pageLabel = NAV_ITEMS.find((n) => n.key === currentPage)?.label;

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("lm_sidebar_collapsed", String(next));
      return next;
    });
  }

  return (
    <div className={`app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
        <div className="sidebar-brand">
            <img src="/logo-mark.svg" alt="NexTest" width="34" height="34" style={{ borderRadius: "var(--radius)", flexShrink: 0 }} />
          <div className="sidebar-brand-text">
            <h1>NexTest</h1>
            <p>License Manager</p>
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} type="button" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={sidebarCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-link${currentPage === item.key ? " active" : ""}`}
              onClick={() => setCurrentPage(item.key)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <NavIcon path={item.icon} />
              <span>{item.label}</span>
              {item.key === "keys" && keyStats && keyStats.available > 0 && (
                <span className="nav-badge">{keyStats.available}</span>
              )}
              {item.key === "verifications" && pendingVerificationsCount > 0 && (
                <span className="nav-badge" style={{ background: "var(--color-warning)" }}>{pendingVerificationsCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {admin && (
            <div className="sidebar-admin">
              <div className="sidebar-admin-avatar">{getInitials(admin.email)}</div>
              <div className="sidebar-admin-info">
                <div className="name">Admin</div>
                <div className="email">{admin.email}</div>
              </div>
            </div>
          )}
          <button className="nav-link" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span>License Manager</span>
              <span>/</span>
              <span>{pageLabel}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-status">
              <div className="topbar-status-dot" />
              <span>Connected</span>
            </div>
          </div>
        </div>
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
