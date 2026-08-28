import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));

  // Lazy initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Helper function: Sleep for backoff
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper function to call Gemini with retries and model fallback
  async function generateContentWithRetry(
    ai: GoogleGenAI,
    params: {
      prompt: string;
      models?: string[];
      config?: any;
      maxRetries?: number;
    }
  ): Promise<string> {
    const models = params.models || ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.1-pro-preview"];
    const maxRetries = params.maxRetries ?? 2;

    let lastError: any = null;

    for (const model of models) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: params.prompt,
            config: params.config,
          });

          if (response.text) {
            return response.text;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.message?.includes('503') ? 503 : 0);
          const isTransient = status === 503 || status === 429 || err?.message?.includes('overloaded') || err?.message?.includes('high demand');

          if (isTransient && attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 300, 4000);
            console.warn(`[Gemini] Model ${model} returned transient error (${status}). Retrying in ${delay.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await sleep(delay);
            continue;
          }

          // If not transient or exhausted retries on this model, break to try next fallback model
          console.warn(`[Gemini] Model ${model} failed: ${err.message || err}. Trying next fallback model...`);
          break;
        }
      }
    }

    throw lastError || new Error("All Gemini models failed to generate content");
  }

  // Server-side fallback insights calculator based on real ledger data
  function calculateRealFallbackInsights(
    financialSummary: any,
    accounts: any[] = [],
    transactions: any[] = [],
    budgets: any[] = [],
    goals: any[] = [],
    currency: string = '$'
  ) {
    const symbol = currency || '$';
    const totalBalance = financialSummary?.totalBalance ?? accounts.reduce((s, a) => s + (a.balance || a.currentBalance || 0), 0);
    const monthlyIncome = financialSummary?.monthlyIncome ?? 0;
    const monthlyExpense = financialSummary?.monthlyExpense ?? 0;
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? ((netSavings / monthlyIncome) * 100) : 0;

    const insights = [];

    // 1. Savings Rate / Cash flow
    if (monthlyIncome > 0) {
      if (savingsRate >= 20) {
        insights.push({
          title: "EXCELLENT SAVINGS RATE",
          description: `Saving ${savingsRate.toFixed(1)}% of your monthly revenue (${symbol}${netSavings.toFixed(2)} retained). You are well above the 20% benchmark.`,
          type: "positive",
          icon: "Zap",
          badge: "SAVINGS WIN",
          impactValue: `+${savingsRate.toFixed(0)}% Rate`
        });
      } else if (savingsRate > 0) {
        insights.push({
          title: "POSITIVE CASH FLOW",
          description: `You have accumulated ${symbol}${netSavings.toFixed(2)} (${savingsRate.toFixed(1)}%) surplus this month. Steady compounding ahead.`,
          type: "positive",
          icon: "TrendingUp",
          badge: "ON TRACK",
          impactValue: `+${symbol}${netSavings.toFixed(2)}`
        });
      } else {
        insights.push({
          title: "CASH FLOW DEFICIT ALERT",
          description: `Expenses (${symbol}${monthlyExpense.toFixed(2)}) outpaced income (${symbol}${monthlyIncome.toFixed(2)}) by ${symbol}${Math.abs(netSavings).toFixed(2)}. Trim top flexible categories.`,
          type: "warning",
          icon: "AlertTriangle",
          badge: "CASH CAUTION",
          impactValue: `-${symbol}${Math.abs(netSavings).toFixed(2)}`
        });
      }
    } else {
      insights.push({
        title: "RECORD MONTHLY INCOME",
        description: `Log your incoming paycheck or revenue to unlock full savings rate tracking and automatic monthly projections.`,
        type: "tip",
        icon: "PiggyBank",
        badge: "GET STARTED",
        impactValue: `${transactions.length} Records`
      });
    }

    // 2. Budget Health
    const overBudget = budgets.find(b => (b.spent || 0) > (b.limit || b.monthlyLimit || 0));
    if (overBudget) {
      const limit = overBudget.limit || overBudget.monthlyLimit;
      const spent = overBudget.spent || 0;
      insights.push({
        title: `${overBudget.category.toUpperCase()} OVER BUDGET`,
        description: `You've spent ${symbol}${spent.toFixed(2)} on ${overBudget.category}, exceeding the ${symbol}${limit.toFixed(2)} monthly ceiling.`,
        type: "warning",
        icon: "AlertTriangle",
        badge: "OVER BUDGET",
        impactValue: `${((spent / limit) * 100).toFixed(0)}% Used`
      });
    } else {
      insights.push({
        title: "BUDGET HEALTHY",
        description: `All tracked spending categories are currently within defined monthly limits.`,
        type: "positive",
        icon: "ShieldCheck",
        badge: "ALL CLEAR",
        impactValue: "100% On Cap"
      });
    }

    // 3. Subscriptions / Portfolio
    const recurring = transactions.filter(t => t.isRecurring);
    if (recurring.length > 0) {
      const recTotal = recurring.reduce((s, t) => s + (t.amount || 0), 0);
      insights.push({
        title: "RECURRING CHARGES TRACKED",
        description: `${recurring.length} active recurring subscriptions and bills amounting to ~${symbol}${recTotal.toFixed(2)} per cycle.`,
        type: "tip",
        icon: "Repeat",
        badge: "RECURRING",
        impactValue: `${recurring.length} Active`
      });
    } else {
      insights.push({
        title: "LIQUIDITY DIVERSIFICATION",
        description: `Monitoring ${accounts.length} active accounts with a combined balance of ${symbol}${totalBalance.toFixed(2)}.`,
        type: "tip",
        icon: "ShieldCheck",
        badge: "PORTFOLIO",
        impactValue: `${symbol}${totalBalance.toFixed(2)}`
      });
    }

    // 4. Goals Milestone
    if (goals.length > 0) {
      const topGoal = goals[0];
      const target = topGoal.target || topGoal.targetAmount || 1;
      const progress = topGoal.progress || topGoal.currentProgress || 0;
      const pct = Math.round((progress / target) * 100);
      const remaining = Math.max(0, target - progress);

      insights.push({
        title: `${topGoal.name.toUpperCase()} MILESTONE`,
        description: remaining > 0 
          ? `You have funded ${pct}% of "${topGoal.name}". Only ${symbol}${remaining.toFixed(2)} remaining to complete target.`
          : `Target complete! You've fully funded "${topGoal.name}" with ${symbol}${progress.toFixed(2)}!`,
        type: "milestone",
        icon: "Trophy",
        badge: pct >= 100 ? "COMPLETED" : "GOAL PROGRESS",
        impactValue: `${pct}% Done`
      });
    } else {
      insights.push({
        title: "SET A SAVINGS TARGET",
        description: "Create a savings goal in the Budgets & Goals view to automatically track progress towards milestones.",
        type: "milestone",
        icon: "Trophy",
        badge: "NEW TARGET",
        impactValue: "Create Goal"
      });
    }

    return insights;
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Smart Insights Generation with Gemini API
  app.post("/api/gemini/insights", async (req, res) => {
    const { financialSummary, accounts, transactions, budgets, goals, currency } = req.body;

    try {
      const ai = getGeminiClient();

      const prompt = `Analyze this user's REAL personal finance data and generate 4 specific, actionable, mathematically accurate insights or advice for their dashboard.
Currency: ${currency || '$'}

Financial Metrics:
- Total Balance: ${financialSummary?.totalBalance ?? 'N/A'}
- Monthly Income: ${financialSummary?.monthlyIncome ?? 'N/A'}
- Monthly Expense: ${financialSummary?.monthlyExpense ?? 'N/A'}
- Net Savings: ${financialSummary?.netSavings ?? 'N/A'}
- Savings Rate: ${financialSummary?.savingsRate ?? 'N/A'}%

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

      const responseText = await generateContentWithRetry(ai, {
        prompt,
        models: ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.1-pro-preview"],
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
                impactValue: { type: Type.STRING, description: "Short numeric impact or metric, e.g. +$320.00, 74% Done" }
              },
              required: ["title", "description", "type", "badge"]
            }
          }
        }
      });

      const insights = JSON.parse(responseText);
      return res.json({ success: true, insights, source: 'gemini' });
    } catch (err: any) {
      console.warn("Gemini Insights API temporarily unavailable, using real ledger calculation fallback:", err.message);
      const fallbackInsights = calculateRealFallbackInsights(financialSummary, accounts, transactions, budgets, goals, currency);
      return res.json({ success: true, insights: fallbackInsights, source: 'ledger-analytics', notice: 'Calculated directly from active ledger' });
    }
  });

  // Interactive AI Financial Advisor Chat / Q&A
  app.post("/api/gemini/advisor", async (req, res) => {
    const { question, financialContext, currency } = req.body;

    try {
      const ai = getGeminiClient();

      const prompt = `You are the Ledgerly Smart Financial Advisor. The user is asking a question about their personal finances.

User Question: "${question}"
Currency: ${currency || '$'}

User's Real Financial Context:
${JSON.stringify(financialContext, null, 2)}

Provide clear, realistic, tailored advice based directly on their real account balances, actual income, expense categories, budgets, and savings goals.
Include concrete calculations or suggestions where applicable. Use clear formatting with bullet points and bold numbers.`;

      const answer = await generateContentWithRetry(ai, {
        prompt,
        models: ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.1-pro-preview"],
      });

      return res.json({ success: true, answer });
    } catch (err: any) {
      console.warn("Gemini Advisor API query fallback:", err.message);
      
      // Provide a structured ledger-grounded answer even if all external models are having high-demand spikes
      const symbol = currency || '$';
      const summary = financialContext?.financialSummary || {};
      const answer = `### 📊 Financial Ledger Summary for "${question}"
Based on your current recorded data:
* **Monthly Income:** ${symbol}${summary.monthlyIncome ?? 0}
* **Monthly Expenses:** ${symbol}${summary.monthlyExpense ?? 0}
* **Net Surplus:** ${symbol}${summary.netSavings ?? 0} (Savings Rate: **${summary.savingsRate ?? 0}%**)
* **Top Spending Focus:** ${summary.highestExpenseCategory || 'Tracked Categories'}

💡 **Key Recommendation:**
${summary.savingsRate > 20 
  ? `Your savings rate is strong at **${summary.savingsRate}%**. Consider allocating extra surplus into your top savings targets or emergency fund.` 
  : `Focus on keeping discretionary categories within budget limits to raise your savings buffer towards 20%.`}`;

      return res.json({ success: true, answer, notice: 'Ledger contextual analysis' });
    }
  });

  // Vite middleware in dev mode, static serving in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ledgerly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
