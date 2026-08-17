import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Cell,
} from "recharts";
import {
  Send, Bot, User, TrendingUp, TrendingDown, Minus,
  BarChart2, DollarSign, Target, ChevronRight, Sparkles,
  MessageSquare, X, ArrowLeft,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

// ── Types ─────────────────────────────────────────────────────────────────────
interface KPI { label: string; value: string; delta: string; up: boolean | null; }
interface Brief {
  id: string; title: string; subtitle: string;
  kpis: KPI[]; charts: Record<string, any[]>; suggestedQuestions: string[];
}
interface Message { role: "user" | "assistant"; content: string; }

// ── Inline brief data (no backend needed for the index page) ──────────────────
const BRIEFS: Brief[] = [
  {
    id: "marketing",
    title: "Q3 Marketing Performance Review",
    subtitle: "Multi-Channel Attribution & Spend Optimization",
    kpis: [
      { label: "Total Spend",        value: "$4.2M",   delta: "+12% YoY",       up: true  },
      { label: "Attributed Revenue", value: "$18.7M",  delta: "+22% YoY",       up: true  },
      { label: "Blended ROAS",       value: "4.45x",   delta: "+0.4x vs Q2",    up: true  },
      { label: "Avg CPA",            value: "$618",    delta: "-8% vs Q2",      up: true  },
    ],
    charts: {
      channelRoas: [
        { channel: "Email/CRM",   roas: 24.0, spend: 200  },
        { channel: "Paid Search", roas: 5.6,  spend: 1100 },
        { channel: "SEO",         roas: 3.25, spend: 800  },
        { channel: "Paid Social", roas: 3.4,  spend: 900  },
        { channel: "Display",     roas: 2.3,  spend: 600  },
        { channel: "Partner",     roas: 0.83, spend: 600  },
      ],
      monthlyConversions: [
        { month: "July",      conversions: 2800 },
        { month: "August",    conversions: 3100 },
        { month: "September", conversions: 3050 },
      ],
    },
    suggestedQuestions: [
      "Which channel should we cut?",
      "Why is ROAS dropping on Partner?",
      "Where should we shift Q4 budget?",
      "Which customer segment has the best ROI?",
      "What drove the August conversion spike?",
    ],
  },
  {
    id: "pricing",
    title: "Pricing Strategy Recommendation",
    subtitle: "Price Elasticity Analysis & Revenue Optimization",
    kpis: [
      { label: "ARR Impact",         value: "+$2.1M",   delta: "from price increase",    up: true  },
      { label: "Elasticity (Pro)",   value: "-1.3",     delta: "moderate risk",           up: null  },
      { label: "Upsell Opportunity", value: "$4.8M ARR",delta: "22% of Pro base",         up: true  },
      { label: "Churn Sensitivity",  value: "-$890K",   delta: "per +0.5pp churn",        up: false },
    ],
    charts: {
      elasticityByTier: [
        { tier: "Starter",      elasticity: -2.1 },
        { tier: "Professional", elasticity: -1.3 },
        { tier: "Enterprise",   elasticity: -0.6 },
      ],
      revenueImpact: [
        { scenario: "Base",        revenue: 0    },
        { scenario: "Pro Only",    revenue: 2100 },
        { scenario: "Pro + Ent",   revenue: 3400 },
        { scenario: "All Tiers",   revenue: 2800 },
      ],
    },
    suggestedQuestions: [
      "Which tier should we increase first?",
      "What is the churn risk of the Pro increase?",
      "How do we handle existing customer pushback?",
      "Should we grandfather current customers?",
      "What is the upsell playbook for Enterprise?",
    ],
  },
  {
    id: "forecast",
    title: "Revenue Forecast vs. Actuals",
    subtitle: "Q3 Variance Analysis & Q4 Outlook",
    kpis: [
      { label: "Q3 Revenue",       value: "$21.1M",  delta: "-5.8% vs target",  up: false },
      { label: "Expansion",        value: "$3.7M",   delta: "+15.6% vs target", up: true  },
      { label: "Q4 Forecast",      value: "$23.8M",  delta: "+12.8% vs Q3",     up: true  },
      { label: "Pipeline Coverage",value: "2.7x",    delta: "$18.2M in pipe",   up: true  },
    ],
    charts: {
      quarterlyTrend: [
        { quarter: "Q1", target: 19.2, actual: 19.8,  forecast: null },
        { quarter: "Q2", target: 20.8, actual: 20.2,  forecast: null },
        { quarter: "Q3", target: 22.4, actual: 21.1,  forecast: null },
        { quarter: "Q4", target: 22.4, actual: null,  forecast: 23.8 },
      ],
      revenueComponents: [
        { component: "New Logo",  target: 6800,  actual: 5900  },
        { component: "Expansion", target: 3200,  actual: 3700  },
        { component: "Renewal",   target: 13600, actual: 13100 },
      ],
    },
    suggestedQuestions: [
      "Why did we miss Q3?",
      "Is the Q4 forecast achievable?",
      "What is the biggest risk to Q4?",
      "How do we address the churn spike?",
      "What is driving expansion outperformance?",
    ],
  },
];

// ── System prompts per brief ──────────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  marketing: `You are an AI Analytics Analyst assistant embedded in an executive marketing performance brief.
The brief covers Q3 marketing performance for a mid-market B2B company.

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

// ── Color tokens (match portfolio palette) ────────────────────────────────────
const CYAN   = "hsl(199 89% 48%)";
const GREEN  = "hsl(158 64% 52%)";
const RED    = "hsl(0 72% 51%)";
const AMBER  = "hsl(35 91% 55%)";
const PURPLE = "hsl(262 80% 65%)";
const SLATE  = "hsl(215 20% 35%)";

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ kpi }: { kpi: KPI }) {
  const Icon = kpi.up === true ? TrendingUp : kpi.up === false ? TrendingDown : Minus;
  const color = kpi.up === true ? GREEN : kpi.up === false ? RED : AMBER;
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
      <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{kpi.label}</span>
      <span className="text-xl font-bold text-foreground mono">{kpi.value}</span>
      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
        <Icon size={11} /> {kpi.delta}
      </span>
    </div>
  );
}

