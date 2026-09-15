import { Link, useLocation } from 'wouter';
import {
  BarChart3, GitBranch, TrendingDown, Activity, Database,
  ChevronRight, Sparkles, Home, ClipboardCheck,
  FlaskConical, FileText, BookOpen, Search
} from 'lucide-react';

const ABOUT_NAV = [
  { href: '/about', label: 'Portfolio', icon: Home, desc: 'About & Projects' },
];

const MODELS_NAV = [
  { href: '/',     label: 'Overview',     icon: Activity,     desc: 'KPI Summary' },
  { href: '/mta',  label: 'MTA',          icon: GitBranch,    desc: 'Attribution' },
  { href: '/mmm',  label: 'MMM',          icon: BarChart3,    desc: 'Mix Modeling' },
  { href: '/cac',  label: 'CAC & LTV',    icon: TrendingDown, desc: 'Acquisition Cost' },
  { href: '/data', label: 'Data Sources', icon: Database,     desc: 'Pipeline Info' },
];

const DATA_PRODUCTS_NAV = [
  { href: '/ab-testing',        label: 'A/B Testing',       icon: FlaskConical, desc: 'Experimentation' },
  { href: '/data-product-spec', label: 'Product Spec',      icon: FileText,     desc: 'Data Product PRD' },
  { href: '/metric-governance', label: 'Metric Governance', icon: BookOpen,     desc: 'Semantic Layer' },
  { href: '/case-study',        label: 'Case Study',        icon: Search,       desc: 'Attribution + Funnel' },
];

const AI_NAV = [
  { href: '/ai-analyst', label: 'AI Analyst',    icon: Sparkles,       desc: 'Executive Briefs' },
  { href: '/scorecard',  label: 'Maturity Score', icon: ClipboardCheck, desc: 'Org Assessment' },
];

function NavSection({ title, items }: { title: string; items: typeof MODELS_NAV }) {
  const [location] = useLocation();
  return (
    <div className="mb-1">
      <p className="section-title px-2 mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{title}</p>
      {items.map(({ href, label, icon: Icon, desc }) => {
        const active = location === href;
        return (
          <Link key={href} href={href}>
            <a
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`
                group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all
                ${active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
              `}
            >
              <Icon size={14} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium leading-tight ${active ? 'text-primary' : ''}`}>{label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
              </div>
              {active && <ChevronRight size={11} className="text-primary flex-shrink-0" />}
            </a>
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-card/40 backdrop-blur-sm">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="MarketIQ Logo">
            <rect width="28" height="28" rx="6" fill="hsl(199 89% 48% / 0.15)" />
            <rect x="5" y="18" width="4" height="6" rx="1" fill="hsl(199 89% 48%)"/>
            <rect x="12" y="12" width="4" height="12" rx="1" fill="hsl(262 80% 65%)"/>
            <rect x="19" y="6" width="4" height="18" rx="1" fill="hsl(158 64% 52%)"/>
            <path d="M7 15 L14 10 L21 5" stroke="hsl(35 91% 55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div className="font-semibold text-sm text-foreground leading-tight">MarketIQ</div>
            <div className="text-[10px] text-muted-foreground">Analytics Suite</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <NavSection title="About" items={ABOUT_NAV} />
        <NavSection title="Analytics Models" items={MODELS_NAV} />
        <NavSection title="Data Products" items={DATA_PRODUCTS_NAV} />
        <NavSection title="AI Tools" items={AI_NAV} />
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="text-[10px] text-muted-foreground">
          <div className="font-medium text-foreground text-xs mb-0.5">Vincent Lepore</div>
          <div>Analytics &amp; Data Products</div>
          <div className="mt-1 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span>2023–2024 Synthetic Data</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
