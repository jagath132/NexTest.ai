import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB_NAME || "testforge";

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  await ensureIndexes(db);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected.");
  return db;
}

async function ensureIndexes(indexDb) {
  await indexDb.collection("admins").createIndex({ email: 1 }, { unique: true });
  await indexDb.collection("product_keys").createIndex({ key: 1 }, { unique: true });
  await indexDb.collection("product_keys").createIndex({ customerEmail: 1 });
  await indexDb.collection("product_keys").createIndex({ status: 1 });
  await indexDb.collection("email_logs").createIndex({ sentAt: -1 });
  await indexDb.collection("email_logs").createIndex({ to: 1 });
  await indexDb.collection("payment_transactions").createIndex({ transactionId: 1 }, { unique: true });
  await indexDb.collection("payment_transactions").createIndex({ email: 1 });
  await indexDb.collection("audit_logs").createIndex({ createdAt: -1 });
  await indexDb.collection("audit_logs").createIndex({ adminId: 1 });
  await indexDb.collection("audit_logs").createIndex({ action: 1 });
}
