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
  stats: z.any().optional(), // Receive calculated stats from frontend
});

ai.post('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const body = await c.req.json();
    const parsed = analysisSchema.safeParse(body);
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.errors }, 400);
    }

    const { trades, timeframe, stats } = parsed.data;

    if (!trades || trades.length === 0) {
      return c.json({
        report: {
          title: "Incomplete History",
          periodAssessment: "BREAK_EVEN",
          summary: "No closed trades found for the selected timeframe. Add more trades to generate an AI analysis.",
          blindspots: [],
          recurringPatterns: [],
          worstTradeAnalysis: [],
          actionPlan: [],
          stats: stats || { totalPnl: 0, totalTrades: 0, winCount: 0, lossCount: 0, winRate: 0, profitFactor: 0 },
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Prepare a compact summary of trades for the AI
    const tradeSummary = trades.map((t: any) => ({
      symbol: t.symbol,
      type: t.type,
      pnl: t.pnl,
      netPnl: t.netPnl,
      duration: t.exitDate && t.entryDate ? (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) / (1000 * 60 * 60) : 'N/A', // hours
      rMultiple: t.rMultiple,
      setup: t.setupType || t.strategyId,
      emotion: t.entryEmotion
    })).slice(0, 50);

    const systemPrompt = `You are an elite Trading Performance Analyst. Your goal is to analyze a trader's performance data and provide a deep, actionable, and data-driven psychological and technical report.
Your response MUST be a valid JSON object. Do not include any text before or after the JSON.

Expected JSON Schema (AIReport):
{
  "title": "A punchy, descriptive title for this report",
  "periodAssessment": "PROFITABLE" | "BREAK_EVEN" | "LOSING",
  "summary": "A deep analysis of the trader's current state, identifying their primary strength and biggest obstacle (3-4 sentences).",
  "blindspots": [
    { 
      "title": "Short title (e.g., Revenge Trading)", 
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "description": "Specific psychological or technical blindspot identified.",
      "evidence": "Data point from the trades justifying this insight.",
      "recommendation": "Specific action to fix or improve."
    }
  ],
  "recurringPatterns": [
    { 
      "title": "e.g., Morning Glory", 
      "pnl": number,
      "description": "Description of the recurring pattern (positive or negative).", 
      "tradeCount": number,
      "isPositive": boolean 
    }
  ],
  "worstTradeAnalysis": [
    { "whatWentWrong": "Summary of execution error", "lesson": "A concrete rule to prevent recurrence" }
  ],
  "actionPlan": [
    { 
      "title": "Clear actionable step", 
      "priority": "FIRST PRIORITY" | "IMPORTANT" | "OPTIMIZATION", 
      "description": "Detailed explanation of what to do.",
      "measureSuccess": "A metric to track if this step is working."
    }
  ]
}

Ensure the report is elite, looks past the surface, and feels like a $1000/hr consultant wrote it.`;

    const userPrompt = `Analyze these trades from the ${timeframe} period:
Trade Data Summary: ${JSON.stringify(tradeSummary, null, 2)}
Performance Stats: ${JSON.stringify(stats, null, 2)}

Provide a detailed report in the specified JSON format. Your generated report will be shown to the user immediately. Avoid generic advice; use the specific evidence from the trades.`;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }) as any;

    let result;
    try {
      const content = aiResponse.response || aiResponse.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[jsonMatch.length - 1]); // Get the last JSON block if multiple exist
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("AI JSON Parse Error:", parseError, aiResponse);
      return c.json({ error: "Failed to parse AI response into the required report format." }, 500);
    }

    // Merge with frontend stats and add timestamp
    const fullReport = {
      ...result,
      stats: stats || result.stats,
      generatedAt: new Date().toISOString()
    };

    return c.json({ report: fullReport });

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return c.json({ 
      error: "Internal Server Error during AI analysis", 
      message: error.message 
    }, 500);
  }
});

export default ai;
