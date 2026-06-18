import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api, type AuthResponse } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { TestForgeIcon } from "../components/ui/TestForgeLogo";

type AuthMode = "login" | "register" | "forgot";

interface AuthPageProps {
  onBackToLanding?: () => void;
}

export function AuthPage({ onBackToLanding }: AuthPageProps) {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const setSavedProviderKeys = useAppStore((s) => s.setSavedProviderKeys);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [productKey, setProductKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const DISPOSABLE_DOMAINS = new Set([
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "1secmail.com", "1secmail.net", "1secmail.org",
    "33mail.com", "armyspy.com", "bccto.com", "bccto.me",
    "burner.email", "cock.li", "dispostable.com", "dodgeit.com",
    "dodgit.com", "dodgit.org", "emailfake.com", "emailnator.com",
    "emailtmp.com", "ephemail.net", "ethereal.email", "fakemail.fr",
    "getairmail.com", "guerrillamail.com", "guerrillamail.net",
    "guerrillamail.org", "hidemail.pro", "hushmail.com",
    "incognitomail.com", "jetable.com", "jetable.net",
    "mail-drop.com", "mail-nospam.com", "mail-temp.com",
    "mail.zpao.xyz", "mailcatch.com", "maileater.com",
    "mailexpire.com", "mailinator.com", "mailinator.net",
    "mailmetrash.com", "mailnator.com", "mailnesia.com",
    "mailsac.com", "mailshell.com", "mailtemp.xyz",
    "mintemail.com", "moakt.com", "nobulk.com", "nospam.xyz",
    "odnorazovoe.ru", "oneoffemail.com", "opentrash.xyz",
    "sharklasers.com", "slopsbox.com", "spam4.me",
    "spambox.us", "spamgourmet.com", "spamspot.com",
    "temp-mail.com", "temp-mail.org", "tempail.com",
    "tempemail.co", "tempemail.net", "tempmail.com",
    "tempmail.net", "tempmail.org", "tempmail.us",
    "tempomail.com", "temporario.com.br", "temporaryemail.net",
    "temporarymail.org", "trash-mail.com", "trash2009.com",
    "trashmail.com", "trashmail.net", "trashmail.org",
    "trashymail.com", "tyldd.com", "wegwerfmail.de",
    "wegwerfmail.net", "wegwerfmail.org", "wh4f.org",
    "whyspam.me", "writeme.us", "xagloo.com", "yopmail.com",
    "yopmail.fr", "yopmail.net", "yuurok.com", "zehnminutenmail.de",
    "zoaxe.com", "zxcv.com", "zxcvbnm.com",
  ]);

  function isDisposableEmail(email: string) {
    if (!email.includes("@")) return false;
    const domain = email.split("@")[1].toLowerCase().trim();
    return DISPOSABLE_DOMAINS.has(domain);
  }

  const KEY_FORMAT = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  const KEY_PARTIAL = /^[A-Z0-9]{0,5}(-[A-Z0-9]{0,5}){0,4}$/;

  function formatProductKeyInput(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const groups = [];
    for (let i = 0; i < cleaned.length && groups.length < 5; i += 5) {
      groups.push(cleaned.slice(i, i + 5));
    }
    return groups.join("-");
  }

  function isKeyPartiallyValid(value: string) {
    if (!value) return true;
    return KEY_PARTIAL.test(value);
  }

  const keyCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (keyCheckRef.current) clearTimeout(keyCheckRef.current); };
  }, []);

  function handleKeyChange(value: string) {
    const formatted = formatProductKeyInput(value);
    setProductKey(formatted);
    if (formatted.length === 29 && KEY_FORMAT.test(formatted)) {
      setKeyStatus("checking");
      if (keyCheckRef.current) clearTimeout(keyCheckRef.current);
      keyCheckRef.current = setTimeout(async () => {
        try {
          const res = await api.post("/api/auth/validate-key", { productKey: formatted });
          setKeyStatus(res.data.valid ? "valid" : "invalid");
        } catch {
          setKeyStatus("invalid");
        }
      }, 400);
    } else {
      if (keyCheckRef.current) clearTimeout(keyCheckRef.current);
      setKeyStatus(formatted.length > 0 ? "idle" : "idle");
    }
  }

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score, label: "", colorClass: "bg-slate-200" };
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    let label = "Weak";
    let colorClass = "bg-rose-500";
    if (score >= 4) { label = "Strong"; colorClass = "bg-emerald-500"; }
    else if (score >= 2) { label = "Medium"; colorClass = "bg-amber-500"; }
    return { score, label, colorClass };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      if (mode === "login") {
        if (isDisposableEmail(email)) { setError("Temporary email addresses are not allowed. Please use a permanent email."); setIsLoading(false); return; }
        const res = await api.post<AuthResponse>("/api/auth/login", { email, password });
        setUser(res.data.user);
        try {
          const keysRes = await api.get<{ keys: Record<string, boolean> }>("/api/settings/api-keys");
          setSavedProviderKeys(keysRes.data.keys ?? {});
        } catch { /* ignore */ }
        navigate("/dashboard");
      } else if (mode === "register") {
        if (password.length < 8) { setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character."); setIsLoading(false); return; }
        if (isDisposableEmail(email)) { setError("Temporary email addresses are not allowed. Please use a permanent email."); setIsLoading(false); return; }
        if (keyStatus !== "valid") { setError("Please enter a valid product key."); setIsLoading(false); return; }
        const res = await api.post<AuthResponse>("/api/auth/register", { email, password, productKey });
        setUser(res.data.user);
        try {
          const keysRes = await api.get<{ keys: Record<string, boolean> }>("/api/settings/api-keys");
          setSavedProviderKeys(keysRes.data.keys ?? {});
        } catch { /* ignore */ }
        navigate("/dashboard");
      } else if (mode === "forgot") {
        const res = await api.post<{ message: string; resetLink?: string }>("/api/auth/forgot-password", { email });
        setSuccessMessage(res.data.message);
        if (res.data.resetLink) setResetLink(res.data.resetLink);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || "An error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Background accents */}
      <div className="absolute top-[-15%] left-[-10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-full opacity-[0.06] pointer-events-none animate-float-slow max-sm:hidden" style={{ background: "var(--accent-violet)", filter: "blur(180px)" }} />
      <div className="absolute bottom-[-15%] right-[-10%] h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] rounded-full opacity-[0.05] pointer-events-none animate-float-slow max-sm:hidden" style={{ background: "var(--accent-cyan)", filter: "blur(180px)" }} />
      <div className="absolute top-[40%] left-[50%] h-[200px] w-[200px] sm:h-[400px] sm:w-[400px] rounded-full opacity-[0.04] pointer-events-none animate-float-slow max-sm:hidden" style={{ background: "var(--accent-rose)", filter: "blur(180px)", animationDelay: "-3s" }} />

      <div className="relative w-full max-w-sm sm:max-w-md rounded-lg p-5 sm:p-8 animate-fade-in gradient-border" style={{ background: "var(--bg-card)" }}>
        <div className="flex flex-col items-center mb-6">
          <TestForgeIcon size="lg" />
          <h1 className="text-2xl font-bold tracking-tight mt-4 gradient-text-rainbow">TestForge</h1>
          <p className="text-sm mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
            {mode === "login"
              ? "Sign in to manage test assets and generation models."
              : mode === "register"
              ? "Create your professional testing automation environment."
              : "Restore access to your TestForge dashboard."}
          </p>
        </div>

        <button onClick={() => { onBackToLanding?.(); navigate("/"); }}
          className="btn-ghost w-full py-2.5 mb-5 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex flex-col items-start gap-2.5 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}>
            <div className="flex items-start gap-2.5">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {mode === "forgot" && successMessage ? (
          <div className="space-y-3">
            {resetLink && (
              <a href={resetLink} className="btn-primary w-full py-3 text-sm font-semibold inline-block text-center no-underline cursor-pointer">
                Open Reset Link
              </a>
            )}
            <button onClick={() => { setMode("login"); setSuccessMessage(""); setResetLink(""); }}
              className="btn-secondary w-full py-3 text-sm font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 11-18 0" />
                  </svg>
                </span>
                <input id="email" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-modern w-full py-3 pl-11 pr-4 text-sm"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Password
                  </label>
                  {mode === "login" && (
                    <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccessMessage(""); }}
                      className="text-xs font-semibold btn-ghost px-2 py-1"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input id="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-modern w-full py-3 pl-11 pr-11 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center btn-ghost"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {mode === "register" && password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Strength:</span>
                      <span className="font-bold" style={{ color: strength.score >= 4 ? "var(--success)" : strength.score >= 2 ? "var(--warning)" : "var(--danger)" }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex h-1.5 gap-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-full flex-1 transition-colors duration-300 ${i < strength.score ? strength.colorClass : "opacity-10"}`} style={{ background: i < strength.score ? undefined : "var(--text-muted)" }} />
                      ))}
                    </div>
                    <ul className="text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
                      <li className={password.length >= 6 ? "font-semibold" : ""} style={{ color: password.length >= 6 ? "var(--success)" : undefined }}>At least 6 characters</li>
                      <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "font-semibold" : ""} style={{ color: /[A-Z]/.test(password) && /[a-z]/.test(password) ? "var(--success)" : undefined }}>Uppercase &amp; lowercase letters</li>
                      <li className={/[0-9]/.test(password) ? "font-semibold" : ""} style={{ color: /[0-9]/.test(password) ? "var(--success)" : undefined }}>Numbers</li>
                      <li className={/[^A-Za-z0-9]/.test(password) ? "font-semibold" : ""} style={{ color: /[^A-Za-z0-9]/.test(password) ? "var(--success)" : undefined }}>Special characters</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {mode === "register" && (
              <div>
                <label htmlFor="productKey" className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Product Key
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </span>
                  <input id="productKey" type="text" inputMode="text" autoComplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxLength={29}
                    value={productKey}
                    onChange={(e) => { if (isKeyPartiallyValid(e.target.value)) handleKeyChange(e.target.value); }}
                    className="input-modern w-full py-3 pl-11 pr-11 text-sm tracking-widest font-mono"
                    style={{
                      borderColor: keyStatus === "valid" ? "var(--success)" : keyStatus === "invalid" ? "var(--danger)" : undefined,
                    }}
                  />
                  {productKey.length > 0 && (
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      {keyStatus === "checking" ? (
                        <span className="h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: "var(--text-muted)" }} />
                      ) : keyStatus === "valid" ? (
                        <svg className="h-5 w-5" style={{ color: "var(--success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : keyStatus === "invalid" ? (
                        <svg className="h-5 w-5" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : null}
                    </span>
                  )}
                </div>
                {keyStatus === "invalid" && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>This product key is invalid, expired, or already used.</p>
                )}
              </div>
            )}

            <button type="submit" disabled={isLoading || (mode === "register" && strength.score < 2)}
              className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : mode === "login" ? (
                "Sign In to Dashboard"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
          {mode === "login" ? (
            <p>
              New to TestForge?{" "}
              <button onClick={() => { setMode("register"); setError(""); setSuccessMessage(""); setProductKey(""); setKeyStatus("idle"); }}
                className="font-semibold btn-ghost px-1"
              >
                Sign up now
              </button>
            </p>
          ) : mode === "register" ? (
            <p>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); setProductKey(""); setKeyStatus("idle"); }}
                className="font-semibold btn-ghost px-1"
              >
                Sign in
              </button>
            </p>
          ) : mode === "forgot" && !successMessage ? (
            <button onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); }}
              className="font-semibold btn-ghost px-1"
            >
              Back to Sign In
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
