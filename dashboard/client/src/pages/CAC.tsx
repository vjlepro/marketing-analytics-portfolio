import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import cacData from '@/data/cac_data.json';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { TrendingDown, Users, DollarSign, Clock } from 'lucide-react';

const HEALTH_COLORS = { Healthy: 'hsl(158 64% 52%)', Marginal: 'hsl(35 91% 55%)', 'At Risk': 'hsl(35 91% 55%)', Unprofitable: 'hsl(0 72% 51%)' };
const PLATFORM_COLORS: Record<string,string> = { 'Google Ads': 'hsl(199 89% 48%)', 'Meta Ads': 'hsl(262 80% 65%)' };
const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function CAC() {
  const avgCac = cacData.blended_monthly.reduce((s,r) => s + r.blended_cac, 0) / cacData.blended_monthly.length;
  const avgLtvCac = cacData.blended_monthly.reduce((s,r) => s + r.ltv_cac_ratio_24m, 0) / cacData.blended_monthly.length;
  const avgPayback = cacData.blended_monthly.reduce((s,r) => s + r.payback_months, 0) / cacData.blended_monthly.length;
  const healthyCount = cacData.by_channel.filter(r => r.health_status === 'Healthy').length;

  // Retention curve
  const retentionData = cacData.retention_curve.map(r => ({
    month: r.month,
    retention: parseFloat((r.avg_retention * 100).toFixed(1)),
  }));

  // CAC by channel scatter (CAC vs LTV:CAC)
  const scatterData = cacData.by_channel.map(r => ({
    name: r.channel,
    cac: r.cac,
    ltv_cac: r.ltv_cac_ratio,
    payback: r.payback_months,
    health: r.health_status,
    platform: r.platform,
  }));

  // Monthly trend
  const trendData = cacData.blended_monthly.slice(-18).map(r => ({
    month: r.month_str.slice(0,7),
    cac: Math.round(r.blended_cac),
    roas: parseFloat(r.roas.toFixed(2)),
    customers: r.total_new_customers,
  }));

  // Bar: CAC vs LTV by channel
  const ltv_bar = cacData.by_channel.map(r => ({
    name: r.channel.replace(' — ',' / '),
    CAC: Math.round(r.cac),
    'LTV 24m': Math.round(r.ltv_24m),
    platform: r.platform,
  })).sort((a,b) => b['LTV 24m'] - a['LTV 24m']);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-2">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{background: p.color || p.fill}}/>
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {p.name === 'roas' ? `${p.value}x` : p.name === 'retention' ? `${p.value}%` : `$${p.value}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <div className="font-medium text-foreground mb-1.5">{d.name}</div>
        <div className="space-y-0.5">
          <div><span className="text-muted-foreground">CAC:</span> <span className="font-mono">{fmt(d.cac)}</span></div>
          <div><span className="text-muted-foreground">LTV:CAC:</span> <span className="font-mono">{d.ltv_cac}x</span></div>
          <div><span className="text-muted-foreground">Payback:</span> <span className="font-mono">{d.payback}mo</span></div>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium`}
              style={{background:`${(HEALTH_COLORS as any)[d.health]}20`, color:(HEALTH_COLORS as any)[d.health]}}>
              {d.health}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Customer Acquisition Cost (CAC) & LTV"
        subtitle="Channel-level CAC, cohort LTV, payback periods — data: Google Ads + Meta Ads + HubSpot Deals + NetSuite"
        badge="7 Channels"
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Avg Blended CAC" value={fmt(avgCac)} subvalue="Total spend / new customers" color="orange" icon={<TrendingDown size={14}/>}/>
          <KpiCard label="LTV:CAC Ratio" value={`${avgLtvCac.toFixed(2)}x`} subvalue="24-month LTV benchmark" delta={avgLtvCac >= 3 ? 5 : -2} deltaLabel="vs. 3x target" color={avgLtvCac >= 3 ? 'green' : 'orange'} icon={<DollarSign size={14}/>}/>
          <KpiCard label="Avg Payback" value={`${avgPayback.toFixed(1)} mo`} subvalue="Months to recover CAC" color="purple" icon={<Clock size={14}/>}/>
          <KpiCard label="Healthy Channels" value={`${healthyCount}/${cacData.by_channel.length}`} subvalue="LTV:CAC > 3x" color="green" icon={<Users size={14}/>}/>
        </div>

        {/* Channel health table */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-1">Channel CAC Health Matrix</div>
          <div className="text-xs text-muted-foreground mb-4">CAC, LTV, payback, and health status by channel — flagged against LTV:CAC &gt; 3x benchmark</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Channel','Platform','CAC','Est. LTV 24m','LTV:CAC','Payback','ROAS','CVR','Health'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cacData.by_channel.sort((a,b) => b.ltv_cac_ratio - a.ltv_cac_ratio).map((r,i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{r.channel}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{background:`${PLATFORM_COLORS[r.platform]||'hsl(199 89% 48%)'}15`, color: PLATFORM_COLORS[r.platform]||'hsl(199 89% 48%)'}}>
                        {r.platform}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{fmt(r.cac)}</td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{fmt(r.ltv_24m)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-1.5 max-w-[60px]">
                          <div className="h-1.5 rounded-full" style={{width:`${Math.min(100, r.ltv_cac_ratio / 5 * 100)}%`, background:(HEALTH_COLORS as any)[r.health_status]}}/>
                        </div>
                        <span className="font-mono font-medium" style={{color:(HEALTH_COLORS as any)[r.health_status]}}>{r.ltv_cac_ratio}x</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{r.payback_months}mo</td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{r.roas.toFixed(2)}x</td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{(r.cvr * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{background:`${(HEALTH_COLORS as any)[r.health_status]}15`, color:(HEALTH_COLORS as any)[r.health_status]}}>
                        {r.health_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* CAC vs LTV bar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">CAC vs. 24-Month LTV by Channel</div>
            <div className="text-xs text-muted-foreground mb-4">LTV bar should always be 3x+ the CAC bar for a healthy unit economics</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ltv_bar} layout="vertical" margin={{top:0,right:8,bottom:0,left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} width={120}/>
                <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:'6px',fontSize:'11px'}} formatter={(v: any) => [`$${v}`, '']}/>
                <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
                <Bar dataKey="CAC"     fill="hsl(35 91% 55%)"  radius={[0,3,3,0]} name="CAC"/>
                <Bar dataKey="LTV 24m" fill="hsl(199 89% 48%)" radius={[0,3,3,0]} name="LTV 24m"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Retention curve */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-1">Customer Retention Curve</div>
            <div className="text-xs text-muted-foreground mb-4">Average % of customers still active at month N — derived from NetSuite transaction data</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={retentionData} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5}/>
                <XAxis dataKey="month" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} label={{value:'Month', position:'insideBottom',offset:-2,fontSize:10,fill:'hsl(var(--muted-foreground))'}}/>
                <YAxis tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
                <Tooltip content={<CustomTooltip/>}/>
                <ReferenceLine y={60} stroke="hsl(35 91% 55%)" strokeDasharray="4 2" label={{value:'60% target',fontSize:9,fill:'hsl(35 91% 55%)'}}/>
                <Line type="monotone" dataKey="retention" stroke="hsl(199 89% 48%)" strokeWidth={2.5} dot={false} name="retention"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CAC trend */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-foreground mb-1">Monthly CAC & ROAS Trend</div>
          <div className="text-xs text-muted-foreground mb-4">18-month blended CAC (left axis, $) and ROAS (right axis, x) — goal: CAC ↓, ROAS ↑</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{top:4,right:40,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5}/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="left"  tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toLocaleString()}`}/>
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:'hsl(var(--muted-foreground))'}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}x`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line yAxisId="left"  type="monotone" dataKey="cac"  stroke="hsl(340 82% 60%)" strokeWidth={2} dot={false} name="CAC ($)"/>
              <Line yAxisId="right" type="monotone" dataKey="roas" stroke="hsl(158 64% 52%)" strokeWidth={2} dot={false} name="roas"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
