"""
=============================================================================
Marketing Analytics Portfolio Project
01 — Platform-Accurate Synthetic Data Generation
=============================================================================

Data sources simulated (exact field names match real API / export schemas):

  Source A → HubSpot CRM          (Contacts + Deals objects)
  Source B → Salesforce CRM       (Opportunity + CampaignMember objects)
  Source C → Google Analytics 4   (BigQuery flat-export schema)
  Source D → Google Ads           (Reporting API / Looker Studio export)
  Source E → Meta Ads             (Marketing API Ads Insights endpoint)
  Source F → NetSuite ERP         (SuiteAnalytics transaction export)

In a real project you would replace these CSV files with the actual
connector calls shown in the comments above each section.

Author : Vincent Lepore
Created: 2024
=============================================================================
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import uuid, hashlib, random, os, json

np.random.seed(42)
random.seed(42)

OUTPUT = "/home/user/workspace/marketing_models/data/raw"
os.makedirs(OUTPUT, exist_ok=True)

START = datetime(2023, 1, 1)
END   = datetime(2024, 12, 31)
DAYS  = (END - START).days

def rand_date(start=START, end=END):
    return start + timedelta(days=random.randint(0, (end - start).days))

def fake_email(name):
    domains = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","company.com"]
    return f"{name.lower().replace(' ','.')}@{random.choice(domains)}"

def hs_id():   return str(random.randint(10_000_000, 99_999_999))
def sf_id():   return "00" + ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))
def ga_uid():  return hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()[:20]

FIRST_NAMES = ["James","Maria","David","Sarah","Michael","Jennifer","Robert","Linda",
               "William","Patricia","Carlos","Elena","Kevin","Aisha","Tyler","Priya"]
LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
               "Wilson","Anderson","Taylor","Thomas","Moore","Jackson","Martin","Lee"]

def rand_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

# Industry segments (B2B SaaS context)
INDUSTRIES   = ["Technology","Healthcare","Financial Services","Retail","Manufacturing",
                "Education","Real Estate","Professional Services","Media","Hospitality"]
COMPANY_SIZES = ["1-10","11-50","51-200","201-500","501-1000","1001-5000","5000+"]

# UTM / channel taxonomy (consistent across all platforms)
UTM_SOURCES  = ["google","meta","linkedin","email","direct","organic","affiliate","bing"]
UTM_MEDIUMS  = {"google":"cpc","meta":"paid_social","linkedin":"paid_social",
                "email":"email","direct":"(none)","organic":"organic",
                "affiliate":"affiliate","bing":"cpc"}
UTM_CAMPAIGNS = {
    "google":   ["brand_search","competitor_search","generic_search_top","generic_search_mid","remarketing_search"],
    "meta":     ["prospecting_top","lookalike_30d","retargeting_14d","video_awareness","catalog_dpa"],
    "linkedin": ["content_syndication","sponsored_content_exec","lead_gen_form_it"],
    "email":    ["welcome_series_1","nurture_drip_w2","promo_blackfriday","quarterly_newsletter","reengagement_90d"],
    "affiliate":["partner_techblog","partner_review_site","partner_coupon"],
    "bing":     ["brand_search_bing","generic_bing"],
}

# ─────────────────────────────────────────────────────────────────────────────
# SOURCE A: HUBSPOT CRM
# Real pull: GET https://api.hubapi.com/crm/v3/objects/contacts?properties=...
#            GET https://api.hubapi.com/crm/v3/objects/deals?properties=...
# ─────────────────────────────────────────────────────────────────────────────
print("Generating HubSpot CRM data...")

HS_LIFECYCLE_STAGES   = ["subscriber","lead","marketingqualifiedlead","salesqualifiedlead",
                          "opportunity","customer","evangelist"]
HS_DEAL_STAGES        = ["appointmentscheduled","qualifiedtobuy","presentationscheduled",
                          "decisionmakerboughtin","contractsent","closedwon","closedlost"]
HS_LEAD_SOURCES       = ["ORGANIC_SEARCH","PAID_SEARCH","SOCIAL_MEDIA","EMAIL_MARKETING",
                          "REFERRAL","DIRECT_TRAFFIC","PAID_SOCIAL","OTHER_CAMPAIGNS"]

N_CONTACTS = 12000
contacts, deals = [], []

for i in range(N_CONTACTS):
    cid       = hs_id()
    name      = rand_name()
    created   = rand_date()
    source    = random.choice(HS_LEAD_SOURCES)
    
    # Lifecycle progression
    stage_idx = random.choices(range(len(HS_LIFECYCLE_STAGES)),
                               weights=[5,18,20,15,10,25,7])[0]
    lifecycle = HS_LIFECYCLE_STAGES[stage_idx]
    
    contacts.append({
        # Core HubSpot contact fields (exact API property names)
        "vid":                          cid,
        "email":                        fake_email(name),
        "firstname":                    name.split()[0],
        "lastname":                     name.split()[1],
        "company":                      f"{random.choice(LAST_NAMES)} {random.choice(['Inc','LLC','Corp','Co','Group'])}",
        "industry":                     random.choice(INDUSTRIES),
        "num_employees":                random.choice(COMPANY_SIZES),
        "phone":                        f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}",
        "city":                         random.choice(["New York","Los Angeles","Chicago","Houston","Miami",
                                                        "Atlanta","Seattle","Boston","Dallas","Denver"]),
        "state":                        random.choice(["NY","CA","IL","TX","FL","GA","WA","MA","TX","CO"]),
        "country":                      "United States",
        "createdate":                   created.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "lastmodifieddate":             (created + timedelta(days=random.randint(1,180))).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "hs_lead_status":               random.choice(["NEW","OPEN","IN_PROGRESS","OPEN_DEAL","UNQUALIFIED","ATTEMPTED_TO_CONTACT","CONNECTED","BAD_TIMING"]),
        "lifecyclestage":               lifecycle,
        "hs_analytics_source":          source,
        "hs_analytics_source_data_1":   random.choice(UTM_SOURCES),
        "hs_analytics_source_data_2":   f"utm_campaign={random.choice(UTM_CAMPAIGNS.get(random.choice(UTM_SOURCES),['unknown']))}",
        "hs_analytics_num_visits":      random.randint(1, 48),
        "hs_analytics_num_page_views":  random.randint(1, 120),
        "hs_email_open":                random.randint(0, 30),
        "hs_email_click":               random.randint(0, 12),
        "num_associated_deals":         1 if stage_idx >= 4 else 0,
        "notes_last_contacted":         (created + timedelta(days=random.randint(1,30))).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "hubspot_owner_id":             str(random.randint(1000, 1015)),
    })
    
    # Create deal if opportunity or beyond
    if stage_idx >= 4:
        deal_stage_idx = random.randint(0, len(HS_DEAL_STAGES)-1)
        deal_created   = created + timedelta(days=random.randint(7, 45))
        amount         = round(random.uniform(500, 25000), 2) if deal_stage_idx in [5] else round(random.uniform(500, 25000), 2)
        close_date     = deal_created + timedelta(days=random.randint(14, 120))
        
        deals.append({
            # Core HubSpot deal fields
            "hs_deal_id":               hs_id(),
            "dealname":                 f"{name.split()[1]} Corp - {random.choice(['Annual Plan','Pro Upgrade','Enterprise','Starter'])}",
            "dealstage":                HS_DEAL_STAGES[deal_stage_idx],
            "pipeline":                 "default",
            "amount":                   amount if deal_stage_idx == 5 else None,
            "hs_projected_amount":      round(amount * random.uniform(0.7, 1.0), 2),
            "closedate":                close_date.strftime("%Y-%m-%d"),
            "createdate":               deal_created.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "hs_closed_amount":         amount if deal_stage_idx == 5 else 0,
            "hs_deal_stage_probability":{"appointmentscheduled":10,"qualifiedtobuy":20,"presentationscheduled":40,
                                         "decisionmakerboughtin":60,"contractsent":80,"closedwon":100,"closedlost":0}[HS_DEAL_STAGES[deal_stage_idx]],
            "hs_analytics_source":      source,
            "associated_contact_vid":   cid,
            "hubspot_owner_id":         str(random.randint(1000, 1015)),
            "num_associated_contacts":  random.randint(1,4),
            "hs_deal_is_closed":        deal_stage_idx in [5, 6],
            "hs_deal_is_closed_won":    deal_stage_idx == 5,
            "days_to_close":            (close_date - deal_created).days,
        })

df_hs_contacts = pd.DataFrame(contacts)
df_hs_deals    = pd.DataFrame(deals)
df_hs_contacts.to_csv(f"{OUTPUT}/hubspot_contacts.csv", index=False)
df_hs_deals.to_csv(f"{OUTPUT}/hubspot_deals.csv", index=False)
print(f"  ✓ HubSpot: {len(df_hs_contacts):,} contacts | {len(df_hs_deals):,} deals")


# ─────────────────────────────────────────────────────────────────────────────
# SOURCE B: SALESFORCE CRM
# Real pull: SELECT Id,Name,StageName,Amount,CloseDate,LeadSource,CampaignId
#            FROM Opportunity WHERE CreatedDate >= 2023-01-01T00:00:00Z
# Also:      SELECT CampaignId,Name,Type,Status,ActualCost,NumberOfLeads,
#                   NumberOfConverted,NumberOfWonOpportunities,AmountAllOpportunities
#            FROM Campaign
# ─────────────────────────────────────────────────────────────────────────────
print("Generating Salesforce CRM data...")

SF_STAGES     = ["Prospecting","Qualification","Needs Analysis","Value Proposition",
                 "Id. Decision Makers","Perception Analysis","Proposal/Price Quote",
                 "Negotiation/Review","Closed Won","Closed Lost"]
SF_STAGE_PROB = [5,10,20,30,40,50,60,75,100,0]
SF_LEAD_SOURCES = ["Web","Phone Inquiry","Partner Referral","Purchased List",
                   "Web Site","Other","Word of mouth","Internal","Employee Referral","Trade Show"]

N_SF_OPPS = 3500
sf_opps, sf_campaigns = [], []

# Generate campaigns first
campaign_ids = []
campaign_types = ["Email","Webinar","Conference","Advertisement","Direct Mail","Other"]
for c in range(40):
    cid = sf_id()
    campaign_ids.append(cid)
    start = rand_date()
    sf_campaigns.append({
        "Id":                          cid,
        "Name":                        f"{'Q'+str(random.randint(1,4))} {random.randint(2023,2024)} - {random.choice(['Brand Awareness','Lead Gen','Nurture','Webinar','Retargeting'])} - {random.choice(INDUSTRIES[:5])}",
        "Type":                        random.choice(campaign_types),
        "Status":                      random.choice(["Planned","In Progress","Completed","Aborted"]),
        "StartDate":                   start.strftime("%Y-%m-%d"),
        "EndDate":                     (start + timedelta(days=random.randint(14,90))).strftime("%Y-%m-%d"),
        "BudgetedCost":                round(random.uniform(2000, 30000), 2),
        "ActualCost":                  round(random.uniform(1800, 28000), 2),
        "ExpectedRevenue":             round(random.uniform(10000, 150000), 2),
        "NumberOfLeads":               random.randint(50, 800),
        "NumberOfContacts":            random.randint(20, 400),
        "NumberOfConvertedLeads":      random.randint(5, 80),
        "NumberOfOpportunities":       random.randint(3, 60),
        "NumberOfWonOpportunities":    random.randint(1, 30),
        "AmountAllOpportunities":      round(random.uniform(5000, 200000), 2),
        "AmountWonOpportunities":      round(random.uniform(2000, 80000), 2),
        "OwnerId":                     sf_id(),
        "IsActive":                    True,
        "CreatedDate":                 start.strftime("%Y-%m-%dT%H:%M:%S.000+0000"),
    })

for i in range(N_SF_OPPS):
    stage_idx  = random.choices(range(len(SF_STAGES)), weights=[8,10,12,10,8,6,14,8,16,8])[0]
    created    = rand_date()
    close_date = created + timedelta(days=random.randint(14, 180))
    amount     = round(random.uniform(1000, 50000), 2)
    
    sf_opps.append({
        # Exact Salesforce Opportunity object field names
        "Id":                          sf_id(),
        "Name":                        f"{random.choice(LAST_NAMES)} {random.choice(['Inc','LLC','Corp'])} - {random.choice(['New Business','Upsell','Renewal','Expansion'])}",
        "AccountId":                   sf_id(),
        "ContactId":                   sf_id(),
        "StageName":                   SF_STAGES[stage_idx],
        "Probability":                 SF_STAGE_PROB[stage_idx],
        "Amount":                      amount,
        "ExpectedRevenue":             round(amount * SF_STAGE_PROB[stage_idx] / 100, 2),
        "CloseDate":                   close_date.strftime("%Y-%m-%d"),
        "Type":                        random.choice(["New Business","Existing Business - Upgrade","Existing Business - Renewal"]),
        "LeadSource":                  random.choice(SF_LEAD_SOURCES),
        "CampaignId":                  random.choice(campaign_ids),
        "IsClosed":                    stage_idx in [8, 9],
        "IsWon":                       stage_idx == 8,
        "ForecastCategory":            random.choice(["Pipeline","Best Case","Commit","Closed","Omitted"]),
        "ForecastCategoryName":        random.choice(["Pipeline","Best Case","Commit","Closed Won","Omitted"]),
        "OwnerId":                     sf_id(),
        "CreatedDate":                 created.strftime("%Y-%m-%dT%H:%M:%S.000+0000"),
        "LastModifiedDate":            (created + timedelta(days=random.randint(1,60))).strftime("%Y-%m-%dT%H:%M:%S.000+0000"),
        "LastActivityDate":            (created + timedelta(days=random.randint(1,30))).strftime("%Y-%m-%d"),
        "NextStep":                    random.choice(["Schedule demo","Send proposal","Follow up call","Contract review",""]),
        "Description":                 "",
        "Fiscal":                      f"FY{close_date.year} {'Q'+str((close_date.month-1)//3+1)}",
        "FiscalYear":                  close_date.year,
        "FiscalQuarter":               (close_date.month-1)//3+1,
        "Age":                         (close_date - created).days,
        "HasOpportunityLineItem":      random.choice([True, False]),
        "PricebookId":                 sf_id(),
    })

df_sf_opps      = pd.DataFrame(sf_opps)
df_sf_campaigns = pd.DataFrame(sf_campaigns)
df_sf_opps.to_csv(f"{OUTPUT}/salesforce_opportunities.csv", index=False)
df_sf_campaigns.to_csv(f"{OUTPUT}/salesforce_campaigns.csv", index=False)
print(f"  ✓ Salesforce: {len(df_sf_opps):,} opportunities | {len(df_sf_campaigns):,} campaigns")


# ─────────────────────────────────────────────────────────────────────────────
# SOURCE C: GOOGLE ANALYTICS 4 (BigQuery Export Schema)
# Real pull: SELECT * FROM `project.analytics_XXXXXX.events_*`
#            WHERE _TABLE_SUFFIX BETWEEN '20230101' AND '20241231'
#            AND event_name IN ('session_start','page_view','purchase','add_to_cart','form_submit')
# ─────────────────────────────────────────────────────────────────────────────
print("Generating Google Analytics 4 (BigQuery export) data...")

GA4_EVENT_NAMES = ["session_start","page_view","scroll","click","view_item",
                   "add_to_cart","begin_checkout","purchase","form_submit","sign_up",
                   "file_download","video_start","video_complete"]
GA4_DEVICE_TYPES = ["mobile","desktop","tablet"]
GA4_BROWSERS     = ["Chrome","Safari","Firefox","Edge","Samsung Internet"]
GA4_OS           = ["Android","iOS","Windows","Macintosh","Linux"]
GA4_COUNTRIES    = ["United States","Canada","United Kingdom","Australia","Germany","France"]

N_GA4_SESSIONS = 50000
ga4_events = []

# Pre-generate sessions
sessions = []
for _ in range(N_GA4_SESSIONS):
    uid     = ga_uid()
    source  = random.choice(UTM_SOURCES)
    medium  = UTM_MEDIUMS[source]
    camp    = random.choice(UTM_CAMPAIGNS.get(source, ["(not set)"]))
    sess_dt = rand_date()
    device  = random.choices(GA4_DEVICE_TYPES, weights=[55,38,7])[0]
    sessions.append((uid, source, medium, camp, sess_dt, device))

for uid, source, medium, campaign, sess_dt, device in sessions:
    # Session start
    ga4_events.append({
        # GA4 BigQuery export schema field names
        "event_date":                   sess_dt.strftime("%Y%m%d"),
        "event_timestamp":              int(sess_dt.timestamp() * 1_000_000),
        "event_name":                   "session_start",
        "event_previous_timestamp":     0,
        "event_value_in_usd":           None,
        "event_bundle_sequence_id":     random.randint(1, 9999999),
        "event_server_timestamp_offset": random.randint(-5000, 5000),
        "user_id":                      None,
        "user_pseudo_id":               uid,
        "privacy_info.analytics_storage": "Yes",
        "privacy_info.ads_storage":      "Yes",
        "privacy_info.uses_transient_token": "No",
        "user_first_touch_timestamp":   int((sess_dt - timedelta(days=random.randint(0,90))).timestamp() * 1_000_000),
        "user_ltv.revenue":             round(random.uniform(0, 500), 2),
        "user_ltv.currency":            "USD",
        "device.category":              device,
        "device.mobile_brand_name":     "Apple" if device == "mobile" else "(not set)",
        "device.mobile_model_name":     "iPhone" if device == "mobile" else "(not set)",
        "device.mobile_os_hardware_model": "(not set)",
        "device.operating_system":      random.choice(GA4_OS),
        "device.operating_system_version": str(random.randint(10, 17)),
        "device.vendor_id":             "(not set)",
        "device.advertising_id":        "(not set)",
        "device.language":              "en-us",
        "device.is_limited_ad_tracking": "No",
        "device.time_zone_offset_seconds": -18000,
        "device.browser":               random.choice(GA4_BROWSERS),
        "device.browser_version":       str(random.randint(100, 120)),
        "device.web_info.browser":      random.choice(GA4_BROWSERS),
        "device.web_info.browser_version": str(random.randint(100, 120)),
        "device.web_info.hostname":     "www.yourbrand.com",
        "geo.continent":                "Americas",
        "geo.sub_continent":            "Northern America",
        "geo.country":                  random.choice(GA4_COUNTRIES),
        "geo.region":                   random.choice(["California","New York","Texas","Florida","Illinois"]),
        "geo.metro":                    random.choice(["New York","Los Angeles","Chicago","San Francisco","Miami"]),
        "geo.city":                     random.choice(["New York","Los Angeles","Chicago","Houston","Miami"]),
        "app_info.id":                  None,
        "app_info.firebase_app_id":     None,
        "app_info.install_source":      None,
        "app_info.version":             None,
        "traffic_source.name":          campaign,
        "traffic_source.medium":        medium,
        "traffic_source.source":        source,
        "stream_id":                    "1234567890",
        "platform":                     "WEB",
        "event_dimensions.hostname":    "www.yourbrand.com",
        "ecommerce.total_item_quantity": None,
        "ecommerce.purchase_revenue_in_usd": None,
        "ecommerce.purchase_revenue":   None,
        "ecommerce.refund_value_in_usd": None,
        "ecommerce.shipping_value_in_usd": None,
        "ecommerce.tax_value_in_usd":   None,
        "ecommerce.unique_items":       None,
        "ecommerce.transaction_id":     None,
        # Key event params (GA4 flattens these in BQ)
        "ep.session_id":                str(random.randint(1000000000, 9999999999)),
        "ep.session_number":            random.randint(1, 15),
        "ep.page_location":             f"https://www.yourbrand.com/{random.choice(['','pricing','features','blog/post-1','about','contact','demo'])}",
        "ep.page_title":                random.choice(["Home | YourBrand","Pricing | YourBrand","Features | YourBrand","About Us"]),
        "ep.source":                    source,
        "ep.medium":                    medium,
        "ep.campaign":                  campaign,
        "ep.ga_session_id":             str(random.randint(1000000000, 9999999999)),
        "ep.engagement_time_msec":      random.randint(0, 180000),
        "ep.engaged_session_event":     random.randint(0, 1),
    })
    
    # Add a purchase event for ~8% of sessions
    if random.random() < 0.08:
        revenue = round(random.uniform(29, 299), 2)
        purchase_event = ga4_events[-1].copy()
        purchase_event["event_name"]   = "purchase"
        purchase_event["event_timestamp"] += random.randint(60_000_000, 1_800_000_000)
        purchase_event["event_value_in_usd"] = revenue
        purchase_event["ecommerce.purchase_revenue_in_usd"] = revenue
        purchase_event["ecommerce.purchase_revenue"]        = revenue
        purchase_event["ecommerce.total_item_quantity"]     = random.randint(1, 5)
        purchase_event["ecommerce.unique_items"]            = random.randint(1, 5)
        purchase_event["ecommerce.transaction_id"]          = f"T-{random.randint(100000,999999)}"
        purchase_event["ecommerce.shipping_value_in_usd"]   = round(random.uniform(0, 15), 2)
        purchase_event["ecommerce.tax_value_in_usd"]        = round(revenue * 0.07, 2)
        ga4_events.append(purchase_event)

df_ga4 = pd.DataFrame(ga4_events)
# Keep only core columns for CSV (BQ schema has 100+ cols — these are the most-used)
ga4_core_cols = [c for c in df_ga4.columns if not c.startswith("ep.") or c in
                 ["ep.session_id","ep.page_location","ep.source","ep.medium","ep.campaign","ep.engagement_time_msec"]]
df_ga4[ga4_core_cols].to_csv(f"{OUTPUT}/ga4_events.csv", index=False)
print(f"  ✓ GA4: {len(df_ga4):,} events from {N_GA4_SESSIONS:,} sessions")


# ─────────────────────────────────────────────────────────────────────────────
# SOURCE D: GOOGLE ADS (Reporting API / Looker Studio export)
# Real pull: googleads.Customer.search(query="""
#   SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
#          segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros,
#          metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
#   FROM ad_group WHERE segments.date BETWEEN '2023-01-01' AND '2024-12-31'""")
# ─────────────────────────────────────────────────────────────────────────────
print("Generating Google Ads data...")

