import { Router, type IRouter } from "express";
import { generateChatReply } from "../../lib/gemini-client.js";

const router: IRouter = Router();

router.post("/chat", async (req, res): Promise<void> => {
  const { message, history, context } = req.body as {
    message: unknown;
    history: unknown;
    context: unknown;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message must be a non-empty string" });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: "message too long (max 2000 chars)" });
    return;
  }
  if (!Array.isArray(history)) {
    res.status(400).json({ error: "history must be an array" });
    return;
  }
  if (typeof context !== "object" || context === null) {
    res.status(400).json({ error: "context must be an object" });
    return;
  }

  const ctx = context as {
    annualIncomeUSD: number;
    employerCountry: string;
    employerCity: string;
    homeCityCOL: number | null;
    comparisons: Array<{
      city: string;
      country: string;
      emoji: string;
      overallScore: number;
      effectiveTaxRate: number;
      monthlyNetIncomeUSD: number;
      monthlyCostOfLivingUSD: number;
      monthlyDisposableIncomeUSD: number;
      hasDigitalNomadVisa: boolean;
      setupDifficultyLabel: string;
      touristVisaDays: number;
      pros: string[];
      cons: string[];
    }>;
  };

  const chatHistory = (history as Array<{ role: string; content: string }>)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    .slice(-20);

  try {
    const reply = await generateChatReply(message.trim(), chatHistory, ctx);
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI response" });
  }
});

export default router;
