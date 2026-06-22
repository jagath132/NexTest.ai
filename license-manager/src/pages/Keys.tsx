import { useEffect, useState, useCallback } from "react";
import { api, type ProductKey } from "../lib/api";

export function KeysPage() {
  const [keys, setKeys] = useState<ProductKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genEmail, setGenEmail] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedKey, setSelectedKey] = useState<ProductKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<ProductKey | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (emailFilter) params.set("email", emailFilter);
      const res = await api.get<{ keys: ProductKey[] }>(`/api/admin/keys?${params}`);
      setKeys(res.data.keys);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, [statusFilter, emailFilter]);

  async function handleGenerate() {
    try {
      const payload: any = { count: genCount };
      if (genEmail.trim()) payload.customerEmail = genEmail.trim();
      if (genNotes.trim()) payload.notes = genNotes.trim();
      await api.post("/api/admin/keys/generate", payload);
      setShowGenerate(false);
      setGenCount(10);
      setGenEmail("");
      setGenNotes("");
      await loadKeys();
      showToast("success", `Generated ${genCount} product key${genCount > 1 ? "s" : ""}`);
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to generate keys");
    }
  }

  async function handleRevoke(key: string) {
    if (!confirm(`Revoke key ${key}?`)) return;
    try {
      await api.post("/api/admin/keys/revoke", { key });
      await loadKeys();
      showToast("success", "Key revoked");
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to revoke key");
    }
  }

  async function handleSendEmail(key: ProductKey) {
    const email = prompt("Send product key to email:", key.customerEmail || "");
    if (!email) return;
    try {
      await api.post("/api/admin/email/send", { to: email, productKey: key.key, customerName: email.split("@")[0] });
      showToast("success", "Email sent");
    } catch (err: any) {
      showToast("error", err?.response?.data?.error || "Failed to send email");
    }
  }

  async function handleCopy(keyStr: string) {
    try {
      await navigator.clipboard.writeText(keyStr);
      setCopiedKey(keyStr);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* fallback */ }
  }

  const FILTERS = [
    { label: "All", value: "" },
    { label: "Available", value: "available" },
    { label: "Used", value: "used" },
    { label: "Expired", value: "expired" },
  ];

  return (
    <div>
      <div className="section-header">
        <h3>Product Keys</h3>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 4v16m8-8H4" /></svg>
          Generate Keys
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="pill-group">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`pill${statusFilter === f.value ? " active" : ""}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                  {f.value && keys.length > 0 && statusFilter === f.value && ` (${keys.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="table-toolbar-right">
            <div className="form-search">
              <svg className="form-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="form-input"
                placeholder="Search email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                style={{ width: 200 }}
              />
            </div>
          </div>
        </div>
      </div>

      {showGenerate && (
        <div className="modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Product Keys</h3>
              <button className="modal-close" onClick={() => setShowGenerate(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Number of Keys</label>
                <input className="form-input" type="number" min={1} max={1000} value={genCount} onChange={(e) => setGenCount(parseInt(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label>Assign to Email (optional)</label>
                <input className="form-input" type="email" placeholder="customer@example.com" value={genEmail} onChange={(e) => setGenEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-input" placeholder="Purchase order, campaign, etc." value={genNotes} onChange={(e) => setGenNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowGenerate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading keys...</p></div>
        ) : keys.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h3>No product keys yet</h3>
            <p>Generate your first batch of keys to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Key</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Registered</th>
                  <th>Created</th>
                  <th>Used At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ cursor: "pointer" }} onClick={() => setDetailKey(k)}>
                    <td>
                      <div className="key-cell">
                        <button className={`key-copy-btn${copiedKey === k.key ? " copied" : ""}`}
                          onClick={(e) => { e.stopPropagation(); handleCopy(k.key); }}
                          title={copiedKey === k.key ? "Copied!" : "Copy to clipboard"}>
                          {copiedKey === k.key ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                          )}
                        </button>
                        <span className="key-value">{k.key}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${k.status}`}>{k.status}</span></td>
                    <td>{k.customerEmail || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td>{k.registeredEmail || <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{k.usedAt ? new Date(k.usedAt).toLocaleDateString() : <span style={{ color: "var(--color-text-muted)" }}>-</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {k.status === "available" && (
                          <>
                            <button className="btn btn-sm btn-secondary" onClick={() => handleSendEmail(k)} title="Send via email">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Email
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRevoke(k.key)} title="Revoke this key">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                              Revoke
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => setDetailKey(k)} title="View details">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailKey && (
        <>
          <div className="drawer-overlay" onClick={() => setDetailKey(null)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h3>Key Details</h3>
              <button className="modal-close" onClick={() => setDetailKey(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="drawer-body">
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div className="text-mono" style={{
                  fontSize: 16, fontWeight: 700, letterSpacing: 3,
                  color: "var(--color-accent)", background: "var(--color-accent-subtle)", borderRadius: "var(--radius)",
                  padding: "10px 16px", display: "inline-block", wordBreak: "break-all",
                }}>
                  {detailKey.key}
                </div>
                <div style={{ marginTop: 8 }}>
                  <button className="key-copy-btn" onClick={() => handleCopy(detailKey.key)} title="Copy key" style={{ width: "auto", padding: "4px 12px", gap: 6 }}>
                    {copiedKey === detailKey.key ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg> Copied</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>
                    )}
                  </button>
                </div>
              </div>

              <div className="modal-info-grid">
                <span className="label">Status</span>
                <span className="value"><span className={`badge badge-${detailKey.status}`} style={{ fontSize: 11 }}>{detailKey.status}</span></span>

                <span className="label">Customer Email</span>
                <span className={detailKey.customerEmail ? "value" : "value muted"}>{detailKey.customerEmail || "-"}</span>

                <span className="label">Registered Email</span>
                <span className={detailKey.registeredEmail ? "value" : "value muted"}>{detailKey.registeredEmail || "-"}</span>

                <span className="label">Notes</span>
                <span className={detailKey.notes ? "value" : "value muted"}>{detailKey.notes || "-"}</span>

                <span className="label">Created</span>
                <span className="value">{new Date(detailKey.createdAt).toLocaleString()}</span>

                {detailKey.usedAt && (
                  <>
                    <span className="label">Used At</span>
                    <span className="value">{new Date(detailKey.usedAt).toLocaleString()}</span>
                  </>
                )}

                {detailKey.expiresAt && (
                  <>
                    <span className="label">Expires</span>
                    <span className="value">{new Date(detailKey.expiresAt).toLocaleString()}</span>
                  </>
                )}
              </div>

              <div className="action-row" style={{ marginTop: 24 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedKey(detailKey); setDetailKey(null); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit Key
                </button>
                {detailKey.status === "available" && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSendEmail(detailKey)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Send Email
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(detailKey.key)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedKey && (
        <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Edit Key</h3>
              <button className="modal-close" onClick={() => setSelectedKey(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => { e.preventDefault(); /* reuse existing update */ }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label>Notes</label>
                  <input className="form-input" defaultValue={selectedKey.notes || ""} id="key-notes" placeholder="Purchase order, campaign, etc." />
                </div>
                <div className="form-group">
                  <label>Customer Email</label>
                  <input className="form-input" type="email" defaultValue={selectedKey.customerEmail || ""} id="key-email" placeholder="customer@example.com" />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--color-border-light)", paddingTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedKey(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" onClick={async () => {
                    const notes = (document.getElementById("key-notes") as HTMLInputElement).value;
                    const customerEmail = (document.getElementById("key-email") as HTMLInputElement).value;
                    try {
                      await api.put(`/api/admin/keys/${selectedKey.id}`, { notes, customerEmail });
                      showToast("success", "Key updated");
                      setSelectedKey(null);
                      await loadKeys();
                    } catch (err: any) {
                      showToast("error", err?.response?.data?.error || "Update failed");
                    }
                  }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
