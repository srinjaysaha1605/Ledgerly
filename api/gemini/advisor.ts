import { GoogleGenAI } from "@google/genai";

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
  const { question, financialContext, currency } = body;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: "GEMINI_API_KEY environment variable is not configured.",
      });
    }

    const prompt = `You are the Ledgerly Smart Financial Advisor. The user is asking a question about their personal finances.

User Question: "${question}"
Currency: ${currency || "$"}

User's Real Financial Context:
${JSON.stringify(financialContext, null, 2)}

Provide clear, realistic, tailored advice based directly on their real account balances, actual income, expense categories, budgets, and savings goals.
Include concrete calculations or suggestions where applicable. Use clear formatting with bullet points and bold numbers.`;

    const CANDIDATE_MODELS = [
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-3.6-flash",
    ];

    const TIMEOUT_PER_MODEL_MS = 8000; // 8-second strict ceiling per model attempt to prevent Vercel 60s timeout

    let successfulAnswer: string | null = null;
    let usedModel = "";
    let lastError: any = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
          }),
          TIMEOUT_PER_MODEL_MS,
          `Gemini (${model})`
        );

        if (response.text) {
          successfulAnswer = response.text;
          usedModel = model;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini /api/gemini/advisor] Model ${model} failed or timed out:`, err?.message || err);
      }
    }

    if (successfulAnswer) {
      return res.status(200).json({ success: true, answer: successfulAnswer, model: usedModel });
    }

    throw lastError || new Error("All Gemini candidate models failed to generate financial advice.");
  } catch (err: any) {
    console.warn("[API Warning /api/gemini/advisor]", err?.message || err);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: err?.message || "Failed to generate financial advice across candidate models",
    });
  }
}