// ── Streaming Chat Panel ──────────────────────────────────────────────────────
function ChatPanel({ brief, onClose }: { brief: Brief; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I'm your AI Analyst for the **${brief.title}**. Ask me anything about the data — channel performance, budget recommendations, risks, or what actions to take next.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
    setMessages(m => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId: brief.id, message: text, history }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages(m => {
                const next = [...m];
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + parsed.text };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(m => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], content: "Sorry, something went wrong. Try again." };
        return next;
      });
    }
    setStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${CYAN}22` }}>
            <Sparkles size={12} style={{ color: CYAN }} />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">AI Analyst</div>
            <div className="text-[10px] text-muted-foreground">Grounded in brief data</div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
              msg.role === "assistant" ? "bg-secondary" : ""
            }`} style={msg.role === "user" ? { background: CYAN } : {}}>
              {msg.role === "assistant"
                ? <Bot size={12} className="text-muted-foreground" />
                : <User size={12} style={{ color: "hsl(222 47% 7%)" }} />
              }
            </div>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "assistant" ? "bg-secondary text-foreground" : "text-foreground"
            }`} style={msg.role === "user" ? { background: CYAN, color: "hsl(222 47% 7%)" } : {}}>
              {msg.content === "" && streaming
                ? <span className="flex gap-1 py-0.5">
                    {[0,0.2,0.4].map((d,j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-current inline-block"
                        style={{ animation: `blink 1.2s ${d}s infinite` }} />
                    ))}
                  </span>
                : msg.content.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                  )
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* quick questions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {brief.suggestedQuestions.slice(0, 3).map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <div className="px-3 pb-3 pt-2 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 items-center bg-secondary rounded-lg px-3 py-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about the data..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none"
            disabled={streaming} />
          <button type="submit" disabled={streaming || !input.trim()}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors disabled:opacity-40"
            style={{ background: CYAN }}>
            <Send size={10} style={{ color: "hsl(222 47% 7%)" }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Charts by brief type ──────────────────────────────────────────────────────
function MarketingCharts({ charts }: { charts: Brief["charts"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">ROAS by Channel</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={charts.channelRoas} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="channel" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} width={72} />
            <Tooltip formatter={(v: any) => [`${v}x`, "ROAS"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <ReferenceLine x={1} stroke={RED} strokeDasharray="3 3" />
            <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
              {charts.channelRoas.map((e: any, i: number) => (
                <Cell key={i} fill={e.roas < 1 ? RED : e.roas > 5 ? GREEN : CYAN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Monthly Conversions</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={charts.monthlyConversions}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="conversions" fill={CYAN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PricingCharts({ charts }: { charts: Brief["charts"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Elasticity by Tier</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={charts.elasticityByTier}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="tier" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="elasticity" radius={[4, 4, 0, 0]}>
              {charts.elasticityByTier.map((e: any, i: number) => (
                <Cell key={i} fill={e.elasticity < -1.5 ? RED : e.elasticity < -1 ? AMBER : GREEN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground mt-1">More negative = more price-sensitive.</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue Impact by Scenario ($K ARR)</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={charts.revenueImpact}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="scenario" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {charts.revenueImpact.map((e: any, i: number) => (
                <Cell key={i} fill={i === 1 ? GREEN : CYAN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ForecastCharts({ charts }: { charts: Brief["charts"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue: Target vs Actual ($M)</div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={charts.quarterlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={[17, 26]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <Line dataKey="target" stroke={SLATE} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target" />
            <Line dataKey="actual" stroke={CYAN} strokeWidth={2} dot={{ fill: CYAN, r: 3 }} name="Actual" connectNulls={false} />
            <Line dataKey="forecast" stroke={GREEN} strokeWidth={2} strokeDasharray="4 4" dot={{ fill: GREEN, r: 3 }} name="Forecast" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Q3 Components: Target vs Actual ($K)</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={charts.revenueComponents}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="component" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="target" fill={SLATE} radius={[4, 4, 0, 0]} name="Target" />
            <Bar dataKey="actual" radius={[4, 4, 0, 0]} name="Actual">
              {charts.revenueComponents.map((e: any, i: number) => (
                <Cell key={i} fill={e.actual >= e.target ? GREEN : RED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Brief detail view ─────────────────────────────────────────────────────────
function BriefDetail({ brief, onBack }: { brief: Brief; onBack: () => void }) {
  const [chatOpen, setChatOpen] = useState(false);
  const Charts = brief.id === "marketing" ? MarketingCharts
    : brief.id === "pricing" ? PricingCharts : ForecastCharts;

  return (
    <div className="flex flex-col h-full">
      {/* sub-header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background/40">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} /> Back to Briefs
        </button>
        <span className="text-border">·</span>
        <span className="text-xs text-foreground font-medium">{brief.title}</span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          AI Analyst active
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground mb-0.5">{brief.title}</h2>
            <p className="text-xs text-muted-foreground">{brief.subtitle}</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {brief.kpis.map(k => <KpiCard key={k.label} kpi={k} />)}
          </div>

          {/* charts */}
          <Charts charts={brief.charts} />

          {/* suggested Qs when chat is closed */}
          {!chatOpen && (
            <div className="mt-5 bg-muted/40 rounded-lg p-4 border border-border">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={10} style={{ color: CYAN }} /> Ask the AI Analyst
              </div>
              <div className="flex flex-wrap gap-2">
                {brief.suggestedQuestions.map(q => (
                  <button key={q} onClick={() => setChatOpen(true)}
                    className="text-[10px] px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center gap-1">
                    <ChevronRight size={9} /> {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* chat sidebar */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 p-4 border-l border-border flex flex-col h-full">
            <ChatPanel brief={brief} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      {/* floating button */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium shadow-lg transition-transform hover:scale-105"
          style={{ background: CYAN, color: "hsl(222 47% 7%)" }}>
          <MessageSquare size={13} /> Ask AI Analyst
        </button>
      )}
    </div>
  );
}

// ── Brief card on index ───────────────────────────────────────────────────────
function BriefCard({ brief, onClick }: { brief: Brief; onClick: () => void }) {
  const icons: Record<string, any> = { marketing: BarChart2, pricing: DollarSign, forecast: Target };
  const Icon = icons[brief.id] || BarChart2;
  return (
    <button onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-200 group">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${CYAN}18` }}>
          <Icon size={17} style={{ color: CYAN }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm mb-0.5 group-hover:text-primary transition-colors">{brief.title}</div>
          <div className="text-[11px] text-muted-foreground mb-3">{brief.subtitle}</div>
          <div className="grid grid-cols-2 gap-2">
            {brief.kpis.slice(0, 2).map(k => (
              <div key={k.label} className="bg-secondary rounded-md px-2.5 py-1.5">
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
                <div className="text-sm font-bold text-foreground mono">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function AIAnalyst() {
  const [active, setActive] = useState<Brief | null>(null);

  if (active) return <BriefDetail brief={active} onBack={() => setActive(null)} />;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Executive AI Analyst"
        subtitle="Three executive-ready briefs with live KPIs, charts, and an AI analyst you can interrogate in real time."
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* brief cards */}
        <div className="max-w-2xl flex flex-col gap-4 mb-8">
          {BRIEFS.map(b => <BriefCard key={b.id} brief={b} onClick={() => setActive(b)} />)}
        </div>

        {/* how it works */}
        <div className="max-w-2xl border border-border rounded-xl p-5 bg-secondary/30">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">How It Works</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: "01", title: "Grounded Context", desc: "Each brief's full dataset is injected into the AI's system prompt — answers come from real data, not hallucination." },
              { n: "02", title: "Streaming Responses", desc: "Responses stream token-by-token via Server-Sent Events from an Express backend, identical to production analytics copilots." },
              { n: "03", title: "Executive Framing", desc: "The AI is prompted to respond as a senior analyst briefing a CMO or CFO — decisions, not data dumps." },
            ].map(s => (
              <div key={s.n}>
                <div className="text-xs font-bold mono mb-1" style={{ color: CYAN }}>{s.n}</div>
                <div className="text-xs font-semibold text-foreground mb-1">{s.title}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// inject blink keyframe globally once
if (typeof document !== "undefined" && !document.getElementById("ai-blink-style")) {
  const s = document.createElement("style");
  s.id = "ai-blink-style";
  s.textContent = `@keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }`;
  document.head.appendChild(s);
}
