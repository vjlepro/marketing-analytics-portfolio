import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Tooltip,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Database, Users, Brain,
  CheckCircle2, AlertCircle, XCircle, Trophy, Target, Lightbulb,
  ArrowRight, RotateCcw,
} from 'lucide-react';

// ── Palette ───────────────────────────────────────────────────────────────────
const CYAN   = 'hsl(199 89% 48%)';
const PURPLE = 'hsl(262 80% 65%)';
const GREEN  = 'hsl(158 64% 52%)';
const AMBER  = 'hsl(35 91% 55%)';
const RED    = 'hsl(0 72% 51%)';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  dimension: 'measurement' | 'infrastructure' | 'culture' | 'ai';
  text: string;
  subtext?: string;
  options: { label: string; score: number; detail: string }[];
}

interface Answer { questionId: string; score: number; optionLabel: string; }

// ── Questions ─────────────────────────────────────────────────────────────────
const QUESTIONS: Question[] = [
  // Measurement
  {
    id: 'attribution',
    dimension: 'measurement',
    text: 'How does your team currently attribute revenue to marketing channels?',
    subtext: 'This tells us how sophisticated your measurement foundation is.',
    options: [
      { label: 'Last-touch only',            score: 1, detail: 'Single-touch attribution misses up to 60% of the customer journey.' },
      { label: 'First or linear multi-touch', score: 2, detail: 'Rule-based multi-touch is better but still assigns arbitrary weights.' },
      { label: 'Data-driven / algorithmic MTA', score: 3, detail: 'Probabilistic attribution accounts for real path weights.' },
      { label: 'MMM + MTA + incrementality testing', score: 4, detail: 'Gold standard: triangulating three methodologies for confidence.' },
    ],
  },
  {
    id: 'incrementality',
    dimension: 'measurement',
    text: 'How do you measure the true incremental impact of a campaign?',
    subtext: 'Incrementality separates causation from correlation.',
    options: [
      { label: "We don't — we use reported ROAS",  score: 1, detail: 'Reported ROAS overstates impact by 30-70% on average.' },
      { label: 'Occasional holdout tests',          score: 2, detail: 'Ad hoc testing is better than nothing but creates gaps.' },
      { label: 'Geo or user-level holdouts regularly', score: 3, detail: 'Systematic holdout testing builds reliable baselines.' },
      { label: 'Always-on geo experiments + Bayesian inference', score: 4, detail: 'Continuous measurement with statistical rigor.' },
    ],
  },
  {
    id: 'ltv',
    dimension: 'measurement',
    text: 'How do you model customer lifetime value?',
    options: [
      { label: 'We use average order value as a proxy', score: 1, detail: 'AOV ignores churn, repeat purchase, and margin.' },
      { label: 'Static LTV formula (e.g. AOV × frequency × lifespan)', score: 2, detail: 'Better, but doesn\'t account for cohort-level behavioral differences.' },
      { label: 'Cohort-based LTV with retention curves', score: 3, detail: 'Tracks actual customer trajectories over time.' },
      { label: 'Predictive LTV model per customer (ML)', score: 4, detail: 'Individual-level predictions enable precision targeting and CAC thresholds.' },
    ],
  },
  // Infrastructure
  {
    id: 'warehouse',
    dimension: 'infrastructure',
    text: 'Where does your analytics data live and how is it accessed?',
    options: [
      { label: 'Spreadsheets and platform dashboards', score: 1, detail: 'Siloed data means every report is a manual effort.' },
      { label: 'A data warehouse exists but access is limited', score: 2, detail: 'Centralized but not democratized — creates analyst bottlenecks.' },
      { label: 'Warehouse with governed semantic layer', score: 3, detail: 'Teams self-serve from a single source of truth.' },
      { label: 'Modern stack: warehouse + dbt + reverse ETL to tools', score: 4, detail: 'Data moves bidirectionally — insights activate automatically in CRM, ads, etc.' },
    ],
  },
  {
    id: 'freshness',
    dimension: 'infrastructure',
    text: 'How current is the data your team makes decisions on?',
    options: [
      { label: 'Weekly or monthly reports',   score: 1, detail: 'Decisions lag reality by days or weeks.' },
      { label: 'Daily dashboards',            score: 2, detail: 'Good for trend monitoring but misses intraday signals.' },
      { label: 'Near real-time (hourly)',     score: 3, detail: 'Enables fast campaign optimization and anomaly detection.' },
      { label: 'Streaming / real-time with alerting', score: 4, detail: 'Teams act on signals as they happen, not after the fact.' },
    ],
  },
  // Culture
  {
    id: 'decisions',
    dimension: 'culture',
    text: 'How are major budget or strategy decisions made in your org?',
    options: [
      { label: 'Primarily gut feel and seniority', score: 1, detail: 'HiPPO-driven decisions ignore evidence systematically.' },
      { label: 'Data is referenced but not decisive', score: 2, detail: 'Data is used to support decisions already made — confirmation bias.' },
      { label: 'Structured decision frameworks with data inputs', score: 3, detail: 'Evidence shapes options; stakeholders own the final call.' },
      { label: 'Experiment-driven — we test before we scale', score: 4, detail: 'Decisions are made from results, not assumptions.' },
    ],
  },
  {
    id: 'selfserve',
    dimension: 'culture',
    text: 'How much of your analytics output is self-served vs. analyst-dependent?',
    options: [
      { label: 'Almost everything goes through analysts', score: 1, detail: 'Analyst time spent on reporting, not analysis — unsustainable.' },
      { label: 'Basic metrics are self-served; complex asks still go to analysts', score: 2, detail: 'Partial democratization but high-value work still bottlenecked.' },
      { label: 'Most business users pull their own data', score: 3, detail: 'Analysts spend 70%+ of time on insight and strategy, not reporting.' },
      { label: 'Fully self-served with AI-assisted analysis', score: 4, detail: 'Natural language queries, automated anomaly alerts, zero bottlenecks.' },
    ],
  },
  // AI & Experimentation
  {
    id: 'experimentation',
    dimension: 'ai',
    text: 'How mature is your A/B testing and experimentation program?',
    options: [
      { label: 'We rarely run controlled tests',           score: 1, detail: 'Without experiments, you can\'t separate signal from noise.' },
      { label: 'Ad hoc tests when someone asks',          score: 2, detail: 'Reactive testing misses systematic optimization opportunities.' },
      { label: 'Structured program: hypothesis → test → decision', score: 3, detail: 'Testing is a habit, not an event.' },
      { label: 'Always-on experimentation platform, 10+ concurrent tests', score: 4, detail: 'Compounding learnings — the org gets smarter every week.' },
    ],
  },
  {
    id: 'ml',
    dimension: 'ai',
    text: 'How is machine learning used in your analytics workflow?',
    options: [
      { label: 'Not used — we rely on descriptive analytics',     score: 1, detail: 'Descriptive analytics tells you what happened, not what to do.' },
      { label: 'Off-the-shelf models (e.g. GA4 predictions)',    score: 2, detail: 'Useful but not differentiated — everyone has the same tool.' },
      { label: 'Custom models: churn, propensity, forecasting',  score: 3, detail: 'Tailored models outperform generic ones significantly.' },
      { label: 'ML in production: models trigger real actions (bids, offers, content)', score: 4, detail: 'Closed-loop ML — predictions directly drive execution.' },
    ],
  },
  {
    id: 'ai_workflow',
    dimension: 'ai',
    text: 'How is AI integrated into your team\'s day-to-day analytics workflow?',
    options: [
      { label: 'Not integrated — we use traditional BI tools only', score: 1, detail: 'Teams not using AI are losing speed and coverage to those that do.' },
      { label: 'AI assists with writing and summarization',         score: 2, detail: 'Productivity gain, but the core analytical work is unchanged.' },
      { label: 'AI accelerates SQL, Python, and insight generation', score: 3, detail: 'Analysts work 2-3× faster; coverage expands without headcount.' },
      { label: 'AI agents run autonomous analysis, surface anomalies, draft recommendations', score: 4, detail: 'The analytics function scales beyond headcount constraints.' },
    ],
  },
];

