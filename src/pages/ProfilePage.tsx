import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";
import { getProfile, saveProfile, getProductKey, changePassword } from "../lib/api";

function getInitials(name: string, fallback = "U") {
  if (!name) return fallback;
  return name.substring(0, 2).toUpperCase();
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const profileName = useAppStore((s) => s.profileName);
  const setProfileName = useAppStore((s) => s.setProfileName);

  const [localName, setLocalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [productKey, setProductKey] = useState<{ key: string; activatedAt: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    getProfile().then((profile) => {
      if (profile.displayName) setProfileName(profile.displayName);
    });
    getProductKey().then(setProductKey);
  }, [user]);

  useEffect(() => {
    setLocalName(profileName);
  }, [profileName]);

  function handleSaveName() {
    const name = localName.trim();
    setSaving(true);
    setProfileName(name);
    saveProfile(name).then(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function handleChangePassword() {
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword) { setPwError("Fill in both fields."); return; }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPwError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (err: any) {
      setPwError(err?.response?.data?.error || err.message || "Failed to change password.");
    }
    setPwSaving(false);
  }

  function handleLogout() {
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  if (!user) return null;

  const initials = getInitials(profileName || user.email.split("@")[0]);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">

      <Card className="overflow-hidden !p-0">
        <div className="relative px-8 pt-12 pb-8" style={{ background: "var(--gradient-primary)" }}>
          <div className="absolute top-4 right-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="8" r="3" />
              <path d="M4 20c0-4 3-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))", backdropFilter: "blur(8px)" }}>
              {initials}
            </div>
            <div className="text-white flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold drop-shadow-sm truncate">{profileName || "Your Account"}</h1>
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-white" />
                  Active
                </span>
              </div>
              <p className="text-sm opacity-90 mt-0.5">{user.email}</p>
              <p className="text-xs opacity-70 mt-1">Member since {joined}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-8 py-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Last sign in: Today
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Email verified
            </span>
          </div>
          <button onClick={handleLogout} type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold btn-ghost cursor-pointer"
            style={{ color: "var(--danger)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </Card>

      {productKey && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--bg-card)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product Key Activated</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Active
                </span>
              </div>
              <p className="text-xs mt-0.5 font-mono tracking-wider" style={{ color: "var(--text-muted)" }}>{productKey.key}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Activated {new Date(productKey.activatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Display Name</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>How others see you in the workspace.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input className="input-modern flex-1 px-4 py-2.5 text-sm" value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter your display name"
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <button onClick={handleSaveName} disabled={saving}
              className="btn-primary px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" type="button"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Appearance</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Switch between light and dark mode.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-card)" }}>
                {theme === "dark" ? (
                  <svg className="h-4 w-4" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{theme === "dark" ? "Dark" : "Light"} Mode</p>
              </div>
            </div>
            <button onClick={toggleTheme} type="button"
              className="relative h-7 w-12 rounded-full transition-colors cursor-pointer"
              style={{ background: theme === "dark" ? "var(--accent)" : "var(--border-default)" }}
              role="switch" aria-checked={theme === "dark"}
            >
              <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transform transition-transform ${theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"}`}>
                {theme === "dark" ? (
                  <svg className="h-3 w-3" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" style={{ color: "var(--accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m15.364-6.364-1.591 1.591M7.227 16.773l-1.591 1.591m12.728 0-1.591-1.591M7.227 7.227 5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { if (theme !== "dark") toggleTheme(); }} type="button"
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${theme === "dark" ? "ring-2" : "hover:bg-[var(--bg-tertiary)]"}`}
              style={{
                background: theme === "dark" ? "var(--accent-soft)" : "var(--bg-secondary)",
                color: theme === "dark" ? "var(--accent)" : "var(--text-muted)",
                borderColor: theme === "dark" ? "var(--accent)" : "var(--border-subtle)",
                ...(theme === "dark" ? { ringColor: "var(--accent)" } : {}),
              }}
            >
              Dark
            </button>
            <button onClick={() => { if (theme !== "light") toggleTheme(); }} type="button"
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${theme === "light" ? "ring-2" : "hover:bg-[var(--bg-tertiary)]"}`}
              style={{
                background: theme === "light" ? "var(--accent-soft)" : "var(--bg-secondary)",
                color: theme === "light" ? "var(--accent)" : "var(--text-muted)",
                ...(theme === "light" ? { ringColor: "var(--accent)" } : {}),
              }}
            >
              Light
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)" }}>
              <svg className="h-5 w-5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Change Password</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Update your account password.</p>
            </div>
          </div>
          {pwError && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{pwError}</p>}
          {pwSuccess && <p className="text-xs mb-3" style={{ color: "var(--success)" }}>{pwSuccess}</p>}
          <div className="space-y-3">
            <input className="input-modern w-full px-4 py-2.5 text-sm" type="password" placeholder="Current password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input className="input-modern w-full px-4 py-2.5 text-sm" type="password" placeholder="New password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            />
            <button onClick={handleChangePassword} disabled={pwSaving || !currentPassword || !newPassword}
              className="btn-primary w-full py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" type="button"
            >
              {pwSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
