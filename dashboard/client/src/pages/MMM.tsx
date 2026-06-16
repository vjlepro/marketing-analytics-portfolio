import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import mmmData from '@/data/mmm_data.json';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { BarChart3, TrendingUp, Zap, Sliders } from 'lucide-react';

const CHANNEL_COLORS: Record<string,string> = {
  google_brand_search:    'hsl(199 89% 48%)',
  google_nonbrand_search: 'hsl(262 80% 65%)',
  google_remarketing:     'hsl(158 64% 52%)',
  google_display_pmax:    'hsl(35 91% 55%)',
  meta_prospecting:       'hsl(340 82% 60%)',
  meta_retargeting:       'hsl(187 60% 50%)',
  meta_other:             'hsl(280 65% 60%)',
};
const CHANNEL_LABELS: Record<string,string> = {
  google_brand_search:    'Google Brand',
  google_nonbrand_search: 'Google Non-Brand',
  google_remarketing:     'Google Remarketing',
  google_display_pmax:    'Display / PMax',
  meta_prospecting:       'Meta Prospecting',
  meta_retargeting:       'Meta Retargeting',
  meta_other:             'Meta Other',
};

const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${Math.round(n/1000)}K`;

export default function MMM() {
  const [selectedChannel, setSelectedChannel] = useState(mmmData.channels[0]?.channel || '');

  const modelFit  = mmmData.model_fit;
  const totalRev  = mmmData.channels.reduce((s,c) => s + c.attributed_rev, 0);
  const totalSpend = mmmData.channels.reduce((s,c) => s + c.actual_spend, 0);
  const blendedRoas = totalRev / totalSpend;
  const budgetLift = modelFit.budget_lift_potential;

  // Weekly decomp stacked area
  const decompKeys = Object.keys(mmmData.weekly_decomp[0] || {}).filter(k => k !== 'week' && k !== 'revenue' && k !== 'y_pred' && k !== 'base' && k !== 'seasonal');

  // Channel ROAS bar
  const roasBar = mmmData.channels
    .filter(c => c.actual_roas > 0)
    .sort((a,b) => b.actual_roas - a.actual_roas)
    .map(c => ({
      channel: CHANNEL_LABELS[c.channel] || c.channel,
      key: c.channel,
      roas: parseFloat(c.actual_roas.toFixed(2)),
      spend: Math.round(c.actual_spend / 1000),
      rev: Math.round(c.attributed_rev / 1000),
      pct: (c.pct_of_revenue * 100).toFixed(1),
    }));

  // MROAS curve for selected channel
  const mroasCurve = ((mmmData.mroas_curves as any)[selectedChannel] || []).map((p: any) => ({
    spend: p.spend_multiplier,
    roas: parseFloat(p.roas.toFixed(3)),
  }));

  // Budget optimizer
  const budgetOpt = mmmData.budget_optimizer.map(r => ({
    channel: CHANNEL_LABELS[r.channel] || r.channel,
    key: r.channel,
    current: Math.round(r.current_spend_wk),
    optimized: Math.round(r.optimized_spend_wk),
    delta: parseFloat(r.change_pct.toFixed(1)),
  }));

  // Adstock params table
  const adstockTable = mmmData.channels.map(c => ({
    channel: CHANNEL_LABELS[c.channel] || c.channel,
    key: c.channel,
    adstock: c.adstock_decay,
    alpha: c.hill_alpha,
    gamma: c.hill_gamma,
    roas: c.actual_roas,
    pct: (c.pct_of_revenue * 100).toFixed(1),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl max-w-[220px]">
        <div className="font-medium text-foreground mb-2">{label}</div>
        {payload.slice(0,5).map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: p.color || p.fill}}/>
            <span className="text-muted-foreground truncate">{CHANNEL_LABELS[p.name] || p.name}:</span>
            <span className="font-mono font-medium text-foreground flex-shrink-0">${p.value}K</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Marketing Mix Model (MMM)"
        subtitle="Adstock + Hill saturation + OLS decomposition — Robyn-inspired methodology — Google Ads + Meta Ads weekly data"
        badge={`R² ${(modelFit.r2_ols*100).toFixed(1)}%`}
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Model R²" value={`${(modelFit.r2_ols*100).toFixed(1)}%`} subvalue={`MAPE: ${(modelFit.mape*100).toFixed(1)}%`} color="green" icon={<Zap size={14}/>}/>
          <KpiCard label="Blended ROAS" value={`${blendedRoas.toFixed(2)}x`} subvalue="Attributed rev / spend" color="blue" icon={<TrendingUp size={14}/>}/>
          <KpiCard label="Base Revenue %" value={`${(modelFit.base_revenue_pct*100).toFixed(1)}%`} subvalue="Organic / brand baseline" color="purple" icon={<BarChart3 size={14}/>}/>
          <KpiCard label="Paid Media %" value={`${(modelFit.paid_media_pct*100).toFixed(1)}%`} subvalue="Incremental from ads" delta={budgetLift*100} deltaLabel="budget lift potential" color="orange" icon={<Sliders size={14}/>}/>
        </div>

        {/* Revenue decomp stacked area */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-1">Weekly Revenue Decomposition</div>
          <div className="text-xs text-muted-foreground mb-4">Stacked contribution: base organic + each paid channel — how much revenue each channel drove each week</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mmmData.weekly_decomp} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false}/>
              <XAxis dataKey="week" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>v?.slice(0,7)||''}/>
              <YAxis tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${Math.round(v/1000)}K`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="base" stackId="1" fill="hsl(215 20% 25%)" stroke="hsl(215 20% 35%)" strokeWidth={0.5} name="Base / Organic"/>
              {decompKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stackId="1"
                  fill={CHANNEL_COLORS[k] || `hsl(${200 + i*30} 70% 50%)`}
                  stroke={CHANNEL_COLORS[k] || `hsl(${200 + i*30} 70% 50%)`}
                  strokeWidth={0.5} fillOpacity={0.85}
                  name={k}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ROAS + Budget optimizer */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Channel ROAS Ranking</div>
            <div className="text-xs text-muted-foreground mb-4">Return on Ad Spend attributed by MMM — accounts for adstock & saturation</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roasBar} layout="vertical" margin={{top:0,right:50,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}x`}/>
                <YAxis type="category" dataKey="channel" tick={{fontSize:10,fill:'hsl(var(--foreground))'}} tickLine={false} axisLine={false} width={120}/>
                <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'6px',fontSize:'11px'}} formatter={(v:any,n:any) => [n==='roas'?`${v}x`:`$${v}K`, n]}/>
                <ReferenceLine x={3} stroke="hsl(35 91% 55%)" strokeDasharray="4 2" label={{value:'3x',fontSize:9,fill:'hsl(35 91% 55%)'}}/>
                <Bar dataKey="roas" radius={[0,4,4,0]} name="ROAS">
                  {roasBar.map((entry,i) => <Cell key={i} fill={CHANNEL_COLORS[entry.key] || 'hsl(199 89% 48%)'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Budget Optimizer — Current vs. Optimal</div>
            <div className="text-xs text-muted-foreground mb-4">SLSQP-optimized spend allocation for same total budget — gradient-based reallocation</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetOpt} layout="vertical" margin={{top:0,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                <YAxis type="category" dataKey="channel" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} width={115}/>
                <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'6px',fontSize:'11px'}} formatter={(v:any) => [`$${v}/wk`, '']}/>
                <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
                <Bar dataKey="current"   fill="hsl(215 20% 30%)" radius={[0,3,3,0]} name="Current"/>
                <Bar dataKey="optimized" radius={[0,3,3,0]} name="Optimized">
                  {budgetOpt.map((entry,i) => (
                    <Cell key={i} fill={entry.delta > 0 ? 'hsl(158 64% 52%)' : entry.delta < 0 ? 'hsl(0 72% 51%)' : 'hsl(215 20% 40%)'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MROAS curve + Adstock params */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Marginal ROAS curve */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-foreground">Marginal ROAS Curve</div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">ROAS at different spend levels — shows where diminishing returns kick in</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {mmmData.channels.filter(c => c.actual_roas > 0).map(c => (
                <button key={c.channel}
                  onClick={() => setSelectedChannel(c.channel)}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${selectedChannel === c.channel ? 'text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                  style={selectedChannel === c.channel ? {background: CHANNEL_COLORS[c.channel]} : {}}
                >{CHANNEL_LABELS[c.channel] || c.channel}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={mroasCurve} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5}/>
                <XAxis dataKey="spend" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}x`} label={{value:'Spend multiplier',position:'insideBottom',offset:-2,fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                <YAxis tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(1)}x`}/>
                <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'6px',fontSize:'11px'}} formatter={(v:any) => [`${parseFloat(v).toFixed(2)}x ROAS`, '']}/>
                <ReferenceLine x={1.0} stroke="hsl(35 91% 55%)" strokeDasharray="4 2" label={{value:'Current',fontSize:9,fill:'hsl(35 91% 55%)'}}/>
                <Line type="monotone" dataKey="roas" stroke={CHANNEL_COLORS[selectedChannel] || 'hsl(199 89% 48%)'} strokeWidth={2.5} dot={false} name="ROAS"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Adstock & saturation params */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Model Parameters — Adstock & Saturation</div>
            <div className="text-xs text-muted-foreground mb-4">Fitted decay (carryover), Hill alpha (shape), Hill gamma (saturation inflection) per channel</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Channel','Adstock Decay','Hill α','Hill γ','ROAS','Rev %'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adstockTable.sort((a,b) => b.roas - a.roas).map((r,i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: CHANNEL_COLORS[r.key] || 'hsl(199 89% 48%)'}}/>
                          <span className="font-medium text-foreground">{r.channel}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="bg-secondary rounded-full h-1 w-16">
                            <div className="h-1 rounded-full bg-primary" style={{width:`${r.adstock*100}%`}}/>
                          </div>
                          <span className="font-mono text-muted-foreground">{r.adstock.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 font-mono text-foreground">{r.alpha.toFixed(2)}</td>
                      <td className="py-2 px-2 font-mono text-foreground">{r.gamma.toFixed(2)}</td>
                      <td className="py-2 px-2 font-mono font-medium" style={{color: r.roas >= 3 ? 'hsl(158 64% 52%)' : r.roas >= 2 ? 'hsl(35 91% 55%)' : 'hsl(0 72% 51%)'}}>{r.roas.toFixed(2)}x</td>
                      <td className="py-2 px-2 font-mono text-muted-foreground">{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-2.5 rounded-md bg-secondary/50 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">Adstock decay:</span> fraction of spend that carries into next week. High decay = longer brand echo (upper funnel). Low decay = immediate response (brand search).
              <span className="font-semibold text-foreground ml-2">Hill α:</span> saturation curve steepness.
              <span className="font-semibold text-foreground ml-1">Hill γ:</span> spend level at inflection point.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
