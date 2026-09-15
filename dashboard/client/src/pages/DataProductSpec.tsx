import { useState } from 'react';
import { FileText, Database, Shield, Users, CheckCircle, AlertTriangle, Clock, Layers } from 'lucide-react';

const SPEC = {
  name: 'Search & Shopping Behavior Data Product',
  version: 'v2.1',
  owner: 'Data Products — Digital Commerce',
  status: 'Production',
  lastUpdated: 'Sep 9, 2024',
  slaRefresh: 'Daily by 6:00 AM ET',
  slaAvailability: '99.5% monthly uptime',
  domain: 'Digital Commerce · eCommerce · Live Events',
  summary: 'A governed, reusable data product that captures the full search and shopping journey — from initial query through property or product selection to cart entry. Designed to power conversion analytics, personalization models, experimentation measurement, and executive reporting across any booking or purchase funnel.',
  businessProblem: 'Search and shopping behavior data was fragmented across the digital analytics platform (Adobe Analytics), the mobile SDK, and session log tables — each with inconsistent metric definitions. Downstream teams were building their own extracts, producing conflicting numbers. This product establishes a single governed layer that every consumer can trust.',
  grain: 'One row per user_session × search_query. A single session may generate multiple rows if the user modifies search parameters.',
  sourceTable: 'DW_DIGITAL.SEARCH_EVENTS_RAW (Snowflake)',
  targetTable: 'DW_PROD.FACT_SEARCH_SHOPPING (Snowflake · MDP)',
  refreshCadence: 'Daily incremental load · Full refresh weekly (Sunday 2 AM)',
  consumers: [
    { team: 'Business Analytics', use: 'Funnel CVR reporting, weekly performance decks' },
    { team: 'Personalization Engineering', use: 'Feature inputs for recommendation model' },
    { team: 'Experimentation Platform', use: 'Metric source for A/B test assignment and measurement' },
    { team: 'Finance / Revenue Management', use: 'Demand signal for pricing and inventory decisions' },
    { team: 'Product / UX', use: 'Drop-off analysis, search zero-results rate, filter usage' },
  ],
  fields: [
    { name: 'SESSION_KEY', type: 'VARCHAR', grain: 'PK', desc: 'Surrogate key — hashed user_pseudo_id + session_id + search_timestamp_utc' },
    { name: 'USER_PSEUDO_ID', type: 'VARCHAR', grain: '—', desc: 'Anonymous device-level ID from Adobe Analytics (post_visid_high + post_visid_low)' },
    { name: 'LOYALTY_ID', type: 'VARCHAR', grain: '—', desc: 'Authenticated loyalty member ID — NULL for anonymous sessions' },
    { name: 'SESSION_ID', type: 'VARCHAR', grain: '—', desc: 'Adobe Analytics visit number, unique per device per day' },
    { name: 'SEARCH_TIMESTAMP_UTC', type: 'TIMESTAMP_NTZ', grain: '—', desc: 'UTC timestamp of search submission event (eVar12 · event1)' },
    { name: 'DESTINATION', type: 'VARCHAR', grain: '—', desc: 'Searched destination — city, property name, or geo string (prop5)' },
    { name: 'CHECK_IN_DATE', type: 'DATE', grain: '—', desc: 'Check-in date entered in search form (eVar18)' },
    { name: 'CHECK_OUT_DATE', type: 'DATE', grain: '—', desc: 'Check-out date entered in search form (eVar19)' },
    { name: 'LOS_NIGHTS', type: 'INTEGER', grain: '—', desc: 'Length of stay in nights — derived: CHECK_OUT_DATE minus CHECK_IN_DATE' },
    { name: 'GUEST_COUNT', type: 'INTEGER', grain: '—', desc: 'Number of guests entered at search (eVar20). NULL if not provided.' },
    { name: 'RESULTS_COUNT', type: 'INTEGER', grain: '—', desc: 'Number of results returned for the search query (eVar33)' },
    { name: 'ZERO_RESULTS_FLAG', type: 'BOOLEAN', grain: '—', desc: 'TRUE when RESULTS_COUNT = 0 — used to track failed search rate' },
    { name: 'PROPERTY_VIEWED_FLAG', type: 'BOOLEAN', grain: '—', desc: 'TRUE if user clicked into any property detail page within the same session (event5)' },
    { name: 'RATE_SELECTED_FLAG', type: 'BOOLEAN', grain: '—', desc: 'TRUE if user clicked a rate or room type (event7 · eVar41)' },
    { name: 'BOOKING_INITIATED_FLAG', type: 'BOOLEAN', grain: '—', desc: 'TRUE if user reached the booking / checkout page (event8)' },
    { name: 'BOOKING_CONFIRMED_FLAG', type: 'BOOLEAN', grain: '—', desc: 'TRUE if a purchase event fired (purchase event · eVar50 order ID)' },
    { name: 'CHANNEL_SOURCE', type: 'VARCHAR', grain: '—', desc: 'Marketing channel driving the session (eVar1 — last-touch campaign channel)' },
    { name: 'DEVICE_TYPE', type: 'VARCHAR', grain: '—', desc: 'Device category: Mobile, Desktop, Tablet (prop3 — mobile_device_type)' },
    { name: 'REPORT_SUITE_ID', type: 'VARCHAR', grain: '—', desc: 'Adobe Analytics report suite — used to distinguish Web vs. App traffic' },
    { name: 'DAYS_UNTIL_CHECKIN', type: 'INTEGER', grain: '—', desc: 'CHECK_IN_DATE minus search date — booking window / lead time signal' },
    { name: 'LOAD_TIMESTAMP_UTC', type: 'TIMESTAMP_NTZ', grain: '—', desc: 'ETL load time — used for SLA monitoring and late-arriving data detection' },
  ],
  metrics: [
    { name: 'Search-to-Property-View Rate', logic: 'COUNT(PROPERTY_VIEWED_FLAG=TRUE) / COUNT(SESSION_KEY)', owner: 'Digital Analytics', threshold: '>= 42%' },
    { name: 'Search-to-Book Rate (S2B)', logic: 'COUNT(BOOKING_CONFIRMED_FLAG=TRUE) / COUNT(SESSION_KEY)', owner: 'Business Analytics', threshold: '>= 2.8%' },
    { name: 'Shopping Abandonment Rate', logic: '1 - (COUNT(BOOKING_INITIATED_FLAG=TRUE) / COUNT(RATE_SELECTED_FLAG=TRUE))', owner: 'Product / UX', threshold: '<= 65%' },
    { name: 'Zero Results Rate', logic: 'COUNT(ZERO_RESULTS_FLAG=TRUE) / COUNT(SESSION_KEY)', owner: 'Search Engineering', threshold: '<= 4%' },
    { name: 'Mobile Share of Search', logic: 'COUNT(DEVICE_TYPE=\'Mobile\') / COUNT(SESSION_KEY)', owner: 'Digital Analytics', threshold: 'KPI — no SLA' },
  ],
  dqRules: [
    { rule: 'SESSION_KEY uniqueness', check: 'Zero duplicates on SESSION_KEY after dedup step', severity: 'Critical', action: 'Block load · Alert on-call' },
    { rule: 'Adobe eVar coverage', check: 'eVar12 (search timestamp) populated on >= 98% of rows', severity: 'Critical', action: 'Block load · Alert on-call' },
    { rule: 'S2B rate sanity', check: 'Search-to-Book Rate between 0.5% and 15%', severity: 'Warning', action: 'Alert data team · Do not block' },
    { rule: 'Load latency SLA', check: 'LOAD_TIMESTAMP_UTC <= 6:00 AM ET daily', severity: 'Warning', action: 'Escalate to engineering if > 7 AM' },
    { rule: 'Zero results rate ceiling', check: 'ZERO_RESULTS_FLAG rate < 10% of daily sessions', severity: 'Warning', action: 'Alert search product team' },
  ],
  acceptance: [
    'Row count within ±5% of prior 7-day average',
    'All Critical DQ rules pass before data is made available to downstream consumers',
    'SESSION_KEY surrogate key generation validated against source hash logic',
    'Metric definitions match approved Semantic Layer / KPI dictionary (v1.4)',
    'Adobe eVar mappings verified against current Solution Design Reference (SDR) document',
    'Tested by experimentation platform team — metric values match experiment scorecard output within 0.1%',
  ],
};

