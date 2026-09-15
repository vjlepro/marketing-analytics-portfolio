import { ExternalLink, CheckCircle2, Layers, Database, BarChart3, Users } from 'lucide-react';

const models = [
  {
    layer: 'Staging',
    icon: Database,
    color: 'hsl(199 89% 48%)',
    models: [
      { name: 'stg_mta_channel_attribution', desc: 'Touch-point paths, channel flags, conversion indicator' },
      { name: 'stg_mmm_weekly_decomp',       desc: 'Weekly revenue decomposition by baseline and paid channels' },
      { name: 'stg_mmm_channel_summary',     desc: 'Channel-level ROAS, adstock alpha, Hill K params' },
      { name: 'stg_cac_by_channel',          desc: 'CAC, LTV, payback period, and efficiency tier per channel' },
      { name: 'stg_new_customers_monthly',   desc: 'Monthly new customer counts by acquisition channel' },
    ],
  },
  {
    layer: 'Mart — Marketing',
    icon: BarChart3,
    color: 'hsl(262 80% 65%)',
    models: [
      { name: 'mart_channel_performance',  desc: 'Unified MMM + MTA + CAC scorecard. One row per channel with ROAS, Shapley share, CAC, LTV, payback, and efficiency classification.' },
      { name: 'mart_mmm_weekly_trends',    desc: 'Rolling 4-week and 13-week aggregates of modeled revenue decomposition by channel.' },
    ],
  },
  {
    layer: 'Mart — Customers',
    icon: Users,
    color: 'hsl(158 64% 52%)',
    models: [
      { name: 'mart_customer_unit_economics', desc: 'CAC/LTV efficiency tiers (Healthy / Monitor / At Risk) with exec-ready budget recommendations per channel.' },
    ],
  },
  {
    layer: 'Mart — Finance',
    icon: Layers,
    color: '#f59e0b',
    models: [
      { name: 'mart_monthly_revenue_summary', desc: 'Monthly revenue close table with MoM delta, YoY growth, and cumulative totals for finance reporting.' },
    ],
  },
];

const tests = [
  { check: 'not_null on all primary keys', scope: 'Every model' },
  { check: 'unique on all primary keys', scope: 'Every model' },
  { check: 'accepted_values on channel, tier, and status columns', scope: 'Staging + Marts' },
  { check: 'Row count > 0 on all mart outputs', scope: 'Mart layer' },
];

const stack = [
  { label: 'Adapter', value: 'dbt-duckdb (local) · swap to dbt-snowflake / dbt-bigquery for production' },
  { label: 'Models', value: '9 total — 5 staging, 4 mart' },
  { label: 'Tests', value: '34 automated — all passing' },
  { label: 'Seeds', value: '8 CSV files from synthetic platform data' },
  { label: 'Docs', value: 'Full YAML semantic documentation on every model and column' },
];

export default function DbtProject() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Data Products</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">dbt Marketing Analytics</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Production-style semantic layer over the MMM, MTA, and CAC/LTV models. Staging cleans and types raw source data; marts deliver exec-ready, pre-aggregated outputs for dashboards and self-service analytics.
          </p>
        </div>
        <a
          href="https://github.com/vjlepro/dbt-marketing-analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          style={{ background: '#f59e0b', color: '#1a1a1a' }}
        >
          <ExternalLink className="w-4 h-4" />
          View on GitHub
        </a>
      </div>

      {/* Stack summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Project Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stack.map(s => (
            <div key={s.label} className="flex gap-3">
              <span className="text-sm font-semibold text-foreground w-20 shrink-0">{s.label}</span>
              <span className="text-sm text-muted-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Architecture</h2>
        <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
          {['Seeds (CSV)', '→', 'Staging models', '→', 'Mart models', '→', 'Dashboard / BI'].map((step, i) => (
            <span
              key={i}
              className={step === '→' ? 'text-muted-foreground/40' : 'px-3 py-1 rounded-md font-semibold'}
              style={step !== '→' ? { background: 'hsl(var(--accent)/0.12)', color: 'hsl(var(--accent))' } : {}}
            >
              {step}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Staging models use <code className="text-xs bg-muted px-1 rounded">view</code> materialization (cheap, always fresh).
          Mart models use <code className="text-xs bg-muted px-1 rounded">table</code> materialization (pre-aggregated for fast dashboard queries).
          All SQL is warehouse-agnostic — swap the adapter profile to run on Snowflake, BigQuery, or Azure Synapse.
        </p>
      </div>

      {/* Models by layer */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Models by Layer</h2>
        {models.map(({ layer, icon: Icon, color, models: layerModels }) => (
          <div key={layer} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="font-semibold text-sm">{layer}</span>
              <span className="ml-auto text-xs text-muted-foreground">{layerModels.length} model{layerModels.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-border">
              {layerModels.map(m => (
                <div key={m.name} className="px-5 py-3 flex gap-4 flex-wrap">
                  <code className="text-xs font-mono shrink-0 text-foreground/80 bg-muted px-2 py-0.5 rounded self-start mt-0.5">{m.name}</code>
                  <span className="text-sm text-muted-foreground">{m.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tests */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Data Quality — 34 Tests, All Passing</h2>
        <div className="space-y-2">
          {tests.map(t => (
            <div key={t.check} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(158 64% 52%)' }} />
              <div>
                <span className="text-sm text-foreground">{t.check}</span>
                <span className="text-xs text-muted-foreground ml-2">({t.scope})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Run Locally</h2>
        <pre className="text-xs font-mono bg-muted rounded-lg p-4 overflow-x-auto leading-relaxed text-foreground/80">{`git clone https://github.com/vjlepro/dbt-marketing-analytics.git
cd dbt-marketing-analytics
pip install dbt-duckdb

dbt seed    # load CSV source data
dbt run     # build all 9 models
dbt test    # run all 34 quality tests
dbt docs generate && dbt docs serve  # browse semantic docs`}</pre>
        <p className="text-xs text-muted-foreground mt-3">
          To run against a cloud warehouse, update <code className="text-xs bg-muted px-1 rounded">profiles.yml</code> with your Snowflake, BigQuery, or Azure Synapse credentials and swap the adapter in <code className="text-xs bg-muted px-1 rounded">packages.yml</code>.
        </p>
      </div>

      <div className="flex justify-center pb-4">
        <a
          href="https://github.com/vjlepro/dbt-marketing-analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ background: '#f59e0b', color: '#1a1a1a' }}
        >
          <ExternalLink className="w-4 h-4" />
          Open GitHub Repo
        </a>
      </div>

    </div>
  );
}
