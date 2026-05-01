import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger.js";

let _gemini: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY secret is not set. Please add it in the Replit Secrets tab.");
  }
  if (!_gemini) {
    _gemini = new GoogleGenerativeAI(apiKey);
  }
  return _gemini;
}

export async function generateAISummary(prompt: string): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logger.warn({ err: errMessage }, "Gemini API call failed");
    if (errMessage.includes("GEMINI_API_KEY")) {
      throw err;
    }
    return "AI analysis temporarily unavailable. Please try again or add your GEMINI_API_KEY to secrets.";
  }
}

export async function generateRecommendationsSummary(params: {
  annualIncomeUSD: number;
  employerCountry: string;
  topLocations: Array<{ city: string; country: string; effectiveTaxRate: number; monthlyDisposableIncomeUSD: number; overallScore: number; pros: string[]; cons: string[] }>;
  priorities: string[];
  workSchedule?: string;
  teamTimezone?: string;
}): Promise<{ aiSummary: string; keyInsights: string[] }> {
  const locationList = params.topLocations
    .map(
      (l, i) =>
        `${i + 1}. ${l.city}, ${l.country}: Score ${l.overallScore}/100, ${(l.effectiveTaxRate * 100).toFixed(1)}% effective tax, $${Math.round(l.monthlyDisposableIncomeUSD).toLocaleString()}/mo disposable. Pros: ${l.pros.slice(0, 2).join(", ")}. Cons: ${l.cons.slice(0, 2).join(", ")}.`
    )
    .join("\n");

  const scheduleNote = params.workSchedule ? `Work schedule: "${params.workSchedule}".` : "";
  const timezoneNote = params.teamTimezone ? `Team timezone: "${params.teamTimezone}".` : "";
  const contextLines = [scheduleNote, timezoneNote].filter(Boolean).join(" ");

  const prompt = `You are a global relocation advisor for remote workers. A remote worker earning $${params.annualIncomeUSD.toLocaleString()}/year with their employer in ${params.employerCountry} is asking for the best places to live.

Their priorities: ${params.priorities.length > 0 ? params.priorities.join(", ") : "not specified — balanced across all factors"}.
${contextLines ? `Work context: ${contextLines}` : ""}

Top location picks (by our algorithm):
${locationList}

Write a concise, insightful summary (3-4 sentences) that:
1. Highlights the most compelling 1-2 options and why they stand out for this person specifically
2. If schedule or timezone context was provided, factor in whether those cities have good timezone overlap with the team region and whether the work schedule makes certain locations more or less suitable
3. Mentions any key trade-offs they should know about
4. Is honest and practical, not generic

Then provide exactly 3 key insights as a JSON array of strings. Format your response as:
SUMMARY: [your summary paragraph]
INSIGHTS: ["insight 1", "insight 2", "insight 3"]`;

  const responseText = await generateAISummary(prompt);

  let aiSummary = "Based on your income and priorities, our algorithm has identified the best locations for you.";
  let keyInsights = [
    "Tax-free jurisdictions offer the highest take-home pay but often come with higher costs of living.",
    "Digital nomad visas provide legal clarity and are worth prioritizing.",
    "Consider timezone compatibility with your employer for collaboration.",
  ];

  try {
    const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]+?)(?=INSIGHTS:|$)/);
    if (summaryMatch) {
      aiSummary = summaryMatch[1].trim();
    }

    const insightsMatch = responseText.match(/INSIGHTS:\s*(\[[\s\S]+?\])/);
    if (insightsMatch) {
      const parsed = JSON.parse(insightsMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        keyInsights = parsed;
      }
    }
  } catch {
    aiSummary = responseText.substring(0, 500) || aiSummary;
  }

  return { aiSummary, keyInsights };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
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
}

