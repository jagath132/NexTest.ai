import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export function UserDropdown() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const profileName = useAppStore((s) => s.profileName);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function getInitials(email: string) {
    if (!email) return "U";
    const part = email.split("@")[0];
    return part.length <= 2 ? part.toUpperCase() : part.substring(0, 2).toUpperCase();
  }

  function handleLogout() {
    setOpen(false);
    openConfirm("Sign Out", "Are you sure you want to sign out?", () => {
      logout();
      navigate("/");
    }, "Sign Out");
  }

  if (!user) return null;

  const displayName = profileName || user.email.split("@")[0];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg btn-ghost cursor-pointer" aria-label="User menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
          {getInitials(displayName)}
        </div>
        <span className="hidden lg:block text-sm max-w-[120px] truncate" style={{ color: "var(--text-primary)" }}>{displayName}</span>
        <svg className="hidden lg:block h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border shadow-lg animate-fade-in z-50" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          </div>
          <div className="py-1.5">
            <button onClick={() => { setOpen(false); navigate("/profile"); }} type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Profile & Team
            </button>
            <button onClick={() => { setOpen(false); navigate("/ai-settings"); }} type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              AI Configuration
            </button>
          </div>
          <div className="border-t py-1.5" style={{ borderColor: "var(--border-default)" }}>
            <button onClick={handleLogout} type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer"
              style={{ color: "var(--danger)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
