import PageHeader from '@/components/PageHeader';
import { Database, Code2, ArrowRight, CheckCircle } from 'lucide-react';

const SOURCES = [
  {
    name: 'HubSpot CRM',
    color: 'hsl(35 91% 55%)',
    objects: ['Contacts (12,000)', 'Deals (4,971)'],
    endpoint: 'GET /crm/v3/objects/contacts?properties=vid,email,lifecyclestage,hs_analytics_source,...',
    fields: ['vid','email','lifecyclestage','hs_analytics_source','hs_analytics_num_visits','hs_email_open'],
    usedFor: 'MTA channel source mapping, lead-to-deal pipeline funnel, CAC closed-won customer counts',
    code: `import hubspot\nclient = hubspot.Client.create(access_token=HS_TOKEN)\nresults = client.crm.contacts.basic_api.get_page(\n    properties=["vid","email","lifecyclestage","hs_analytics_source"],\n    limit=100\n)`
  },
  {
    name: 'Salesforce CRM',
    color: 'hsl(199 89% 48%)',
    objects: ['Opportunities (3,500)', 'Campaigns (40)'],
    endpoint: "SELECT Id, StageName, Amount, CloseDate, LeadSource, CampaignId FROM Opportunity WHERE CreatedDate >= 2023-01-01T00:00:00Z",
    fields: ['Id','StageName','Amount','IsWon','LeadSource','CampaignId','FiscalQuarter'],
    usedFor: 'Campaign-level ROI, pipeline velocity, lead source attribution, win rate analysis',
    code: `from simple_salesforce import Salesforce\nsf = Salesforce(username=SF_USER, password=SF_PASS, security_token=SF_TOKEN)\nopp_data = sf.query_all(\n    "SELECT Id, StageName, Amount, CloseDate, LeadSource FROM Opportunity"\n)`
  },
  {
    name: 'Google Analytics 4',
    color: 'hsl(158 64% 52%)',
    objects: ['Events (53,944)', 'Sessions (50,000)'],
    endpoint: "SELECT * FROM `project.analytics_XXXXX.events_*` WHERE event_name IN ('session_start','purchase')",
    fields: ['user_pseudo_id','event_name','traffic_source.source','traffic_source.medium','ecommerce.purchase_revenue_in_usd'],
    usedFor: 'Multi-touch journey reconstruction (MTA), session-level channel attribution, conversion events',
    code: `from google.cloud import bigquery\nclient = bigquery.Client()\nquery = """\n  SELECT user_pseudo_id, event_name, \n         traffic_source.source, traffic_source.medium,\n         ecommerce.purchase_revenue_in_usd\n  FROM \`project.analytics_123.events_*\`\n  WHERE event_name IN ('session_start','purchase')\n  AND _TABLE_SUFFIX BETWEEN '20230101' AND '20241231'\n"""\ndf = client.query(query).to_dataframe()`
  },
  {
    name: 'Google Ads',
    color: 'hsl(262 80% 65%)',
    objects: ['Daily Campaign Rows (7,310)'],
    endpoint: "GAQL: SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign",
    fields: ['segments.date','campaign.name','metrics.cost','metrics.conversions','metrics.conversions_value','metrics.roas'],
    usedFor: 'Paid search/display spend inputs for MMM adstock model, CAC paid channel spend',
    code: `from google.ads.googleads.client import GoogleAdsClient\nclient = GoogleAdsClient.load_from_dict(credentials)\nquery = """\n  SELECT campaign.id, campaign.name, segments.date,\n         metrics.impressions, metrics.clicks,\n         metrics.cost_micros, metrics.conversions\n  FROM campaign\n  WHERE segments.date BETWEEN '2023-01-01' AND '2024-12-31'\n"""\nresponse = client.get_service("GoogleAdsService").search(customer_id=CUSTOMER_ID, query=query)`
  },
  {
    name: 'Meta Ads',
    color: 'hsl(340 82% 60%)',
    objects: ['Daily Adset Rows (26,247)'],
    endpoint: "AdAccount(act_XXXX).get_insights(fields=[spend, impressions, clicks, actions, purchase_roas], params={level: adset})",
    fields: ['date_start','campaign_name','spend','actions.purchase','action_values.purchase','purchase_roas','age','gender'],
    usedFor: 'Paid social spend for MMM, Meta campaign CAC, audience-level performance',
    code: `from facebook_business.api import FacebookAdsApi\nfrom facebook_business.adobjects.adaccount import AdAccount\nFacebookAdsApi.init(access_token=META_TOKEN)\naccount = AdAccount(f'act_{ACCOUNT_ID}')\ninsights = account.get_insights(\n    fields=['spend','impressions','clicks','actions','purchase_roas'],\n    params={'date_preset':'last_2_years','level':'adset','time_increment':1}\n)`
  },
  {
    name: 'NetSuite ERP',
    color: 'hsl(187 60% 50%)',
    objects: ['Transaction Lines (37,405)'],
    endpoint: "ODBC: SELECT t.ID, t.TranDate, t.Amount, tl.Item, tl.Department, tl.Class FROM Transactions t JOIN TransactionLines tl ON t.ID = tl.Transaction",
    fields: ['TranID','TranDate','RecordType','Entity','Amount','Department','Class','PostingPeriod'],
    usedFor: 'Customer LTV calculation (revenue per customer over time), cohort retention analysis, payback period',
    code: `import pyodbc\nconn = pyodbc.connect(\n    f"DRIVER={{NetSuite ODBC Driver}};Host={NS_HOST};\n     Port=1708;ServerDataSource=NetSuite.com;\n     UID={NS_ACCOUNT_ID};PWD={NS_TOKEN}"\n)\ndf = pd.read_sql_query("""\n  SELECT t.TranDate, t.Entity, t.Amount, tl.Item, tl.Department\n  FROM Transactions t\n  JOIN TransactionLines tl ON t.ID = tl.Transaction\n  WHERE t.RecordType IN ('Invoice','Cash Sale')\n  AND t.TranDate >= '01/01/2023'\n""", conn)`
  },
];

