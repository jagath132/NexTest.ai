import { getDb } from "../db.js";
import { assignKeyToCustomer } from "../keys/service.js";
import { sendProductKeyEmail } from "../email/service.js";

export async function handleStripeWebhook(req, rawBody) {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  let stripe;
  try {
    stripe = await import("stripe");
    stripe = stripe.default || stripe;
  } catch {
    throw new Error("stripe package not installed");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) throw new Error("Missing stripe-signature header");

  let event;
  try {
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    event = stripeInstance.webhooks.constructEvent(rawBody, sig, stripeSecret);
  } catch (err) {
    throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return { received: true, ignored: true };
  }

  const session = event.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName = session.customer_details?.name || "";

  if (!customerEmail) {
    throw new Error("No customer email in Stripe session");
  }

  const txColl = getDb().collection("payment_transactions");
  await txColl.insertOne({
    transactionId: session.id,
    email: customerEmail,
    amount: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency || null,
    status: "completed",
    provider: "stripe",
    productKey: null,
    timestamp: new Date().toISOString(),
  });

  const key = await assignKeyToCustomer(customerEmail);
  if (key) {
    await txColl.updateOne(
      { transactionId: session.id },
      { $set: { productKey: key.key } }
    );
    await sendProductKeyEmail(customerEmail, key.key, customerName);
  }

  return { received: true, productKey: key?.key || null };
}
