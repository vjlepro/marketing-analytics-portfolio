import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import mtaData from '@/data/mta_data.json';
import cacData from '@/data/cac_data.json';
import mmmData from '@/data/mmm_data.json';
import { DollarSign, Users, TrendingUp, Target, Activity, Zap } from 'lucide-react';

const CHANNEL_COLORS: Record<string,string> = {
  google_brand_search:    'hsl(199 89% 48%)',
  google_nonbrand_search: 'hsl(262 80% 65%)',
  google_remarketing:     'hsl(158 64% 52%)',
  google_display_pmax:    'hsl(35 91% 55%)',
  meta_prospecting:       'hsl(340 82% 60%)',
  meta_retargeting:       'hsl(187 60% 50%)',
  meta_other:             'hsl(280 65% 60%)',
};
const COLORS8 = Object.values(CHANNEL_COLORS);

const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function Overview() {
  // KPIs from model outputs
  const totalModeledRev = mmmData.model_fit.total_revenue_modeled;
  const totalSpend = mmmData.channels.reduce((s,c) => s + c.actual_spend, 0);
  const blendedRoas = totalModeledRev / totalSpend;
  const avgCac = cacData.blended_monthly.reduce((s,r) => s + (r.blended_cac||0), 0) / cacData.blended_monthly.length;
  const avgLtvCac = cacData.blended_monthly.reduce((s,r) => s + (r.ltv_cac_ratio_24m||0), 0) / cacData.blended_monthly.length;
  const modelFit = mmmData.model_fit;

  // Revenue trend from MMM weekly
  const revTrend = mmmData.weekly_decomp.slice(-26).map(w => ({
    week: w.week.slice(5),
    actual: Math.round(w.revenue / 1000),
    modeled: Math.round(w.y_pred / 1000),
  }));

  // Channel contribution pie — short labels to prevent truncation
  const CHAN_SHORT: Record<string,string> = {
    google_brand_search:    'Brand Search',
    google_nonbrand_search: 'Non-Brand',
    google_remarketing:     'Remarketing',
    google_display_pmax:    'Display/PMax',
    meta_prospecting:       'Meta Prospect',
    meta_retargeting:       'Meta Retarget',
    meta_other:             'Meta Other',
  };
  const channelPie = mmmData.channels
    .filter(c => c.attributed_rev > 0)
    .sort((a,b) => b.attributed_rev - a.attributed_rev)
    .map((c,i) => ({
      name: CHAN_SHORT[c.channel] || c.channel,
      value: Math.round(c.attributed_rev / 1000),
      color: COLORS8[i % COLORS8.length],
    }));

  // CAC trend last 12 months
  const cacTrend = cacData.blended_monthly.slice(-12).map(r => ({
    month: r.month_str?.slice(0,7) || '',
    cac: Math.round(r.blended_cac || 0),
    ltv_cac: parseFloat((r.ltv_cac_ratio_24m || 0).toFixed(2)),
  }));

  // MTA method comparison (top 3 channels)
  const topChannels = ['Paid Search','Paid Social','Email','Direct','Affiliate','Organic Search'];
  const mtaCompare = topChannels.map(ch => {
    const row = mtaData.attribution.find(r => r.channel === ch);
    if (!row) return null;
    return {
      channel: ch.replace(' ','\n'),
      Shapley: Math.round(row.shapley_rev / 1000),
      Markov:  Math.round(row.markov_rev / 1000),
      Linear:  Math.round(row.linear_rev / 1000),
    };
  }).filter(Boolean);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-1.5">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{background: p.color || p.fill}}/>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-mono font-medium text-foreground">{typeof p.value === 'number' && p.name !== 'ltv_cac' ? `$${p.value}K` : p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Marketing Analytics Overview"
        subtitle="2-year synthetic dataset • HubSpot + Salesforce + GA4 + Google Ads + Meta Ads + NetSuite"
        badge="2023–2024"
      />

      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Total Revenue" value={fmt(totalModeledRev)} subvalue="Modeled (MMM)" delta={14.2} deltaLabel="YoY" color="blue" icon={<DollarSign size={14}/>}/>
          <KpiCard label="Total Ad Spend" value={fmt(totalSpend)} subvalue="All paid channels" delta={8.1} deltaLabel="YoY" color="purple" icon={<Target size={14}/>}/>
          <KpiCard label="Blended ROAS" value={`${blendedRoas.toFixed(2)}x`} subvalue="Revenue / Spend" delta={5.4} deltaLabel="YoY" color="green" icon={<TrendingUp size={14}/>}/>
          <KpiCard label="Avg CAC" value={`$${Math.round(avgCac).toLocaleString()}`} subvalue="Paid channels" delta={-3.2} deltaLabel="YoY" color="orange" icon={<Users size={14}/>}/>
          <KpiCard label="LTV:CAC Ratio" value={`${avgLtvCac.toFixed(2)}x`} subvalue="24-month LTV" delta={2.1} deltaLabel="YoY" color="blue" icon={<Activity size={14}/>}/>
          <KpiCard label="MMM R²" value={`${(modelFit.r2_ols * 100).toFixed(1)}%`} subvalue={`MAPE: ${(modelFit.mape * 100).toFixed(1)}%`} color="green" icon={<Zap size={14}/>}/>
        </div>

        {/* Revenue trend + Channel pie */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Revenue — Actual vs. MMM Model Fit</div>
                <div className="text-xs text-muted-foreground">Weekly, last 26 weeks (thousands)</div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-px inline-block bg-sky-400"/>Actual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-px inline-block bg-violet-400"/>Modeled</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revTrend} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5}/>
                <XAxis dataKey="week" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}K`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="actual"  stroke="hsl(199 89% 48%)" strokeWidth={2} dot={false} name="Actual"/>
                <Line type="monotone" dataKey="modeled" stroke="hsl(262 80% 65%)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Modeled"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Revenue Attribution</div>
            <div className="text-xs text-muted-foreground mb-3">MMM channel contribution ($K)</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={channelPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                  {channelPie.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                </Pie>
                <Tooltip formatter={(v: any) => [`$${v}K`, '']} contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'6px',fontSize:'11px'}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {channelPie.map((c,i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c.color}}/>
                    <span className="text-muted-foreground truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <span className="font-mono font-medium text-foreground">${c.value.toLocaleString()}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MTA Comparison + CAC trend */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">MTA Model Comparison</div>
            <div className="text-xs text-muted-foreground mb-4">Shapley vs. Markov vs. Linear attribution (Revenue $K)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mtaCompare} margin={{top:4,right:8,bottom:0,left:0}} barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false}/>
                <XAxis dataKey="channel" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}K`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:'11px',paddingTop:'8px'}}/>
                <Bar dataKey="Shapley" fill="hsl(199 89% 48%)" radius={[2,2,0,0]}/>
                <Bar dataKey="Markov"  fill="hsl(262 80% 65%)" radius={[2,2,0,0]}/>
                <Bar dataKey="Linear"  fill="hsl(158 64% 52%)" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">CAC Trend & LTV:CAC Ratio</div>
            <div className="text-xs text-muted-foreground mb-4">Monthly blended CAC ($) vs. LTV:CAC ratio (right axis)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cacTrend} margin={{top:4,right:36,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5}/>
                <XAxis dataKey="month" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false}/>
                <YAxis yAxisId="left"  tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}x`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line yAxisId="left"  type="monotone" dataKey="cac"     stroke="hsl(35 91% 55%)"  strokeWidth={2} dot={false} name="CAC ($)"/>
                <Line yAxisId="right" type="monotone" dataKey="ltv_cac" stroke="hsl(158 64% 52%)" strokeWidth={2} dot={false} name="LTV:CAC"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data source summary */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-3">Data Pipeline Architecture</div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { src: 'HubSpot CRM',      rows: '16,971', type: 'Contacts + Deals', color: 'hsl(35 91% 55%)' },
              { src: 'Salesforce CRM',   rows: '3,540',  type: 'Opps + Campaigns', color: 'hsl(199 89% 48%)' },
              { src: 'Google Analytics', rows: '53,944', type: 'GA4 BQ Export',    color: 'hsl(158 64% 52%)' },
              { src: 'Google Ads',       rows: '7,310',  type: 'Campaign Daily',   color: 'hsl(262 80% 65%)' },
              { src: 'Meta Ads',         rows: '26,247', type: 'Ads Insights API', color: 'hsl(340 82% 60%)' },
              { src: 'NetSuite ERP',     rows: '37,405', type: 'Transaction Lines', color: 'hsl(187 60% 50%)' },
              { src: 'MTA Model',        rows: '3,944',  type: 'Conversions',      color: 'hsl(280 65% 60%)' },
              { src: 'MMM Model',        rows: '104',    type: 'Weekly periods',   color: 'hsl(199 89% 48%)' },
            ].map(s => (
              <div key={s.src} className="rounded-md p-2.5" style={{background:`${s.color}10`, border:`1px solid ${s.color}30`}}>
                <div className="text-[10px] font-medium mb-0.5" style={{color:s.color}}>{s.src}</div>
                <div className="font-mono text-sm font-bold text-foreground">{s.rows}</div>
                <div className="text-[10px] text-muted-foreground">{s.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
