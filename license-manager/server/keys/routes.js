import { getDb } from "../db.js";
import { generateProductKeys, listProductKeys, revokeProductKey, getKeyStats } from "./service.js";

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleGenerate(req, res, url, body, admin) {
  const count = Math.min(Math.max(parseInt(body.count, 10) || 1, 1), 1000);
  const metadata = {
    customerEmail: body.customerEmail || null,
    notes: body.notes || null,
  };
  if (body.expiresInDays) {
    metadata.expiresAt = new Date(Date.now() + body.expiresInDays * 86400000).toISOString();
  }
  const keys = await generateProductKeys(count, metadata);
  sendJson(res, 200, { keys, count: keys.length });
  return { action: "generate_keys", details: { count } };
}

async function handleList(req, res, url, body, admin) {
  const filter = {};
  const status = url.searchParams.get("status");
  const email = url.searchParams.get("email");
  if (status) filter.status = status;
  if (email) filter.email = email;
  const keys = await listProductKeys(filter);
  sendJson(res, 200, { keys });
}

async function handleRevoke(req, res, url, body, admin) {
  const { key } = body;
  if (!key) {
    sendJson(res, 400, { error: "Key is required." });
    return;
  }
  const ok = await revokeProductKey(key);
  if (!ok) {
    sendJson(res, 404, { error: "Key not found or already revoked." });
    return;
  }
  sendJson(res, 200, { ok: true });
  return { action: "revoke_key", resourceId: key, details: { key } };
}

async function handleStats(req, res, url, body, admin) {
  const stats = await getKeyStats();
  sendJson(res, 200, stats);
}

export const KEY_ROUTES = [
  { path: "/api/admin/keys/generate", method: "POST", handler: handleGenerate },
  { path: "/api/admin/keys", method: "GET", handler: handleList },
  { path: "/api/admin/keys/revoke", method: "POST", handler: handleRevoke },
  { path: "/api/admin/keys/stats", method: "GET", handler: handleStats },
];
