import { useMemo, useState } from "react";
import {
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday as isDateToday,
  addMonths,
  subMonths
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Briefcase,
  Trash2,
  X,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";

interface GCalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  projectId?: string;
}

export function CalendarView() {
  const tasks = useTasks((s) => s.tasks);
  const projects = useTasks((s) => s.projects);
  const selectTask = useTasks((s) => s.selectTask);
  
  // Google Calendar Sync states/actions
  const gcalConnected = useTasks((s) => s.gcalConnected);
  const gcalEmail = useTasks((s) => s.gcalEmail);
  const gcalEvents = useTasks((s) => s.gcalEvents);
  const addGCalEvent = useTasks((s) => s.addGCalEvent);
  const updateGCalEvent = useTasks((s) => s.updateGCalEvent);
  const deleteGCalEvent = useTasks((s) => s.deleteGCalEvent);
  const syncGCal = useTasks((s) => s.syncGCal);

  // View settings
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  // Month grid calculation
  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Filtered GCal & Task Events
  const filteredGCalEvents = useMemo(() => {
    return gcalEvents.filter((event) => {
      if (filterProjectId === "all") return true;
      if (filterProjectId === "none") return !event.projectId;
      return event.projectId === filterProjectId;
    });
  }, [gcalEvents, filterProjectId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      if (filterProjectId === "all") return true;
      if (filterProjectId === "none") return !task.projectId;
      return task.projectId === filterProjectId;
    });
  }, [tasks, filterProjectId]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleOpenCreateModal = (day?: Date) => {
    setModalMode("create");
    setEditingEvent(null);
    setTitle("");
    const formattedDate = day ? format(day, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
    setStartDate(formattedDate);
    setStartTime("09:00");
    setEndDate(formattedDate);
    setEndTime("10:00");
    setDescription("");
    setProjectId("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: GCalEvent) => {
    setModalMode("edit");
    setEditingEvent(event);
    setTitle(event.title);
    
    // Parse event start and end
    try {
      const startParts = event.start.split("T");
      setStartDate(startParts[0]);
      if (startParts[1]) setStartTime(startParts[1].substring(0, 5));
      
      const endParts = event.end.split("T");
      setEndDate(endParts[0]);
      if (endParts[1]) setEndTime(endParts[1].substring(0, 5));
    } catch (e) {
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("09:00");
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setEndTime("10:00");
    }
    
    setDescription(event.description || "");
    setProjectId(event.projectId || "");
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) return;

    const startISO = `${startDate}T${startTime}:00`;
    const endISO = `${endDate}T${endTime}:00`;

    const eventPayload = {
      title: title.trim(),
      start: startISO,
      end: endISO,
      description: description.trim(),
      projectId: projectId || undefined,
    };

    if (modalMode === "create") {
      addGCalEvent(eventPayload);
    } else if (modalMode === "edit" && editingEvent) {
      updateGCalEvent(editingEvent.id, eventPayload);
    }

    setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
    if (editingEvent) {
      deleteGCalEvent(editingEvent.id);
      setIsModalOpen(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncGCal();
    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 max-w-[1280px] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Calendar Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan milestones, sync engineering events, and manage project schedules in one view.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project filter */}
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
          >
            <option value="all">All Projects</option>
            <option value="none">General / No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Sync Button */}
          {gcalConnected && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              Sync GCal
            </button>
          )}

          {/* Add Event Button */}
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {!gcalConnected && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card shadow-sm text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-cyan-500" />
            <span>Google Calendar is not synced. Connect your account in Settings to enable real-time two-way synchronization.</span>
          </div>
          <span className="text-[10px] text-cyan-500 uppercase tracking-wider font-semibold bg-cyan-500/10 px-2 py-0.5 rounded">Simulating Offline</span>
        </div>
      )}

      {gcalConnected && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-600 dark:text-green-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Connected to Google Calendar: <strong className="font-semibold">{gcalEmail}</strong></span>
          </div>
          <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Active Sync</span>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="flex-1 border border-border bg-card rounded-xl shadow-card overflow-hidden flex flex-col min-h-[500px]">
        {/* Calendar Nav Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/10 text-center py-2 text-xs font-bold text-muted-foreground/80 tracking-wide uppercase">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid Cells */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-border/20 gap-[1px]">
          {gridDays.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isDateToday(day);
            
            // Filter events for this specific day
            const dayGCalEvents = filteredGCalEvents.filter((e) =>
              isSameDay(parseISO(e.start), day)
            );
            
            const dayTasks = filteredTasks.filter((t) =>
              t.dueDate && isSameDay(parseISO(t.dueDate), day)
            );

            return (
              <div
                key={idx}
                onClick={() => handleOpenCreateModal(day)}
                className={cn(
                  "bg-card p-2 flex flex-col justify-between min-h-[90px] hover:bg-secondary/20 transition-colors cursor-pointer group relative",
                  !isCurrentMonth && "bg-card/40 opacity-40 text-muted-foreground"
                )}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center transition-colors",
                      isToday && "bg-primary text-primary-foreground font-black shadow-glow"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  
                  {/* Plus hover indicator */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground/60 font-semibold px-1 py-0.5 rounded border border-border bg-secondary">
                    + Add
                  </span>
                </div>

                {/* Day Items List */}
                <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px] scrollbar-none flex-1">
                  {/* GCal events */}
                  {dayGCalEvents.map((event) => {
                    const project = projects.find((p) => p.id === event.projectId);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(event);
                        }}
                        className="group/item flex flex-col p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium transition-all"
                        title={`${event.title} (${event.description || "No description"})`}
                      >
                        <div className="flex items-center gap-1 font-semibold truncate">
                          <CalendarIcon className="h-3 w-3 shrink-0 text-cyan-500" />
                          <span className="truncate">{event.title}</span>
                        </div>
                        {project && (
                          <span className="text-[9px] opacity-85 truncate mt-0.5 font-mono">
                            [{project.name}]
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Tasks */}
                  {dayTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    const isDone = task.status === "done";
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectTask(task.id);
                        }}
                        className={cn(
                          "group/item flex flex-col p-1.5 rounded border text-[11px] font-medium transition-all",
                          isDone
                            ? "bg-muted text-muted-foreground border-border/40 line-through"
                            : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-600 dark:text-purple-400"
                        )}
                        title={`Task: ${task.title}`}
                      >
                        <div className="flex items-center gap-1 truncate font-semibold">
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0 text-purple-500" />
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                        {project && (
                          <span className="text-[9px] opacity-85 truncate mt-0.5 font-mono">
                            [{project.name}]
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Glassmorphic Event Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in select-text">
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-card overflow-hidden flex flex-col bg-opacity-95 backdrop-blur-md">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                {modalMode === "create" ? "Schedule Google Calendar Event" : "Edit Google Calendar Event"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
              
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-title">
                  Event Title *
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  placeholder="e.g. Engineering Sync, Release QA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-start-date">
                    Start Date *
                  </label>
                  <input
                    id="event-start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-start-time">
                    Start Time *
                  </label>
                  <input
                    id="event-start-time"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-end-date">
                    End Date *
                  </label>
                  <input
                    id="event-end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-end-time">
                    End Time *
                  </label>
                  <input
                    id="event-end-time"
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              {/* Project Linkage */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-project">
                  Linked Workspace Project
                </label>
                <div className="relative">
                  <select
                    id="event-project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground appearance-none"
                  >
                    <option value="">General / None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Briefcase className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="event-description">
                  Event Description
                </label>
                <textarea
                  id="event-description"
                  rows={3}
                  placeholder="Sync notes, agenda, or location information..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <div>
                  {modalMode === "edit" && (
                    <button
                      type="button"
                      onClick={handleDeleteEvent}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition-colors"
                  >
                    {modalMode === "create" ? "Create Event" : "Save Changes"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