GADS_CAMPAIGN_TYPES    = ["SEARCH","DISPLAY","SHOPPING","VIDEO","PERFORMANCE_MAX"]
GADS_CAMPAIGN_STATUS   = ["ENABLED","PAUSED","REMOVED"]
GADS_BIDDING_STRATEGIES = ["TARGET_CPA","TARGET_ROAS","MAXIMIZE_CONVERSIONS","MAXIMIZE_CONVERSION_VALUE","MANUAL_CPC"]
GADS_NETWORK_TYPES     = ["SEARCH","DISPLAY","YOUTUBE_WATCH","CROSS_NETWORK"]

# Create campaign hierarchy
gads_campaigns_meta = []
for i in range(18):
    camp_type = random.choice(GADS_CAMPAIGN_TYPES)
    gads_campaigns_meta.append({
        "campaign.id":           str(random.randint(1000000000, 9999999999)),
        "campaign.name":         f"[{camp_type[:3]}] {'Brand' if i<3 else random.choice(['Generic','Competitor','Remarketing','Prospecting','Category'])} - {random.choice(INDUSTRIES[:5])} - {random.choice(['Exact','Broad','Phrase','Smart'])}",
        "campaign.advertising_channel_type": camp_type,
        "campaign.status":       "ENABLED" if i < 14 else random.choice(GADS_CAMPAIGN_STATUS),
        "campaign.bidding_strategy_type": random.choice(GADS_BIDDING_STRATEGIES),
        "campaign.target_cpa.target_cpa_micros": random.randint(5_000_000, 50_000_000),
        "campaign.target_roas.target_roas": round(random.uniform(2.0, 8.0), 2),
        "campaign.budget_amount_micros":    random.randint(50_000_000, 500_000_000),
    })

