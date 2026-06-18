import { useEffect, useState } from "react";
import { api, type Transaction } from "../lib/api";

export function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ transactions: Transaction[] }>("/api/admin/transactions")
      .then((r) => setTransactions(r.data.transactions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-header">
        <h3>Payment Transactions</h3>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {transactions.length > 0 ? `${transactions.length} transaction${transactions.length > 1 ? "s" : ""}` : ""}
        </span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading transactions...</p></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3>No transactions yet</h3>
            <p>Payment transactions will appear here when customers purchase via Stripe or Razorpay.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Product Key</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><span className="text-mono" style={{ fontSize: 12 }}>{tx.transactionId}</span></td>
                    <td>{tx.email}</td>
                    <td style={{ fontWeight: 600 }}>{tx.amount != null ? `${tx.currency?.toUpperCase()} ${tx.amount}` : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                    <td>
                      <span className={`badge ${tx.provider === "stripe" ? "badge-available" : "badge-used"}`}>
                        {tx.provider === "stripe" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                        ) : null}
                        {tx.provider}
                      </span>
                    </td>
                    <td><span className="text-mono" style={{ fontSize: 12, letterSpacing: 1 }}>{tx.productKey || <span style={{ color: "var(--text-muted)" }}>-</span>}</span></td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
