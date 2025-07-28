import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import Stripe from "stripe";

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Create Stripe Connect account link
router.post("/connect", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let stripeAccountId = user.stripeAccountId;

    // Create Stripe account if it doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
      });

      stripeAccountId = account.id;

      // Update user with Stripe account ID
      await prisma.user.update({
        where: { id: uid },
        data: { stripeAccountId },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/seller-dashboard?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/seller-dashboard?success=true`,
      type: "account_onboarding",
    });

    res.json({ accountLinkUrl: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    res.status(500).json({ error: "Failed to create Stripe account link" });
  }
});

// Get Stripe account status
router.get("/account", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.user!;

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user || !user.stripeAccountId) {
      return res.json({ account: null });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    res.json({
      id: account.id,
      verified: account.details_submitted && account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
    });
  } catch (error) {
    console.error("Stripe account retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve account status" });
  }
});

export default router;