gads_daily = []
date_range = pd.date_range(start=START, end=END, freq='D')

for day in date_range:
    for camp in gads_campaigns_meta[:10]:  # Top 10 active campaigns
        dow_mult   = 1.3 if day.weekday() < 5 else 0.7  # weekday boost
        seasonal   = 1 + 0.15 * np.sin(2 * np.pi * day.dayofyear / 365)
        base_impr  = random.randint(800, 8000)
        impressions = int(base_impr * dow_mult * seasonal * random.uniform(0.85, 1.15))
        ctr         = random.uniform(0.02, 0.12)
        clicks      = int(impressions * ctr)
        avg_cpc     = random.uniform(0.80, 6.50)
        cost        = round(clicks * avg_cpc, 2)
        conv_rate   = random.uniform(0.03, 0.18)
        conversions = round(clicks * conv_rate, 2)
        conv_value  = round(conversions * random.uniform(80, 350), 2)
        
        gads_daily.append({
            # Exact Google Ads API field names
            "segments.date":                    day.strftime("%Y-%m-%d"),
            "campaign.id":                      camp["campaign.id"],
            "campaign.name":                    camp["campaign.name"],
            "campaign.advertising_channel_type": camp["campaign.advertising_channel_type"],
            "campaign.status":                  camp["campaign.status"],
            "campaign.bidding_strategy_type":   camp["campaign.bidding_strategy_type"],
            "segments.ad_network_type":         random.choice(GADS_NETWORK_TYPES),
            "segments.device":                  random.choice(["MOBILE","DESKTOP","TABLET"]),
            "metrics.impressions":              impressions,
            "metrics.clicks":                   clicks,
            "metrics.cost_micros":              int(cost * 1_000_000),  # Google stores as micros
            "metrics.cost":                     cost,                    # derived for convenience
            "metrics.average_cpc":              round(avg_cpc, 4),
            "metrics.average_cpm":              round(cost / impressions * 1000, 4) if impressions > 0 else 0,
            "metrics.ctr":                      round(ctr, 4),
            "metrics.conversions":              conversions,
            "metrics.conversions_value":        conv_value,
            "metrics.cost_per_conversion":      round(cost / conversions, 2) if conversions > 0 else 0,
            "metrics.conversion_rate":          round(conv_rate, 4),
            "metrics.roas":                     round(conv_value / cost, 2) if cost > 0 else 0,
            "metrics.search_impression_share":  round(random.uniform(0.30, 0.95), 4),
            "metrics.search_rank_lost_impression_share": round(random.uniform(0.01, 0.20), 4),
            "metrics.search_budget_lost_impression_share": round(random.uniform(0.00, 0.15), 4),
            "metrics.all_conversions":          round(conversions * random.uniform(1.0, 1.4), 2),
            "metrics.all_conversions_value":    round(conv_value * random.uniform(1.0, 1.3), 2),
            "metrics.view_through_conversions": random.randint(0, 10),
            "metrics.engagements":              random.randint(0, clicks),
            "metrics.interactions":             clicks,
            "metrics.interaction_rate":         round(ctr, 4),
        })

