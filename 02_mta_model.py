"""
=============================================================================
Marketing Analytics Portfolio Project
02 — Multi-Touch Attribution (MTA) Model
=============================================================================

Methods implemented:
  1. Rule-Based Baselines  → First Touch, Last Touch, Linear, Time Decay, U-Shape
  2. Markov Chain MTA      → Transition probability matrix + removal effect
  3. Shapley Value MTA     → Cooperative game theory credit allocation
     (industry gold standard, used by Rockerbox, Northbeam, Triple Whale)

Data source: GA4 BigQuery export (ga4_events.csv)
  — session_source / session_medium / session_campaign map to touchpoints
  — purchase events mark conversion + value

In production this would query:
  BigQuery: SELECT user_pseudo_id, event_name, traffic_source.source,
                   traffic_source.medium, ecommerce.purchase_revenue_in_usd,
                   event_timestamp
            FROM `project.analytics_XXXXX.events_*`
            ORDER BY user_pseudo_id, event_timestamp

Author : Vincent Lepore
=============================================================================
"""

import numpy as np
import pandas as pd
from itertools import combinations
import math
from collections import defaultdict
import json, os, warnings
warnings.filterwarnings('ignore')

RAW  = "/home/user/workspace/marketing_models/data/raw"
OUT  = "/home/user/workspace/marketing_models/data/processed"
os.makedirs(OUT, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Load & prep GA4 data (mirrors real BigQuery pull)
# ─────────────────────────────────────────────────────────────────────────────
print("Loading GA4 event data...")
df_ga4 = pd.read_csv(f"{RAW}/ga4_events.csv")

# Parse sessions: one row per user_pseudo_id × session
sessions = df_ga4.groupby(['user_pseudo_id','ep.session_id']).agg(
    source   = ('traffic_source.source',  'first'),
    medium   = ('traffic_source.medium',  'first'),
    campaign = ('traffic_source.name',    'first'),
    ts       = ('event_timestamp',        'min'),
    converted= ('event_name', lambda x: 'purchase' in x.values),
    revenue  = ('ecommerce.purchase_revenue_in_usd', 'max'),
).reset_index()

sessions['channel'] = sessions['source'].str.lower().map({
    'google':    'Paid Search',
    'meta':      'Paid Social',
    'linkedin':  'Paid Social',
    'bing':      'Paid Search',
    'email':     'Email',
    'organic':   'Organic Search',
    'direct':    'Direct',
    'affiliate': 'Affiliate',
}).fillna('Other')

sessions['revenue'] = sessions['revenue'].fillna(0)

# Build journeys: all sessions per user ordered by timestamp
journeys = sessions.sort_values('ts').groupby('user_pseudo_id').agg(
    channels  = ('channel', list),
    converted = ('converted', 'any'),
    revenue   = ('revenue', 'max'),
).reset_index()

converted_journeys = journeys[journeys['converted']].copy()
total_conversions  = len(converted_journeys)
total_revenue      = converted_journeys['revenue'].sum()

print(f"  Sessions: {len(sessions):,} | Journeys: {len(journeys):,} | Conversions: {total_conversions:,}")
print(f"  Total attributed revenue: ${total_revenue:,.2f}")

CHANNELS = sessions['channel'].unique().tolist()

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Rule-Based Attribution Baselines
# ─────────────────────────────────────────────────────────────────────────────
print("\nComputing rule-based attribution models...")

def rule_based_attribution(journeys_df, method='linear'):
    credits = defaultdict(float)
    rev_credits = defaultdict(float)

    for _, row in journeys_df.iterrows():
        if not row['converted']:
            continue
        path = row['channels']
        n    = len(path)
        rev  = row['revenue']

        if method == 'first_touch':
            weights = [1.0] + [0.0] * (n - 1)
        elif method == 'last_touch':
            weights = [0.0] * (n - 1) + [1.0]
        elif method == 'linear':
            weights = [1.0 / n] * n
        elif method == 'time_decay':
            # Exponential decay: last touch gets most credit
            raw = [0.5 ** (n - i - 1) for i in range(n)]
            total = sum(raw)
            weights = [r / total for r in raw]
        elif method == 'u_shape':
            # 40% first, 40% last, 20% split among middle
            if n == 1:
                weights = [1.0]
            elif n == 2:
                weights = [0.5, 0.5]
            else:
                mid_weight = 0.20 / (n - 2) if n > 2 else 0
                weights = [0.40] + [mid_weight] * (n - 2) + [0.40]
        else:
            weights = [1.0 / n] * n

        for ch, w in zip(path, weights):
            credits[ch]     += w
            rev_credits[ch] += w * rev

    return credits, rev_credits

rule_methods = ['first_touch', 'last_touch', 'linear', 'time_decay', 'u_shape']
rule_results = {}

for method in rule_methods:
    credits, rev_credits = rule_based_attribution(journeys, method)
    rule_results[method] = {
        'conversions': dict(credits),
        'revenue':     dict(rev_credits),
    }
    print(f"  ✓ {method.replace('_',' ').title()}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Markov Chain Attribution
# ─────────────────────────────────────────────────────────────────────────────
print("\nBuilding Markov Chain attribution model...")

def build_markov_chain(journeys_df):
    """
    Build a transition probability matrix from all journeys.
    States: each channel + 'Start' + 'Conversion' + 'Null'
    Removal effect: for each channel, calculate how conversion rate
    drops when that channel is removed → proportional credit.
    """
    # Count transitions
    transitions = defaultdict(lambda: defaultdict(int))
    
    for _, row in journeys_df.iterrows():
        path = ['Start'] + row['channels']
        end  = 'Conversion' if row['converted'] else 'Null'
        path.append(end)
        
        for i in range(len(path) - 1):
            transitions[path[i]][path[i+1]] += 1
    
    # Build transition probability matrix
    states = list(set(
        list(transitions.keys()) +
        [k for v in transitions.values() for k in v.keys()]
    ))
    
    trans_prob = {}
    for state, nexts in transitions.items():
        total = sum(nexts.values())
        trans_prob[state] = {s: count/total for s, count in nexts.items()}
    
    def compute_conversion_rate(trans, blocked=None):
        """Monte Carlo simulation of conversion rate"""
        n_sim = 5000
        conversions = 0
        for _ in range(n_sim):
            state = 'Start'
            for _ in range(20):  # max path length
                if state in ('Conversion', 'Null'):
                    break
                if state == blocked:
                    state = 'Null'
                    break
                probs = trans.get(state, {'Null': 1.0})
                next_states = list(probs.keys())
                next_probs  = list(probs.values())
                state = np.random.choice(next_states, p=next_probs)
            if state == 'Conversion':
                conversions += 1
        return conversions / n_sim
    
    # Baseline conversion rate
    baseline_cr = compute_conversion_rate(trans_prob)
    
    # Removal effect per channel
    channel_states = [s for s in states if s not in ('Start','Conversion','Null')]
    removal_effects = {}
    
    for ch in channel_states:
        cr_without = compute_conversion_rate(trans_prob, blocked=ch)
        removal_effects[ch] = max(0, baseline_cr - cr_without)
    
    # Normalize to get attribution weights
    total_effect = sum(removal_effects.values())
    if total_effect == 0:
        weights = {ch: 1/len(channel_states) for ch in channel_states}
    else:
        weights = {ch: v/total_effect for ch, v in removal_effects.items()}
    
    return weights, removal_effects, baseline_cr

markov_weights, removal_effects, baseline_cr = build_markov_chain(journeys)

# Apply weights to revenue
markov_conv = {ch: w * total_conversions for ch, w in markov_weights.items()}
markov_rev  = {ch: w * total_revenue     for ch, w in markov_weights.items()}

print(f"  ✓ Markov Chain | Baseline CVR: {baseline_cr:.3f}")
for ch, effect in sorted(removal_effects.items(), key=lambda x: -x[1]):
    print(f"     {ch:<20} removal effect: {effect:.4f} | attribution: {markov_weights.get(ch,0):.3f}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Shapley Value Attribution
# ─────────────────────────────────────────────────────────────────────────────
print("\nBuilding Shapley Value attribution model...")

def shapley_attribution(journeys_df, channels):
    """
    Shapley value: the marginal contribution of each channel
    averaged across all possible orderings (coalitions).
    
    v(S) = conversion rate of journeys that CONTAIN at least one touch from
           each channel in S (presence-based characteristic function).
    
    Uses Monte Carlo permutation sampling for tractability.
    """
    channels = [c for c in channels if c in 
                set(ch for path in journeys_df['channels'] for ch in path)]
    n = len(channels)
    
    journey_sets = []
    for _, row in journeys_df.iterrows():
        ch_set = frozenset(row['channels'])
        journey_sets.append((ch_set, int(row['converted']), float(row['revenue'])))
    
    # Pre-build a lookup: for each frozenset-key, store (n_journeys, n_converted, total_rev)
    coalition_cache = {}
    
    def value_function(subset):
        """Conversion rate for journeys that include ALL channels in subset"""
        key = frozenset(subset)
        if key in coalition_cache:
            return coalition_cache[key]
        if not key:
            # Empty coalition: use global conversion rate
            rate = sum(cv for _, cv, _ in journey_sets) / max(len(journey_sets), 1)
            coalition_cache[key] = rate
            return rate
        relevant = [cv for cs, cv, rv in journey_sets if key.issubset(cs)]
        rate = sum(relevant) / len(relevant) if relevant else 0.0
        coalition_cache[key] = rate
        return rate
    
    # Monte Carlo Shapley: sample N_PERM random permutations
    N_PERM = 500
    shapley_values = defaultdict(float)
    
    rng = np.random.default_rng(42)
    for _ in range(N_PERM):
        perm = rng.permutation(n)
        coalition = []
        v_prev = value_function([])
        for idx in perm:
            ch = channels[idx]
            coalition.append(ch)
            v_new = value_function(coalition)
            shapley_values[ch] += (v_new - v_prev)
            v_prev = v_new
    
    # Average over permutations
    for ch in channels:
        shapley_values[ch] /= N_PERM
    
    # Normalize to positive weights
    min_sv = min(shapley_values.values())
    shifted = {ch: v - min_sv for ch, v in shapley_values.items()}
    total   = sum(shifted.values())
    if total > 0:
        norm_shapley = {ch: v / total for ch, v in shifted.items()}
    else:
        norm_shapley = {ch: 1/n for ch in channels}
    
    return norm_shapley, dict(shapley_values)

# Use a sample for Shapley (computational cost scales with 2^n)
sample_journeys = journeys.sample(min(3000, len(journeys)), random_state=42)
shapley_norm, shapley_raw = shapley_attribution(sample_journeys, CHANNELS)

shapley_conv = {ch: w * total_conversions for ch, w in shapley_norm.items()}
shapley_rev  = {ch: w * total_revenue     for ch, w in shapley_norm.items()}

print(f"  ✓ Shapley Values computed across {len(CHANNELS)} channels")
for ch, sv in sorted(shapley_raw.items(), key=lambda x: -x[1]):
    print(f"     {ch:<20} raw Shapley: {sv:.4f} | normalized: {shapley_norm.get(ch,0):.3f}")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Compile Results & Save
# ─────────────────────────────────────────────────────────────────────────────
print("\nCompiling MTA results...")

all_channels = sorted(list(set(
    list(markov_rev.keys()) + list(shapley_rev.keys()) +
    [ch for m in rule_results.values() for ch in m['revenue'].keys()]
)))

mta_summary = []
for ch in all_channels:
    row = {'channel': ch}
    # Rule-based
    for method in rule_methods:
        row[f'{method}_conversions'] = round(rule_results[method]['conversions'].get(ch, 0), 2)
        row[f'{method}_revenue']     = round(rule_results[method]['revenue'].get(ch, 0), 2)
    # Markov
    row['markov_conversions'] = round(markov_conv.get(ch, 0), 2)
    row['markov_revenue']     = round(markov_rev.get(ch, 0), 2)
    row['markov_weight']      = round(markov_weights.get(ch, 0), 4)
    row['markov_removal_effect'] = round(removal_effects.get(ch, 0), 4)
    # Shapley
    row['shapley_conversions'] = round(shapley_conv.get(ch, 0), 2)
    row['shapley_revenue']     = round(shapley_rev.get(ch, 0), 2)
    row['shapley_weight']      = round(shapley_norm.get(ch, 0), 4)
    row['shapley_raw_value']   = round(shapley_raw.get(ch, 0), 6)
    mta_summary.append(row)

df_mta = pd.DataFrame(mta_summary)
df_mta.to_csv(f"{OUT}/mta_results.csv", index=False)

# Also save path-level data for Sankey diagram
path_counts = journeys.groupby(
    journeys['channels'].apply(lambda x: ' > '.join(x[:5]))
).agg(
    journeys=('converted','count'),
    conversions=('converted','sum'),
    revenue=('revenue','sum')
).reset_index().rename(columns={'channels':'path'})
path_counts['conversion_rate'] = (path_counts['conversions'] / path_counts['journeys']).round(4)
path_counts = path_counts.sort_values('conversions', ascending=False).head(50)
path_counts.to_csv(f"{OUT}/mta_top_paths.csv", index=False)

print(f"\n✅ MTA Model Complete")
print(f"   Output: {OUT}/mta_results.csv")
print(f"\n{'='*55}")
print(f"{'Channel':<22} {'Shapley Rev':>12} {'Markov Rev':>12} {'Linear Rev':>12}")
print(f"{'-'*55}")
for _, r in df_mta.sort_values('shapley_revenue', ascending=False).iterrows():
    print(f"  {r['channel']:<20} ${r['shapley_revenue']:>10,.0f} ${r['markov_revenue']:>10,.0f} ${r['linear_revenue']:>10,.0f}")
print(f"{'='*55}")
