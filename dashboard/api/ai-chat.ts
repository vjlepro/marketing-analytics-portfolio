import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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
- LTV:CAC: Enterprise 8.2x, Mid-Market 4.1x, SMB 1.9x (SMB below 3x threshold)
- Recommendation: Shift $300K from Partner/Display to Paid Search and Email

Answer like a senior analyst briefing a CMO. Direct, specific, max 3-4 sentences.`,

  pricing: `You are an AI Analytics Analyst embedded in an executive pricing strategy brief.

DATA:
- Tiers: Starter $49/mo (elasticity -2.1), Professional $149/mo (elasticity -1.3), Enterprise $499/mo (elasticity -0.6)
- A/B test: 10% Pro increase → -4% conversion, +6.5% net revenue
- Proposed: Professional $149→$169, Enterprise $499→$549
- Revenue impact: +$2.1M ARR; churn sensitivity: +0.5pp = -$890K ARR
- 22% of Pro customers have Enterprise usage patterns = $4.8M upsell opportunity

Answer like a senior analyst briefing a CFO. Direct, specific, max 3-4 sentences.`,

  forecast: `You are an AI Analytics Analyst embedded in an executive forecast variance brief.

DATA:
- Q3 Revenue: $22.4M target → $21.1M actual (-5.8%). Root cause: 2 lost enterprise deals late September.
- Expansion: $3.2M target → $3.7M actual (+15.6%) — upsell campaign outperformed
- Churn: exceeded target by $400K; 3 of 4 churns were competitive displacement
- Q4 pipeline: $18.2M (2.7x coverage). Forecast: $23.8M. Risk: $2.2M renewal at risk.

Answer like a senior analyst briefing a CFO. Direct, specific, max 3-4 sentences.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { briefId, message, history } = req.body as {
    briefId: string;
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  };

  const systemPrompt = SYSTEM_PROMPTS[briefId];
  if (!systemPrompt) {
    return res.status(400).json({ error: 'Unknown brief' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: ${JSON.stringify({ error: 'Missing OPENAI_API_KEY env var' })}\n\n`);
    res.end();
    return;
  }

  const client = new OpenAI({ apiKey });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    const status = err?.status || 'no-status';
    console.error('AI chat error:', status, msg);
    res.write(`data: ${JSON.stringify({ error: `${status}: ${msg}` })}\n\n`);
    res.end();
  }
}