const ERD_NODES = [
  { id: 'fact', label: 'FACT_SEARCH_SHOPPING', type: 'fact', x: 200, y: 160, fields: ['SESSION_KEY (PK)', 'USER_PSEUDO_ID (FK)', 'DATE_KEY (FK)', 'CHANNEL_KEY (FK)', 'DESTINATION_KEY (FK)', 'SEARCH_TIMESTAMP_UTC', 'LOS_NIGHTS', 'RESULTS_COUNT', 'ZERO_RESULTS_FLAG', 'PROPERTY_VIEWED_FLAG', 'RATE_SELECTED_FLAG', 'BOOKING_INITIATED_FLAG', 'BOOKING_CONFIRMED_FLAG'] },
  { id: 'dim_user', label: 'DIM_USER', type: 'dim', x: 520, y: 40, fields: ['USER_PSEUDO_ID (PK)', 'LOYALTY_ID', 'LOYALTY_TIER', 'DEVICE_TYPE', 'REPORT_SUITE_ID'] },
  { id: 'dim_date', label: 'DIM_DATE', type: 'dim', x: 520, y: 200, fields: ['DATE_KEY (PK)', 'FULL_DATE', 'WEEK_NUM', 'MONTH', 'QUARTER', 'IS_WEEKEND', 'IS_HOLIDAY'] },
  { id: 'dim_channel', label: 'DIM_CHANNEL', type: 'dim', x: 520, y: 350, fields: ['CHANNEL_KEY (PK)', 'CHANNEL_SOURCE', 'CHANNEL_GROUP', 'PAID_FLAG', 'CAMPAIGN_NAME'] },
  { id: 'dim_dest', label: 'DIM_DESTINATION', type: 'dim', x: -80, y: 200, fields: ['DESTINATION_KEY (PK)', 'DESTINATION_RAW', 'CITY', 'COUNTRY', 'REGION', 'PROPERTY_COUNT'] },
];

