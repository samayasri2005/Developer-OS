import { CheckCircle2, Command, LayoutGrid, Target } from "lucide-react";

interface Props {
  kicker: string;
  title: string;
  subtitle: string;
}

export const AuthVisualPanel = ({ kicker, title, subtitle }: Props) => (
  <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary-glow text-primary-foreground">
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-glow/60 blur-3xl" />
    </div>

    <div className="relative z-10 flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur grid place-items-center border border-white/20">
        <Command className="w-4 h-4" />
      </div>
      <span className="font-semibold tracking-tight">Developer OS</span>
    </div>

    <div className="relative z-10 space-y-8 animate-fade-in">
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-widest opacity-70">{kicker}</div>
        <h2 className="text-4xl font-semibold tracking-tight leading-tight max-w-sm">{title}</h2>
        <p className="text-base opacity-80 max-w-sm leading-relaxed">{subtitle}</p>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4 text-xs opacity-80">
          <div className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Today</div>
          <span className="font-mono">3 / 8</span>
        </div>
        <div className="space-y-2">
          {[
            { t: "Ship v1.2 release", d: true },
            { t: "Review PR #428", d: true },
            { t: "Pair on auth bug", d: false },
            { t: "Write release notes", d: false },
          ].map((i) => (
            <div key={i.t} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className={`w-4 h-4 ${i.d ? "" : "opacity-40"}`} />
              <span className={i.d ? "line-through opacity-60" : ""}>{i.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs opacity-80">
        <div className="flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Kanban</div>
        <div className="flex items-center gap-1.5"><Command className="w-3.5 h-3.5" /> ⌘K palette</div>
        <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Focus</div>
      </div>
    </div>

    <div className="relative z-10 text-xs opacity-70">
      "It's the only task app I haven't quit." — A developer, somewhere.
    </div>
  </div>
);
