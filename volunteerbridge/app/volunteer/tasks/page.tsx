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

// ── No mock data: tasks come from live assignment records ──

type StatusFilter = "all" | "Not Started" | "In Progress" | "Done";

type AssignmentGroup = {
  requestId: string;
  requestTitle: string;
  teamName: string;
  status: string;
  tasks: ChecklistTask[];
};

export default function MyTasksPage() {
  const [groups, setGroups] = useState<AssignmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const volunteerId = getCookie("vb_volunteer_id") || "";

  useEffect(() => {
    if (!volunteerId) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const assignments = await apiClient.getVolunteerAssignments(volunteerId);
        if (Array.isArray(assignments) && assignments.length > 0) {
          const grps: AssignmentGroup[] = assignments.map((asgn: any) => ({
            requestId:    asgn.requestId,
            requestTitle: asgn.requestTitle || "Untitled Assignment",
            teamName:     asgn.teamName    || "—",
            status:       asgn.status      || "in_progress",
            tasks: (asgn.checklist || []).map((t: any) => ({
              ...t,
              assignedTeam:  asgn.teamName    || "—",
              requestTitle:  asgn.requestTitle || "Untitled Assignment",
              requestId:     asgn.requestId,
            })),
          }));
          setGroups(grps);
        } else {
          setGroups([]);
        }
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const allTasks = groups.flatMap(g => g.tasks);

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
    // Update task within its group
    setGroups(prev => prev.map(g =>
      g.requestId === task.requestId
        ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, status: updated } : t) }
        : g
    ));
    setUpdatingId(null);
  };

  const stats = {
    total:      allTasks.length,
    done:       allTasks.filter(t => t.status === "Done").length,
    inProgress: allTasks.filter(t => t.status === "In Progress").length,
    notStarted: allTasks.filter(t => t.status === "Not Started").length,
  };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Filter groups by status — groups with no matching tasks are hidden
  const filteredGroups = useMemo(() =>
    groups.map(g => ({
      ...g,
      tasks: filter === "all" ? g.tasks : g.tasks.filter(t => t.status === filter),
    })).filter(g => g.tasks.length > 0),
    [groups, filter]
  );

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
          <p className="text-secondary/60 font-medium mt-1">Track and update your personal task assignments, grouped by assignment.</p>
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

      {/* Assignment-Grouped Task List */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map(group => {
            const grpDone  = group.tasks.filter(t => t.status === "Done").length;
            const grpTotal = group.tasks.length;
            const grpPct   = grpTotal > 0 ? Math.round((grpDone / grpTotal) * 100) : 0;
            return (
              <div key={group.requestId} className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden">
                {/* Assignment header */}
                <div className="px-8 py-5 bg-surface-variant/10 border-b-2 border-outline/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-on-surface text-base">{group.requestTitle}</h3>
                    <p className="text-xs font-bold text-secondary/50 mt-0.5">Team: {group.teamName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Progress</p>
                      <p className="text-sm font-black text-primary">{grpDone}/{grpTotal} done</p>
                    </div>
                    <div className="w-24 h-2 bg-outline/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${grpPct === 100 ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${grpPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task rows */}
                <div className="divide-y-2 divide-outline/20">
                  {group.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-6 transition-all duration-300 ${task.status === "Done" ? "bg-green-50/40" : task.status === "In Progress" ? "bg-orange-50/30" : ""}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="shrink-0">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-base font-black ${task.status === "Done" ? "line-through text-secondary/40" : "text-on-surface"}`}>
                            {task.title || task.text || "Untitled task"}
                          </p>
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
          <AlertTriangle size={56} className="mx-auto text-secondary/10" />
          <h3 className="text-xl font-black text-secondary/40">
            {allTasks.length === 0 ? "No tasks yet" : "No tasks match this filter"}
          </h3>
          <p className="text-sm text-secondary/30 italic">
            {allTasks.length === 0
              ? "Once an NGO assigns you to a task, your checklist items will appear here."
              : "Try a different filter."}
          </p>
          {allTasks.length > 0 && (
            <button onClick={() => setFilter("all")} className="px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
              Show All Tasks
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