const EDGES = [
  { from: 'fact', to: 'dim_user', label: 'USER_PSEUDO_ID' },
  { from: 'fact', to: 'dim_date', label: 'DATE_KEY' },
  { from: 'fact', to: 'dim_channel', label: 'CHANNEL_KEY' },
  { from: 'fact', to: 'dim_dest', label: 'DESTINATION_KEY' },
];

function ERDDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);
  const nodeW = 180, nodeH = (fields: string[]) => 28 + fields.length * 18;
  const cx = (n: typeof ERD_NODES[0]) => n.x + nodeW / 2 + 100;
  const cy = (n: typeof ERD_NODES[0]) => n.y + nodeH(n.fields) / 2 + 20;
  return (
    <div className="overflow-x-auto">
      <svg width="760" height="520" viewBox="-100 0 760 520" className="w-full">
        {/* Edges */}
        {EDGES.map(e => {
          const from = ERD_NODES.find(n => n.id === e.from)!;
          const to = ERD_NODES.find(n => n.id === e.to)!;
          const x1 = cx(from), y1 = cy(from), x2 = cx(to), y2 = cy(to);
          const mx = (x1 + x2) / 2;
          return (
            <g key={e.label}>
              <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="5,3" />
              <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{e.label}</text>
            </g>
          );
        })}
        {/* Nodes */}
        {ERD_NODES.map(n => {
          const h = nodeH(n.fields);
          const isHovered = hovered === n.id;
          const isFact = n.type === 'fact';
          return (
            <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={n.x + 100} y={n.y + 20} width={nodeW} height={h} rx="6"
                fill={isFact ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--card))'}
                stroke={isHovered ? 'hsl(var(--primary))' : isFact ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}
                strokeWidth={isHovered ? 1.5 : 1} />
              <rect x={n.x + 100} y={n.y + 20} width={nodeW} height={22} rx="6"
                fill={isFact ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--secondary))'} />
              <rect x={n.x + 100} y={n.y + 30} width={nodeW} height={12}
                fill={isFact ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--secondary))'} />
              <text x={n.x + 100 + nodeW / 2} y={n.y + 35} textAnchor="middle" fontSize="9" fontWeight="600"
                fill={isFact ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}>
                {n.label}
              </text>
              {n.fields.map((f, i) => (
                <text key={f} x={n.x + 108} y={n.y + 54 + i * 18} fontSize="8"
                  fill={f.includes('(PK)') ? 'hsl(var(--primary))' : f.includes('(FK)') ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}>
                  {f}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const TABS = ['Overview', 'Fields', 'ERD', 'Metrics & SLAs', 'Acceptance'];

export default function DataProductSpec() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText size={18} className="text-primary" /></div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-semibold text-foreground">{SPEC.name}</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">{SPEC.status}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{SPEC.version}</span>
              </div>
              <p className="text-xs text-muted-foreground">{SPEC.domain}</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-muted-foreground flex-shrink-0">
            <div className="flex items-center gap-1 justify-end"><Clock size={9} />{SPEC.lastUpdated}</div>
            <div className="mt-0.5">{SPEC.owner}</div>
          </div>
        </div>
        <div className="flex gap-1 mt-4 flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${tab === t ? 'bg-primary/15 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:bg-secondary'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'Overview' && (
          <div className="space-y-5 max-w-3xl">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Product Summary</h2>
              <p className="text-sm text-foreground leading-relaxed">{SPEC.summary}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Business Problem</h2>
              <p className="text-sm text-foreground leading-relaxed">{SPEC.businessProblem}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Database, label: 'Source', value: SPEC.sourceTable },
                { icon: Database, label: 'Target', value: SPEC.targetTable },
                { icon: Layers, label: 'Grain', value: SPEC.grain },
                { icon: Clock, label: 'Refresh', value: SPEC.refreshCadence },
                { icon: Shield, label: 'Availability SLA', value: SPEC.slaAvailability },
                { icon: Clock, label: 'Refresh SLA', value: SPEC.slaRefresh },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon size={12} className="text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3"><Users size={14} className="text-primary" /><h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Downstream Consumers</h2></div>
              <div className="space-y-2">
                {SPEC.consumers.map(c => (
                  <div key={c.team} className="flex gap-3 text-xs">
                    <span className="font-medium text-foreground w-44 flex-shrink-0">{c.team}</span>
                    <span className="text-muted-foreground">{c.use}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Fields' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Field Definitions — {SPEC.fields.length} columns</h2>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="text-primary font-mono">PK — Primary Key</span>
                <span className="text-foreground font-mono">FK — Foreign Key</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Field Name', 'Type', 'Role', 'Business Definition'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SPEC.fields.map((f, i) => (
                    <tr key={f.name} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/20'}`}>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-primary font-medium">{f.name}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{f.type}</td>
                      <td className="px-4 py-2.5">
                        {f.grain !== '—' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">{f.grain}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-foreground leading-relaxed">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ERD' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-1">Entity Relationship Diagram</h2>
              <p className="text-xs text-muted-foreground mb-4">Star schema — one fact table joined to four dimension tables. Gold node = fact. Hover to highlight.</p>
              <ERDDiagram />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {ERD_NODES.map(n => (
                <div key={n.id} className={`bg-card border rounded-lg p-4 ${n.type === 'fact' ? 'border-primary/30' : 'border-border'}`}>
                  <div className="text-[10px] font-mono font-semibold mb-2 ${n.type === 'fact' ? 'text-primary' : 'text-foreground'}"
                    style={{ color: n.type === 'fact' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                    {n.type === 'fact' ? 'FACT' : 'DIM'} · {n.label}
                  </div>
                  <div className="space-y-0.5">
                    {n.fields.map(f => (
                      <div key={f} className={`text-[10px] font-mono ${f.includes('(PK)') ? 'text-primary' : f.includes('(FK)') ? 'text-foreground' : 'text-muted-foreground'}`}>{f}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Metrics & SLAs' && (
          <div className="space-y-5 max-w-3xl">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-secondary/30">
                <h2 className="text-xs font-semibold text-foreground">Governed Metric Definitions</h2>
              </div>
              <div className="divide-y divide-border/50">
                {SPEC.metrics.map(m => (
                  <div key={m.name} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-foreground mb-1">{m.name}</div>
                        <div className="font-mono text-[10px] text-primary bg-primary/5 border border-primary/15 rounded px-2 py-1 inline-block">{m.logic}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-muted-foreground">Owner</div>
                        <div className="text-xs font-medium text-foreground">{m.owner}</div>
                        <div className="text-[10px] text-primary mt-1">{m.threshold}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-secondary/30">
                <h2 className="text-xs font-semibold text-foreground">Data Quality Rules & SLAs</h2>
              </div>
              <div className="divide-y divide-border/50">
                {SPEC.dqRules.map(r => (
                  <div key={r.rule} className="px-5 py-4 flex items-start gap-4">
                    {r.severity === 'Critical'
                      ? <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{r.rule}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${r.severity === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>{r.severity}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{r.check}</div>
                      <div className="text-[10px] text-foreground mt-0.5">Action: {r.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Acceptance' && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-1">Acceptance Criteria</h2>
              <p className="text-xs text-muted-foreground mb-4">All criteria must pass before the data product is promoted to Production or after any schema/logic change.</p>
              <div className="space-y-3">
                {SPEC.acceptance.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <div className="text-xs font-semibold text-primary mb-1">Adaptability Note</div>
              <p className="text-xs text-foreground leading-relaxed">
                This spec is domain-agnostic by design. The same schema pattern — search event grain, funnel flag columns, and star schema joins — applies directly to live event ticketing (event search → venue detail → seat selection → checkout), SaaS product trials (feature discovery → activation → conversion), and retail eCommerce (product search → PDP → add-to-cart → purchase). Only the eVar/event mappings and metric threshold values change.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
