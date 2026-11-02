import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { financialSummary, accounts, transactions, budgets, goals, currency } = body;

  try {
    const ai = getGeminiClient();

    const prompt = `Analyze this user's REAL personal finance data and generate 4 specific, actionable, mathematically accurate insights or advice for their dashboard.
Currency: ${currency || "$"}

Financial Metrics:
- Total Balance: ${financialSummary?.totalBalance ?? "N/A"}
- Monthly Income: ${financialSummary?.monthlyIncome ?? "N/A"}
- Monthly Expense: ${financialSummary?.monthlyExpense ?? "N/A"}
- Net Savings: ${financialSummary?.netSavings ?? "N/A"}
- Savings Rate: ${financialSummary?.savingsRate ?? "N/A"}%

Accounts:
${JSON.stringify(accounts || [], null, 2)}

Recent Transactions:
${JSON.stringify((transactions || []).slice(0, 25), null, 2)}

Budgets:
${JSON.stringify(budgets || [], null, 2)}

Savings Goals:
${JSON.stringify(goals || [], null, 2)}

Guidelines:
1. Every insight MUST be grounded strictly in the real transactions, budgets, accounts, or goals provided.
2. Mention specific numbers, percentages, merchant names, or budget categories from the data.
3. Provide a diverse mix of 4 insights:
   - 'positive': Highlight high savings rate, staying within a budget, or account growth.
   - 'warning': Alert on categories with heavy spending or budgets exceeding/approaching limits.
   - 'tip': Provide a practical recommendation based on their recurring subscriptions or spending pattern.
   - 'milestone': Report progress on their actual savings goals.
4. Keep the descriptions clear, punchy, and helpful (1-2 sentences).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 4 real financial insights",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Uppercase punchy title" },
              description: { type: Type.STRING, description: "1-2 sentence explanation with real figures" },
              type: { type: Type.STRING, enum: ["positive", "warning", "tip", "milestone"] },
              icon: { type: Type.STRING, description: "One of: Zap, AlertTriangle, Repeat, Trophy, TrendingUp, PiggyBank, ShieldCheck, Sparkles" },
              badge: { type: Type.STRING, description: "Short 1-2 word badge" },
              impactValue: { type: Type.STRING, description: "Short numeric impact or metric, e.g. +$320.00, 74% Done" },
            },
            required: ["title", "description", "type", "badge"],
          },
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    const insights = JSON.parse(responseText);
    return res.status(200).json({ success: true, insights, source: "gemini-3.8-flash" });
  } catch (err: any) {
    console.error("[API Error /api/gemini/insights]", err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate AI insights with gemini-3.8-flash",
    });
  }
}
