import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import mtaData from '@/data/mta_data.json';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell } from 'recharts';
import { GitBranch, Layers, Zap, Info } from 'lucide-react';

type Method = 'shapley' | 'markov' | 'linear' | 'first_touch' | 'last_touch' | 'time_decay' | 'u_shape';

const METHOD_LABELS: Record<Method, string> = {
  shapley: 'Shapley Value', markov: 'Markov Chain', linear: 'Linear',
  first_touch: 'First Touch', last_touch: 'Last Touch', time_decay: 'Time Decay', u_shape: 'U-Shape (Bath Tub)',
};

const METHOD_INFO: Record<Method, string> = {
  shapley: 'Game-theory approach. Averages marginal contribution across all possible channel orderings. Industry gold standard (Rockerbox, Northbeam, Triple Whale). Computationally expensive — solved via Monte Carlo sampling.',
  markov:  'Models the customer journey as a Markov Chain. Removal effect: measures how much conversion probability drops when each channel is removed. Captures sequential dependencies between channels.',
  linear:  'Distributes credit equally across all touchpoints. Simple, transparent, but ignores touchpoint quality and position.',
  first_touch: '100% credit to the first touchpoint. Best for measuring awareness/discovery channel impact.',
  last_touch:  '100% credit to the last touchpoint before conversion. Default in Google Ads. Overvalues bottom-funnel channels.',
  time_decay:  'More credit to touchpoints closer to conversion. Exponential decay. Good for short sales cycles.',
  u_shape:     '40% first touch, 40% last touch, 20% distributed across middle. Balances awareness and conversion channel credit.',
};

const CHANNEL_COLORS: Record<string,string> = {
  'Paid Search':    'hsl(199 89% 48%)',
  'Paid Social':    'hsl(262 80% 65%)',
  'Email':          'hsl(158 64% 52%)',
  'Direct':         'hsl(35 91% 55%)',
  'Affiliate':      'hsl(340 82% 60%)',
  'Organic Search': 'hsl(187 60% 50%)',
  'Other':          'hsl(280 65% 60%)',
};

const fmt = (n: number) => n >= 1000 ? `$${Math.round(n/1000)}K` : `$${Math.round(n)}`;

