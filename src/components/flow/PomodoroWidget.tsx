import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "work" | "shortBreak" | "longBreak";

const DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      endRef.current = null;
      return;
    }
    
    // Resume or start
    if (!endRef.current) {
      endRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      if (!endRef.current) return;
      const remaining = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setIsActive(false);
        endRef.current = null;
        
        // Auto-switch mode
        if (mode === "work") {
          const nextCycles = cycles + 1;
          setCycles(nextCycles);
          if (nextCycles % 4 === 0) {
            setMode("longBreak");
            setTimeLeft(DURATIONS.longBreak);
          } else {
            setMode("shortBreak");
            setTimeLeft(DURATIONS.shortBreak);
          }
        } else {
          setMode("work");
          setTimeLeft(DURATIONS.work);
        }
        
        // Play sound
        try {
          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, cycles]);

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      endRef.current = Date.now() + timeLeft * 1000;
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    endRef.current = null;
    setTimeLeft(DURATIONS[mode]);
  };

  const changeMode = (m: TimerMode) => {
    setIsActive(false);
    endRef.current = null;
    setMode(m);
    setTimeLeft(DURATIONS[m]);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-20 h-12 px-4 rounded-full bg-card border border-border shadow-glow flex items-center gap-2 hover:bg-secondary/80 transition-all z-50 group"
      >
        <Brain className={cn("h-4 w-4", isActive ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="font-mono text-sm font-bold text-foreground tabular-nums">
          {mins}:{secs}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[280px] rounded-2xl border border-border bg-card/95 backdrop-blur shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Brain className="h-3.5 w-3.5" /> Focus Mode
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 grid place-items-center rounded hover:bg-secondary text-muted-foreground transition-colors"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 flex flex-col items-center">
        <div className="flex bg-secondary/50 p-1 rounded-lg w-full mb-4">
          <button
            onClick={() => changeMode("work")}
            className={cn("flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-colors", mode === "work" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Work
          </button>
          <button
            onClick={() => changeMode("shortBreak")}
            className={cn("flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-colors", mode === "shortBreak" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Short
          </button>
          <button
            onClick={() => changeMode("longBreak")}
            className={cn("flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-colors", mode === "longBreak" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Long
          </button>
        </div>

        <div className="text-5xl font-mono font-black tracking-tight text-foreground tabular-nums drop-shadow-sm mb-4">
          {mins}:{secs}
        </div>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={toggleTimer}
            className={cn(
              "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors",
              isActive ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
          </button>
          <button
            onClick={resetTimer}
            className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-secondary/20 border-t border-border/50 text-center">
        <span className="text-[10px] font-semibold text-muted-foreground">
          Completed Cycles: <span className="text-foreground">{cycles}</span>
        </span>
      </div>
    </div>
  );
}
