import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, LayoutGrid, Calendar, FileText, Command,
  Zap, Inbox, Target, Github, Keyboard, Code2, CheckCircle2,
  GitBranch, Bell, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Nav = () => (
  <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
    <div className="max-w-7xl mx-auto h-14 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">Developer OS</span>
      </Link>
      <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
        <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
        <a href="#dev" className="hover:text-foreground transition-colors">For Developers</a>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/signin" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">Sign in</Link>
        <Button asChild size="sm" className="rounded-full px-4 bg-gradient-primary hover:opacity-95 border-0">
          <Link to="/signup">Get started <ArrowRight className="w-3.5 h-3.5" /></Link>
        </Button>
      </div>
    </div>
  </header>
);

const MockKanban = () => (
  <div className="rounded-2xl glass-strong p-4 w-[360px] animate-fade-in">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium">Sprint Board</span>
      </div>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-priority-high/70" />
        <span className="w-1.5 h-1.5 rounded-full bg-priority-medium/70" />
        <span className="w-1.5 h-1.5 rounded-full bg-status-done/70" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { t: "Todo", items: ["Auth flow", "Webhook retry"], c: "bg-secondary" },
        { t: "Doing", items: ["Refactor parser"], c: "bg-tile-sky" },
        { t: "Done", items: ["v1.2 ship"], c: "bg-tile-mint" },
      ].map((col) => (
        <div key={col.t} className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{col.t}</div>
          {col.items.map((i) => (
            <div key={i} className={`${col.c} rounded-md px-2 py-1.5 text-[11px] border border-border/60`}>{i}</div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const MockToday = () => (
  <div className="rounded-2xl glass-strong p-4 w-[320px] animate-fade-in">
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Today</div>
        <div className="text-sm font-semibold">Focus session</div>
      </div>
      <Target className="w-4 h-4 text-primary" />
    </div>
    <div className="space-y-1.5">
      {[
        { t: "Review PR #428", d: true },
        { t: "Write release notes", d: false },
        { t: "Pair on auth bug", d: false },
      ].map((i) => (
        <div key={i.t} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition-colors">
          <CheckCircle2 className={`w-3.5 h-3.5 ${i.d ? "text-status-done" : "text-muted-foreground/50"}`} />
          <span className={`text-[12px] ${i.d ? "line-through text-muted-foreground" : ""}`}>{i.t}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
      <span>3 of 8 done</span>
      <span className="text-primary font-medium">37%</span>
    </div>
  </div>
);

const MockNote = () => (
  <div className="rounded-2xl glass-strong p-4 w-[280px] animate-fade-in">
    <div className="flex items-center gap-2 mb-2">
      <FileText className="w-3.5 h-3.5 text-accent" />
      <span className="text-xs font-medium">debug-notes.md</span>
    </div>
    <div className="text-[11px] font-mono bg-secondary/70 rounded-md p-2 border border-border/60 leading-relaxed">
      <div className="text-muted-foreground"># Auth race condition</div>
      <div>session refresh fires</div>
      <div>before user.load() →</div>
      <div className="text-primary">await Promise.all([...])</div>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-gradient-glow" />
    <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-7 animate-fade-in">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-border bg-card/60 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-status-done animate-pulse-glow" />
          New — Command Palette ⌘K
        </div>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
          Your Developer<br />
          <span className="gradient-text">Operating System</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
          A personal execution system for developers. Tasks, kanban, notes, and recurring work — unified in a fast, keyboard-first surface.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full px-6 bg-gradient-primary hover:opacity-95 border-0 shadow-glow">
            <Link to="/signup">Get started <ArrowRight className="w-4 h-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link to="/signin">View demo</Link>
          </Button>
        </div>
        <div className="flex items-center gap-5 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Keyboard className="w-3.5 h-3.5" /> Keyboard-first</div>
          <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant capture</div>
          <div className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> Built for devs</div>
        </div>
      </div>

      <div className="relative h-[460px] hidden lg:block">
        <div className="absolute right-0 top-4 rotate-[2deg] shadow-elev"><MockKanban /></div>
        <div className="absolute left-0 top-28 -rotate-[3deg] shadow-elev"><MockToday /></div>
        <div className="absolute right-8 bottom-0 rotate-[1deg] shadow-elev"><MockNote /></div>
        <div className="absolute -z-10 inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
      </div>
    </div>
  </section>
);

const Pillars = () => (
  <section className="border-y border-border/60 bg-card/40">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { i: Keyboard, t: "Keyboard-first", d: "Every action, one shortcut away." },
        { i: GitBranch, t: "Recurring tasks", d: "Daily rituals that just work." },
        { i: Target, t: "Smart priority", d: "Focus on what moves the needle." },
        { i: FileText, t: "Developer notes", d: "Markdown + code, linked to tasks." },
      ].map(({ i: Icon, t, d }) => (
        <div key={t} className="space-y-2">
          <Icon className="w-5 h-5 text-primary" />
          <div className="font-medium text-sm">{t}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{d}</div>
        </div>
      ))}
    </div>
  </section>
);

const FEATURES = [
  { i: Target, t: "Today Dashboard", d: "Your daily mission control with focus, priorities, and progress." },
  { i: LayoutGrid, t: "Kanban Boards", d: "Drag-driven workflow with Todo, Doing, and Done lanes." },
  { i: Zap, t: "Focus Mode", d: "Distraction-free single-task view with timers." },
  { i: Inbox, t: "Inbox", d: "Capture now, sort later. Zero friction entry." },
  { i: FileText, t: "Notes & Context", d: "Markdown notes linked bidirectionally to tasks." },
  { i: Sparkles, t: "Quick Add", d: "Type `p2 #api /daily` — natural parsing built in." },
  { i: Command, t: "Command Palette", d: "⌘K to jump anywhere, do anything, instantly." },
  { i: Calendar, t: "Recurring Rituals", d: "Daily, weekly, custom cycles handled cleanly." },
];

const Features = () => (
  <section id="features" className="max-w-7xl mx-auto px-6 py-24">
    <div className="max-w-2xl mb-14">
      <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Features</div>
      <h2 className="text-4xl font-semibold tracking-tight">Everything you need.<br />Nothing you don't.</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {FEATURES.map(({ i: Icon, t, d }) => (
        <div key={t} className="group rounded-2xl border border-border bg-card p-5 surface-hover">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 grid place-items-center mb-4 group-hover:bg-gradient-primary transition-colors">
            <Icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <div className="font-medium text-sm mb-1.5">{t}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{d}</div>
        </div>
      ))}
    </div>
  </section>
);

const Workflow = () => (
  <section id="workflow" className="relative">
    <div className="absolute inset-0 -z-10 bg-gradient-glow opacity-50" />
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Workflow</div>
        <h2 className="text-4xl font-semibold tracking-tight">Capture. Organize. Focus. Ship.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {[
          { n: "01", t: "Capture", d: "Quick Add anywhere with ⌘N. Natural language parsed instantly." },
          { n: "02", t: "Organize", d: "Tags, priorities, projects. Kanban or list — your choice." },
          { n: "03", t: "Focus", d: "Today view + Focus mode. One task at a time." },
          { n: "04", t: "Ship", d: "Mark done, log learnings, repeat tomorrow." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl bg-card border border-border p-6 surface-hover">
            <div className="text-xs font-mono text-primary mb-3">{s.n}</div>
            <div className="font-semibold mb-2">{s.t}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const DevSection = () => (
  <section id="dev" className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">For Developers</div>
      <h2 className="text-4xl font-semibold tracking-tight mb-5">Built the way you think.</h2>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Code blocks in notes, GitHub links on tasks, ⌘K everywhere. Designed to disappear into your flow — not interrupt it.
      </p>
      <ul className="space-y-3 text-sm">
        {[
          { i: Github, t: "Attach GitHub issues, PRs, and repos to any task" },
          { i: Code2, t: "Fenced code blocks render perfectly in notes" },
          { i: Keyboard, t: "30+ keyboard shortcuts — no mouse required" },
          { i: Zap, t: "Sub-50ms interactions, everywhere" },
        ].map(({ i: Icon, t }) => (
          <li key={t} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-secondary border border-border grid place-items-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-muted-foreground pt-1">{t}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-elev">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/50">
        <div className="w-2.5 h-2.5 rounded-full bg-priority-high/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-priority-medium/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-status-done/60" />
        <div className="ml-3 text-[11px] text-muted-foreground font-mono">~/devos/notes/api-refactor.md</div>
      </div>
      <pre className="p-5 text-[12px] font-mono leading-relaxed text-foreground/90 overflow-x-auto">
{`# API Refactor — Sprint 12

## Issue
Race condition on token refresh.

## Fix
\`\`\`ts
const [user, session] = await Promise.all([
  loadUser(),
  refreshSession(),
]);
\`\`\`

- linked: #task/4821
- pr: github.com/team/api/pull/428`}
      </pre>
    </div>
  </section>
);

const Showcase = () => (
  <section id="showcase" className="relative">
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Product</div>
        <h2 className="text-4xl font-semibold tracking-tight">Designed to feel inevitable.</h2>
      </div>
      <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-elev">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="grid grid-cols-12 min-h-[480px]">
          <div className="col-span-2 border-r border-border p-4 space-y-2 bg-sidebar">
            {["Today", "Inbox", "Board", "Upcoming", "Notes"].map((v, i) => (
              <div key={v} className={`text-xs px-3 py-2 rounded-lg ${i === 0 ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground"}`}>{v}</div>
            ))}
          </div>
          <div className="col-span-10 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Friday</div>
                <div className="text-2xl font-semibold tracking-tight">Good morning, ship something.</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg border border-border bg-secondary/60 text-xs text-muted-foreground flex items-center gap-2">
                  <Search className="w-3 h-3" /> Search or jump…
                  <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-card border border-border">⌘K</kbd>
                </div>
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { l: "Focus", v: "4h 20m", c: "bg-tile-sky" },
                { l: "Done today", v: "7", c: "bg-tile-mint" },
                { l: "In progress", v: "3", c: "bg-tile-peach" },
                { l: "Streak", v: "12d", c: "bg-tile-pink" },
              ].map((s) => (
                <div key={s.l} className={`rounded-xl p-4 border border-border/70 ${s.c}`}>
                  <div className="text-[10px] uppercase tracking-wider text-foreground/60 font-semibold">{s.l}</div>
                  <div className="text-xl font-semibold mt-1">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {["Review PR #428 — auth race condition", "Write release notes for v1.2", "Pair with Sam on webhook retry", "Update onboarding doc"].map((t, i) => (
                <div key={t} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background/60 surface-hover">
                  <CheckCircle2 className={`w-4 h-4 ${i < 1 ? "text-status-done" : "text-muted-foreground/40"}`} />
                  <span className={`text-sm ${i < 1 ? "line-through text-muted-foreground" : ""}`}>{t}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">p{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="relative py-28">
    <div className="absolute inset-0 -z-10 bg-gradient-glow" />
    <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
      <h2 className="text-5xl font-semibold tracking-tight text-balance">
        Build your <span className="gradient-text">workflow</span>.
      </h2>
      <p className="text-muted-foreground text-lg max-w-xl mx-auto">
        Start organizing like a developer. Free forever for personal use.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Button asChild size="lg" className="rounded-full px-8 bg-gradient-primary hover:opacity-95 border-0 shadow-glow">
          <Link to="/signup">Get started <ArrowRight className="w-4 h-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-8">
          <Link to="/signin">Try the demo</Link>
        </Button>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border/60">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
      <div className="col-span-2 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-primary grid place-items-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Developer OS</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs">The personal execution system for developers who ship.</p>
      </div>
      {[
        { h: "Product", l: ["Features", "Workflow", "Changelog"] },
        { h: "Resources", l: ["Docs", "GitHub", "Community"] },
        { h: "Company", l: ["Privacy", "Terms", "Contact"] },
      ].map((c) => (
        <div key={c.h}>
          <div className="text-xs font-semibold mb-3">{c.h}</div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {c.l.map((x) => <li key={x}><a className="hover:text-foreground transition-colors" href="#">{x}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border/60 py-5 text-center text-[11px] text-muted-foreground">
      © 2026 Developer OS. Crafted for builders.
    </div>
  </footer>
);

const Landing = () => (
  <div className="min-h-screen">
    <Nav />
    <main>
      <Hero />
      <Pillars />
      <Features />
      <Workflow />
      <DevSection />
      <Showcase />
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

export default Landing;