export default function DataSources() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Data Sources & Pipeline"
        subtitle="Real API endpoints, connector code, and field mappings — how you'd pull this data in production"
        badge="6 Sources"
      />
      <div className="p-6 space-y-4">
        {/* Architecture flow */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-3">Pipeline Architecture</div>
          <div className="flex items-center gap-2 flex-wrap">
            {['HubSpot / Salesforce','GA4 (BigQuery)','Google Ads API','Meta Ads API','NetSuite ODBC'].map((s,i,arr) => (
              <div key={s} className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-md bg-secondary text-xs font-medium text-foreground border border-border">{s}</div>
                {i < arr.length-1 && <ArrowRight size={12} className="text-muted-foreground flex-shrink-0"/>}
              </div>
            ))}
            <ArrowRight size={12} className="text-muted-foreground"/>
            <div className="px-3 py-1.5 rounded-md bg-primary/15 text-xs font-medium text-primary border border-primary/30">BigQuery / Snowflake</div>
            <ArrowRight size={12} className="text-muted-foreground"/>
            <div className="px-3 py-1.5 rounded-md bg-primary/15 text-xs font-medium text-primary border border-primary/30">Python Models</div>
            <ArrowRight size={12} className="text-muted-foreground"/>
            <div className="px-3 py-1.5 rounded-md bg-primary/15 text-xs font-medium text-primary border border-primary/30">This Dashboard</div>
          </div>
        </div>

        {/* Source cards */}
        {SOURCES.map(src => (
          <div key={src.name} className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{background:`${src.color}08`}}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{background: src.color}}/>
                <span className="font-semibold text-sm text-foreground">{src.name}</span>
                {src.objects.map(o => (
                  <span key={o} className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                    style={{background:`${src.color}12`, color: src.color, borderColor:`${src.color}30`}}>
                    {o}
                  </span>
                ))}
              </div>
              <Database size={14} style={{color: src.color}}/>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-border">
              {/* Endpoint */}
              <div className="p-4">
                <div className="section-title">Endpoint / Query</div>
                <code className="block text-[10px] font-mono leading-relaxed text-muted-foreground bg-secondary/50 p-2 rounded-md break-all">
                  {src.endpoint}
                </code>
                <div className="mt-3">
                  <div className="section-title">Key Fields</div>
                  <div className="flex flex-wrap gap-1.5">
                    {src.fields.map(f => (
                      <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Used for */}
              <div className="p-4">
                <div className="section-title">Used For</div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <CheckCircle size={12} style={{color: src.color, flexShrink: 0, marginTop: 2}}/>
                  <span>{src.usedFor}</span>
                </div>
              </div>
              {/* Code */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Code2 size={11} className="text-muted-foreground"/>
                  <div className="section-title mb-0">Connector Code (Python)</div>
                </div>
                <pre className="text-[9.5px] font-mono leading-relaxed text-muted-foreground bg-secondary/50 p-2.5 rounded-md overflow-x-auto">{src.code}</pre>
              </div>
            </div>
          </div>
        ))}

        {/* GitHub note */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-2">GitHub Repository Structure</div>
          <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed bg-secondary/50 p-3 rounded-md overflow-x-auto">{`marketing-analytics-portfolio/
├── data/
│   ├── raw/                          # Platform exports (CSV, exact API field names)
│   │   ├── hubspot_contacts.csv      # HubSpot CRM Contacts API
│   │   ├── hubspot_deals.csv         # HubSpot CRM Deals API
│   │   ├── salesforce_opportunities.csv   # Salesforce SOQL query
│   │   ├── salesforce_campaigns.csv       # Salesforce SOQL query
│   │   ├── ga4_events.csv            # GA4 BigQuery export schema
│   │   ├── google_ads_daily.csv      # Google Ads Reporting API
│   │   ├── meta_ads_daily.csv        # Meta Marketing API (Ads Insights)
│   │   └── netsuite_transactions.csv # NetSuite SuiteAnalytics ODBC
│   ├── processed/                    # Model outputs
│   └── data_dictionary.json          # Schema docs with real API endpoints
├── 01_generate_platform_data.py      # Synthetic data with real field schemas
├── 02_mta_model.py                   # MTA: Shapley + Markov + rule-based
├── 03_cac_model.py                   # CAC: channel, cohort, LTV:CAC, payback
├── 04_mmm_model.py                   # MMM: adstock, saturation, OLS, optimizer
└── dashboard/                        # React + Recharts interactive dashboard`}</pre>
        </div>
      </div>
    </div>
  );
}