const DIMENSIONS = {
  measurement:    { label: 'Measurement',     icon: Target,   color: CYAN,   desc: 'Attribution, incrementality, and LTV modeling' },
  infrastructure: { label: 'Data Infrastructure', icon: Database, color: PURPLE, desc: 'Stack, freshness, and data access' },
  culture:        { label: 'Decision Culture', icon: Users,    color: AMBER,  desc: 'How data drives decisions and self-service' },
  ai:             { label: 'AI & Experimentation', icon: Brain, color: GREEN,  desc: 'Testing maturity and ML/AI integration' },
};

const TIERS = [
  {
    min: 1, max: 1.74,
    label: 'Reactive',
    color: RED,
    summary: 'Your analytics org is operating in reactive mode — reporting on what happened rather than driving what happens next. The foundation needs to be built before advanced capabilities add value.',
    icon: XCircle,
  },
  {
    min: 1.75, max: 2.49,
    label: 'Developing',
    color: AMBER,
    summary: 'You have core analytics in place but significant gaps in measurement rigor, data infrastructure, or decision culture are limiting your impact. Targeted investments in 1-2 areas will unlock step-change improvement.',
    icon: AlertCircle,
  },
  {
    min: 2.5, max: 3.24,
    label: 'Scaling',
    color: CYAN,
    summary: 'Your analytics function is solid and increasingly influential. You have mature measurement practices and a data-driven culture emerging. The opportunity now is closing gaps in AI/ML and moving from insight to automated action.',
    icon: CheckCircle2,
  },
  {
    min: 3.25, max: 4,
    label: 'Leading',
    color: GREEN,
    summary: 'Your analytics org is operating at the frontier. Measurement is rigorous, infrastructure is modern, culture is experiment-driven, and AI is integrated. Focus on compounding these advantages and exporting your model to the rest of the business.',
    icon: Trophy,
  },
];

