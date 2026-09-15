import { useState, useMemo } from 'react';
import { BookOpen, Search, Clock, User, Tag, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const METRICS = [
  // ── Funnel / Conversion ──────────────────────────────────────────────────
  {
    id: 'm-001', name: 'Search-to-Book Rate (S2B)', category: 'Funnel', domain: 'Digital Commerce',
    definition: 'The percentage of search sessions that result in a confirmed booking or purchase within the same or subsequent session (within 7-day attribution window).',
    formula: 'Confirmed Bookings / Total Search Sessions',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · BOOKING_CONFIRMED_FLAG',
    grain: 'Daily · by channel · by device type',
    owner: 'Business Analytics', lastUpdated: 'Aug 12, 2024',
    notes: 'Do not conflate with Visit-to-Book Rate — S2B denominates on search initiations only, not all site visits. Cross-device journeys are attributed via loyalty ID when available.',
    tags: ['Funnel', 'CVR', 'Core KPI'],
  },
  {
    id: 'm-002', name: 'Shopping Abandonment Rate', category: 'Funnel', domain: 'Digital Commerce',
    definition: 'The percentage of users who selected a rate or room type but did not initiate the booking page within the same session.',
    formula: '1 − (Booking Page Initiations / Rate Selections)',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · RATE_SELECTED_FLAG, BOOKING_INITIATED_FLAG',
    grain: 'Daily · by property type · by device type',
    owner: 'Product / UX', lastUpdated: 'Aug 12, 2024',
    notes: 'High mobile abandonment (>72%) is expected — desktop is the benchmark. Segment by LOS and lead time; long-stay or far-out searches have structurally higher abandonment.',
    tags: ['Funnel', 'UX', 'Core KPI'],
  },
  {
    id: 'm-003', name: 'Booking Page Conversion Rate', category: 'Funnel', domain: 'Digital Commerce',
    definition: 'Percentage of sessions that reached the booking/checkout page and resulted in a confirmed transaction.',
    formula: 'Confirmed Bookings / Booking Page Sessions',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · BOOKING_INITIATED_FLAG, BOOKING_CONFIRMED_FLAG',
    grain: 'Daily · by channel',
    owner: 'Business Analytics', lastUpdated: 'Jul 30, 2024',
    notes: 'This metric is inflated when more browsing traffic is sent to the booking page — always pair with overall S2B Rate to avoid misreading a volume-driven CVR drop as a quality problem.',
    tags: ['Funnel', 'CVR', 'Checkout'],
  },
  {
    id: 'm-004', name: 'Seat Add-to-Cart Rate', category: 'Funnel', domain: 'Live Events',
    definition: 'Percentage of event detail page views where a user adds at least one ticket to cart.',
    formula: 'Add-to-Cart Events / Event Detail Page Views',
    source: 'DW_PROD.FACT_TICKET_SHOPPING · CART_ADDED_FLAG',
    grain: 'Daily · by event category · by venue',
    owner: 'Product Analytics', lastUpdated: 'Sep 2, 2024',
    notes: 'Premium and club-level sections have 18-25% higher add-to-cart rates than GA sections — always segment before benchmarking. Seat map vs. list selection method is a known confound.',
    tags: ['Funnel', 'Ticketing', 'Live Events'],
  },

  // ── Search Quality ───────────────────────────────────────────────────────
  {
    id: 'm-005', name: 'Zero Results Rate', category: 'Search Quality', domain: 'Digital Commerce',
    definition: 'Percentage of search queries that returned zero results, indicating a gap in inventory, search logic, or query parsing.',
    formula: 'Sessions with RESULTS_COUNT = 0 / Total Search Sessions',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · ZERO_RESULTS_FLAG',
    grain: 'Daily · by destination · by LOS bucket',
    owner: 'Search Engineering', lastUpdated: 'Aug 5, 2024',
    notes: 'Alert threshold is 4%. Spikes typically correspond to calendar availability gaps or query parsing failures on non-standard destination strings. Route anomalies to Search Eng, not Analytics.',
    tags: ['Search', 'Quality', 'SLA'],
  },
  {
    id: 'm-006', name: 'Search Refinement Rate', category: 'Search Quality', domain: 'Digital Commerce',
    definition: 'Percentage of sessions in which a user modified their search parameters (dates, destination, guest count) at least once after viewing results.',
    formula: 'Sessions with ≥2 distinct search events / Sessions with ≥1 search event',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · SESSION_KEY aggregation',
    grain: 'Weekly · by device type',
    owner: 'Product / UX', lastUpdated: 'Jul 18, 2024',
    notes: 'High refinement rate (>35%) can indicate search results are not matching intent on the first query — pair with Zero Results Rate and property click-through to diagnose.',
    tags: ['Search', 'Engagement', 'UX'],
  },

  // ── Revenue & Monetization ───────────────────────────────────────────────
  {
    id: 'm-007', name: 'Average Order Value (AOV)', category: 'Revenue', domain: 'Digital Commerce',
    definition: 'Average confirmed booking or purchase value, inclusive of base rate and ancillary add-ons, exclusive of taxes and fees.',
    formula: 'Total Net Booking Revenue / Confirmed Booking Count',
    source: 'DW_PROD.FACT_TRANSACTIONS · BOOKING_REVENUE_NET',
    grain: 'Weekly · by channel · by loyalty tier',
    owner: 'Finance Analytics', lastUpdated: 'Sep 1, 2024',
    notes: 'Do not include cancellation credits or comp bookings in the denominator. Loyalty members average 22% higher AOV than anonymous — always dimension by LOYALTY_TIER.',
    tags: ['Revenue', 'Core KPI', 'Monetization'],
  },
  {
    id: 'm-008', name: 'Revenue Per Search Session', category: 'Revenue', domain: 'Digital Commerce',
    definition: 'Total net booking revenue attributable to a cohort of search sessions, divided by the number of sessions in that cohort.',
    formula: 'Total Net Booking Revenue (attributed) / Total Search Sessions',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING JOIN DW_PROD.FACT_TRANSACTIONS',
    grain: 'Weekly · by channel · by destination tier',
    owner: 'Business Analytics', lastUpdated: 'Aug 19, 2024',
    notes: 'Preferred top-of-funnel efficiency metric over S2B Rate alone — accounts for both conversion rate and booking value simultaneously. Used in channel ROAS and MMM model validation.',
    tags: ['Revenue', 'Efficiency', 'MMM Input'],
  },
  {
    id: 'm-009', name: 'Ticket Sell-Through Rate', category: 'Revenue', domain: 'Live Events',
    definition: 'Percentage of available ticket inventory for an event that has been sold as of the measurement date.',
    formula: 'Tickets Sold / Total Available Inventory',
    source: 'DW_PROD.FACT_INVENTORY · TICKETS_SOLD, CAPACITY',
    grain: 'Daily · by event · by section tier',
    owner: 'Revenue Management', lastUpdated: 'Aug 28, 2024',
    notes: 'Measure at multiple pre-event checkpoints (90d, 60d, 30d, 7d out). Early sell-through velocity is a stronger predictor of final sell-through than current snapshot.',
    tags: ['Revenue', 'Ticketing', 'Inventory'],
  },

  // ── Engagement ───────────────────────────────────────────────────────────
  {
    id: 'm-010', name: 'Property Detail Page CTR', category: 'Engagement', domain: 'Digital Commerce',
    definition: 'Click-through rate from search results list to individual property detail pages.',
    formula: 'Property Detail Page Views / Search Result Impressions',
    source: 'Adobe Analytics · eVar12 search event → event5 property view',
    grain: 'Daily · by result position · by device type',
    owner: 'Digital Analytics', lastUpdated: 'Aug 8, 2024',
    notes: 'Position 1-3 CTR benchmarks ~28-35% on desktop, ~18-24% on mobile. Significant CTR drop below position 4 is expected and normal — use this to evaluate search ranking quality, not absolute values.',
    tags: ['Engagement', 'Search', 'Adobe Analytics'],
  },
  {
    id: 'm-011', name: 'Mobile Share of Search', category: 'Engagement', domain: 'Digital Commerce',
    definition: 'Percentage of total search sessions originating from a mobile device.',
    formula: 'Mobile Search Sessions / Total Search Sessions',
    source: 'DW_PROD.FACT_SEARCH_SHOPPING · DEVICE_TYPE = \'Mobile\'',
    grain: 'Weekly · by channel',
    owner: 'Digital Analytics', lastUpdated: 'Jul 22, 2024',
    notes: 'Tracking metric only — no SLA threshold. Used to weight mobile UX investment and contextualize mobile-vs-desktop CVR gap. Expected range 55-65% for most consumer digital products.',
    tags: ['Engagement', 'Mobile', 'Tracking'],
  },

  // ── Loyalty & Retention ──────────────────────────────────────────────────
  {
    id: 'm-012', name: 'Loyalty Sign-Up Rate', category: 'Loyalty & Retention', domain: 'Digital Commerce',
    definition: 'Percentage of anonymous booking sessions where the user created or authenticated a loyalty account before or during checkout.',
    formula: 'Sessions with Loyalty ID at Checkout / Anonymous Booking Sessions',
    source: 'DW_PROD.FACT_TRANSACTIONS · LOYALTY_ID IS NOT NULL',
    grain: 'Weekly · by acquisition channel',
    owner: 'Loyalty Analytics', lastUpdated: 'Sep 3, 2024',
    notes: 'Denominator is anonymous sessions that reached checkout — not all sessions. A/B test variants targeting sign-up prompt placement should use this as the primary metric, not overall CVR.',
    tags: ['Loyalty', 'Retention', 'Acquisition'],
  },
  {
    id: 'm-013', name: 'Repeat Purchase Rate (90d)', category: 'Loyalty & Retention', domain: 'Live Events',
    definition: 'Percentage of customers who made a confirmed purchase in a period who made at least one additional purchase within 90 days.',
    formula: 'Customers with ≥2 purchases within 90d / Customers with ≥1 purchase',
    source: 'DW_PROD.FACT_TRANSACTIONS · USER_PSEUDO_ID cohort analysis',
    grain: 'Monthly cohort · by channel · by event category',
    owner: 'CRM Analytics', lastUpdated: 'Aug 25, 2024',
    notes: 'This is a lagging metric — 90d window means the September cohort is not reportable until December. Do not use for in-flight campaign optimization. Use 30d proxy for early signals.',
    tags: ['Retention', 'LTV', 'Ticketing'],
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(METRICS.map(m => m.category)))];
const DOMAINS = ['All Domains', ...Array.from(new Set(METRICS.map(m => m.domain)))];

export default function MetricGovernance() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [domain, setDomain] = useState('All Domains');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => METRICS.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.definition.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q));
    const matchCat = category === 'All' || m.category === category;
    const matchDomain = domain === 'All Domains' || m.domain === domain;
    return matchSearch && matchCat && matchDomain;
  }), [search, category, domain]);

  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    METRICS.forEach(m => { c[m.category] = (c[m.category] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10"><BookOpen size={18} className="text-primary" /></div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Metric Governance & Semantic Layer</h1>
            <p className="text-xs text-muted-foreground">Governed KPI dictionary · {METRICS.length} metrics · Digital Commerce & Live Events</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search metrics by name, definition, or tag..."
            className="w-full pl-8 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        </div>
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${category === c ? 'bg-primary/15 text-primary border-primary/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
              {c}{c !== 'All' ? ` (${catCounts[c] ?? 0})` : ''}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {DOMAINS.map(d => (
              <button key={d} onClick={() => setDomain(d)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${domain === d ? 'bg-primary/15 text-primary border-primary/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No metrics match your search. Try a different term or clear filters.</div>
        )}
        <div className="space-y-2">
          {filtered.map(m => {
            const expanded = expandedId === m.id;
            return (
              <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all">
                <button className="w-full text-left px-5 py-4" onClick={() => setExpandedId(expanded ? null : m.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{m.id}</span>
                        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{m.category}</span>
                        <span className="text-[10px] bg-primary/8 text-primary px-2 py-0.5 rounded-full border border-primary/15">{m.domain}</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground mb-1">{m.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{m.definition}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right text-[10px] text-muted-foreground hidden sm:block">
                        <div className="flex items-center gap-1 justify-end"><User size={9} />{m.owner}</div>
                        <div className="flex items-center gap-1 justify-end mt-0.5"><Clock size={9} />{m.lastUpdated}</div>
                      </div>
                      {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </div>
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-border/40 px-5 py-4 space-y-4 bg-secondary/10">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Definition</div>
                      <p className="text-sm text-foreground">{m.definition}</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Formula / Business Logic</div>
                      <div className="font-mono text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">{m.formula}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Source Table / Field</div>
                        <div className="font-mono text-[11px] text-foreground">{m.source}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Reporting Grain</div>
                        <div className="text-xs text-foreground">{m.grain}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Governance Notes</div>
                      <div className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground">{m.notes}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {m.tags.map(tag => (
                          <button key={tag} onClick={e => { e.stopPropagation(); setSearch(tag); }}
                            className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border hover:text-primary hover:border-primary/30 transition-all flex items-center gap-1">
                            <Tag size={8} />{tag}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><User size={9} />{m.owner}</span>
                        <span className="flex items-center gap-1"><Clock size={9} />Updated {m.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
