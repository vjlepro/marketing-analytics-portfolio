"""
=============================================================================
Marketing Analytics Portfolio Project
04 — Marketing Mix Model (MMM)
=============================================================================

Inspired by Meta's Robyn open-source MMM framework.

Model components:
  1. Adstock Transformation    → Carry-over / lag effect of advertising
     - Geometric decay:  adstock_t = spend_t + decay * adstock_{t-1}
     - Weibull CDF:      delayed peak for TV / upper-funnel channels
  2. Saturation / Diminishing Returns
     - Hill transformation: y = x^alpha / (x^alpha + gamma^alpha)
     - Transforms raw spend into effective reach
  3. Regression Model
     - Decomposed revenue = base + Σ channel_contributions + seasonality + trend + error
     - Uses OLS (interpretable) + Ridge for robustness
  4. ROAS & Budget Optimizer    → Marginal ROAS curves per channel
  5. Budget Allocation Scenario → Optimized vs current spend mix

Data source: Google Ads + Meta Ads daily (aggregated to weekly)
  — mirrors exactly what you'd pull into a BigQuery MMM pipeline:
    SELECT DATE_TRUNC(date, WEEK) as week,
           SUM(IF(platform='google', cost, 0)) AS google_spend,
           SUM(IF(platform='meta',   spend, 0)) AS meta_spend,
           SUM(revenue) AS revenue
    FROM analytics_mart.weekly_channel_performance
    GROUP BY 1 ORDER BY 1

Author : Vincent Lepore
=============================================================================
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize, curve_fit
from scipy.special import expit
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_percentage_error
import warnings, os
warnings.filterwarnings('ignore')

RAW = "/home/user/workspace/marketing_models/data/raw"
OUT = "/home/user/workspace/marketing_models/data/processed"

print("Loading spend data for MMM...")

# ─── Aggregate spend to weekly (mirrors BigQuery aggregation) ─────────────────
df_gads = pd.read_csv(f"{RAW}/google_ads_daily.csv")
df_meta = pd.read_csv(f"{RAW}/meta_ads_daily.csv")

df_gads['date'] = pd.to_datetime(df_gads['segments.date'])
df_meta['date'] = pd.to_datetime(df_meta['date_start'])

# Map to channel groups for MMM (typically 5-8 channels)
def gads_channel(name):
    n = str(name)
    if 'Brand' in n:    return 'google_brand_search'
    if 'Generic' in n or 'Competitor' in n or 'Category' in n: return 'google_nonbrand_search'
    if 'Remarket' in n or 'Retarget' in n: return 'google_remarketing'
    return 'google_display_pmax'

def meta_channel(name):
    n = str(name)
    if 'Prospect' in n or 'Aware' in n: return 'meta_prospecting'
    if 'Retarget' in n or 'LAL' in n:   return 'meta_retargeting'
    return 'meta_other'

df_gads['mmm_channel'] = df_gads['campaign.name'].apply(gads_channel)
df_meta['mmm_channel'] = df_meta['campaign_name'].apply(meta_channel)

gads_weekly = df_gads.groupby([pd.Grouper(key='date', freq='W-MON'), 'mmm_channel'])['metrics.cost'].sum().reset_index()
gads_weekly.columns = ['week','channel','spend']

meta_weekly = df_meta.groupby([pd.Grouper(key='date', freq='W-MON'), 'mmm_channel'])['spend'].sum().reset_index()
meta_weekly.columns = ['week','channel','spend']

spend_long = pd.concat([gads_weekly, meta_weekly])
spend_wide = spend_long.pivot_table(index='week', columns='channel', values='spend', aggfunc='sum').fillna(0)
spend_wide = spend_wide.reset_index().sort_values('week')

# ─── Simulate revenue (in production: JOIN to ERP revenue by week) ────────────
# From NetSuite: SELECT PostingPeriod, SUM(Amount) FROM transactions GROUP BY week
np.random.seed(42)
n_weeks = len(spend_wide)
weeks   = np.arange(n_weeks)

# True underlying revenue function (what the MMM will try to recover)
trend_effect   = 75000 * (1 + 0.003 * weeks)           # ~15% YoY growth
seasonal_effect = 12000 * np.sin(2*np.pi*weeks/52 - 1)  # Annual seasonality
holiday_effect  = np.zeros(n_weeks)
for i, w in enumerate(spend_wide['week']):
    if hasattr(w, 'month'):
        if w.month == 11 and 22 <= w.day <= 30: holiday_effect[i] = 35000
        if w.month == 12: holiday_effect[i] = 25000

CHANNEL_COLS = [c for c in spend_wide.columns if c != 'week']

# True channel ROI parameters (model will estimate these)
TRUE_PARAMS = {
    'google_brand_search':   {'adstock': 0.25, 'alpha': 2.5, 'gamma': 0.4, 'beta': 3.8},
    'google_nonbrand_search':{'adstock': 0.35, 'alpha': 2.0, 'gamma': 0.5, 'beta': 2.9},
    'google_remarketing':    {'adstock': 0.40, 'alpha': 1.8, 'gamma': 0.45,'beta': 3.2},
    'google_display_pmax':   {'adstock': 0.55, 'alpha': 1.5, 'gamma': 0.6, 'beta': 1.8},
    'meta_prospecting':      {'adstock': 0.60, 'alpha': 1.4, 'gamma': 0.65,'beta': 1.6},
    'meta_retargeting':      {'adstock': 0.45, 'alpha': 2.0, 'gamma': 0.50,'beta': 2.7},
    'meta_other':            {'adstock': 0.50, 'alpha': 1.3, 'gamma': 0.60,'beta': 1.5},
}

revenue_components = {}
for ch in CHANNEL_COLS:
    if ch in TRUE_PARAMS:
        p = TRUE_PARAMS[ch]
        spend = spend_wide[ch].values
        # Apply adstock
        adstocked = np.zeros(n_weeks)
        adstocked[0] = spend[0]
        for t in range(1, n_weeks):
            adstocked[t] = spend[t] + p['adstock'] * adstocked[t-1]
        # Apply Hill saturation
        x_scaled = adstocked / adstocked.max() if adstocked.max() > 0 else adstocked
        saturated = x_scaled**p['alpha'] / (x_scaled**p['alpha'] + p['gamma']**p['alpha'])
        revenue_components[ch] = saturated * p['beta'] * adstocked.mean()

total_channel_contrib = sum(revenue_components.values())
noise = np.random.normal(0, 4500, n_weeks)
revenue = trend_effect + seasonal_effect + holiday_effect + total_channel_contrib + noise

spend_wide['revenue'] = revenue
spend_wide['week_num'] = np.arange(n_weeks)
spend_wide['sin_52']   = np.sin(2 * np.pi * spend_wide['week_num'] / 52)
spend_wide['cos_52']   = np.cos(2 * np.pi * spend_wide['week_num'] / 52)
spend_wide['trend']    = spend_wide['week_num']

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Adstock Transformation
# ─────────────────────────────────────────────────────────────────────────────
def apply_adstock(spend_series, decay_rate):
    """Geometric adstock: each week's spend carries over with exponential decay"""
    adstocked = np.zeros(len(spend_series))
    adstocked[0] = spend_series[0]
    for t in range(1, len(spend_series)):
        adstocked[t] = spend_series[t] + decay_rate * adstocked[t-1]
    return adstocked