const RECOMMENDATIONS: Record<string, Record<number, string>> = {
  measurement: {
    1: 'Immediately move off last-touch attribution. Implement a data-driven MTA model using your ad platform data — Google and Meta both offer this natively. Set a 90-day goal to run your first geo holdout test.',
    2: 'Your measurement foundation is partial. Prioritize building an incrementality testing calendar — one geo test per quarter minimum. Start modeling LTV by acquisition cohort to understand which channels acquire customers worth keeping.',
    3: 'Layer in a lightweight MMM to complement your MTA — even a simple regression-based model adds the triangulation you need. Push toward always-on incrementality with Bayesian sequential testing.',
    4: 'You are at measurement maturity. Focus on speed: reduce the time from campaign launch to measurable incrementality signal.',
  },
  infrastructure: {
    1: 'Consolidating data into a warehouse is the highest-leverage investment you can make. Start with BigQuery or Snowflake + a single dbt project that defines your core metrics. Everything else flows from this.',
    2: 'Expand access to your warehouse. Build a semantic layer (dbt metrics, LookML, or Cube) so business users can self-serve without knowing SQL. This 3-month investment pays off for years.',
    3: 'Move toward reverse ETL — push warehouse signals back into CRM, ad platforms, and customer success tools so insights activate automatically. Hightouch or Census can do this in days.',
    4: 'Your infrastructure is modern. Focus on reliability: SLA monitoring, data quality alerts, and lineage documentation so the org trusts the data as much as it uses it.',
  },
  culture: {
    1: 'Culture change starts with one visible win. Pick one upcoming decision — a budget allocation, a channel mix change — and force a structured experiment before committing. Make the result public. Repeat.',
    2: 'Your team references data but doesn\'t depend on it. Implement a "decision log" — every major decision documents the hypothesis, the data consulted, and the outcome. This builds accountability and learning.',
    3: 'You\'re close to a fully data-driven culture. Close the self-service gap: identify the top 10 questions business leaders ask weekly and build automated dashboards or AI-assisted answers for all of them.',
    4: 'Culture is your advantage. Protect it by making experimentation a hiring criterion — candidates should be able to articulate a test they\'ve run and what they learned.',
  },
  ai: {
    1: 'Start with forecasting — it\'s the highest-impact, lowest-risk ML use case. Build a simple revenue or demand forecast model in Python. Publish the confidence intervals alongside the point estimate. This alone changes how leadership uses the number.',
    2: 'Move beyond off-the-shelf AI. Build one custom propensity model — churn risk or purchase likelihood — trained on your own data. Custom models routinely outperform generic ones by 20-40%.',
    3: 'Close the loop: connect your models to execution. A churn model that triggers a retention offer automatically is 10× more valuable than one that produces a weekly report. Prioritize one closed-loop use case.',
    4: 'You\'re at the frontier. Invest in autonomous agents — AI systems that monitor KPIs, detect anomalies, draft hypotheses, and surface recommendations without human prompting. This is where the next wave of analytics value is being created.',
  },
};

