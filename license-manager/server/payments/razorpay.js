import crypto from "node:crypto";
import { getDb } from "../db.js";
import { assignKeyToCustomer } from "../keys/service.js";
import { sendProductKeyEmail } from "../email/service.js";

export async function handleRazorpayWebhook(req, rawBody) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) throw new Error("Missing x-razorpay-signature header");

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    throw new Error("Razorpay webhook signature mismatch");
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured") {
    return { received: true, ignored: true };
  }

  const payment = event.payload.payment.entity;
  const customerEmail = payment.email;
  const customerName = payment.notes?.name || "";

  if (!customerEmail) {
    throw new Error("No customer email in Razorpay payment");
  }

  const txColl = getDb().collection("payment_transactions");
  await txColl.insertOne({
    transactionId: payment.id,
    email: customerEmail,
    amount: payment.amount ? payment.amount / 100 : null,
    currency: payment.currency || null,
    status: "completed",
    provider: "razorpay",
    productKey: null,
    timestamp: new Date().toISOString(),
  });

  const key = await assignKeyToCustomer(customerEmail);
  if (key) {
    await txColl.updateOne(
      { transactionId: payment.id },
      { $set: { productKey: key.key } }
    );
    await sendProductKeyEmail(customerEmail, key.key, customerName);
  }

  return { received: true, productKey: key?.key || null };
}