df_gads = pd.DataFrame(gads_daily)
df_gads.to_csv(f"{OUTPUT}/google_ads_daily.csv", index=False)
print(f"  ✓ Google Ads: {len(df_gads):,} daily campaign rows")


# ─────────────────────────────────────────────────────────────────────────────
# SOURCE E: META ADS (Marketing API — Ads Insights endpoint)
# Real pull: AdAccount(act_XXXXXXX).get_insights(fields=[
#   AdsInsights.Field.campaign_name, AdsInsights.Field.adset_name,
#   AdsInsights.Field.spend, AdsInsights.Field.impressions,
#   AdsInsights.Field.reach, AdsInsights.Field.clicks, AdsInsights.Field.cpm,
#   AdsInsights.Field.cpc, AdsInsights.Field.ctr, AdsInsights.Field.frequency,
#   AdsInsights.Field.actions, AdsInsights.Field.action_values,
#   AdsInsights.Field.purchase_roas], params={"date_preset":"last_2_years","level":"adset"})
# ─────────────────────────────────────────────────────────────────────────────
print("Generating Meta Ads data...")

META_OBJECTIVES  = ["OUTCOME_AWARENESS","OUTCOME_TRAFFIC","OUTCOME_ENGAGEMENT",
                    "OUTCOME_LEADS","OUTCOME_APP_PROMOTION","OUTCOME_SALES"]
