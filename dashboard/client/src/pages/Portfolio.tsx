import { Link } from 'wouter';
import { ExternalLink, Github, Linkedin, Mail, Phone, MapPin, BarChart3, Brain, Database, TrendingUp, Award, Briefcase, ClipboardCheck, Sparkles, FlaskConical, FileText, BookOpen, GraduationCap } from 'lucide-react';

const CYAN   = "hsl(199 89% 48%)";
const PURPLE = "hsl(262 80% 65%)";
const GREEN  = "hsl(158 64% 52%)";

// ── Experience ────────────────────────────────────────────────────────────────
const experience = [
  {
    title: "Manager, Data and Analytics",
    company: "Sightline Payments",
    period: "Feb 2025 – May 2026",
    desc: "Analytics product owner for the Play+ digital wallet across MGM, Hard Rock, and FanDuel gaming operators. Reported to CFO. Led team of 3.",
    tags: ["Fintech", "Digital Wallet", "Product Analytics", "SQL", "Python"],
    color: CYAN,
  },
  {
    title: "Director, Data and Analytics",
    company: "IMG Academy & NCSA",
    period: "Dec 2023 – Feb 2025",
    desc: "Owned analytics product roadmap across enrollment, acquisition, lifecycle, pricing, and marketing. Led 4 local + 6 offshore. Reported to COO.",
    tags: ["Analytics Product Owner", "MMM", "MTA", "Team Leadership", "EdTech"],
    color: PURPLE,
  },
  {
    title: "Director, Business Intelligence and Analytics",
    company: "Tabacalera USA",
    period: "Mar 2020 – Dec 2023",
    desc: "Built analytics function from scratch reporting to CEO. Owned BI and data products across ecommerce, pricing, supply chain, marketing, and revenue.",
    tags: ["BI", "Data Products", "Forecasting", "CPG", "eCommerce"],
    color: GREEN,
  },
  {
    title: "Manager, BI and Marketing Analytics",
    company: "Pegula Sports and Entertainment",
    period: "May 2016 – Mar 2020",
    desc: "Analytics product owner for Buffalo Bills, Sabres, and Bandits. Pricing, ticketing, digital, sponsorship, and fan engagement analytics.",
    tags: ["Sports Analytics", "Ticketing", "Pricing", "Digital Analytics", "Loyalty"],
    color: CYAN,
  },
  {
    title: "AVP, Derivative Operations Analytics",
    company: "Citigroup",
    period: "Apr 2013 – May 2016",
    desc: "Led 18 analysts supporting derivatives trading operations, risk reporting, and process improvement. Delivered 50% efficiency improvement.",
    tags: ["Financial Services", "Operations", "Team Leadership", "Automation"],
    color: PURPLE,
  },
];

// ── Skills ────────────────────────────────────────────────────────────────────
const skills = [
  { category: "Analytics & Product Ownership", icon: Brain, items: ["Data Product Strategy", "Roadmap & Backlog", "User Stories", "Acceptance Criteria", "Agile / Scrum", "UAT & QA"] },
  { category: "Modeling & Measurement", icon: TrendingUp, items: ["MMM", "MTA", "A/B Testing", "Incrementality", "LTV Modeling", "Cohort Analysis", "Forecasting"] },
  { category: "Data Engineering & Platforms", icon: Database, items: ["SQL", "Python", "Snowflake", "BigQuery", "dbt", "Azure", "AWS", "Supabase"] },
  { category: "BI, Digital & AI", icon: BarChart3, items: ["Power BI", "Tableau", "GA4", "Adobe Analytics", "Semantic Layers", "AI-Assisted Analytics", "LLM Workflows"] },
];