export async function generateChatReply(
  userMessage: string,
  history: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY secret is not set.");
  }
  const client = getGeminiClient();

  const colLine = context.homeCityCOL
    ? `Current home city: ${context.employerCity} (~$${context.homeCityCOL.toLocaleString()}/mo COL).`
    : `Current home city: ${context.employerCity}.`;

  const cityList = context.comparisons
    .map(
      (c) =>
        `- ${c.emoji} ${c.city}, ${c.country}: Score ${c.overallScore}/100 | Tax ${(c.effectiveTaxRate * 100).toFixed(1)}% | Net $${c.monthlyNetIncomeUSD.toLocaleString()}/mo | COL $${c.monthlyCostOfLivingUSD.toLocaleString()}/mo | Disposable $${c.monthlyDisposableIncomeUSD.toLocaleString()}/mo | Nomad Visa: ${c.hasDigitalNomadVisa ? "Yes" : "No"} | Move: ${c.setupDifficultyLabel} | Visa-free: ${c.touristVisaDays}d | Pros: ${c.pros.slice(0, 2).join(", ")} | Cons: ${c.cons.slice(0, 1).join(", ")}`
    )
    .join("\n");

  const systemInstruction = `You are Nomad Compass AI, an expert relocation advisor for remote workers. You have real-time access to the user's comparison data. Be concise, direct, and practical. Use specific numbers from the data. Don't repeat the full table — highlight what's most relevant to the question.

User Profile:
- Annual Income: $${context.annualIncomeUSD.toLocaleString()} USD
- Employer Country: ${context.employerCountry}
- ${colLine}

Current comparison data (${context.comparisons.length} cities):
${cityList}

Answer questions about this data, help the user decide between options, explain trade-offs, and give personalized recommendations. Keep responses under 200 words unless the user asks for detail. Use markdown bullet points where helpful.`;

  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });

  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

export async function generateTaxAnalysis(params: {
  city: string;
  country: string;
  annualIncomeUSD: number;
  employerCountry: string;
  effectiveTaxRate: number;
  annualTaxUSD: number;
  taxNotes: string;
  specialRegimes?: string;
  hasTaxTreaty: boolean;
  incomeType: string;
}): Promise<{ aiAnalysis: string; optimizationTips: string[]; warnings: string[] }> {
  const prompt = `You are a tax advisor specializing in international taxation for remote workers.

Worker Profile:
- Annual Income: $${params.annualIncomeUSD.toLocaleString()} USD
- Employer Country: ${params.employerCountry}
- Living in: ${params.city}, ${params.country}
- Income Type: ${params.incomeType}
- Effective Tax Rate: ${(params.effectiveTaxRate * 100).toFixed(1)}%
- Estimated Annual Tax: $${Math.round(params.annualTaxUSD).toLocaleString()}
- Tax Treaty with employer country: ${params.hasTaxTreaty ? "Yes" : "No"}
- Tax Notes: ${params.taxNotes}
${params.specialRegimes ? `- Special Regime Available: ${params.specialRegimes}` : ""}

Provide:
1. A clear 2-3 sentence explanation of the tax situation for this person specifically
2. 3-4 actionable optimization tips
3. 2-3 important warnings or things to watch out for

Format:
ANALYSIS: [your analysis]
TIPS: ["tip 1", "tip 2", "tip 3", "tip 4"]
WARNINGS: ["warning 1", "warning 2", "warning 3"]`;

  const responseText = await generateAISummary(prompt);

  let aiAnalysis = `As a remote worker living in ${params.city}, ${params.country}, your estimated effective tax rate is ${(params.effectiveTaxRate * 100).toFixed(1)}%.`;
  let optimizationTips = [
    "Consult a local tax advisor who specializes in expat taxation",
    "Keep records of days spent in different countries",
    "Consider timing of income recognition if using a remittance-based system",
  ];
  let warnings = [
    "Tax laws change frequently — verify current rules with a local accountant",
    "Tax residency rules may differ from visa rules",
  ];

  try {
    const analysisMatch = responseText.match(/ANALYSIS:\s*([\s\S]+?)(?=TIPS:|$)/);
    if (analysisMatch) {
      aiAnalysis = analysisMatch[1].trim();
    }

    const tipsMatch = responseText.match(/TIPS:\s*(\[[\s\S]+?\])/);
    if (tipsMatch) {
      const parsed = JSON.parse(tipsMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        optimizationTips = parsed;
      }
    }

    const warningsMatch = responseText.match(/WARNINGS:\s*(\[[\s\S]+?\])/);
    if (warningsMatch) {
      const parsed = JSON.parse(warningsMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        warnings = parsed;
      }
    }
  } catch {
    aiAnalysis = responseText.substring(0, 800) || aiAnalysis;
  }

  return { aiAnalysis, optimizationTips, warnings };
}
