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

    const requestConfig = {
      model: "gemini-3.8-flash",
      contents: prompt,
    };

    let response: any;
    try {
      response = await ai.models.generateContent(requestConfig);
    } catch (firstErr: any) {
      const status = firstErr?.status || firstErr?.code || (firstErr?.message?.includes("503") ? 503 : 0);
      const isTransient = status === 503 || status === 429 || firstErr?.message?.includes("high demand") || firstErr?.message?.includes("overloaded");
      if (isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        response = await ai.models.generateContent(requestConfig);
      } else {
        throw firstErr;
      }
    }

    const answer = response.text;
    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    return res.status(200).json({ success: true, answer, model: "gemini-3.8-flash" });
  } catch (err: any) {
    console.warn("[API Warning /api/gemini/advisor]", err?.message || err);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: err?.message || "Failed to generate financial advice with gemini-3.8-flash",
    });
  }
}