META_OPT_GOALS   = ["LINK_CLICKS","IMPRESSIONS","REACH","LANDING_PAGE_VIEWS",
                    "LEAD_GENERATION","PURCHASE","ADD_TO_CART","OFFSITE_CONVERSIONS"]
META_PLACEMENTS  = ["facebook_feed","instagram_feed","instagram_stories","facebook_stories",
                    "audience_network_native","messenger_inbox","reels"]
META_AGE_GROUPS  = ["18-24","25-34","35-44","45-54","55-64","65+"]
META_GENDERS     = ["male","female","unknown"]

meta_campaigns = [
    {"campaign_id": str(random.randint(10**14, 10**15)),
     "campaign_name": f"[{obj.split('_')[1][:4]}] {random.choice(['Brand','Prospecting','Retargeting','LLA'])} - {random.choice(INDUSTRIES[:4])} - {random.randint(2023,2024)}",
     "objective": obj,
     "buying_type": "AUCTION"}
    for obj in random.choices(META_OBJECTIVES, k=12)
]

meta_daily = []
for day in date_range:
    for camp in meta_campaigns[:8]:
        for placement in random.sample(META_PLACEMENTS, k=random.randint(2,4)):
            for gender in random.sample(META_GENDERS[:2], k=random.randint(1,2)):
                age = random.choice(META_AGE_GROUPS)
                
                reach       = random.randint(500, 15000)
                freq        = round(random.uniform(1.0, 4.5), 2)
                impressions = int(reach * freq)
                cpm         = round(random.uniform(4.0, 22.0), 2)
                spend       = round(impressions / 1000 * cpm, 2)
                ctr         = round(random.uniform(0.005, 0.035), 4)
                clicks      = int(impressions * ctr)
                cpc         = round(spend / clicks, 2) if clicks > 0 else 0
                link_clicks = int(clicks * 0.7)
                
                # Conversion actions (Meta returns as array — flattened here)
                purchases    = round(link_clicks * random.uniform(0.005, 0.04), 2)
                purch_value  = round(purchases * random.uniform(80, 300), 2)
                add_to_cart  = round(link_clicks * random.uniform(0.02, 0.08), 2)
                leads        = round(link_clicks * random.uniform(0.01, 0.05), 2)
                
                meta_daily.append({
                    # Exact Meta Ads Insights API field names
                    "date_start":                   day.strftime("%Y-%m-%d"),
                    "date_stop":                    day.strftime("%Y-%m-%d"),
                    "account_id":                   "act_123456789012345",
                    "account_name":                 "YourBrand Media Account",
                    "campaign_id":                  camp["campaign_id"],
                    "campaign_name":                camp["campaign_name"],
                    "objective":                    camp["objective"],
                    "buying_type":                  camp["buying_type"],
                    "adset_id":                     str(random.randint(10**14, 10**15)),
                    "adset_name":                   f"{random.choice(['Interest','LAL','Retarget','Broad'])} - {age} - {placement.replace('_',' ').title()}",
                    "ad_id":                        str(random.randint(10**14, 10**15)),
                    "ad_name":                      f"Creative_{random.choice(['Video','Image','Carousel','Collection'])}_{random.randint(1,10):02d}",
                    "reach":                        reach,
                    "frequency":                    freq,
                    "impressions":                  impressions,
                    "spend":                        spend,
                    "cpm":                          cpm,
                    "cpp":                          round(spend / reach * 1000, 2) if reach > 0 else 0,
                    "clicks":                       clicks,
                    "unique_clicks":                int(clicks * 0.85),
                    "ctr":                          round(ctr * 100, 4),      # Meta returns CTR as percentage
                    "unique_ctr":                   round(ctr * 100 * 0.85, 4),
                    "cpc":                          cpc,
                    "cost_per_unique_click":        round(spend / int(clicks * 0.85), 2) if clicks > 0 else 0,
                    "inline_link_clicks":           link_clicks,
                    "inline_link_click_ctr":        round(link_clicks / impressions * 100, 4) if impressions > 0 else 0,
                    "actions.purchase":             purchases,
                    "actions.add_to_cart":          add_to_cart,
                    "actions.lead":                 leads,
                    "actions.landing_page_view":    int(link_clicks * 0.8),
                    "actions.post_engagement":      random.randint(0, 200),
                    "actions.page_engagement":      random.randint(0, 100),
                    "actions.video_view":           random.randint(0, 500) if "video" in camp["campaign_name"].lower() else 0,
                    "action_values.purchase":       purch_value,
                    "purchase_roas":                round(purch_value / spend, 4) if spend > 0 else 0,
                    "cost_per_action_type.purchase": round(spend / purchases, 2) if purchases > 0 else 0,
                    "cost_per_action_type.lead":    round(spend / leads, 2) if leads > 0 else 0,
                    "age":                          age,
                    "gender":                       gender,
                    "publisher_platform":           placement.split("_")[0],
                    "platform_position":            placement,
                    "impression_device":            random.choice(["mobile","desktop"]),
                })

