import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Terminal, Code, Cpu, ShieldCheck, ArrowRight, Github } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Developer OS
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3 w-3" />
          The Unified Command Center for Developers
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Configure, Execute, and{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Automate Your Flow
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Stop digging through folders and terminals. Store your scripts, dynamic placeholders, project commands, and system configs in one ultra-premium dashboard.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 group"
          >
            {user ? "Launch Workspace" : "Access Developer OS"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            Star on GitHub
          </a>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 md:mt-36 w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Dynamic Commands</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Store custom templates with variables. Substitute placeholders in real-time and bulk-copy commands with a single click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Quick Snippets</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Keep critical bash configs, setup guidelines, and code commands cataloged under tags for quick retrieval.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 backdrop-blur-sm hover:border-sky-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-6">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">System Configs</h3>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Centralized tool settings and custom presets tailored specifically to boost your workspace execution flow.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Personal Command Center. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
            <span>Secure Dev-Environment Encryption</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