// ── Score utils ───────────────────────────────────────────────────────────────
function calcScores(answers: Answer[]) {
  const dims = Object.keys(DIMENSIONS) as (keyof typeof DIMENSIONS)[];
  const dimScores: Record<string, number> = {};
  dims.forEach(dim => {
    const qs = QUESTIONS.filter(q => q.dimension === dim);
    const ans = answers.filter(a => qs.find(q => q.id === a.questionId));
    dimScores[dim] = ans.length ? ans.reduce((s, a) => s + a.score, 0) / ans.length : 0;
  });
  const overall = Object.values(dimScores).reduce((s, v) => s + v, 0) / dims.length;
  return { dimScores, overall };
}

function getTier(score: number) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CYAN }} />
      </div>
      <span className="text-[10px] text-muted-foreground mono flex-shrink-0">{current}/{total}</span>
    </div>
  );
}

// ── Dimension badge ───────────────────────────────────────────────────────────
function DimBadge({ dim }: { dim: keyof typeof DIMENSIONS }) {
  const d = DIMENSIONS[dim];
  const Icon = d.icon;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[10px] font-medium"
      style={{ color: d.color, borderColor: `${d.color}40`, background: `${d.color}10` }}>
      <Icon size={10} /> {d.label}
    </div>
  );
}

