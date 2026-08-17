import type { Express, Request, Response } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPTS: Record<string, string> = {
  marketing: `You are an AI Analytics Analyst embedded in an executive marketing performance brief.

DATA:
- Total Q3 spend: $4.2M across 6 channels. Attributed revenue: $18.7M (4.45x blended ROAS).
- Paid Search: $1.1M spend, $6.2M revenue (5.6x ROAS), 2,340 conversions, CPA $470, 68% incrementality
- Paid Social: $900K spend, $3.1M revenue (3.4x ROAS), 1,100 conversions, CPA $818
- Display: $600K spend, $1.4M revenue (2.3x ROAS), 31% incrementality
- Email/CRM: $200K spend, $4.8M revenue (24x ROAS), 3,200 conversions, CPA $63
- SEO: $800K spend, $2.6M revenue (3.25x ROAS)
- Partner/Referral: $600K spend, $500K revenue (0.83x ROAS — cash negative)
- MoM conversions: July 2,800 → August 3,100 (+11%) → September 3,050 (-2%, seasonal)
- LTV:CAC: Enterprise 8.2x, Mid-Market 4.1x, SMB 1.9x (SMB below 3x threshold)
- Recommendation: Shift $300K from Partner/Display to Paid Search and Email

Answer like a senior analyst briefing a CMO. Direct, specific, max 3-4 sentences. Translate metrics into decisions.`,

  pricing: `You are an AI Analytics Analyst embedded in an executive pricing strategy brief.

DATA:
- Tiers: Starter $49/mo (elasticity -2.1, highly elastic), Professional $149/mo (elasticity -1.3), Enterprise $499/mo (elasticity -0.6, inelastic)
- Churn: Starter 8.2%/mo, Professional 3.1%/mo, Enterprise 0.9%/mo
- LTV: Starter $340, Professional $2,890, Enterprise $33,200
- A/B test (n=1,200): 10% Pro price increase → -4% conversion, +6.5% net revenue
- Proposed: Professional $149→$169 (+13.4%), Enterprise $499→$549 (+10%)
- Revenue impact: +$2.1M ARR at current volume; churn sensitivity: +0.5pp = -$890K ARR
- 22% of Pro customers have Enterprise-tier usage patterns = $4.8M upsell opportunity
- Competitor A is 15% higher across all tiers

Answer like a senior analyst briefing a CFO and CRO. Direct, specific, max 3-4 sentences.`,

  forecast: `You are an AI Analytics Analyst embedded in an executive forecast variance brief.

DATA:
- Q3 Revenue: $22.4M target → $21.1M actual (-$1.3M, -5.8%)
- New Bookings: $6.8M target → $5.9M actual (-$0.9M). Root cause: 2 lost enterprise deals ($1.1M) in late September
- Expansion Revenue: $3.2M target → $3.7M actual (+$500K, +15.6%) — upsell campaign worked
- Churn: $1.2M target → $1.6M actual. 4 mid-market churns; 3 competitive displacement
- Q4 pipeline: $18.2M (2.7x coverage vs $6.7M target)
- Q4 forecast: $23.8M. Risk: $2.2M enterprise renewal at risk due to stakeholder change
- Pipeline velocity: +18% MoM. Demo-to-trial: +9%. Time-to-close: -12 days

Answer like a senior analyst briefing a CFO and sales leadership. Direct, specific, max 3-4 sentences.`,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/ai-chat", async (req: Request, res: Response) => {
    const { briefId, message, history } = req.body as {
      briefId: string;
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    const systemPrompt = SYSTEM_PROMPTS[briefId];
    if (!systemPrompt) {
      res.status(400).json({ error: "Unknown brief" });
      return;
    }

    const messages = [
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = client.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: systemPrompt,
        messages,
      });

      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error(err);
      res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
      res.end();
    }
  });

  return httpServer;
}
