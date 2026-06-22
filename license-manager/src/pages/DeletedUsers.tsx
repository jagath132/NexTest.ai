import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface DeletedUser {
  id: string;
  originalId: string;
  email: string;
  name: string | null;
  deletedAt: string;
}

export function DeletedUsersPage() {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ deletedUsers: DeletedUser[] }>("/api/admin/deleted-users")
      .then((r) => setDeletedUsers(r.data.deletedUsers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? deletedUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
      )
    : deletedUsers;

  return (
    <div>
      <div className="section-header">
        <h3>Deleted Users</h3>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          {deletedUsers.length > 0 ? `${deletedUsers.length} total` : ""}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-search">
          <svg className="form-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="form-input"
            placeholder="Search deleted users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state"><p>Loading deleted users...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <h3>{search ? "No deleted users match your search" : "No deleted users found"}</h3>
            <p>{search ? "Try a different search term." : "Deleted users will appear here when accounts are removed."}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td><span className="text-mono">{u.email}</span></td>
                    <td>{u.name || "—"}</td>
                    <td><span className="text-muted">{new Date(u.deletedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
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
