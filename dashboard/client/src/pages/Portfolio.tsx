import { Link } from 'wouter';
import { ExternalLink, Github, Linkedin, Mail, Phone, MapPin, BarChart3, Brain, Database, TrendingUp, Award, Briefcase, ClipboardCheck, Sparkles } from 'lucide-react';

const CYAN = "hsl(199 89% 48%)";
const PURPLE = "hsl(262 80% 65%)";
const GREEN = "hsl(158 64% 52%)";

// ── Data ──────────────────────────────────────────────────────────────────────
const experience = [
  {
    title: "Manager, Data & Analytics",
    company: "Sightline Payments",
    period: "Feb 2025 – May 2026",
    desc: "Led analytics for Play+ digital wallet across MGM, Hard Rock, and FanDuel gaming operators. Reported to CFO.",
    tags: ["Gaming Analytics", "Fintech", "SQL", "Python"],
    color: CYAN,
  },
  {
    title: "Director, Data & Analytics",
    company: "IMG Academy & NCSA",
    period: "Dec 2023 – Feb 2025",
    desc: "Led team of 10 across 4 local + 6 offshore analysts. Delivered 10% conversion lift via MMM and multi-touch attribution.",
    tags: ["MMM", "MTA", "Team Leadership", "EdTech"],
    color: PURPLE,
  },
  {
    title: "Director, Business Intelligence & Analytics",
    company: "Tabacalera USA",
    period: "Mar 2020 – Dec 2023",
    desc: "Built analytics function from scratch, reporting to CEO. Delivered $75M revenue growth and 65% backorder reduction.",
    tags: ["BI", "Forecasting", "CPG", "Built from Scratch"],
    color: GREEN,
  },
  {
    title: "Manager, BI & Marketing Analytics",
    company: "Pegula Sports & Entertainment",
    period: "May 2016 – Mar 2020",
    desc: "Buffalo Bills & Sabres analytics. $10M+ unrealized revenue identified, 20% F&B revenue increase, fan loyalty program.",
    tags: ["Sports Analytics", "Pricing", "Loyalty", "Fan Engagement"],
    color: CYAN,
  },
  {
    title: "AVP, Derivative Operations Analytics",
    company: "Citigroup",
    period: "Apr 2013 – May 2016",
    desc: "Led 18 analysts across derivative operations. Delivered 50% operational efficiency improvement.",
    tags: ["Finance", "Operations", "Team Leadership"],
    color: PURPLE,
  },
];

const skills = [
  { category: "Analytics & Modeling", icon: Brain, items: ["MMM", "MTA", "Incrementality Testing", "Price Elasticity", "LTV Modeling", "Cohort Analysis", "A/B Testing", "Forecasting"] },
  { category: "Data Engineering", icon: Database, items: ["SQL", "Python", "dbt", "Fivetran", "Snowflake", "BigQuery", "AWS", "Azure"] },
  { category: "Visualization & BI", icon: BarChart3, items: ["Power BI", "Tableau", "Looker", "GA4", "Recharts", "D3.js"] },
  { category: "Platforms & Tools", icon: TrendingUp, items: ["HubSpot", "Salesforce", "R", "MLForecast", "LightGBM", "XGBoost", "Supabase", "Vercel"] },
];

// External-link projects
const projects = [
  {
    title: "Marketing Analytics Platform",
    desc: "Full-stack MMM, MTA, CAC, and CLV platform with HubSpot/Salesforce/GA4 pipelines, Adstock/Hill saturation modeling, and Shapley/Markov attribution.",
    tags: ["MMM", "MTA", "Python", "React"],
    href: "https://github.com/vjlepro/marketing-analytics-portfolio",
    color: CYAN,
  },
  {
    title: "Sales Forecasting & Pricing Dashboard",
    desc: "7-page dashboard with 36-month history, 6-month forecast horizon, and 20-SKU price elasticity model yielding +51.5% revenue uplift potential.",
    tags: ["Forecasting", "Pricing", "React", "Recharts"],
    href: "https://github.com/vjlepro/marketing-analytics-portfolio",
    color: PURPLE,
  },
  {
    title: "ML Forecasting Notebook",
    desc: "MLForecast + LightGBM across multiple revenue channels with confidence bands. Built in Google Colab.",
    tags: ["LightGBM", "MLForecast", "Python", "Colab"],
    href: "https://github.com/vjlepro/marketing-analytics-portfolio",
    color: GREEN,
  },
];