def apply_hill_saturation(x, alpha=2.0, gamma=0.5):
    """
    Hill function: models diminishing returns
    alpha = shape (steepness), gamma = inflection point (as fraction of max)
    """
    x_scaled = x / x.max() if x.max() > 0 else x
    return x_scaled**alpha / (x_scaled**alpha + gamma**alpha)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Grid Search for Adstock & Saturation Parameters
# ─────────────────────────────────────────────────────────────────────────────
print("\nFitting adstock & saturation parameters...")

ADSTOCK_GRID    = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
ALPHA_GRID      = [1.0, 1.5, 2.0, 2.5, 3.0]
GAMMA_GRID      = [0.3, 0.4, 0.5, 0.6, 0.7]

best_params = {}

for ch in CHANNEL_COLS:
    spend = spend_wide[ch].values
    y     = spend_wide['revenue'].values
    
    best_r2 = -999
    best_p  = {'adstock': 0.4, 'alpha': 2.0, 'gamma': 0.5}
    
    for decay in ADSTOCK_GRID:
        adstocked = apply_adstock(spend, decay)
        for alpha in ALPHA_GRID:
            for gamma in GAMMA_GRID:
                saturated = apply_hill_saturation(adstocked, alpha, gamma)
                # Simple univariate R² as proxy for grid search
                if saturated.std() > 0:
                    corr = np.corrcoef(saturated, y)[0,1]
                    if corr > best_r2:
                        best_r2 = corr
                        best_p  = {'adstock': decay, 'alpha': alpha, 'gamma': gamma}
    
    best_params[ch] = best_p

print(f"  ✓ Parameters estimated for {len(best_params)} channels")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Build Feature Matrix & Fit Regression
# ─────────────────────────────────────────────────────────────────────────────
print("\nFitting MMM regression...")

feature_cols = []
feature_matrix = {}

for ch in CHANNEL_COLS:
    p = best_params[ch]
    spend = spend_wide[ch].values
    adstocked  = apply_adstock(spend, p['adstock'])
    saturated  = apply_hill_saturation(adstocked, p['alpha'], p['gamma'])
    col_name   = f"{ch}_transformed"
    feature_matrix[col_name] = saturated
    feature_cols.append(col_name)

