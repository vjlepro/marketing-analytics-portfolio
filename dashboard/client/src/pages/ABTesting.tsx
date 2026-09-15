import { useState, useMemo } from 'react';
import { FlaskConical, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ── Stats helpers ────────────────────────────────────────────────────────────
function zScore(p1: number, p2: number, n1: number, n2: number) {
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  return se === 0 ? 0 : (p2 - p1) / se;
}
function pValue(z: number) {
  // Two-tailed approximation
  const t = Math.abs(z);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const x = 1 / (1 + p * t);
  const y = 1 - (((((a5 * x + a4) * x) + a3) * x + a2) * x + a1) * x * Math.exp(-t * t);
  return 2 * (1 - y);
}
function mde(n: number, baseline: number, power = 0.8, alpha = 0.05) {
  const z_alpha = 1.96, z_beta = 0.84;
  const p = baseline;
  return (z_alpha + z_beta) * Math.sqrt(2 * p * (1 - p) / n);
}
function verdict(p: number, lift: number, sampleRatio: number, conf: number) {
  const alpha = 1 - conf / 100;
  if (sampleRatio < 0.7 || sampleRatio > 1.3) return 'srm';
  if (p < alpha && lift > 0) return 'winner';
  if (p < alpha && lift < 0) return 'loser';
  if (p < 0.15) return 'trending';
  return 'inconclusive';
}

// ── Pre-loaded test history ──────────────────────────────────────────────────
const HISTORY = [
  {
    id: 'exp-041',
    name: 'Rate Display — Per-Night vs. Total Stay',
    domain: 'Booking / eCommerce',
    hypothesis: 'Showing total stay price upfront reduces sticker shock and increases booking page CVR.',
    status: 'winner',
    startDate: 'Jul 14, 2024',
    endDate: 'Jul 28, 2024',
    control: { label: 'Per-night price (Control)', n: 48200, conversions: 2313 },
    variant: { label: 'Total stay price (Variant)', n: 48500, conversions: 2619 },
    insight: 'Total-stay pricing lifted booking CVR by 13.2%. Eliminated the "multiply by nights" cognitive step at rate selection, reducing abandonment. Rolled out to 100% of sessions.',
    tags: ['Pricing Display', 'Booking Funnel', 'CVR'],
  },
  {
    id: 'exp-038',
    name: 'Search Results — Map View Default vs. List View Default',
    domain: 'Search & Shopping',
    hypothesis: 'Defaulting to map view increases property engagement and downstream booking intent.',
    status: 'inconclusive',
    startDate: 'Jun 3, 2024',
    endDate: 'Jun 24, 2024',
    control: { label: 'List view default (Control)', n: 31400, conversions: 1131 },
    variant: { label: 'Map view default (Variant)', n: 31600, conversions: 1152 },
    insight: 'No statistically significant difference in booking CVR. Map engagement was higher (+18% interactions) but did not translate to downstream conversion lift. Recommend re-testing with a refined map UX that surfaces availability inline.',
    tags: ['Search UX', 'Engagement', 'Inconclusive'],
  },
  {
    id: 'exp-035',
    name: 'Loyalty Upsell — Inline Banner vs. Modal at Checkout',
    domain: 'Loyalty / Acquisition',
    hypothesis: 'An inline loyalty sign-up prompt at rate selection converts better than a modal interrupt at checkout.',
    status: 'winner',
    startDate: 'Apr 29, 2024',
    endDate: 'May 20, 2024',
    control: { label: 'Checkout modal (Control)', n: 22800, conversions: 684 },
    variant: { label: 'Inline banner at rate select (Variant)', n: 22600, conversions: 881 },
    insight: 'Inline prompt drove 28.8% more loyalty sign-ups without increasing checkout abandonment. Modal timing created friction at the highest-intent moment; inline placement met users earlier in their decision with lower commitment ask.',
    tags: ['Loyalty', 'Checkout', 'Sign-up Rate'],
  },
  {
    id: 'exp-031',
    name: 'Seat Selection — Interactive Map vs. Category List (Events)',
    domain: 'Ticketing / Live Events',
    hypothesis: 'Interactive seat map increases add-to-cart rate vs. section-category list selection.',
    status: 'winner',
    startDate: 'Mar 11, 2024',
    endDate: 'Mar 25, 2024',
    control: { label: 'Category list (Control)', n: 14200, conversions: 5538 },
    variant: { label: 'Interactive seat map (Variant)', n: 14100, conversions: 6204 },
    insight: 'Seat map lifted add-to-cart by 11.9%. Visual ownership of a specific seat drives stronger commitment intent than abstract category selection. Effect was largest for premium and club sections (+21%).',
    tags: ['Ticketing', 'Seat Selection', 'Add-to-Cart'],
  },
  {
    id: 'exp-028',
    name: 'Urgency Messaging — Rooms Remaining Counter',
    domain: 'Booking / eCommerce',
    hypothesis: '"Only 2 rooms left" scarcity messaging on property cards increases click-through to property detail.',
    status: 'loser',
    startDate: 'Feb 5, 2024',
    endDate: 'Feb 26, 2024',
    control: { label: 'No scarcity message (Control)', n: 39100, conversions: 6648 },
    variant: { label: 'Rooms remaining counter (Variant)', n: 39300, conversions: 6166 },
    insight: 'Scarcity messaging reduced CTR by 7.4%. User research follow-up suggested it triggered distrust rather than urgency — users interpreted low-count messages as a high-pressure tactic and bounced to OTA comparison sites. Archived; not recommended for re-test without UX trust signal work first.',
    tags: ['Urgency', 'CTR', 'Backfire'],
  },
];

const STATUS_CONFIG = {
  winner:       { label: 'Winner',       icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  loser:        { label: 'Lost',         icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  inconclusive: { label: 'Inconclusive', icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  trending:     { label: 'Trending',     icon: TrendingUp,   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  srm:          { label: 'SRM Warning',  icon: AlertCircle,  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
};

// ── Normal distribution curve SVG ───────────────────────────────────────────
function DistributionCurve({ z, conf }: { z: number; conf: number }) {
  const width = 320, height = 100;
  const alpha = 1 - conf / 100;
  const critZ = conf === 90 ? 1.645 : conf === 95 ? 1.96 : 2.576;
  const pts = (start: number, end: number, steps = 80) =>
    Array.from({ length: steps }, (_, i) => {
      const x = start + (i / (steps - 1)) * (end - start);
      const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
      return { x, y };
    });
  const toSVG = (x: number, y: number) => ({
    sx: ((x + 4) / 8) * width,
    sy: height - 10 - y * (height - 20) * 3.5,
  });
  const curve = pts(-4, 4);
  const pathD = curve.map((p, i) => {
    const { sx, sy } = toSVG(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ');
  const fillLeft = pts(-4, -critZ).map((p, i) => {
    const { sx, sy } = toSVG(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ') + ` L${toSVG(-critZ, 0).sx.toFixed(1)},${height - 10} L${toSVG(-4, 0).sx.toFixed(1)},${height - 10} Z`;
  const fillRight = pts(critZ, 4).map((p, i) => {
    const { sx, sy } = toSVG(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ') + ` L${toSVG(4, 0).sx.toFixed(1)},${height - 10} L${toSVG(critZ, 0).sx.toFixed(1)},${height - 10} Z`;
  const zClamped = Math.max(-4, Math.min(4, z));
  const { sx: zx } = toSVG(zClamped, 0);
  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <path d={fillLeft} fill="rgba(239,68,68,0.15)" />
      <path d={fillRight} fill="rgba(239,68,68,0.15)" />
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      <line x1={zx} y1={10} x2={zx} y2={height - 10}
        stroke={Math.abs(z) >= critZ ? '#34d399' : '#f59e0b'}
        strokeWidth="2" strokeDasharray="4,3" />
      <text x={zx} y={8} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">z={z.toFixed(2)}</text>
    </svg>
  );
}

export default function ABTesting() {
  const [tab, setTab] = useState<'calculator' | 'history'>('calculator');
  const [conf, setConf] = useState(95);
  const [n1, setN1] = useState(25000);
  const [n2, setN2] = useState(25000);
  const [conv1, setConv1] = useState(3.2);
  const [conv2, setConv2] = useState(3.8);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState('All');

  const p1 = conv1 / 100, p2 = conv2 / 100;
  const z = zScore(p1, p2, n1, n2);
  const pv = pValue(z);
  const lift = p1 > 0 ? (p2 - p1) / p1 : 0;
  const sratio = n2 / n1;
  const result = verdict(pv, lift, sratio, conf);
  const detectedMDE = mde(Math.min(n1, n2), p1);
  const cfg = STATUS_CONFIG[result];

  const domains = ['All', ...Array.from(new Set(HISTORY.map(h => h.domain)))];
  const filtered = domainFilter === 'All' ? HISTORY : HISTORY.filter(h => h.domain === domainFilter);

  const verdictMsg = useMemo(() => {
    if (result === 'srm') return 'Sample Ratio Mismatch detected — the split is not 50/50. Investigate logging or bucketing before trusting any result.';
    if (result === 'winner') return `Variant wins at ${conf}% confidence. Lift of ${(lift * 100).toFixed(1)}% is statistically significant (p=${pv.toFixed(3)}). Recommend full rollout with continued monitoring for novelty effects.`;
    if (result === 'loser') return `Variant underperforms control at ${conf}% confidence. Do not ship. Diagnose whether the hypothesis was wrong or the implementation was flawed before retesting.`;
    if (result === 'trending') return `Trending toward significance (p=${pv.toFixed(3)}) but not there yet. Do not call the test early — continue to target sample size to avoid underpowered conclusions.`;
    return `No significant difference detected (p=${pv.toFixed(3)}). This could mean the change has no real effect, or the test was underpowered. Review MDE vs. actual lift before deciding to retest.`;
  }, [result, conf, lift, pv]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10"><FlaskConical size={18} className="text-primary" /></div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Experimentation Framework</h1>
            <p className="text-xs text-muted-foreground">Statistical A/B test analysis · Judgment-driven readouts · Test history log</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {(['calculator', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all border ${tab === t ? 'bg-primary/15 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:bg-secondary'}`}>
              {t === 'calculator' ? 'Test Calculator' : `Test History (${HISTORY.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'calculator' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Test Parameters</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Confidence Level</label>
                    <div className="flex gap-2">
                      {[90, 95, 99].map(c => (
                        <button key={c} onClick={() => setConf(c)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-all ${conf === c ? 'bg-primary/15 text-primary border-primary/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                          {c}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Control Visitors</label>
                      <input type="number" value={n1} onChange={e => setN1(+e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Variant Visitors</label>
                      <input type="number" value={n2} onChange={e => setN2(+e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Control CVR (%)</label>
                      <input type="number" step="0.1" value={conv1} onChange={e => setConv1(+e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Variant CVR (%)</label>
                      <input type="number" step="0.1" value={conv2} onChange={e => setConv2(+e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-loaded examples */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Load Example</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Rate display test — clear winner', n1: 48200, n2: 48500, c1: 4.8, c2: 5.4, conf: 95 },
                    { label: 'Search layout — inconclusive', n1: 31400, n2: 31600, c1: 3.6, c2: 3.64, conf: 95 },
                    { label: 'Seat map vs. list — too early to call', n1: 4200, n2: 4100, c1: 39.0, c2: 41.2, conf: 95 },
                  ].map(ex => (
                    <button key={ex.label} onClick={() => { setN1(ex.n1); setN2(ex.n2); setConv1(ex.c1); setConv2(ex.c2); setConf(ex.conf); }}
                      className="w-full text-left px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {/* Verdict */}
              <div className={`rounded-xl border p-5 ${cfg.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <cfg.icon size={16} className={cfg.color} />
                  <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{verdictMsg}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Relative Lift', value: `${lift >= 0 ? '+' : ''}${(lift * 100).toFixed(1)}%`, sub: 'variant vs. control' },
                  { label: 'p-value', value: pv.toFixed(4), sub: `threshold: ${(1 - conf / 100).toFixed(2)}` },
                  { label: 'z-statistic', value: z.toFixed(3), sub: `critical: ±${conf === 90 ? '1.645' : conf === 95 ? '1.960' : '2.576'}` },
                  { label: 'Min. Detectable Effect', value: `${(detectedMDE * 100).toFixed(2)}%`, sub: 'at 80% power' },
                  { label: 'Sample Ratio', value: sratio.toFixed(3), sub: sratio > 1.05 || sratio < 0.95 ? '⚠ Check bucketing' : '✓ Within tolerance' },
                  { label: 'Absolute Lift', value: `${((p2 - p1) * 100).toFixed(2)}pp`, sub: 'percentage points' },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</div>
                    <div className="text-lg font-bold text-foreground">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Distribution curve */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-3">Distribution — test statistic vs. rejection regions</div>
                <DistributionCurve z={z} conf={conf} />
                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-red-400/50"></span>Rejection region</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-amber-400"></span>Observed z</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            {/* Domain filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter:</span>
              {domains.map(d => (
                <button key={d} onClick={() => setDomainFilter(d)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${domainFilter === d ? 'bg-primary/15 text-primary border-primary/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                  {d}
                </button>
              ))}
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Tests', value: HISTORY.length },
                { label: 'Winners', value: HISTORY.filter(h => h.status === 'winner').length, color: 'text-emerald-400' },
                { label: 'Inconclusive', value: HISTORY.filter(h => h.status === 'inconclusive').length, color: 'text-amber-400' },
                { label: 'Lost / Stopped', value: HISTORY.filter(h => h.status === 'loser').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${s.color ?? 'text-foreground'}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Test cards */}
            {filtered.map(test => {
              const c = STATUS_CONFIG[test.status as keyof typeof STATUS_CONFIG];
              const p1h = test.control.conversions / test.control.n;
              const p2h = test.variant.conversions / test.variant.n;
              const liftH = p1h > 0 ? (p2h - p1h) / p1h : 0;
              const expanded = expandedId === test.id;
              return (
                <div key={test.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${c.bg}`}>
                  <button className="w-full text-left p-5" onClick={() => setExpandedId(expanded ? null : test.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground">{test.id}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
                            <c.icon size={10} />{c.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{test.domain}</span>
                        </div>
                        <div className="text-sm font-semibold text-foreground">{test.name}</div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={9} />{test.startDate} → {test.endDate}</span>
                          <span className={liftH >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {liftH >= 0 ? '+' : ''}{(liftH * 100).toFixed(1)}% lift
                          </span>
                        </div>
                      </div>
                      {expanded ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 mt-1" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-5 pb-5 border-t border-border/40 pt-4 space-y-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Hypothesis</div>
                        <p className="text-xs text-foreground">{test.hypothesis}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[test.control, test.variant].map((arm, i) => (
                          <div key={i} className="bg-secondary/50 rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground mb-1">{arm.label}</div>
                            <div className="text-sm font-bold text-foreground">{((arm.conversions / arm.n) * 100).toFixed(2)}% CVR</div>
                            <div className="text-[10px] text-muted-foreground">{arm.n.toLocaleString()} visitors · {arm.conversions.toLocaleString()} conversions</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Decision & Insight</div>
                        <p className="text-xs text-foreground leading-relaxed">{test.insight}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {test.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
