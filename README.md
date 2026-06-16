# 📊 Marketing Analytics Portfolio

> **End-to-end marketing science project** — synthetic data mirroring real platform APIs, three production-grade models (MTA · CAC · MMM), and an interactive analytics dashboard.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Jupyter](https://img.shields.io/badge/Jupyter-Notebooks-F37626?style=flat-square&logo=jupyter&logoColor=white)](https://jupyter.org/)
[![React](https://img.shields.io/badge/React-Dashboard-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Open Issues](https://img.shields.io/github/issues/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio?style=flat-square)](https://github.com/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/issues)

---

## 🌐 Live Dashboard

**[→ View Interactive Dashboard](https://www.perplexity.ai/computer/a/marketiq-marketing-analytics-p-yH_sDaC_TUKyNvIlEi3IFw)**

Dark-navy analytics interface with 5 interactive pages — Overview, MTA Attribution, CAC & LTV, MMM Budget Optimizer, and Data Sources.

> **Hosting note:** The dashboard is deployed as a static React app. See [Deployment](#-deployment) for instructions to host your own copy for free on Vercel or Netlify.

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Data Sources](#-data-sources)
- [Models](#-models)
  - [Multi-Touch Attribution (MTA)](#1-multi-touch-attribution-mta)
  - [Customer Acquisition Cost (CAC)](#2-customer-acquisition-cost--ltv)
  - [Marketing Mix Model (MMM)](#3-marketing-mix-model-mmm)
- [Dashboard](#-dashboard)
- [Notebooks](#-jupyter-notebooks)
- [Results Summary](#-results-summary)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Skills Demonstrated](#-skills-demonstrated)

---

## 🎯 Project Overview

This portfolio project demonstrates a complete marketing analytics workflow — from raw platform data ingestion through attribution modeling, acquisition cost analysis, and media mix optimization — all using synthetic data that exactly mirrors the field schemas returned by real marketing APIs.

| Dimension | Detail |
|---|---|
| **Data volume** | 141,417 rows across 8 datasets |
| **Time range** | 24 months (Jan 2023 – Dec 2024) |
| **Channels modeled** | 6 (Paid Search Brand/Nonbrand, Google Remarketing, Meta Prospecting, Organic, Direct) |
| **Conversions tracked** | 3,944 |
| **Total modeled revenue** | $55.0M |
| **MMM model fit** | R² = 0.9449, MAPE = 2.03% |

---

## 🏗️ Architecture

```
marketing-analytics-portfolio/
│
├── 📂 data/
│   ├── raw/                        ← Synthetic platform data (API-accurate schemas)
│   │   ├── hubspot_contacts.csv         12,000 rows  · HubSpot CRM API v3
│   │   ├── hubspot_deals.csv            4,971 rows   · HubSpot Deals API
│   │   ├── salesforce_opportunities.csv 3,500 rows   · Salesforce SOQL fields
│   │   ├── salesforce_campaigns.csv     40 rows      · Salesforce Campaign object
│   │   ├── ga4_events.csv               53,944 rows  · GA4 BigQuery flat export
│   │   ├── google_ads_daily.csv         7,310 rows   · Google Ads Reporting API (GAQL)
│   │   ├── meta_ads_daily.csv           26,247 rows  · Meta Marketing API Ads Insights
│   │   └── netsuite_transactions.csv    37,405 rows  · NetSuite SuiteAnalytics ODBC
│   ├── processed/                  ← Model outputs (CSV + JSON)
│   └── data_dictionary.json        ← Schema docs with real API endpoints
│
├── 📂 notebooks/                   ← Jupyter notebooks (render natively on GitHub)
│   ├── 01_data_generation.ipynb
│   ├── 02_mta_model.ipynb
│   ├── 03_cac_model.ipynb
│   └── 04_mmm_model.ipynb
│
├── 📂 dashboard/                   ← React + Recharts analytics dashboard
│   ├── client/src/
│   │   ├── pages/                  ← Overview, MTA, CAC, MMM, DataSources
│   │   ├── components/             ← Reusable chart components
│   │   └── data/                   ← JSON data files (mta, cac, mmm)
│   └── package.json
│
├── 01_generate_platform_data.py    ← Data generation script
├── 02_mta_model.py                 ← MTA model script
├── 03_cac_model.py                 ← CAC / LTV model script
├── 04_mmm_model.py                 ← MMM model script
└── README.md
```

---

## 📡 Data Sources

All datasets use **exact field names** from real platform APIs — so the same ETL code works on live data with minimal changes.

| Platform | Object | Key Fields | Rows |
|---|---|---|---|
| **HubSpot CRM** | Contacts | `hs_object_id`, `lifecyclestage`, `hs_analytics_source`, `num_associated_deals` | 12,000 |
| **HubSpot CRM** | Deals | `hs_deal_id`, `dealstage`, `amount`, `hs_analytics_source` | 4,971 |
| **Salesforce** | Opportunities | `Id`, `StageName`, `Amount`, `LeadSource`, `CloseDate` | 3,500 |
| **Salesforce** | Campaigns | `Id`, `Name`, `Type`, `Status`, `ActualCost`, `NumberOfOpportunities` | 40 |
| **Google Analytics 4** | Events | `user_pseudo_id`, `event_name`, `traffic_source.medium`, `ecommerce.purchase_revenue` | 53,944 |
| **Google Ads** | Daily Performance | `metrics.cost_micros`, `metrics.conversions`, `metrics.clicks`, `campaign.advertising_channel_type` | 7,310 |
| **Meta Ads** | Ads Insights | `spend`, `actions.purchase`, `action_values.purchase`, `impressions`, `reach` | 26,247 |
| **NetSuite ERP** | Transactions | `TranDate` (MM/DD/YYYY), `TranType`, `NetAmount`, `Entity`, `Department` | 37,405 |

> See [`data/data_dictionary.json`](data/data_dictionary.json) for full schemas with real API endpoint URLs.

---

## 🤖 Models

### 1. Multi-Touch Attribution (MTA)

**File:** [`notebooks/02_mta_model.ipynb`](notebooks/02_mta_model.ipynb)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/02_mta_model.ipynb)

Implements **7 attribution models** side-by-side to show how model choice dramatically impacts channel credit:

| Model | Logic | Best For |
|---|---|---|
| First Touch | 100% credit to first channel | Awareness measurement |
| Last Touch | 100% credit to last channel | Direct response |
| Linear | Equal credit across all touches | Baseline comparison |
| Time Decay | Exponential weight toward conversion | Short-cycle sales |
| U-Shape | 40% first + 40% last + 20% middle | Lead gen / B2B |
| **Markov Chain** | Removal-effect transition probability | Path dependency |
| **Shapley Value** | Monte Carlo game theory (500 permutations) | True marginal contribution |

**Key outputs:**
- Attribution by channel for all 7 models (`data/processed/mta_results.csv`)
- Top 50 converting journey paths (`data/processed/mta_top_paths.csv`)
- Side-by-side model comparison charts

```python
# Core Shapley computation (Monte Carlo, 500 permutations)
def shapley_monte_carlo(channel, all_channels, conversion_func, n_perms=500):
    marginal_contributions = []
    for _ in range(n_perms):
        perm = random.sample(all_channels, len(all_channels))
        idx = perm.index(channel)
        with_channel = conversion_func(set(perm[:idx+1]))
        without_channel = conversion_func(set(perm[:idx]))
        marginal_contributions.append(with_channel - without_channel)
    return np.mean(marginal_contributions)
```

---

### 2. Customer Acquisition Cost & LTV

**File:** [`notebooks/03_cac_model.ipynb`](notebooks/03_cac_model.ipynb)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/03_cac_model.ipynb)

Full CAC/LTV framework including channel health classification, cohort retention curves, and payback period analysis.

**Channel health matrix:**

| Channel | CAC | LTV | LTV:CAC | Payback | Status |
|---|---|---|---|---|---|
| Brand Search | $35 | $112 | 3.2x | 4 mo | ✅ Healthy |
| Google Remarketing | $28 | $98 | 3.5x | 3 mo | ✅ Healthy |
| Organic | $12 | $145 | 12.1x | 1 mo | ✅ Healthy |
| Nonbrand Search | $67 | $108 | 1.6x | 8 mo | ⚠️ Monitor |
| Meta Prospecting | $41 | $78 | 1.9x | 7 mo | ⚠️ At Risk |
| Direct | $18 | $134 | 7.4x | 2 mo | ✅ Healthy |

**Key outputs:**
- Channel-level CAC, LTV, payback periods (`data/processed/cac_by_channel.csv`)
- Monthly blended CAC trend (`data/processed/cac_blended_monthly.csv`)
- 12-month cohort retention curves (`data/processed/cohort_retention.csv`)

---

### 3. Marketing Mix Model (MMM)

**File:** [`notebooks/04_mmm_model.ipynb`](notebooks/04_mmm_model.ipynb)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/04_mmm_model.ipynb)

Robyn-inspired MMM with geometric adstock decay, Hill saturation curves, OLS regression, and SLSQP budget optimization.

**Model fit:** R² = **0.9449** · MAPE = **2.03%**

**Channel ROAS results:**

| Channel | ROAS | Adstock α | Hill K | Revenue Share |
|---|---|---|---|---|
| Google Remarketing | 6.90x | 0.3 | 2.1 | 28% |
| Brand Search | 4.12x | 0.2 | 1.8 | 22% |
| Organic (baseline) | — | — | — | 18% |
| Nonbrand Search | 2.87x | 0.4 | 1.5 | 16% |
| Direct (baseline) | — | — | — | 10% |
| Meta Prospecting | 0.00x | 0.6 | 0.9 | 6% |

**Budget optimizer (SLSQP):** Reallocation of the $16.6M budget toward higher-ROAS channels yields projected +12–15% revenue improvement.

```python
# Adstock transformation (geometric decay)
def apply_adstock(spend_series, alpha):
    adstocked = np.zeros(len(spend_series))
    adstocked[0] = spend_series[0]
    for t in range(1, len(spend_series)):
        adstocked[t] = spend_series[t] + alpha * adstocked[t-1]
    return adstocked

# Hill saturation curve
def hill_transform(x, k, n=2):
    return x**n / (k**n + x**n)
```

---

## 📊 Dashboard

**Tech stack:** React · Recharts · Tailwind CSS · Vite

**5 interactive pages:**
1. **Overview** — KPI cards, revenue decomposition waterfall, channel performance matrix
2. **MTA Attribution** — Side-by-side model comparison, Sankey-style path analysis
3. **CAC & LTV** — Channel health matrix, cohort retention heatmap, payback curves
4. **MMM Optimizer** — Adstock/saturation visualizations, budget reallocation waterfall
5. **Data Sources** — Platform connection guide with real API field references

**Live URL:** [marketiq-marketing-analytics](https://www.perplexity.ai/computer/a/marketiq-marketing-analytics-p-yH_sDaC_TUKyNvIlEi3IFw)

> To self-host: see [Deployment](#-deployment) below.

---

## 📓 Jupyter Notebooks

All four notebooks render natively inside GitHub. Click any notebook file to view it directly — no additional software needed.

| Notebook | Description | Colab |
|---|---|---|
| [`01_data_generation.ipynb`](notebooks/01_data_generation.ipynb) | Platform data synthesis with real API schemas | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/01_data_generation.ipynb) |
| [`02_mta_model.ipynb`](notebooks/02_mta_model.ipynb) | All 7 MTA models with visual comparison | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/02_mta_model.ipynb) |
| [`03_cac_model.ipynb`](notebooks/03_cac_model.ipynb) | CAC, LTV, cohort retention, payback periods | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/03_cac_model.ipynb) |
| [`04_mmm_model.ipynb`](notebooks/04_mmm_model.ipynb) | Adstock + Hill saturation + budget optimizer | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio/blob/main/notebooks/04_mmm_model.ipynb) |

> **One-click execution:** Click any Colab badge → File → Save a copy in Drive → Run All.  
> All dependencies are installed in the first cell of each notebook.

---

## 📈 Results Summary

### MMM: Revenue Decomposition

```
Total Revenue ($55.0M)
├── Baseline / Organic    $9.9M   (18%)
├── Brand Search         $12.1M   (22%)
├── Google Remarketing   $15.4M   (28%)
├── Nonbrand Search       $8.8M   (16%)
├── Meta Prospecting      $3.3M    (6%)
└── Direct / Other        $5.5M   (10%)
```

### MTA: Shapley vs Last-Touch Delta

| Channel | Last Touch | Shapley | Delta |
|---|---|---|---|
| Brand Search | 38% | 24% | −14pp (over-credited) |
| Google Remarketing | 12% | 31% | +19pp (under-credited) |
| Organic | 28% | 22% | −6pp |
| Meta Prospecting | 4% | 11% | +7pp |

> Shapley reveals that Google Remarketing is significantly under-credited by last-touch — a common finding that justifies mid-funnel investment.

---

## 🚀 Getting Started

### Prerequisites

```bash
Python 3.10+
Node.js 18+  (for dashboard only)
```

### Clone & install

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/marketing-analytics-portfolio.git
cd marketing-analytics-portfolio

# Python dependencies
pip install pandas numpy scikit-learn scipy matplotlib seaborn nbformat

# Dashboard dependencies (optional)
cd dashboard && npm install
```

### Run the pipeline

```bash
# 1. Generate synthetic data
python 01_generate_platform_data.py

# 2. Run MTA model
python 02_mta_model.py

# 3. Run CAC/LTV model
python 03_cac_model.py

# 4. Run MMM model
python 04_mmm_model.py

# 5. Launch dashboard (dev mode)
cd dashboard && npm run dev
```

### Or open in Colab

Click any badge above — everything runs in your browser, no local install needed.

---

## ☁️ Deployment

### Recommended: Vercel (free, permanent)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
3. Set **Root Directory** to `dashboard`
4. Set **Build Command** to `npm run build` and **Output Directory** to `dist`
5. Click **Deploy** — you'll get a permanent `your-project.vercel.app` URL

Vercel auto-redeploys on every `git push`. The free tier has no expiry date.

### Alternative: Netlify

Same process — drag-and-drop the `dashboard/dist` folder at [netlify.com/drop](https://netlify.com/drop) for an instant deploy.

### GitHub Pages (static only)

Works for the notebooks (rendered natively). The interactive React dashboard requires Vercel or Netlify since it's a full React app.

---

## 🛠️ Skills Demonstrated

| Domain | Technologies |
|---|---|
| **Marketing Science** | Multi-Touch Attribution, Marketing Mix Modeling, CAC/LTV, Cohort Analysis |
| **Attribution Methods** | Shapley Value (Monte Carlo), Markov Chain, First/Last/Linear/Time Decay/U-Shape |
| **MMM Techniques** | Geometric Adstock, Hill Saturation, OLS Regression, SLSQP Budget Optimization |
| **Data Engineering** | HubSpot API, Salesforce SOQL, GA4 BigQuery Export, Google Ads GAQL, Meta Ads Insights, NetSuite SuiteAnalytics |
| **Python** | pandas, numpy, scikit-learn, scipy, matplotlib, seaborn, nbformat |
| **Frontend** | React, Recharts, Tailwind CSS, Vite |
| **Notebooks** | Jupyter, Google Colab |
| **Deployment** | Vercel, GitHub Pages |

---

## 👤 Author

**Vincent Lepore**  
Data & Analytics Leader · 15+ years in marketing science, attribution, and revenue modeling

- 🔗 [LinkedIn](https://linkedin.com/in/YOUR_LINKEDIN)
- 💼 [GitHub](https://github.com/YOUR_GITHUB_USERNAME)
- 📍 Margate, FL

> *Built to showcase production-quality marketing analytics workflows for data science & analytics leadership roles.*

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with Python · React · Recharts · Tailwind · Jupyter</sub>
</p>