export default function MTA() {
  const [method, setMethod] = useState<Method>('shapley');
  const [showInfo, setShowInfo] = useState(false);

  const totalRev = mtaData.attribution.reduce((s,r) => s + (r[`${method}_rev` as keyof typeof r] as number || 0), 0);
  const topChannel = [...mtaData.attribution].sort((a,b) => 
    (b[`${method}_rev` as keyof typeof b] as number) - (a[`${method}_rev` as keyof typeof a] as number)
  )[0];

  // Bar chart data
  const barData = mtaData.attribution.map(r => ({
    channel: r.channel,
    revenue: Math.round((r[`${method}_rev` as keyof typeof r] as number) / 1000),
    pct: totalRev > 0 ? ((r[`${method}_rev` as keyof typeof r] as number) / totalRev * 100).toFixed(1) : '0',
  })).sort((a,b) => b.revenue - a.revenue);

  // Method comparison radar
  const radarData = mtaData.attribution.map(r => ({
    channel: r.channel,
    Shapley: Math.round(r.shapley_rev / totalRev * 100 || 0),
    Markov:  Math.round(r.markov_rev / totalRev * 100 || 0),
    Linear:  Math.round(r.linear_rev / totalRev * 100 || 0),
  }));

  // Multi-method comparison bar
  const multiBar = mtaData.attribution.map(r => ({
    channel: r.channel,
    Shapley:    Math.round(r.shapley_rev / 1000),
    Markov:     Math.round(r.markov_rev / 1000),
    Linear:     Math.round(r.linear_rev / 1000),
    'First Touch': Math.round(r.first_touch_rev / 1000),
    'Last Touch':  Math.round(r.last_touch_rev / 1000),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{background: p.color || p.fill}}/>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-mono font-medium text-foreground">${p.value}K</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Multi-Touch Attribution (MTA)"
        subtitle="Shapley Value, Markov Chain, and rule-based models — data source: GA4 BigQuery export"
        badge="6 Channels"
      />

      <div className="p-6 space-y-6">
        {/* Method selector */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attribution Model</div>
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              <Info size={12}/> How it works
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(METHOD_LABELS) as Method[]).map(m => (
              <button
                key={m}
                data-testid={`method-${m}`}
                onClick={() => setMethod(m)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  method === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >{METHOD_LABELS[m]}</button>
            ))}
          </div>
          {showInfo && (
            <div className="mt-3 p-3 rounded-md bg-primary/8 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-primary">{METHOD_LABELS[method]}:</span>{' '}{METHOD_INFO[method]}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Attributed Rev" value={fmt(totalRev)} subvalue={`${METHOD_LABELS[method]} model`} color="blue" icon={<GitBranch size={14}/>}/>
          <KpiCard label="Top Channel" value={topChannel?.channel || ''} subvalue={fmt((topChannel?.[`${method}_rev` as keyof typeof topChannel] as number) || 0)} color="purple" icon={<Zap size={14}/>}/>
          <KpiCard label="Channels Tracked" value="6" subvalue="GA4 session source" color="green" icon={<Layers size={14}/>}/>
          <KpiCard label="Conversions" value={mtaData.top_paths.reduce((s,p) => s + p.conversions, 0).toLocaleString()} subvalue="Total purchase events" color="orange"/>
        </div>

        {/* Main charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Attribution bar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">{METHOD_LABELS[method]} — Revenue Attribution</div>
            <div className="text-xs text-muted-foreground mb-4">Revenue credited to each channel ($K)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} layout="vertical" margin={{top:0,right:60,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}K`}/>
                <YAxis type="category" dataKey="channel" tick={{fontSize:11,fill:'hsl(var(--foreground))'}} tickLine={false} axisLine={false} width={100}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revenue" radius={[0,4,4,0]} name="Revenue ($K)">
                  {barData.map((entry,i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[entry.channel] || 'hsl(199 89% 48%)'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Multi-method comparison */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Model Comparison — All Methods</div>
            <div className="text-xs text-muted-foreground mb-4">Revenue attribution per channel by model ($K) — shows bias of each approach</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={multiBar} margin={{top:4,right:8,bottom:20,left:0}} barGap={1} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false}/>
                <XAxis dataKey="channel" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} interval={0}/>
                <YAxis tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}K`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend iconType="square" iconSize={7} wrapperStyle={{fontSize:'10px',paddingTop:'4px'}}/>
                <Bar dataKey="Shapley"     fill="hsl(199 89% 48%)" radius={[2,2,0,0]}/>
                <Bar dataKey="Markov"      fill="hsl(262 80% 65%)" radius={[2,2,0,0]}/>
                <Bar dataKey="Linear"      fill="hsl(158 64% 52%)" radius={[2,2,0,0]}/>
                <Bar dataKey="First Touch" fill="hsl(35 91% 55%)"  radius={[2,2,0,0]}/>
                <Bar dataKey="Last Touch"  fill="hsl(340 82% 60%)" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top paths */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-1">Top Converting Journeys</div>
          <div className="text-xs text-muted-foreground mb-4">Most common multi-touch paths leading to conversion</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Journey Path','Total Journeys','Conversions','Conv. Rate','Revenue'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mtaData.top_paths.slice(0,12).map((p,i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-foreground max-w-[300px]">
                      <div className="flex flex-wrap gap-1">
                        {p.path.split(' > ').map((ch,j,arr) => (
                          <span key={j} className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{background:`${CHANNEL_COLORS[ch]||'hsl(199 89% 48%)'}20`, color: CHANNEL_COLORS[ch]||'hsl(199 89% 48%)'}}>{ch}</span>
                            {j < arr.length-1 && <span className="text-muted-foreground">→</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-foreground">{p.journeys.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-foreground">{p.conversions.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`font-mono font-medium ${parseFloat(p.conversion_rate as any) > 0.1 ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {(parseFloat(p.conversion_rate as any) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-foreground">{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
