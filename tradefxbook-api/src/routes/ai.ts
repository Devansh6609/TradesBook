// src/routes/ai.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import type { AppEnv } from '../index';

const ai = new Hono<AppEnv>();

// Apply auth middleware to all AI routes
ai.use('*', authMiddleware);

const analysisSchema = z.object({
  trades: z.array(z.any()),
  timeframe: z.string(),
});

ai.post('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const body = await c.req.json();
    const parsed = analysisSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.errors }, 400);
    }

    const { trades, timeframe } = parsed.data;

    if (!trades || trades.length === 0) {
      return c.json({
        summary: "No trade data available for the selected timeframe. Please add some trades to generate an AI analysis.",
        stats: { totalPnL: 0, winRate: 0, profitFactor: 0, avgRR: 0 },
        blindspots: [],
        patterns: [],
        actionPlan: []
      });
    }

    // Prepare a compact summary of trades for the AI
    const tradeSummary = trades.map((t: any) => ({
      symbol: t.symbol,
      type: t.type,
      pnl: t.pnl,
      netPnl: t.netPnl,
      duration: t.exitDate && t.entryDate ? (t.exitDate - t.entryDate) : 'N/A',
      rMultiple: t.rMultiple,
      setup: t.setupType,
      emotion: t.entryEmotion
    })).slice(0, 50); // Limit to top 50 trades to stay within context limits

    const systemPrompt = `You are an elite Trading Performance Analyst. Your goal is to analyze a trader's performance data and provide a deep, actionable, and data-driven psychological and technical report.
Your response MUST be a valid JSON object. Do not include any text before or after the JSON.

Expected JSON Schema:
{
  "summary": "A concise, professional overview of the trader's performance (2-3 sentences).",
  "stats": {
    "totalPnL": number,
    "winRate": number,
    "profitFactor": number,
    "avgRR": number
  },
  "blindspots": [
    { "title": "Short title", "description": "Specific psychological or technical blindspot identified.", "severity": "high" | "medium" | "low" }
  ],
  "patterns": [
    { "behavior": "Recurring behavior", "impact": "negative" | "positive", "recommendation": "Specific action to fix or improve." }
  ],
  "actionPlan": [
    { "step": "Clear actionable step", "timeframe": "e.g., Next 10 trades", "priority": "high" | "medium" | "low" }
  ]
}`;

    const userPrompt = `Analyze these trades from the ${timeframe} period:
${JSON.stringify(tradeSummary, null, 2)}

Provide a detailed report in the specified JSON format.`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }) as any;

    let result;
    try {
      // The AI might return the JSON wrapped in markdown or with extra text
      const content = aiResponse.response || aiResponse.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("AI JSON Parse Error:", parseError, aiResponse);
      return c.json({ error: "Failed to parse AI response into the required report format." }, 500);
    }

    return c.json(result);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return c.json({ 
      error: "Internal Server Error during AI analysis", 
      message: error.message 
    }, 500);
  }
});

export default ai;