df_meta = pd.DataFrame(meta_daily)
df_meta.to_csv(f"{OUTPUT}/meta_ads_daily.csv", index=False)
print(f"  ✓ Meta Ads: {len(df_meta):,} daily adset/placement rows")


# ─────────────────────────────────────────────────────────────────────────────
# SOURCE F: NETSUITE ERP (SuiteAnalytics / Saved Search Export)
# Real pull: SuiteAnalytics Connect ODBC:
#   SELECT t.ID, t.TranDate, t.TranID, t.Entity, t.Amount, t.NetAmount,
#          t.TaxAmount, t.ForeignAmount, tl.Account, tl.Department,
#          tl.Class, tl.Location, tl.Item, tl.Quantity, tl.Rate
#   FROM Transactions t JOIN TransactionLines tl ON t.ID = tl.Transaction
#   WHERE t.RecordType IN ('salesorder','cashsale','invoice')
#   AND t.TranDate BETWEEN '01/01/2023' AND '12/31/2024'
# ─────────────────────────────────────────────────────────────────────────────
print("Generating NetSuite ERP transaction data...")

NS_RECORD_TYPES  = ["Invoice","Cash Sale","Sales Order","Credit Memo"]
NS_DEPARTMENTS   = ["Sales - East","Sales - West","Sales - Mid","Online / DTC","Enterprise","SMB","Channel"]
NS_CLASSES       = ["New Business","Renewal","Upsell","Cross-sell","Professional Services"]
NS_LOCATIONS     = ["HQ - Miami","Remote - NY","Remote - CA","Remote - TX","Remote - IL"]
NS_SUBSIDIARIES  = ["YourBrand Inc (Parent)","YourBrand Canada","YourBrand EU"]
NS_PAYMENT_TERMS = ["Net 30","Net 45","Net 60","Due on Receipt","Net 15"]
NS_ITEMS = [
    ("SKU-001","Starter Plan - Monthly",     49.00),
    ("SKU-002","Professional Plan - Monthly",149.00),
    ("SKU-003","Enterprise Plan - Monthly",  499.00),
    ("SKU-004","Starter Plan - Annual",      470.00),
    ("SKU-005","Professional Plan - Annual", 1430.00),
    ("SKU-006","Enterprise Plan - Annual",   4790.00),
    ("SKU-007","Implementation Services",    2500.00),
    ("SKU-008","Training Package",           800.00),
    ("SKU-009","API Add-on",                 99.00),
    ("SKU-010","Data Export Add-on",         49.00),
]

