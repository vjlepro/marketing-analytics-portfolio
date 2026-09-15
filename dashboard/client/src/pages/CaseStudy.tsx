import { useState } from 'react';
import {
  AlertTriangle, Search, Database, BarChart2, CheckCircle2,
  ChevronDown, ChevronRight, Layers, Tag, GitBranch,
  ShieldCheck, Lightbulb, ArrowRight, Circle, FileCode2,
  TrendingDown, Eye, Wrench
} from 'lucide-react';

const CYAN   = "hsl(199 89% 48%)";
const PURPLE = "hsl(262 80% 65%)";
const GREEN  = "hsl(158 64% 52%)";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";

// ── Types ─────────────────────────────────────────────────────────────────────
type StepStatus = 'finding' | 'warning' | 'clear' | 'action';

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ label, icon: Icon, color = CYAN }: { label: string; icon: any; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">{label}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CalloutBox({ type, children }: { type: 'insight' | 'warning' | 'action' | 'result'; children: React.ReactNode }) {
  const styles = {
    insight: { bg: `${CYAN}12`, border: `${CYAN}40`, icon: Lightbulb, color: CYAN, label: 'Key Insight' },
    warning: { bg: `${AMBER}12`, border: `${AMBER}40`, icon: AlertTriangle, color: AMBER, label: 'Red Flag' },
    action:  { bg: `${PURPLE}12`, border: `${PURPLE}40`, icon: Wrench, color: PURPLE, label: 'Action Taken' },
    result:  { bg: `${GREEN}12`, border: `${GREEN}40`, icon: CheckCircle2, color: GREEN, label: 'Outcome' },
  };
  const s = styles[type];
  return (
    <div className="rounded-lg p-4 my-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <s.icon size={13} style={{ color: s.color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function DiagnosisStep({
  step, title, finding, status, detail, expanded, onToggle
}: {
  step: number; title: string; finding: string; status: StepStatus;
  detail: React.ReactNode; expanded: boolean; onToggle: () => void;
}) {
  const statusStyles: Record<StepStatus, { color: string; label: string; bg: string }> = {
    finding: { color: AMBER,  label: 'Finding',  bg: `${AMBER}18` },
    warning: { color: RED,    label: 'Problem',   bg: `${RED}18` },
    clear:   { color: GREEN,  label: 'Clear',     bg: `${GREEN}18` },
    action:  { color: CYAN,   label: 'Fixed',     bg: `${CYAN}18` },
  };
  const s = statusStyles[status];

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-secondary text-muted-foreground">
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground mb-0.5">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{finding}</div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex-shrink-0"
          style={{ background: s.bg, color: s.color }}>{s.label}</span>
        {expanded ? <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
                  : <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border bg-secondary/20">
          <div className="pt-4 text-xs text-muted-foreground leading-relaxed">{detail}</div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event, type, fires, evar, notes }: {
  event: string; type: string; fires: string; evar?: string; notes: string;
}) {
  const typeColors: Record<string, string> = {
    'Page View': CYAN, 'Interaction': PURPLE, 'Conversion': GREEN, 'Micro-conversion': AMBER,
  };
  const color = typeColors[type] || CYAN;
  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
      <td className="py-2.5 pr-3 text-[11px] font-medium text-foreground">{event}</td>
      <td className="py-2.5 pr-3">
        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
          style={{ background: `${color}18`, color }}>{type}</span>
      </td>
      <td className="py-2.5 pr-3 text-[10px] text-muted-foreground font-mono">{fires}</td>
      <td className="py-2.5 pr-3 text-[10px] text-muted-foreground font-mono">{evar || '—'}</td>
      <td className="py-2.5 text-[10px] text-muted-foreground">{notes}</td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CaseStudy() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [activeTab, setActiveTab] = useState<'plan' | 'taxonomy' | 'validation' | 'governance'>('plan');

  const diagnosisSteps = [
    {
      step: 1,
      title: "Check the data pipeline first, not the model",
      finding: "ETL job silently failing on GA4 → Snowflake connector for 11 days",
      status: 'warning' as StepStatus,
      detail: (
        <div>
          <p className="mb-3">Before touching any model, the first question is: <strong className="text-foreground">is the data actually arriving?</strong> A 30% ROAS drop that happened on a specific date is almost always a pipeline or tagging issue before it's a real performance change.</p>
          <div className="bg-secondary rounded-lg p-3 font-mono text-[10px] mb-3 space-y-1">
            <div className="text-muted-foreground">-- Pipeline freshness check: when did each source last load?</div>
            <div className="text-green-400">SELECT source_name, max(loaded_at) as last_load,</div>
            <div className="text-green-400 pl-4">current_timestamp - max(loaded_at) as staleness</div>
            <div className="text-green-400">FROM raw.etl_load_log</div>
            <div className="text-green-400">GROUP BY 1 ORDER BY staleness DESC;</div>
          </div>
          <CalloutBox type="warning">
            GA4 → Snowflake connector had been failing silently for 11 days — no alerting, no error surfaced to the analytics team. The row count in <code className="text-foreground">raw.ga4_sessions</code> was flat while all other sources continued loading. The ROAS drop in the model was entirely an artifact of missing impression and session data, not real performance degradation.
          </CalloutBox>
          <CalloutBox type="action">
            Added a dbt freshness test (<code className="text-foreground">freshness: warn_after: 24h, error_after: 48h</code>) on all source tables and a row-count anomaly alert via Slack webhook. Any future pipeline failure surfaces within one hour.
          </CalloutBox>
        </div>
      ),
    },
    {
      step: 2,
      title: "Audit the tagging layer — UTMs and event taxonomy",
      finding: "32% of paid sessions missing UTM parameters after a site redesign",
      status: 'warning' as StepStatus,
      detail: (
        <div>
          <p className="mb-3">Pipeline is healthy? Next: <strong className="text-foreground">are sessions being tagged correctly?</strong> Missing UTMs funnel paid traffic into Direct, artificially inflating organic performance and collapsing paid attribution.</p>
          <div className="bg-secondary rounded-lg p-3 font-mono text-[10px] mb-3 space-y-1">
            <div className="text-muted-foreground">-- UTM coverage rate by channel and landing page</div>
            <div className="text-green-400">SELECT</div>
            <div className="text-green-400 pl-4">channel_grouping,</div>
            <div className="text-green-400 pl-4">count(*) as sessions,</div>
            <div className="text-green-400 pl-4">countif(utm_source is null) as missing_utm,</div>
            <div className="text-green-400 pl-4">round(countif(utm_source is null) / count(*) * 100, 1) as pct_missing</div>
            <div className="text-green-400">FROM staging.stg_ga4_sessions</div>
            <div className="text-green-400">WHERE session_date &gt;= date_sub(current_date, interval 30 day)</div>
            <div className="text-green-400">GROUP BY 1 ORDER BY pct_missing DESC;</div>
          </div>
          <CalloutBox type="warning">
            A site redesign had removed UTM passthrough on the new booking flow landing pages. 32% of Google Ads and Meta sessions were landing on redesigned pages that stripped query parameters. These sessions were classified as Direct, making Google Ads look 40% less efficient than it actually was.
          </CalloutBox>
          <CalloutBox type="action">
            Fixed the UTM passthrough in the landing page templates. Retroactively reclassified affected sessions using referrer-based channel logic for the 11-day window. Documented UTM governance rules (naming convention, required parameters, QA checklist) in the team wiki.
          </CalloutBox>
        </div>
      ),
    },
    {
      step: 3,
      title: "Validate model assumptions — is the training window still representative?",
      finding: "MMM trained on pre-iOS 14.5 data; signal loss not yet accounted for in model",
      status: 'finding' as StepStatus,
      detail: (
        <div>
          <p className="mb-3">Once data quality is confirmed, evaluate whether the model itself is stale. An MMM trained on 18-month-old data may have learned channel relationships that no longer hold — especially for Meta after signal loss, or any channel that added/removed spend dramatically.</p>
          <div className="space-y-2 mb-3">
            {[
              { check: "R² on holdout period", target: "> 0.85", actual: "0.71", ok: false },
              { check: "MAPE on last 8 weeks", target: "< 10%", actual: "18.3%", ok: false },
              { check: "Base revenue trend", target: "Stable or rising", actual: "Stable", ok: true },
              { check: "Meta adstock decay vs prior model", target: "~0.3", actual: "0.51 (carryover inflated)", ok: false },
            ].map(r => (
              <div key={r.check} className="flex items-center gap-3 p-2 rounded bg-secondary">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.ok ? 'bg-green-400' : 'bg-amber-400'}`} />
                <span className="text-[11px] text-foreground flex-1">{r.check}</span>
                <span className="text-[10px] text-muted-foreground">Target: {r.target}</span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: r.ok ? GREEN : AMBER }}>{r.actual}</span>
              </div>
            ))}
          </div>
          <CalloutBox type="insight">
            The model's R² had degraded from 0.91 to 0.71 on recent holdout data — a clear signal it was stale, not just noisy. Meta's adstock decay parameter had inflated (signal loss means less measurable immediate impact, so the model was over-attributing carryover). The model needed retraining on the most recent 18 months with an updated prior for Meta signal loss.
          </CalloutBox>
        </div>
      ),
    },
    {
      step: 4,
      title: "Cross-validate with MTA — do the signals agree?",
      finding: "Brand Search: MMM +$2.1M vs MTA +$1.4M — expected divergence, not a problem",
      status: 'clear' as StepStatus,
      detail: (
        <div>
          <p className="mb-3">MMM and MTA will never agree exactly — they measure fundamentally different things. The question is whether the divergence is <strong className="text-foreground">explainable</strong> by the methodology differences, or a signal of a data problem.</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { channel: "Brand Search", mmm: "$2.1M", mta: "$1.4M", gap: "+$700K", explain: "MMM captures adstock carryover from brand campaigns; MTA only sees last-click session" },
              { channel: "Meta Prospecting", mmm: "$3.4M", mta: "$5.1M", gap: "-$1.7M", explain: "MTA over-credits Meta for view-through touches; MMM adjusts for signal loss" },
              { channel: "Email", mmm: "$1.8M", mta: "$2.2M", gap: "-$400K", explain: "Email open tracking gaps in MTA; MMM uses send volume as proxy" },
            ].map(r => (
              <div key={r.channel} className="col-span-2 bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">{r.channel}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">MMM {r.mmm} · MTA {r.mta} · Gap {r.gap}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.explain}</p>
              </div>
            ))}
          </div>
          <CalloutBox type="insight">
            Every divergence was explainable by the methodological differences between the two models. No unexplained gaps. When both models agree directionally, the signal is strong. When they diverge, the explanation tells you something useful about the channel's measurement characteristics.
          </CalloutBox>
        </div>
      ),
    },
    {
      step: 5,
      title: "Brief the CFO — what actually happened and what we're doing about it",
      finding: "Root cause: ETL failure + UTM gap, not performance. Budget hold not warranted.",
      status: 'action' as StepStatus,
      detail: (
        <div>
          <p className="mb-3">The investigation took 3 days. The CFO's instinct to cut budget was understandable — but wrong. The finding needs to be delivered clearly and without hedging, along with a concrete path forward.</p>
          <div className="bg-card border border-border rounded-lg p-4 mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Executive Summary — What We Found</div>
            <div className="space-y-2">
              {[
                { label: "Root cause", value: "ETL failure (11 days) + UTM passthrough bug on redesigned pages" },
                { label: "Actual performance", value: "Google Ads ROAS stable at 4.1x once data corrected — no real decline" },
                { label: "Model status", value: "MMM needs retraining — degraded R² from 0.91 to 0.71 on recent holdout" },
                { label: "Recommendation", value: "Hold current budget levels. Retrain model on Q3 data. Monitor with new pipeline alerts." },
              ].map(r => (
                <div key={r.label} className="flex gap-3">
                  <span className="text-[10px] font-semibold text-muted-foreground w-28 flex-shrink-0">{r.label}</span>
                  <span className="text-[10px] text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <CalloutBox type="result">
            Budget hold was lifted. Pipeline monitoring was implemented. MMM retrained over the following 3 weeks with updated Meta signal-loss priors. The retrained model achieved R² of 0.89 on holdout and MAPE of 6.2% — back within acceptable thresholds.
          </CalloutBox>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-8 py-8 border-b border-border bg-card/30">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{ background: `${CYAN}20`, color: CYAN }}>Case Study</span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{ background: `${PURPLE}20`, color: PURPLE }}>Attribution · Digital Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-snug">
            When the Numbers Lie:<br />
            <span style={{ color: CYAN }}>Diagnosing a Broken Attribution Model</span> and Building the Funnel Instrumentation That Prevents It
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mt-3">
            A CFO sees ROAS drop 30% and wants to cut $2M in Google Ads spend. This case study walks through how I'd investigate that claim systematically — from pipeline health through model validation — and then the instrumentation framework I'd build to make sure it never goes unexplained again.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-muted-foreground">
            {[
              { label: "Domain", value: "Digital Commerce / Subscription" },
              { label: "Stack", value: "GA4 · Adobe Analytics · Snowflake · dbt · Python" },
              { label: "Scenario", value: "Composite — drawn from real investigations" },
            ].map(i => (
              <div key={i.label}>
                <span className="font-semibold text-foreground">{i.label}: </span>{i.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl space-y-12">

          {/* ── Part 1: Diagnosis ── */}
          <div>
            <SectionHeader label="Part 1 — The Investigation" icon={Search} color={AMBER} />
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Every analytics leader will face a version of this moment: a metric moves sharply and a business leader wants to act on it immediately. The job is to determine whether the signal is real before anyone pulls a trigger on budget or strategy. Here's the systematic approach I use.
            </p>

            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">The Diagnostic Framework — in Order</div>
              <div className="space-y-2">
                {[
                  { n: 1, label: "Pipeline & data freshness", q: "Did the data actually arrive?" },
                  { n: 2, label: "Tagging & UTM integrity", q: "Is traffic being classified correctly?" },
                  { n: 3, label: "Model assumption drift", q: "Is the model still representative of current conditions?" },
                  { n: 4, label: "Cross-model validation", q: "Do MMM and MTA agree directionally? Are divergences explainable?" },
                  { n: 5, label: "Executive brief", q: "What actually happened, what does it mean, what do we do?" },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${CYAN}20`, color: CYAN }}>{s.n}</div>
                    <span className="text-xs font-semibold text-foreground w-44 flex-shrink-0">{s.label}</span>
                    <span className="text-[11px] text-muted-foreground">{s.q}</span>
                  </div>
                ))}
              </div>
            </div>

            {diagnosisSteps.map(s => (
              <DiagnosisStep
                key={s.step}
                {...s}
                expanded={expandedStep === s.step}
                onToggle={() => setExpandedStep(expandedStep === s.step ? null : s.step)}
              />
            ))}
          </div>

          {/* ── Part 2: Instrumentation ── */}
          <div>
            <SectionHeader label="Part 2 — Building Instrumentation That Prevents This" icon={Layers} color={PURPLE} />
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              The diagnosis revealed three gaps: no pipeline monitoring, no UTM governance, and no model drift alerting. This section covers how I'd instrument a digital commerce funnel from the ground up so these issues surface in hours, not weeks.
            </p>

            {/* Tab nav */}
            <div className="flex gap-1 mb-6 border border-border rounded-lg p-1 bg-secondary/30">
              {([
                { id: 'plan', label: 'Measurement Plan' },
                { id: 'taxonomy', label: 'Event Taxonomy' },
                { id: 'validation', label: 'Validation Layer' },
                { id: 'governance', label: 'Governance' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors"
                  style={activeTab === t.id
                    ? { background: PURPLE + '25', color: PURPLE }
                    : { color: 'var(--muted-foreground)' }}
                >{t.label}</button>
              ))}
            </div>

            {/* Measurement Plan */}
            {activeTab === 'plan' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A measurement plan is written before a single line of tracking code is added. It defines the business questions first, then works backwards to the data requirements. This prevents the common failure mode of instrumenting everything and measuring nothing.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      question: "What drives a visitor to start a booking?",
                      kpis: ["Search initiation rate", "Time-to-first-search after landing", "Entry channel vs search behavior correlation"],
                      source: "GA4 / Adobe Analytics event stream",
                      owner: "Product Analytics",
                    },
                    {
                      question: "Where do we lose people in the booking funnel?",
                      kpis: ["Step-level conversion rates", "Drop-off rate by device and channel", "Rate of returning to abandoned funnel"],
                      source: "GA4 funnel exploration + Snowflake session stitching",
                      owner: "Product + Revenue Analytics",
                    },
                    {
                      question: "Which acquisition channels produce the most valuable customers?",
                      kpis: ["CAC by channel", "30/90/180-day retention by acquisition source", "LTV:CAC ratio"],
                      source: "CRM (Salesforce/HubSpot) + Paid platform APIs + Snowflake",
                      owner: "Marketing Analytics",
                    },
                    {
                      question: "Is our paid media spend producing real incremental bookings?",
                      kpis: ["MMM-attributed ROAS by channel", "Geo-lift test results", "MTA Shapley share"],
                      source: "MMM model output + A/B testing platform",
                      owner: "Marketing Analytics + Finance",
                    },
                  ].map((item, i) => (
                    <div key={i} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Circle size={6} className="mt-1.5 flex-shrink-0" style={{ color: PURPLE, fill: PURPLE }} />
                        <span className="text-xs font-semibold text-foreground">{item.question}</span>
                      </div>
                      <div className="pl-4 space-y-2">
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">KPIs</div>
                          <div className="flex flex-wrap gap-1">
                            {item.kpis.map(k => (
                              <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{k}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-6 text-[10px]">
                          <div><span className="font-semibold text-muted-foreground">Source: </span><span className="text-foreground">{item.source}</span></div>
                          <div><span className="font-semibold text-muted-foreground">Owner: </span><span className="text-foreground">{item.owner}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Taxonomy */}
            {activeTab === 'taxonomy' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The event taxonomy defines every tracked interaction before implementation — name, trigger condition, properties, and which BI variable it maps to. Written once, validated in QA, referenced forever. This is the contract between Analytics, Engineering, and Product.
                </p>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Digital Commerce Funnel — Core Event Taxonomy
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-y border-border bg-secondary/50">
                          {["Event Name", "Type", "Fires When", "Variable", "Notes"].map(h => (
                            <th key={h} className="text-left py-2 px-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="px-3">
                        <EventRow event="page_view" type="Page View" fires="Every page load" evar="eVar1 (channel), prop3 (device)" notes="Baseline; channel classification happens here" />
                        <EventRow event="search_initiated" type="Interaction" fires="User submits search form" evar="eVar12 (timestamp), event1 (counter)" notes="Funnel entry point; measure intent signal" />
                        <EventRow event="search_results_viewed" type="Interaction" fires="Results page renders" evar="eVar33 (result count), prop5 (destination)" notes="Zero results rate = demand signal gap" />
                        <EventRow event="rate_selected" type="Micro-conversion" fires="User taps/clicks a rate card" evar="event7 + eVar41 (rate value)" notes="Intent confirmed; drop here = price sensitivity" />
                        <EventRow event="booking_initiated" type="Micro-conversion" fires="Booking form step 1 submitted" evar="event8, eVar18 (check-in), eVar19 (check-out)" notes="High-intent signal; gate for remarketing audiences" />
                        <EventRow event="guest_details_entered" type="Micro-conversion" fires="Guest info form completed" evar="eVar20 (guest count)" notes="Drop here often = form friction or auth barrier" />
                        <EventRow event="purchase" type="Conversion" fires="Booking confirmation page loads" evar="purchase event + eVar50 (booking ID)" notes="Revenue event; tie to CRM order ID for attribution" />
                        <EventRow event="booking_abandoned" type="Interaction" fires="Session ends without purchase after booking_initiated" evar="" notes="Synthetic event computed in dbt; triggers re-engagement" />
                      </tbody>
                    </table>
                  </div>
                </div>
                <CalloutBox type="insight">
                  Variable names above use Adobe Analytics eVar/prop conventions — the same naming structure used in the Data Product Spec. For GA4, replace eVars with custom dimensions and events with GA4 event parameters. The taxonomy is tool-agnostic; the names change, the business logic doesn't.
                </CalloutBox>
              </div>
            )}

            {/* Validation Layer */}
            {activeTab === 'validation' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tracking code breaks constantly — deploys, A/B tests, CMS updates, new landing pages. A validation layer catches issues automatically, before they corrupt a week of data or trigger a false alarm like the CFO scenario above.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      layer: "Pipeline freshness",
                      tool: "dbt source freshness",
                      check: "Each source table must have loaded within 24h. Alert if any source exceeds 48h without new rows.",
                      trigger: "Slack alert to #data-alerts within 1 hour of threshold breach",
                      color: CYAN,
                    },
                    {
                      layer: "Row count anomaly detection",
                      tool: "dbt + Python (Prophet)",
                      check: "Daily row counts for key events must fall within 2 standard deviations of the trailing 30-day average. Sudden drops = tagging failure. Sudden spikes = bot traffic or duplicate sends.",
                      trigger: "PagerDuty for >3σ drop in purchase events. Slack warning for 2–3σ on all other events.",
                      color: PURPLE,
                    },
                    {
                      layer: "UTM coverage rate",
                      tool: "dbt test + BI alert",
                      check: "Paid sessions (Google Ads, Meta) must have UTM source populated ≥ 95% of the time. Drop below 90% triggers immediate investigation.",
                      trigger: "Weekly UTM coverage report to marketing team. Daily alert if coverage drops below 90% for any paid channel.",
                      color: AMBER,
                    },
                    {
                      layer: "Funnel conversion sanity",
                      tool: "dbt model + dashboard",
                      check: "Step-level conversion rates must not change by more than ±20% week-over-week without a known cause (campaign launch, site change, seasonality). Coded exceptions logged in a changes table.",
                      trigger: "Automated comment in weekly analytics report: 'Booking initiation rate dropped 18% WoW — investigating.'",
                      color: GREEN,
                    },
                    {
                      layer: "Model drift monitoring",
                      tool: "Python (scikit-learn) + dbt",
                      check: "MMM holdout MAPE recalculated weekly on the trailing 8 weeks. If MAPE exceeds 12%, model is flagged for retraining review. R² below 0.80 triggers mandatory retraining.",
                      trigger: "Monthly model health report to analytics leadership. Retraining initiated within 2 weeks of threshold breach.",
                      color: RED,
                    },
                  ].map(item => (
                    <div key={item.layer} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-foreground">{item.layer}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{item.tool}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-2">{item.check}</p>
                          <div className="flex items-start gap-1.5">
                            <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                            <span className="text-[10px] text-muted-foreground italic">{item.trigger}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Governance */}
            {activeTab === 'governance' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instrumentation without governance degrades within 6 months — new pages don't get tagged, UTM conventions drift, event names get duplicated. These are the operating rules I put in place to keep the measurement layer clean long-term.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      rule: "Analytics review on every release ticket",
                      detail: "Any engineering ticket that modifies a landing page, booking flow, or conversion event requires an analytics review checkbox before it ships. Checklist: does this page have correct tagging? Does it preserve UTM parameters? Is there a dbt test for the affected event?",
                      icon: ShieldCheck, color: GREEN,
                    },
                    {
                      rule: "UTM naming convention — enforced via link generator",
                      detail: "All paid media links are built through a shared UTM link generator (a simple Google Sheet or internal tool) that enforces: utm_source (platform), utm_medium (channel type), utm_campaign (campaign ID), utm_content (ad variant). Free-form UTMs are rejected in the pipeline via a dbt test against an allowed-values list.",
                      icon: Tag, color: CYAN,
                    },
                    {
                      rule: "Event taxonomy is a versioned document, not a Slack thread",
                      detail: "The taxonomy lives in the team wiki (Confluence/Notion) with a version history. Any addition, rename, or deprecation of an event requires a PR to the schema YAML file in dbt, a migration plan for historical data, and a notification to all consumers of that event.",
                      icon: FileCode2, color: PURPLE,
                    },
                    {
                      rule: "Attribution model assumptions are documented and dated",
                      detail: "The MMM training window, data inputs, key parameters, and known limitations are documented in a model card — updated every time the model is retrained. Business stakeholders know exactly what the model does and doesn't measure before they use it to make decisions.",
                      icon: GitBranch, color: AMBER,
                    },
                  ].map(item => (
                    <div key={item.rule} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                        <item.icon size={14} style={{ color: item.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground mb-1">{item.rule}</div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Takeaways ── */}
          <div>
            <SectionHeader label="What This Reveals" icon={Eye} color={GREEN} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Investigate before you act",
                  body: "A 30% ROAS drop is a hypothesis, not a fact. The measurement layer is always the first suspect — not the media team's performance.",
                  color: AMBER,
                },
                {
                  label: "Infrastructure is upstream of insight",
                  body: "Every interesting analytical question is only answerable if the pipeline, tagging, and semantic layer underneath it are reliable. Governance isn't overhead — it's the product.",
                  color: CYAN,
                },
                {
                  label: "The model is a living system",
                  body: "An MMM trained 18 months ago is a different model than the business needs today. Scheduled retraining and drift monitoring are non-negotiable at scale.",
                  color: GREEN,
                },
              ].map(t => (
                <div key={t.label} className="bg-card border border-border rounded-lg p-4">
                  <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ background: t.color }} />
                  <div className="text-xs font-semibold text-foreground mb-1.5">{t.label}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
