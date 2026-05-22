import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowRight, Github, Sun, Moon, Calendar, LayoutGrid, FileText, CheckCircle2 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleCTA = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans overflow-x-hidden relative selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-border/50 bg-background/70 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Developer OS Logo" className="h-6 w-6 object-contain" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Developer OS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="h-9 w-9 grid place-items-center rounded-xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-card border border-border hover:bg-secondary transition-colors"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          The Unified Personal Workspace for Developers
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight text-balance">
          Organize Your Day, Tasks, and{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Notes in One Workspace
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Stop context switching between separate apps. Plan your schedule, manage deliverables on kanban boards, jot down notes, and map custom commands in a single premium dashboard.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 group"
          >
            {user ? "Launch Workspace" : "Access Developer OS"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            Star on GitHub
          </a>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 md:mt-36 w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Calendar & Today View */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Today's Agenda</h3>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Track tasks due today, check upcoming schedules, and manage your focus items with an integrated calendar planner designed for rapid execution.
            </p>
          </div>

          {/* Kanban Board */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Interactive Board</h3>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Organize workflows with drag-and-drop status pipelines (Todo, Doing, Done). Group items by custom folders and assign priority levels.
            </p>
          </div>

          {/* Quick Notes & Commands */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Notes & Cmd Palette</h3>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Jot down thoughts instantly with lightweight styled text notes. Maintain quick command templates with parameter substitution helper utilities.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 bg-background/50 py-8 text-center text-muted-foreground text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Personal Command Center. All rights reserved.</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Developer Productivity Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