# Build customer master (matches HubSpot contacts that became customers)
customer_ids   = [f"CUST-{i:05d}" for i in range(1, 2501)]
N_NS_TRANSACTIONS = 15000
ns_transactions = []

for i in range(N_NS_TRANSACTIONS):
    tran_date  = rand_date()
    rec_type   = random.choices(NS_RECORD_TYPES, weights=[45, 20, 25, 10])[0]
    cust_id    = random.choice(customer_ids)
    dept       = random.choice(NS_DEPARTMENTS)
    n_lines    = random.randint(1, 4)
    
    tran_id_prefix = {"Invoice":"INV","Cash Sale":"CASHSALE","Sales Order":"SO","Credit Memo":"CM"}[rec_type]
    tran_id    = f"{tran_id_prefix}-{random.randint(10000,99999)}"
    tran_ns_id = random.randint(1000000, 9999999)
    
    is_credit  = rec_type == "Credit Memo"
    sign       = -1 if is_credit else 1
    
    for line_num in range(1, n_lines + 1):
        item = random.choice(NS_ITEMS)
        qty  = random.randint(1, 10) if "Add-on" in item[1] or "Services" in item[1] else random.randint(1, 3)
        rate = item[2]
        amt  = round(sign * qty * rate, 2)
        tax  = round(abs(amt) * random.uniform(0, 0.085), 2) if rec_type != "Sales Order" else 0
        
        ns_transactions.append({
            # NetSuite SuiteAnalytics field names (as returned by ODBC connector)
            "ID":                   tran_ns_id,
            "TranDate":             tran_date.strftime("%m/%d/%Y"),  # NetSuite date format
            "TranID":               tran_id,
            "RecordType":           rec_type,
            "Entity":               cust_id,
            "EntityName":           f"{random.choice(LAST_NAMES)} {random.choice(['Inc','LLC','Corp'])}",
            "Status":               random.choice(["Open","Paid In Full","Pending Approval","Closed"]) if rec_type != "Cash Sale" else "Paid In Full",
            "PaymentTerms":         random.choice(NS_PAYMENT_TERMS),
            "DueDate":              (tran_date + timedelta(days=30)).strftime("%m/%d/%Y"),
            "PostingPeriod":        f"{tran_date.strftime('%b')} {tran_date.year}",
            "FiscalYear":           tran_date.year,
            "FiscalQuarter":        f"Q{(tran_date.month-1)//3+1} FY{tran_date.year}",
            "Department":           dept,
            "Class":                random.choice(NS_CLASSES),
            "Location":             random.choice(NS_LOCATIONS),
            "Subsidiary":           random.choice(NS_SUBSIDIARIES),
            "Currency":             "USD",
            "ExchangeRate":         1.0,
            "ForeignAmount":        amt,
            "Amount":               amt,
            "NetAmount":            round(amt * 0.72, 2),  # after COGS / margin
            "TaxAmount":            tax,
            "GrossAmount":          round(abs(amt) + tax, 2) * sign,
            "LineID":               line_num,
            "LineType":             "Item",
            "Item":                 item[0],
            "ItemName":             item[1],
            "ItemType":             "Service" if "Plan" in item[1] or "Service" in item[1] else "Non-inventory",
            "Quantity":             qty,
            "Rate":                 rate,
            "Memo":                 f"{'Renewal' if 'Annual' in item[1] else 'New'} - {dept}",
            "Account":              "4000 Sales Revenue" if not is_credit else "4001 Sales Returns",
            "AccountType":          "Income",
            "isClosed":             random.choice([True, False]),
            "isVoided":             False,
            "CreatedDate":          tran_date.strftime("%m/%d/%Y %H:%M"),
            "LastModifiedDate":     (tran_date + timedelta(days=random.randint(0,5))).strftime("%m/%d/%Y %H:%M"),
        })

