import crypto from "node:crypto";
import { authStore } from "./store.js";
import { isDisposableEmail } from "./disposable-emails.js";
import { authenticateToken, encryptApiKey, generateToken } from "./service.js";
import { validateProductKey, claimProductKey, isValidKeyFormat } from "./productKeys.js";
import { sendPasswordResetEmail } from "../email/index.js";
import { checkRateLimit, checkAccountLockout, recordFailedAttempt, clearLockout } from "../rate-limit/index.js";
import { verify2FA, is2FAEnabled } from "../2fa/index.js";
import { getUserPlan, checkBillingLimit } from "../billing/plans.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function setAuthCookie(res, token) {
  const maxAge = 7 * 24 * 60 * 60;
  res.setHeader("Set-Cookie", [
    `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
    `session=active; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
  ]);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    const MAX_SIZE = 1024 * 100;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        req.destroy(new Error("Request body too large"));
        return;
      }
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function handleRegister(req, res, body) {
  const { email, password, productKey } = body;

  if (!email || !password) {
    sendJson(res, 400, { error: "Email and password are required." });
    return;
  }

  if (!process.env.SKIP_PRODUCT_KEY) {
    if (!productKey) {
      sendJson(res, 400, { error: "A valid product key is required to register." });
      return;
    }

    if (!isValidKeyFormat(productKey)) {
      sendJson(res, 400, { error: "Product key format is invalid. Use XXXXX-XXXXX-XXXXX-XXXXX-XXXXX." });
      return;
    }

    const validKey = await validateProductKey(productKey);
    if (!validKey) {
      sendJson(res, 400, { error: "Product key is invalid, expired, or already used." });
      return;
    }
  }

  if (!email.includes("@") || email.length > 254) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (!PASSWORD_REGEX.test(password)) {
    sendJson(res, 400, { error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character." });
    return;
  }

  if (isDisposableEmail(email)) {
    sendJson(res, 400, { error: "Temporary email addresses are not allowed." });
    return;
  }

  const existingUser = await authStore.findUserByEmail(email);
  if (existingUser) {
    sendJson(res, 409, { error: "An account with this email already exists. Try signing in instead." });
    return;
  }

  const user = await authStore.createUser({ email, password });

  if (!process.env.SKIP_PRODUCT_KEY && productKey) {
    await claimProductKey(productKey, user.id, email);
  }

  const token = generateToken(user);
  setAuthCookie(res, token);

  sendJson(res, 201, {
    token,
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
  });
}

async function handleValidateKey(req, res, body) {
  const { productKey } = body;

  if (!productKey) {
    sendJson(res, 400, { error: "Product key is required." });
    return;
  }

  if (!isValidKeyFormat(productKey)) {
    sendJson(res, 400, { error: "Product key format is invalid." });
    return;
  }

  const validKey = await validateProductKey(productKey);
  if (!validKey) {
    sendJson(res, 400, { error: "Product key is invalid, expired, or already used." });
    return;
  }

  sendJson(res, 200, { valid: true, key: validKey.key });
}

async function handleLogin(req, res, body) {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!await checkRateLimit(clientIp)) {
    sendJson(res, 429, { error: "Too many login attempts. Try again later." });
    return;
  }

  const { email, password } = body;

  if (!email || !password) {
    sendJson(res, 400, { error: "Email and password are required." });
    return;
  }

  const lockoutKey = `login:${email.trim().toLowerCase()}`;
  if (await checkAccountLockout(lockoutKey)) {
    sendJson(res, 429, { error: "Account temporarily locked due to too many failed attempts. Try again later." });
    return;
  }

  if (isDisposableEmail(email)) {
    sendJson(res, 400, { error: "Temporary email addresses are not allowed." });
    return;
  }

  const userRecord = await authStore.findUserWithPassword(email);
  const dummyHash = crypto.pbkdf2Sync("dummy", "salt", 600000, 64, "sha512").toString("hex");

  let match = false;
  if (userRecord && userRecord.passwordHash && userRecord.salt) {
    const checkHash = crypto.pbkdf2Sync(password, userRecord.salt, 600000, 64, "sha512").toString("hex");
    try {
      match = crypto.timingSafeEqual(
        Buffer.from(userRecord.passwordHash, "hex"),
        Buffer.from(checkHash, "hex")
      );
    } catch { match = false; }
  } else {
    crypto.timingSafeEqual(Buffer.from(dummyHash, "hex"), Buffer.from(dummyHash, "hex"));
  }

  if (!match) {
    recordFailedAttempt(lockoutKey);
    sendJson(res, 401, { error: "Invalid email or password." });
    return;
  }

  clearLockout(lockoutKey);

  const tfaCode = body.twoFactorCode;
  const tfaEnabled = await is2FAEnabled(userRecord._id.toString());
  if (tfaEnabled) {
    if (!tfaCode) {
      sendJson(res, 200, { require2FA: true, email: userRecord.email });
      return;
    }
    const tfaOk = await verify2FA(userRecord._id.toString(), tfaCode);
    if (!tfaOk) {
      recordFailedAttempt(lockoutKey);
      sendJson(res, 401, { error: "Invalid two-factor authentication code." });
      return;
    }
  }

  const token = generateToken(userRecord);
  setAuthCookie(res, token);

  sendJson(res, 200, {
    token,
    user: { id: userRecord._id.toString(), email: userRecord.email, role: userRecord.role || "Member", createdAt: userRecord.createdAt },
  });
}

async function handleForgotPassword(req, res, body) {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!await checkRateLimit(clientIp)) {
    sendJson(res, 429, { error: "Too many requests. Try again later." });
    return;
  }

  const { email } = body;

  if (!email || !email.includes("@")) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (isDisposableEmail(email)) {
    sendJson(res, 400, { error: "Temporary email addresses are not allowed." });
    return;
  }

  const resetToken = await authStore.createPasswordResetToken(email);
  if (resetToken) {
    const baseUrl = process.env.APP_URL || "http://127.0.0.1:5173";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  sendJson(res, 200, {
    message: "If an account exists with that email, password reset instructions have been sent.",
  });
}

async function handleResetPassword(req, res, body) {
  const { token, password } = body;

  if (!token || !password) {
    sendJson(res, 400, { error: "Token and password are required." });
    return;
  }

  if (!PASSWORD_REGEX.test(password)) {
    sendJson(res, 400, { error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character." });
    return;
  }

  try {
    const user = await authStore.resetPassword(token, password);
    if (user?.email) {
      const lockoutKey = `login:${user.email.toLowerCase()}`;
      await clearLockout(lockoutKey);
    }
    sendJson(res, 200, { message: "Password has been reset successfully. You can now sign in." });
  } catch (err) {
    sendJson(res, 400, { error: err.message || "Unable to reset password." });
  }
}

async function handleChangePassword(req, res, url, body, user) {
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    sendJson(res, 400, { error: "Current password and new password are required." });
    return;
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    sendJson(res, 400, { error: "New password must be at least 8 characters with uppercase, lowercase, number, and special character." });
    return;
  }
  try {
    await authStore.changePassword(user.id, currentPassword, newPassword);
    sendJson(res, 200, { message: "Password changed successfully." });
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
}

async function handleMe(req, res, url, body, user) {
  const plan = await getUserPlan(user.id);
  const twoFactor = await is2FAEnabled(user.id);
  sendJson(res, 200, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role || "Member",
      createdAt: user.createdAt,
      subscriptionTier: plan.tier,
      subscriptionStatus: plan.subscriptionStatus,
      twoFactorEnabled: twoFactor,
    },
  });
}

async function handleSetup2FA(req, res, url, body, user) {
  const { setup2FA, enable2FA } = await import("../2fa/index.js");
  const result = await setup2FA(user.id, user.email);
  sendJson(res, 200, result);
}

async function handleEnable2FA(req, res, url, body, user) {
  const { enable2FA } = await import("../2fa/index.js");
  const { token } = body;
  if (!token) { sendJson(res, 400, { error: "Verification code is required." }); return; }
  try {
    await enable2FA(user.id, token);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
}

async function handleDisable2FA(req, res, url, body, user) {
  const { disable2FA } = await import("../2fa/index.js");
  const { token } = body;
  if (!token) { sendJson(res, 400, { error: "Verification code is required." }); return; }
  const { verify2FA } = await import("../2fa/index.js");
  const ok = await verify2FA(user.id, token);
  if (!ok) { sendJson(res, 400, { error: "Invalid verification code." }); return; }
  await disable2FA(user.id);
  sendJson(res, 200, { ok: true });
}

async function handleGetBilling(req, res, url, body, user) {
  const plan = await getUserPlan(user.id);
  sendJson(res, 200, { plan });
}

async function handleGetApiKeys(req, res, url, body, user) {
  const configuredProviders = await authStore.listUserApiKeys(user.id);
  const providers = ["gemini", "openai", "groq", "claude", "openrouter", "opencode"];
  const keysObj = {};
  providers.forEach((p) => { keysObj[p] = configuredProviders.includes(p); });
  sendJson(res, 200, { keys: keysObj });
}

async function handleSaveApiKey(req, res, url, body, user) {
  const { provider, apiKey } = body;
  if (!provider || !apiKey || !apiKey.trim()) {
    sendJson(res, 400, { error: "Provider and API key are required." });
    return;
  }
  const encrypted = encryptApiKey(apiKey.trim());
  await authStore.saveEncryptedApiKey(user.id, provider, encrypted);
  sendJson(res, 200, { ok: true });
}

async function handleDeleteApiKey(req, res, url, body, user) {
  const provider = url.searchParams.get("provider");
  if (!provider) {
    sendJson(res, 400, { error: "Provider query parameter is required." });
    return;
  }
  await authStore.deleteApiKey(user.id, provider);
  sendJson(res, 200, { ok: true });
}

const ROUTE_CONFIG = [
  { path: "/api/auth/register", method: "POST", handler: handleRegister, auth: false },
  { path: "/api/auth/validate-key", method: "POST", handler: handleValidateKey, auth: false },
  { path: "/api/auth/login", method: "POST", handler: handleLogin, auth: false },
  { path: "/api/auth/forgot-password", method: "POST", handler: handleForgotPassword, auth: false },
  { path: "/api/auth/reset-password", method: "POST", handler: handleResetPassword, auth: false },
  { path: "/api/auth/me", method: "GET", handler: handleMe, auth: true },
  { path: "/api/auth/password", method: "PUT", handler: handleChangePassword, auth: true },
  { path: "/api/settings/api-keys", method: "GET", handler: handleGetApiKeys, auth: true },
  { path: "/api/settings/api-key", method: "POST", handler: handleSaveApiKey, auth: true },
  { path: "/api/settings/api-key", method: "DELETE", handler: handleDeleteApiKey, auth: true },
  { path: "/api/auth/2fa/setup", method: "POST", handler: handleSetup2FA, auth: true },
  { path: "/api/auth/2fa/enable", method: "POST", handler: handleEnable2FA, auth: true },
  { path: "/api/auth/2fa/disable", method: "POST", handler: handleDisable2FA, auth: true },
  { path: "/api/user/billing", method: "GET", handler: handleGetBilling, auth: true },
];

export async function handleAuthRoute(req, res, url) {
  const routeConfig = ROUTE_CONFIG.find(
    (r) => r.path === url.pathname && r.method === req.method
  );
  if (!routeConfig) return false;

  const rawBody = await readRequestBody(req);
  const body = rawBody ? JSON.parse(rawBody) : {};

  if (routeConfig.auth) {
    try {
      const user = await authenticateToken(req);
      await routeConfig.handler(req, res, url, body, user);
    } catch (authError) {
      sendJson(res, authError.statusCode || 401, { error: authError.message });
    }
  } else {
    await routeConfig.handler(req, res, body);
  }

  return true;
}
