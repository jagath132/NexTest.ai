import { connectDb } from "./db.js";
import { adminStore, authenticateToken, handleAuthRoute, logAudit, getAuditLogs } from "./auth/index.js";
import { KEY_ROUTES } from "./keys/routes.js";
import { sendProductKeyEmail, getEmailLogs } from "./email/service.js";
import { handleStripeWebhook } from "./payments/stripe.js";
import { handleRazorpayWebhook } from "./payments/razorpay.js";

function corsify(res, req) {
  const origin = req?.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  if (origin !== "*") res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    const MAX_SIZE = 1024 * 512;
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

function parseUrl(req) {
  return new URL(req.url, "http://localhost");
}

export function createApiMiddleware(env) {
  let dbReady = connectDb().then(async () => {
    await adminStore.seedDefaultAdmin();
  }).catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

  return async function apiMiddleware(req, res, next) {
    const url = parseUrl(req);

    corsify(res, req);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!url.pathname.startsWith("/api/")) {
      next();
      return;
    }

    await dbReady;

    try {
      // Stripe webhook needs raw body (not JSON parsed)
      if (url.pathname === "/api/webhooks/stripe" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const result = await handleStripeWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Razorpay webhook also needs raw body
      if (url.pathname === "/api/webhooks/razorpay" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const result = await handleRazorpayWebhook(req, rawBody);
        sendJson(res, 200, result);
        return;
      }

      // Auth routes (login, me)
      const matched = await handleAuthRoute(req, res, url);
      if (matched) return;

      // All remaining /api/* routes require admin authentication
      let admin;
      try {
        admin = await authenticateToken(req);
      } catch (authError) {
        sendJson(res, authError.statusCode || 401, { error: authError.message });
        return;
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

      // Key management routes
      for (const route of KEY_ROUTES) {
        if (url.pathname === route.path && req.method === route.method) {
          const rawBody = await readRequestBody(req);
          const body = rawBody ? JSON.parse(rawBody) : {};
          const result = await route.handler(req, res, url, body, admin);
          if (result?.action) {
            await logAudit({ adminId: admin.id, adminEmail: admin.email, action: result.action, resource: "key", resourceId: result.keyId, details: result.details, ip: clientIp });
          }
          return;
        }
      }

      // Email sending endpoint
      if (url.pathname === "/api/admin/email/send" && req.method === "POST") {
        const rawBody = await readRequestBody(req);
        const { to, productKey, customerName } = JSON.parse(rawBody || "{}");
        if (!to || !productKey) {
          sendJson(res, 400, { error: "Recipient email and product key are required." });
          return;
        }
        try {
          await sendProductKeyEmail(to, productKey, customerName);
          await logAudit({ adminId: admin.id, adminEmail: admin.email, action: "send_email", resource: "email", details: { to, productKey }, ip: clientIp });
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      // Email log endpoint
      if (url.pathname === "/api/admin/email/logs" && req.method === "GET") {
        const to = url.searchParams.get("to") || "";
        const logs = await getEmailLogs({ to });
        sendJson(res, 200, { logs });
        return;
      }

      // Customer list (users collection)
      if (url.pathname === "/api/admin/customers" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const db = getDb();
        const users = await db.collection("users")
          .find({}, { projection: { email: 1, role: 1, createdAt: 1 } })
          .sort({ createdAt: -1 })
          .toArray();

        const customers = await Promise.all(users.map(async (u) => {
          const keyDoc = await db.collection("product_keys").findOne(
            { $or: [{ customerEmail: u.email }, { registeredEmail: u.email }] }
          );
          return {
            id: u._id.toString(),
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            productKey: keyDoc?.key || null,
            keyStatus: keyDoc?.status || null,
          };
        }));

        sendJson(res, 200, { customers });
        return;
      }

      // Payment transactions
      if (url.pathname === "/api/admin/transactions" && req.method === "GET") {
        const { getDb } = await import("./db.js");
        const docs = await getDb().collection("payment_transactions")
          .find({})
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray();
        sendJson(res, 200, {
          transactions: docs.map((d) => ({
            id: d._id.toString(),
            transactionId: d.transactionId,
            email: d.email,
            amount: d.amount,
            currency: d.currency,
            status: d.status,
            provider: d.provider,
            productKey: d.productKey,
            timestamp: d.timestamp,
          })),
        });
        return;
      }

      // Audit logs
      if (url.pathname === "/api/admin/audit-logs" && req.method === "GET") {
        const logs = await getAuditLogs({ limit: 200 });
        sendJson(res, 200, { logs });
        return;
      }

      sendJson(res, 404, { error: "Route not found." });
    } catch (error) {
      console.error("License Manager API error:", error);
      sendJson(res, error.statusCode || 500, { error: error.message || "Internal error" });
    }
  };
}
