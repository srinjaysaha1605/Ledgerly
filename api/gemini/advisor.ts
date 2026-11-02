import { GoogleGenAI } from "@google/genai";

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
  const { question, financialContext, currency } = body;

  try {
    const ai = getGeminiClient();

    const prompt = `You are the Ledgerly Smart Financial Advisor. The user is asking a question about their personal finances.

User Question: "${question}"
Currency: ${currency || "$"}

User's Real Financial Context:
${JSON.stringify(financialContext, null, 2)}

Provide clear, realistic, tailored advice based directly on their real account balances, actual income, expense categories, budgets, and savings goals.
Include concrete calculations or suggestions where applicable. Use clear formatting with bullet points and bold numbers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const answer = response.text;
    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    return res.status(200).json({ success: true, answer, model: "gemini-3.8-flash" });
  } catch (err: any) {
    console.error("[API Error /api/gemini/advisor]", err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate financial advice with gemini-3.8-flash",
    });
  }
}