# Add controls
feature_matrix['trend']  = spend_wide['trend'].values
feature_matrix['sin_52'] = spend_wide['sin_52'].values
feature_matrix['cos_52'] = spend_wide['cos_52'].values

X = pd.DataFrame(feature_matrix)
y = spend_wide['revenue'].values

# Fit OLS
reg_ols = LinearRegression(fit_intercept=True)
reg_ols.fit(X, y)
y_pred_ols = reg_ols.predict(X)
r2_ols  = r2_score(y, y_pred_ols)
mape_ols = mean_absolute_percentage_error(y, y_pred_ols)

# Fit Ridge for comparison
reg_ridge = Ridge(alpha=10.0, fit_intercept=True)
reg_ridge.fit(X, y)
y_pred_ridge = reg_ridge.predict(X)
r2_ridge  = r2_score(y, y_pred_ridge)

print(f"  OLS   R²: {r2_ols:.4f}  MAPE: {mape_ols:.2%}")
print(f"  Ridge R²: {r2_ridge:.4f}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Revenue Decomposition
# ─────────────────────────────────────────────────────────────────────────────
print("\nDecomposing revenue contributions...")

# Extract coefficients
intercept = reg_ols.intercept_
coef_dict  = dict(zip(X.columns, reg_ols.coef_))

# Revenue attributed to each component
contributions = {}
for ch in CHANNEL_COLS:
    col  = f"{ch}_transformed"
    coef = coef_dict.get(col, 0)
    contributions[ch] = np.maximum(0, coef * X[col].values)

base_revenue     = intercept + coef_dict['trend'] * X['trend'].values
seasonal_revenue = (coef_dict['sin_52'] * X['sin_52'].values +
                    coef_dict['cos_52'] * X['cos_52'].values)

total_channel_rev = sum(contributions.values())
total_base_rev    = base_revenue.sum()
total_sea_rev     = seasonal_revenue.sum()
total_rev         = y.sum()

print(f"\n  Revenue Decomposition:")
print(f"  {'Base / Organic':<28} ${total_base_rev:>12,.0f}  ({total_base_rev/total_rev:.1%})")
print(f"  {'Seasonality':<28} ${total_sea_rev:>12,.0f}  ({total_sea_rev/total_rev:.1%})")
for ch, contrib in sorted(contributions.items(), key=lambda x: -x[1].sum()):
    pct = contrib.sum() / total_rev
    print(f"  {ch:<28} ${contrib.sum():>12,.0f}  ({pct:.1%})")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — ROAS & Marginal ROAS Curves
# ─────────────────────────────────────────────────────────────────────────────
print("\nCalculating ROAS & marginal ROAS...")

mmm_results = []
spend_increments = np.linspace(0.5, 3.0, 50)  # 50% to 300% of current spend

for ch in CHANNEL_COLS:
    p     = best_params[ch]
    col   = f"{ch}_transformed"
    coef  = max(0, coef_dict.get(col, 0))
    
    actual_spend     = spend_wide[ch].sum()
    attributed_rev   = contributions[ch].sum()
    actual_roas      = attributed_rev / actual_spend if actual_spend > 0 else 0
    
    # Marginal ROAS curve: revenue gained from next $1 of spend
    mroas_curve = []
    current_spend = spend_wide[ch].mean()
    
    for mult in spend_increments:
        hyp_spend   = current_spend * mult
        ads_hyp     = apply_adstock(np.full(n_weeks, hyp_spend), p['adstock'])
        sat_hyp     = apply_hill_saturation(ads_hyp, p['alpha'], p['gamma'])
        rev_hyp     = coef * sat_hyp.mean() * n_weeks
        mroas_curve.append({
            'spend_multiplier': round(mult, 2),
            'weekly_spend':     round(hyp_spend, 2),
            'total_revenue':    round(rev_hyp, 2),
            'roas':             round(rev_hyp / (hyp_spend * n_weeks), 4) if hyp_spend > 0 else 0,
        })
    
    mmm_results.append({
        'channel':          ch,
        'actual_spend':     round(actual_spend, 2),
        'attributed_rev':   round(attributed_rev, 2),
        'actual_roas':      round(actual_roas, 4),
        'adstock_decay':    p['adstock'],
        'hill_alpha':       p['alpha'],
        'hill_gamma':       p['gamma'],
        'coefficient':      round(coef, 6),
        'pct_of_revenue':   round(attributed_rev / total_rev, 4),
        'marginal_roas_curve': mroas_curve,
    })

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Budget Optimizer (Gradient-based)
# ─────────────────────────────────────────────────────────────────────────────
print("\nRunning budget optimizer...")

def total_revenue_fn(budget_vector, params_list, coef_list, n_weeks):
    """Objective function: total attributed revenue for a given budget allocation"""
    total = 0
    for spend_weekly, p, coef in zip(budget_vector, params_list, coef_list):
        ads = apply_adstock(np.full(n_weeks, spend_weekly), p['adstock'])
        sat = apply_hill_saturation(ads, p['alpha'], p['gamma'])
        total += coef * sat.mean() * n_weeks
    return -total  # minimize negative = maximize

params_list = [best_params[ch] for ch in CHANNEL_COLS]
coef_list   = [max(0, coef_dict.get(f"{ch}_transformed", 0)) for ch in CHANNEL_COLS]
current_avg = [spend_wide[ch].mean() for ch in CHANNEL_COLS]
total_budget = sum(current_avg)

# Constraints: total spend = current total, each channel >= 10% of current
constraints = [{'type': 'eq', 'fun': lambda x: sum(x) - total_budget}]
bounds = [(max(1, 0.1 * c), 5 * c) for c in current_avg]
x0 = np.array(current_avg)

result = minimize(
    total_revenue_fn, x0,
    args=(params_list, coef_list, n_weeks),
    method='SLSQP',
    bounds=bounds,
    constraints=constraints,
    options={'maxiter': 200}
)

optimized_budget = result.x
current_rev  = -total_revenue_fn(current_avg,   params_list, coef_list, n_weeks)
optimized_rev = -total_revenue_fn(optimized_budget, params_list, coef_list, n_weeks)
revenue_lift = (optimized_rev - current_rev) / current_rev

print(f"  Current attributed revenue:   ${current_rev:,.0f}")
print(f"  Optimized attributed revenue: ${optimized_rev:,.0f}")
print(f"  Revenue lift from reallocation: {revenue_lift:.1%}")

budget_comparison = pd.DataFrame({
    'channel':         CHANNEL_COLS,
    'current_spend_wk':   np.round(current_avg, 2),
    'optimized_spend_wk': np.round(optimized_budget, 2),
    'change_pct':      np.round((optimized_budget - current_avg) / np.array(current_avg) * 100, 1),
})

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Save all outputs
# ─────────────────────────────────────────────────────────────────────────────
df_mmm_results  = pd.DataFrame([{k: v for k, v in r.items() if k != 'marginal_roas_curve'} for r in mmm_results])
df_mmm_results.to_csv(f"{OUT}/mmm_channel_results.csv", index=False)

# Weekly decomposition time series
decomp_weekly = spend_wide[['week','revenue']].copy()
decomp_weekly['y_pred']    = y_pred_ols
decomp_weekly['base']      = base_revenue
decomp_weekly['seasonal']  = seasonal_revenue
for ch in CHANNEL_COLS:
    decomp_weekly[f'contrib_{ch}'] = contributions[ch]
decomp_weekly.to_csv(f"{OUT}/mmm_weekly_decomp.csv", index=False)

budget_comparison.to_csv(f"{OUT}/mmm_budget_optimizer.csv", index=False)

# Marginal ROAS curves (for dashboard charting)
mroas_rows = []
for r in mmm_results:
    for point in r['marginal_roas_curve']:
        mroas_rows.append({'channel': r['channel'], **point})
pd.DataFrame(mroas_rows).to_csv(f"{OUT}/mmm_mroas_curves.csv", index=False)

# Model fit metrics
model_fit = {
    'r2_ols': round(r2_ols, 4),
    'r2_ridge': round(r2_ridge, 4),
    'mape': round(mape_ols, 4),
    'total_weeks': n_weeks,
    'total_revenue_modeled': round(total_rev, 2),
    'base_revenue_pct': round(total_base_rev / total_rev, 4),
    'paid_media_pct': round(sum(c.sum() for c in contributions.values()) / total_rev, 4),
    'budget_lift_potential': round(revenue_lift, 4),
}
import json
with open(f"{OUT}/mmm_model_fit.json", 'w') as f:
    json.dump(model_fit, f, indent=2)

print(f"\n✅ MMM Complete — R²: {r2_ols:.4f} | MAPE: {mape_ols:.2%}")
print(f"\n{'='*60}")
print(f"{'Channel':<30} {'ROAS':>8} {'% Rev':>8} {'Optimal Δ':>10}")
print(f"{'-'*60}")
for _, r in df_mmm_results.sort_values('actual_roas', ascending=False).iterrows():
    ch = r['channel']
    opt_row = budget_comparison[budget_comparison['channel'] == ch]
    delta = opt_row['change_pct'].values[0] if not opt_row.empty else 0
    print(f"  {ch:<28} {r['actual_roas']:>7.2f}x {r['pct_of_revenue']:>7.1%} {delta:>+8.0f}%")
print(f"{'='*60}")
