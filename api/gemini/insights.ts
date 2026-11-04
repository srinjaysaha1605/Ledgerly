import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
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

// Serverless execution configuration
export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  const { financialSummary, accounts, transactions, budgets, goals, currency } = body;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: "GEMINI_API_KEY environment variable is not configured.",
      });
    }

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

    const CANDIDATE_MODELS = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ];

    const TIMEOUT_PER_MODEL_MS = 8000; // 8-second strict ceiling per model attempt to prevent Vercel 60s timeout

    let successfulInsights: any = null;
    let usedModel = "";
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
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
          }),
          TIMEOUT_PER_MODEL_MS,
          `Gemini (${model})`
        );

        const responseText = response.text;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            successfulInsights = parsed;
            usedModel = model;
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini /api/gemini/insights] Model ${model} failed or timed out:`, err?.message || err);
      }
    }

    if (successfulInsights) {
      return res.status(200).json({ success: true, insights: successfulInsights, source: usedModel });
    }

    throw lastError || new Error("All Gemini candidate models failed to generate insights.");
  } catch (err: any) {
    console.warn("[API Warning /api/gemini/insights]", err?.message || err);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: err?.message || "Failed to generate AI insights across candidate models",
    });
  }
}
