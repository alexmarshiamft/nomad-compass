import { Router, type IRouter } from "express";

const router: IRouter = Router();

export const NOMAD_PRO_PLAN = {
  priceId: "price_nomad_pro_annual",
  name: "Nomad Compass Pro",
  amountUSD: 79.0,
  interval: "year",
  features: [
    "100 Global Cities Relocation Matrix",
    "Detailed Double-Taxation Treaty Simulator",
    "AI Relocation Concierge (Unlimited Gemini)",
    "Personalized Tax Optimization Reports",
    "Cost of Living & Rent Benchmarks"
  ]
};

router.post("/billing/create-checkout-session", async (req, res) => {
  const { userEmail } = req.body || {};
  const sessionId = "cs_nomad_" + Math.random().toString(36).substring(2, 12);
  const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

  return res.json({
    success: true,
    sessionId,
    url: checkoutUrl,
    plan: NOMAD_PRO_PLAN
  });
});

router.post("/billing/webhook", async (req, res) => {
  const event = req.body;
  const eventType = event?.type || "checkout.session.completed";

  switch (eventType) {
    case "checkout.session.completed":
      console.log(`[Stripe Webhook] Nomad Pro subscription activated for: ${event?.data?.object?.customer_email || "customer"}`);
      break;
    case "customer.subscription.deleted":
      console.log(`[Stripe Webhook] Nomad Pro subscription cancelled`);
      break;
    default:
      console.log(`[Stripe Webhook] Processed event: ${eventType}`);
  }

  return res.json({ received: true });
});

export default router;