// Internal featured tools (link to route, not external URL)
const featuredTools = [
  {
    title: "Analytics Maturity Scorecard",
    desc: "10-question self-assessment across Measurement, Infrastructure, Decision Culture, and AI maturity. Scores your org, assigns a tier, and delivers personalized recommendations.",
    tags: ["Interactive Tool", "Thought Leadership", "React"],
    to: "/scorecard",
    color: GREEN,
    icon: ClipboardCheck,
  },
  {
    title: "AI Analyst — Executive Briefs",
    desc: "Three live executive briefs (marketing performance, pricing strategy, forecast variance) powered by a streaming GPT-4o-mini assistant grounded in each brief's dataset.",
    tags: ["AI", "GPT-4o-mini", "Streaming", "React"],
    to: "/ai-analyst",
    color: PURPLE,
    icon: Sparkles,
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">{children}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="px-8 py-8 border-b border-border bg-card/30">
        <div className="max-w-3xl">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Vincent J. Lepore Jr.</h1>
              <p className="text-sm font-medium mb-3" style={{ color: CYAN }}>
                Director of Analytics &nbsp;·&nbsp; 15+ Years Data &amp; Analytics Leadership
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Analytics leader specializing in marketing measurement, pricing strategy, and revenue optimization.
                Built analytics functions from scratch at three companies, led teams up to 10 analysts, and delivered
                measurable impact across gaming, sports, CPG, EdTech, and fintech.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <MapPin size={11} />
                <span>Fort Lauderdale, FL</span>
              </div>
            </div>

            {/* Contact / Links */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a href="https://www.linkedin.com/in/vincent-lepore-64873a58" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Linkedin size={13} style={{ color: "#0A66C2" }} /> LinkedIn
                <ExternalLink size={10} className="ml-auto opacity-50" />
              </a>
              <a href="https://github.com/vjlepro/marketing-analytics-portfolio" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Github size={13} /> GitHub Portfolio
                <ExternalLink size={10} className="ml-auto opacity-50" />
              </a>
              <a href="mailto:vjlepore@gmail.com"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Mail size={13} /> vjlepore@gmail.com
              </a>
              <a href="tel:7163419561"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <Phone size={13} /> 716-341-9561
              </a>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "Years Experience", value: "15+" },
              { label: "Teams Led", value: "Up to 10" },
              { label: "Revenue Impact", value: "$75M+" },
              { label: "Industries", value: "5+" },
            ].map(s => (
              <div key={s.label} className="bg-secondary rounded-lg px-3 py-2 flex flex-col">
                <span className="text-base font-bold text-foreground mono">{s.value}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl space-y-10">

          {/* Featured Interactive Tools */}
          <div>
            <SectionTitle><Sparkles size={12} className="inline mr-1.5" />Featured Tools</SectionTitle>
            <div className="space-y-3">
              {featuredTools.map((p, i) => (
                <Link key={i} href={p.to}>
                  <a className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p.icon size={13} style={{ color: p.color }} className="flex-shrink-0" />
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                          <span className="ml-2 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${p.color}20`, color: p.color }}>Live</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{p.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Portfolio Projects */}
          <div>
            <SectionTitle><Github size={12} className="inline mr-1.5" />Portfolio Projects</SectionTitle>
            <div className="space-y-3">
              {projects.map((p, i) => (
                <a key={i} href={p.href} target="_blank" rel="noreferrer"
                  className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{p.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <SectionTitle><Briefcase size={12} className="inline mr-1.5" />Experience</SectionTitle>
            <div className="space-y-3">
              {experience.map((e, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                  <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: e.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{e.title}</div>
                        <div className="text-xs font-medium" style={{ color: e.color }}>{e.company}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{e.period}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{e.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {e.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About this portfolio */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} style={{ color: CYAN }} />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">About This Portfolio</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This dashboard showcases end-to-end analytics work built with real synthetic data — from raw pipeline generation
              through multi-touch attribution, CAC/LTV modeling, and media mix modeling. The <strong className="text-foreground">AI Analyst</strong> page
              demonstrates an AI-augmented analytics workflow: three executive briefs backed by a streaming GPT-4o-mini assistant,
              grounded in the brief's dataset. Every model and visualization here was designed and built independently to reflect
              the kind of work I lead day-to-day.
            </p>
          </div>

          {/* Skills */}
          <div>
            <SectionTitle><Brain size={12} className="inline mr-1.5" />Skills &amp; Tools</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map(s => (
                <div key={s.category} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <s.icon size={13} style={{ color: CYAN }} />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{s.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.items.map(item => (
                      <span key={item} className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Education</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">B.S. Economics</div>
                <div className="text-[11px] text-muted-foreground">State University of New York at Buffalo</div>
              </div>
              <span className="text-[10px] text-muted-foreground">SUNY Buffalo</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
