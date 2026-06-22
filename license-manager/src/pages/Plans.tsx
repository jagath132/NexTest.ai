import { useEffect, useState } from "react";
import { api, type Plan } from "../lib/api";
import { PlanModal } from "../components/PlanModal";

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await api.get<{ plans: Plan[] }>("/api/admin/plans");
      setPlans(res.data.plans);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadPlans(); }, []);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const ACCENT_RECIPE: Record<string, { color: string; bg: string }> = {
    free: { color: "var(--color-text-muted)", bg: "transparent" },
    pro: { color: "var(--color-accent)", bg: "var(--color-accent-subtle)" },
    enterprise: { color: "var(--color-warning)", bg: "var(--color-warning-subtle)" },
  };

  return (
    <div>
      <div className="section-header">
        <h3>Plans</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`plan-table-toggle${viewMode === "cards" ? " active" : ""}`} onClick={() => setViewMode("cards")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Cards
          </button>
          <button className={`plan-table-toggle${viewMode === "table" ? " active" : ""}`} onClick={() => setViewMode("table")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
            Table
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 4v16m8-8H4" /></svg>
            Create Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading plans...</p></div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3>No plans defined</h3>
          <p>Create your first plan to define pricing tiers.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 16 }}>
            Create Plan
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <div className="plan-cards-grid">
          {plans.map((p) => {
            return (
              <div key={p.id} className={`plan-card-large${p.popular ? " popular" : ""}`}>
                <div className="plan-card-head">
                  <div className="plan-card-name">{p.name}</div>
                  <div className="plan-card-tier">{p.id}</div>
                  <div className={`plan-card-price${p.price === 0 ? " free" : ""}`}>
                    {formatPrice(p.price)}
                    <span className="plan-card-period">
                      {p.period === "forever" ? "" : `/${p.period === "yearly" ? "yr" : "mo"}`}
                    </span>
                  </div>
                  <div className="plan-card-badges">
                    <span className={`badge ${p.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 10 }}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                    {p.popular && <span className="badge badge-used" style={{ fontSize: 10 }}>Popular</span>}
                  </div>
                </div>
                <div className="plan-card-body">
                  {p.description && <div className="plan-card-desc">{p.description}</div>}
                  <div className="plan-card-features">
                    {p.features.slice(0, 5).map((f, i) => (
                      <div key={i} className="plan-card-feature">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                        {f}
                      </div>
                    ))}
                    {p.features.length > 5 && (
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, textAlign: "center" }}>
                        +{p.features.length - 5} more features
                      </div>
                    )}
                  </div>
                </div>
                <div className="plan-card-footer">
                  <button className="btn btn-primary btn-sm" onClick={() => setEditPlan(p)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Features</th>
                  <th>Limits</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setEditPlan(p)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
                          background: ACCENT_RECIPE[p.id]?.bg || "var(--color-accent-subtle)",
                          color: ACCENT_RECIPE[p.id]?.color || "var(--color-accent)",
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-muted)" }}>{p.id}</div>
                        </div>
                        {p.popular && <span className="badge badge-available" style={{ fontSize: 10, padding: "1px 7px" }}>Popular</span>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 15, color: p.price === 0 ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
                      {formatPrice(p.price)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.period}</td>
                    <td>
                      <span className={`badge ${p.active ? "badge-available" : "badge-expired"}`} style={{ fontSize: 11 }}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{p.features.length}</span>
                      <span style={{ color: "var(--color-text-muted)", marginLeft: 2 }}>features</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {p.maxUsers !== null ? `${p.maxUsers} users` : "Unlimited"}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditPlan(p)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <PlanModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); loadPlans(); }} />
      )}

      {editPlan && (
        <PlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={() => { setEditPlan(null); loadPlans(); }} />
      )}
    </div>
  );
}
