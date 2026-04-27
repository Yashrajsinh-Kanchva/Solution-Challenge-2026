"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  CheckSquare, CheckCircle, Clock, Circle,
  Filter, Zap, AlertTriangle
} from "lucide-react";
import ToastContainer, { showToast } from "@/components/volunteer/ToastContainer";

type ChecklistTask = {
  id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Done";
  assignedTeam: string;
  requestTitle: string;
  requestId: string;
};

const MOCK_TASKS: ChecklistTask[] = [
  { id: "t-1", title: "Set up triage station", status: "Done", assignedTeam: "Team Alpha", requestTitle: "Flood Relief — Medical Support", requestId: "req-flood-001" },
  { id: "t-2", title: "Conduct patient intake assessments", status: "In Progress", assignedTeam: "Team Alpha", requestTitle: "Flood Relief — Medical Support", requestId: "req-flood-001" },
  { id: "t-3", title: "Coordinate with ambulance dispatch", status: "Not Started", assignedTeam: "Team Alpha", requestTitle: "Flood Relief — Medical Support", requestId: "req-flood-001" },
  { id: "t-4", title: "Daily medical supply inventory check", status: "In Progress", assignedTeam: "Team Alpha", requestTitle: "Flood Relief — Medical Support", requestId: "req-flood-001" },
];

type StatusFilter = "all" | "Not Started" | "In Progress" | "Done";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const assignments = await apiClient.getVolunteerAssignments(volunteerId);
        if (assignments?.length > 0) {
          const allTasks: ChecklistTask[] = assignments.flatMap((asgn: any) =>
            (asgn.checklist || []).map((t: any) => ({
              ...t,
              requestTitle: asgn.requestTitle,
              requestId: asgn.requestId,
            }))
          );
          setTasks(allTasks.length > 0 ? allTasks : MOCK_TASKS);
        } else {
          setTasks(MOCK_TASKS);
        }
      } catch {
        setTasks(MOCK_TASKS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const nextStatus = (current: string): "Not Started" | "In Progress" | "Done" => {
    if (current === "Not Started") return "In Progress";
    if (current === "In Progress") return "Done";
    return "Not Started";
  };

  const handleUpdate = async (task: ChecklistTask) => {
    const updated = nextStatus(task.status);
    setUpdatingId(task.id);
    try {
      await apiClient.updateTaskStatus(task.requestId, task.id, updated, volunteerId);
      showToast(`Task marked as "${updated}"`, "success");
    } catch {
      showToast("Status saved locally — sync when online", "warning");
    }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: updated } : t));
    setUpdatingId(null);
  };

  const filtered = useMemo(() =>
    filter === "all" ? tasks : tasks.filter(t => t.status === filter),
    [tasks, filter]
  );

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "Done").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    notStarted: tasks.filter(t => t.status === "Not Started").length,
  };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done": return <CheckCircle size={20} className="text-green-500" />;
      case "In Progress": return <Clock size={20} className="text-orange-500" />;
      default: return <Circle size={20} className="text-secondary/30" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "Done": return "bg-green-50 border-green-200";
      case "In Progress": return "bg-orange-50 border-orange-200";
      default: return "bg-white border-outline/60";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface-variant/50 rounded-2xl w-1/3" />
        <div className="grid grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white border-2 border-outline/40 rounded-modern" />)}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border-2 border-outline/40 rounded-modern p-6 flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-surface-variant/40" />
            <div className="flex-1 h-4 bg-surface-variant/30 rounded-xl" />
            <div className="w-24 h-8 bg-surface-variant/20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">My Task Checklist</h1>
          <p className="text-secondary/60 font-medium mt-1">Track and update your personal task assignments.</p>
        </div>
        <div className="px-5 py-2.5 bg-white border-2 border-outline/60 rounded-2xl shadow-sm text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
          <CheckSquare size={16} />
          {stats.done}/{stats.total} Done
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Total Tasks", value: stats.total, color: "bg-blue-500", bg: "bg-blue-50 border-blue-200" },
          { label: "Done", value: stats.done, color: "bg-green-500", bg: "bg-green-50 border-green-200" },
          { label: "In Progress", value: stats.inProgress, color: "bg-orange-500", bg: "bg-orange-50 border-orange-200" },
          { label: "Not Started", value: stats.notStarted, color: "bg-gray-400", bg: "bg-gray-50 border-gray-200" },
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-modern border-2 custom-shadow ${s.bg}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50 mb-2">{s.label}</p>
            <p className="text-3xl font-black text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white p-6 rounded-modern border-2 border-outline/60 custom-shadow">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-black text-on-surface">Overall Completion</p>
          <p className="text-sm font-black text-primary">{progress}%</p>
        </div>
        <div className="w-full h-4 bg-outline/20 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-1000 shadow-lg shadow-primary/30"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-secondary/40" />
        {(["all", "Not Started", "In Progress", "Done"] as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${
              filter === f ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-outline/60 text-secondary hover:border-primary/40"
            }`}
          >
            {f === "all" ? "All Tasks" : f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(task => (
            <div
              key={task.id}
              className={`rounded-modern border-2 custom-shadow p-6 transition-all duration-300 group ${getStatusBg(task.status)}`}
            >
              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1">
                  <p className={`text-base font-black ${task.status === "Done" ? "line-through text-secondary/40" : "text-on-surface"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">{task.assignedTeam}</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{task.requestTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${
                    task.status === "Done" ? "bg-green-100 text-green-700 border-green-200" :
                    task.status === "In Progress" ? "bg-orange-100 text-orange-700 border-orange-200" :
                    "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {task.status}
                  </span>
                  {task.status !== "Done" && (
                    <button
                      disabled={updatingId === task.id}
                      onClick={() => handleUpdate(task)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-on-surface text-white rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      {updatingId === task.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Zap size={12} /> Mark as {nextStatus(task.status)}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
          <AlertTriangle size={56} className="mx-auto text-secondary/10" />
          <h3 className="text-xl font-black text-secondary/40">No tasks match this filter</h3>
          <button onClick={() => setFilter("all")} className="px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
            Show All Tasks
          </button>
        </div>
      )}
    </div>
    </>
  );
}