// ── GitHub Projects ───────────────────────────────────────────────────────────
const projects = [
  {
    title: "Marketing Analytics Platform",
    desc: "Full-stack MMM, MTA, CAC, and CLV platform with HubSpot, Salesforce, and GA4 pipelines. Adstock/Hill saturation modeling, Shapley/Markov attribution.",
    tags: ["MMM", "MTA", "Python", "React"],
    href: "https://github.com/vjlepro/marketing-analytics-portfolio",
    color: CYAN,
  },
  {
    title: "Sales Forecasting and Pricing Dashboard",
    desc: "36-month history, 6-month forecast horizon, and 20-SKU price elasticity model. Built with MLForecast and LightGBM.",
    tags: ["Forecasting", "Pricing", "LightGBM", "React"],
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

// ── Featured Tools (internal routes) ─────────────────────────────────────────
const featuredTools = [
  {
    title: "A/B Testing Framework",
    desc: "Interactive experimentation tool with live statistical analysis, judgment-driven verdicts, and a logged test history across booking, search, and ticketing use cases.",
    tags: ["Experimentation", "Stats", "Data Products"],
    to: "/ab-testing",
    color: CYAN,
    icon: FlaskConical,
  },
  {
    title: "Data Product Spec",
    desc: "Confluence-style PRD for a Search and Shopping Behavior data product — field definitions, Adobe Analytics eVar mapping, star schema ERD, metric SLAs, and acceptance criteria.",
    tags: ["Data Product", "Adobe Analytics", "Snowflake", "ERD"],
    to: "/data-product-spec",
    color: GREEN,
    icon: FileText,
  },
  {
    title: "Metric Governance & Semantic Layer",
    desc: "Searchable KPI dictionary across Digital Commerce and Live Events — formula, source table, grain, owner, and governance notes for every metric.",
    tags: ["Metric Governance", "Semantic Layer", "KPI Design"],
    to: "/metric-governance",
    color: PURPLE,
    icon: BookOpen,
  },
  {
    title: "Analytics Maturity Scorecard",
    desc: "10-question self-assessment across Measurement, Infrastructure, Decision Culture, and AI maturity. Scores your org and delivers personalized recommendations.",
    tags: ["Interactive Tool", "Thought Leadership"],
    to: "/scorecard",
    color: CYAN,
    icon: ClipboardCheck,
  },
  {
    title: "AI Analyst — Executive Briefs",
    desc: "Three live executive briefs powered by a streaming GPT-4o-mini assistant grounded in each brief's dataset — marketing performance, pricing strategy, and forecast variance.",
    tags: ["AI", "GPT-4o-mini", "Streaming"],
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
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground mb-1">Vincent J. Lepore Jr.</h1>
              <p className="text-sm font-medium mb-3" style={{ color: CYAN }}>
                Analytics Product Owner &nbsp;·&nbsp; Data and Analytics Leader &nbsp;·&nbsp; Digital, Marketing, Product and BI
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Analytics product owner and data leader with 15+ years translating business needs into scalable data products,
                measurement frameworks, and executive decisions. Hands-on background in SQL, Python, data modeling, digital analytics,
                attribution, experimentation, forecasting, and AI-enabled analytics. Built analytics functions from the ground up at
                three companies and led teams across fintech, CPG, eCommerce, sports and entertainment, EdTech, and financial services.
                Currently pursuing an MS in Artificial Intelligence at the University of Colorado Boulder.
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
              This platform was designed and built independently to demonstrate the kind of work I lead and build — end-to-end, from data pipeline through modeling, product specification, governance, and AI-enabled analysis. Everything here runs on synthetic data modeled after real business contexts across digital commerce, fintech, sports, and eCommerce. The <strong className="text-foreground">Data Products</strong> section reflects TPO and data product ownership work: an A/B testing framework with statistical rigor and logged test history, a governed data product spec with Adobe Analytics instrumentation and Snowflake schema design, and a searchable metric governance dictionary. The <strong className="text-foreground">AI Analyst</strong> demonstrates an AI-augmented analytics workflow powered by GPT-4o-mini.
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
          <div>
            <SectionTitle><GraduationCap size={12} className="inline mr-1.5" />Education</SectionTitle>
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-4 flex gap-4">
                <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: CYAN }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-xs font-semibold text-foreground">MS in Artificial Intelligence</div>
                      <div className="text-xs font-medium" style={{ color: CYAN }}>University of Colorado Boulder</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">In Progress · Expected 2027</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Machine Learning: Theory and Hands-On Practice with Python · Supervised Learning, Deep Learning, AI Ethics, Applied AI</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 flex gap-4">
                <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: PURPLE }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Bachelor of Arts, Economics</div>
                      <div className="text-xs font-medium" style={{ color: PURPLE }}>University at Buffalo, SUNY</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