// ── Question view ─────────────────────────────────────────────────────────────
function QuestionView({
  question, current, total, selected, onSelect, onNext, onBack,
}: {
  question: Question; current: number; total: number;
  selected: Answer | undefined; onSelect: (a: Answer) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <ProgressBar current={current} total={total} />
      </div>

      <div>
        <div className="mb-3"><DimBadge dim={question.dimension} /></div>
        <h2 className="text-base font-semibold text-foreground mb-1 leading-snug">{question.text}</h2>
        {question.subtext && <p className="text-xs text-muted-foreground">{question.subtext}</p>}
      </div>

      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selected?.optionLabel === opt.label;
          return (
            <button
              key={i}
              onClick={() => onSelect({ questionId: question.id, score: opt.score, optionLabel: opt.label })}
              className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                isSelected
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border hover:border-primary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: CYAN }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium mb-0.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">{opt.detail}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} disabled={current === 1}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: selected ? CYAN : undefined, color: selected ? 'hsl(222 47% 7%)' : undefined,
            border: selected ? 'none' : '1px solid hsl(var(--border))' }}>
          {current === total ? 'See Results' : 'Next'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Score meter ───────────────────────────────────────────────────────────────
function ScoreMeter({ score, color }: { score: number; color: string }) {
  const pct = ((score - 1) / 3) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold mono" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────
function Results({ answers, onRetake }: { answers: Answer[]; onRetake: () => void }) {
  const { dimScores, overall } = calcScores(answers);
  const tier = getTier(overall);
  const TierIcon = tier.icon;

  const radarData = Object.entries(DIMENSIONS).map(([key, d]) => ({
    subject: d.label.split(' ')[0],
    score: dimScores[key] || 0,
    fullMark: 4,
  }));

  const barData = Object.entries(DIMENSIONS).map(([key, d]) => ({
    name: d.label.split(' & ')[0].split(' ')[0],
    score: parseFloat((dimScores[key] || 0).toFixed(2)),
    color: d.color,
  }));

  const weakest = Object.entries(dimScores).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Overall tier */}
      <div className="rounded-xl border p-5 text-center" style={{ borderColor: `${tier.color}40`, background: `${tier.color}08` }}>
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${tier.color}20` }}>
            <TierIcon size={28} style={{ color: tier.color }} />
          </div>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Analytics Maturity</div>
        <div className="text-2xl font-bold mb-1" style={{ color: tier.color }}>{tier.label}</div>
        <div className="text-3xl font-black mono mb-3" style={{ color: tier.color }}>{overall.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 4.0</span></div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">{tier.summary}</p>
      </div>

      {/* Dimension scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(DIMENSIONS).map(([key, d]) => {
          const Icon = d.icon;
          const score = dimScores[key] || 0;
          const dimTier = getTier(score);
          return (
            <div key={key} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} style={{ color: d.color }} />
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{d.label}</span>
                <span className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${dimTier.color}20`, color: dimTier.color }}>{dimTier.label}</span>
              </div>
              <ScoreMeter score={score} color={d.color} />
              <p className="text-[10px] text-muted-foreground mt-1.5">{d.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Radar chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Capability Profile</div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }} />
            <Radar dataKey="score" stroke={CYAN} fill={CYAN} fillOpacity={0.15} strokeWidth={2} dot={{ fill: CYAN, r: 3 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score bar chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score by Dimension</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={barData} margin={{ left: 0 }}>
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={13} style={{ color: AMBER }} />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Priority Recommendations</span>
        </div>
        <div className="flex flex-col gap-3">
          {weakest.map((dim, i) => {
            const d = DIMENSIONS[dim as keyof typeof DIMENSIONS];
            const Icon = d.icon;
            const score = dimScores[dim];
            const level = Math.min(Math.round(score), 3) as 1 | 2 | 3 | 4;
            const rec = RECOMMENDATIONS[dim]?.[level] || RECOMMENDATIONS[dim]?.[1];
            return (
              <div key={dim} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold mono" style={{ color: d.color }}>0{i + 1}</span>
                  <Icon size={12} style={{ color: d.color }} />
                  <span className="text-xs font-semibold text-foreground">{d.label}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">Score: {score.toFixed(1)}/4.0</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rec}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full recommendations accordion */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">All Dimension Recommendations</div>
        <div className="flex flex-col gap-2">
          {Object.entries(DIMENSIONS).map(([dim, d]) => {
            const score = dimScores[dim];
            const level = Math.min(Math.round(score), 3) as 1|2|3|4;
            const rec = RECOMMENDATIONS[dim]?.[level] || RECOMMENDATIONS[dim]?.[1];
            const Icon = d.icon;
            return (
              <div key={dim} className="bg-card border border-border rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={11} style={{ color: d.color }} />
                  <span className="text-[10px] font-semibold text-foreground">{d.label}</span>
                  <span className="ml-auto text-[9px] mono text-muted-foreground">{score.toFixed(1)}/4.0</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{rec}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <div className="text-xs font-semibold text-foreground mb-1">Want to close these gaps?</div>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          This scorecard is built on frameworks I've implemented across gaming, sports, CPG, and EdTech orgs.
          I'm available for Director and senior leadership roles where analytics maturity is a priority.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href="https://www.linkedin.com/in/vincent-lepore-64873a58" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: CYAN, color: 'hsl(222 47% 7%)' }}>
            Connect on LinkedIn <ArrowRight size={12} />
          </a>
          <button onClick={onRetake}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw size={12} /> Retake Assessment
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Intro screen ──────────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-6 py-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${CYAN}18`, border: `1px solid ${CYAN}30` }}>
        <BarChart3 size={30} style={{ color: CYAN }} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground mb-2">Analytics Maturity Scorecard</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          10 questions across 4 dimensions. Find out where your analytics org ranks — and exactly what to prioritize next.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full text-left">
        {Object.values(DIMENSIONS).map(d => {
          const Icon = d.icon;
          return (
            <div key={d.label} className="bg-card border border-border rounded-lg p-3 flex items-start gap-2.5">
              <Icon size={14} style={{ color: d.color }} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-foreground">{d.label}</div>
                <div className="text-[10px] text-muted-foreground">{d.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 size={11} style={{ color: GREEN }} /> 10 questions</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={11} style={{ color: GREEN }} /> ~3 minutes</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={11} style={{ color: GREEN }} /> Instant results</span>
      </div>

      <button onClick={onStart}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-105"
        style={{ background: CYAN, color: 'hsl(222 47% 7%)' }}>
        Start Assessment <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'questions' | 'results';

export default function Scorecard() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const currentQ = QUESTIONS[currentIdx];
  const currentAnswer = answers.find(a => a.questionId === currentQ?.id);

  function handleSelect(answer: Answer) {
    setAnswers(prev => {
      const next = prev.filter(a => a.questionId !== answer.questionId);
      return [...next, answer];
    });
  }

  function handleNext() {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setPhase('results');
    }
  }

  function handleBack() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  function handleRetake() {
    setAnswers([]);
    setCurrentIdx(0);
    setPhase('intro');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/20 sticky top-0 z-10 backdrop-blur-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-base font-semibold text-foreground">Analytics Maturity Scorecard</h1>
            {phase === 'results' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">Results</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Assess your org's analytics capabilities across 4 dimensions</p>
        </div>
        {phase !== 'intro' && (
          <button onClick={handleRetake}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw size={12} /> Restart
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {phase === 'intro' && <Intro onStart={() => setPhase('questions')} />}
        {phase === 'questions' && currentQ && (
          <QuestionView
            question={currentQ}
            current={currentIdx + 1}
            total={QUESTIONS.length}
            selected={currentAnswer}
            onSelect={handleSelect}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {phase === 'results' && <Results answers={answers} onRetake={handleRetake} />}
      </div>
    </div>
  );
}