df_ns = pd.DataFrame(ns_transactions)
df_ns.to_csv(f"{OUTPUT}/netsuite_transactions.csv", index=False)
print(f"  ✓ NetSuite ERP: {len(df_ns):,} transaction lines")


# ─────────────────────────────────────────────────────────────────────────────
# WRITE DATA DICTIONARY (README for GitHub)
# ─────────────────────────────────────────────────────────────────────────────
data_dict = {
    "project": "Marketing Analytics Portfolio — Platform-Accurate Synthetic Data",
    "author":  "Vincent Lepore",
    "sources": {
        "hubspot_contacts.csv": {
            "description": "HubSpot CRM Contacts object export",
            "real_endpoint": "GET /crm/v3/objects/contacts?properties=vid,email,firstname,lastname,lifecyclestage,hs_analytics_source,...",
            "rows": len(df_hs_contacts),
            "key_fields": ["vid","lifecyclestage","hs_analytics_source","hs_analytics_num_visits"]
        },
        "hubspot_deals.csv": {
            "description": "HubSpot CRM Deals object export",
            "real_endpoint": "GET /crm/v3/objects/deals?properties=hs_deal_id,dealstage,amount,closedate,...",
            "rows": len(df_hs_deals),
            "key_fields": ["hs_deal_id","dealstage","amount","days_to_close","hs_deal_is_closed_won"]
        },
        "salesforce_opportunities.csv": {
            "description": "Salesforce Opportunity object via SOQL",
            "real_endpoint": "SELECT Id,StageName,Amount,CloseDate,LeadSource,CampaignId FROM Opportunity",
            "rows": len(df_sf_opps),
            "key_fields": ["Id","StageName","Amount","IsWon","FiscalQuarter","LeadSource"]
        },
        "salesforce_campaigns.csv": {
            "description": "Salesforce Campaign object via SOQL",
            "real_endpoint": "SELECT Id,Name,Type,ActualCost,NumberOfLeads,AmountWonOpportunities FROM Campaign",
            "rows": len(df_sf_campaigns),
            "key_fields": ["Id","ActualCost","NumberOfWonOpportunities","AmountWonOpportunities"]
        },
        "ga4_events.csv": {
            "description": "Google Analytics 4 — BigQuery flat export schema",
            "real_endpoint": "SELECT * FROM `project.analytics_XXXXXX.events_*` WHERE event_name IN (...)",
            "rows": len(df_ga4),
            "key_fields": ["user_pseudo_id","event_name","traffic_source.source","traffic_source.medium","ecommerce.purchase_revenue_in_usd"]
        },
        "google_ads_daily.csv": {
            "description": "Google Ads Reporting API — campaign/adgroup daily metrics",
            "real_endpoint": "gaql: SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date BETWEEN ...",
            "rows": len(df_gads),
            "key_fields": ["segments.date","campaign.name","metrics.cost","metrics.conversions","metrics.roas"]
        },
        "meta_ads_daily.csv": {
            "description": "Meta Ads Marketing API — Ads Insights endpoint",
            "real_endpoint": "AdAccount.get_insights(fields=[spend, impressions, clicks, actions, purchase_roas], params={level: adset})",
            "rows": len(df_meta),
            "key_fields": ["date_start","campaign_name","spend","actions.purchase","purchase_roas","age","gender"]
        },
        "netsuite_transactions.csv": {
            "description": "NetSuite ERP — SuiteAnalytics ODBC transaction export",
            "real_endpoint": "ODBC: SELECT t.ID, t.TranDate, t.Amount, tl.Item, tl.Department FROM Transactions JOIN TransactionLines ON ...",
            "rows": len(df_ns),
            "key_fields": ["TranID","RecordType","Entity","Amount","Department","Class","PostingPeriod"]
        }
    }
}

with open(f"{OUTPUT}/../data_dictionary.json","w") as f:
    json.dump(data_dict, f, indent=2)

print("\n" + "="*60)
print("ALL PLATFORM DATA GENERATED")
print("="*60)
for name, info in data_dict["sources"].items():
    print(f"  {name:<40} {info['rows']:>8,} rows")
print(f"\n  Data dictionary → data/data_dictionary.json")
print(f"  Raw files       → data/raw/")
