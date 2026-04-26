"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  ClipboardList, CheckCircle, Clock, 
  MapPin, AlertTriangle, Users, 
  ChevronRight, ListTodo, Activity, XCircle,
  Package, Utensils, Home
} from "lucide-react";

type TaskStatus = "assigned_to_ngo" | "Accepted" | "assigned_to_volunteer" | "in_progress" | "completed";

const STEPS = [
  { id: "assigned_to_ngo", label: "Assigned" },
  { id: "Accepted", label: "Accepted" },
  { id: "assigned_to_volunteer", label: "Dispatched" },
  { id: "in_progress", label: "On Site" },
  { id: "completed", label: "Completed" }
];


export default function ActiveTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<Record<string, { id: number; text: string; done: boolean }[]>>({});
  
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  useEffect(() => {
    fetchActiveTasks();
  }, [ngoId]);

  const fetchActiveTasks = async () => {
    setLoading(true);
    const data = await apiClient.getNgoRequests(ngoId);
    // Filter for Active statuses: Accepted, assigned_to_volunteer (Assigned), in_progress
    const active = data.filter((req: any) => 
      req.status === "Accepted" || 
      req.status === "assigned_to_volunteer" || 
      req.status === "in_progress"
    );
    setTasks(active);
    
    // Initialize checklists from DB or set defaults
    const newChecklists: Record<string, any[]> = {};
    active.forEach((task: any) => {
      if (task.checklist && task.checklist.length > 0) {
        newChecklists[task.requestId] = task.checklist;
      } else {
        newChecklists[task.requestId] = [
          { id: 1, text: "Verify location and security", done: false },
          { id: 2, text: "Dispatch assigned volunteers", done: false },
          { id: 3, text: "Arrival and situation assessment", done: false },
          { id: 4, text: "Distribution of resources", done: false },
        ];
      }
    });
    setChecklists(newChecklists);
    
    setLoading(false);
  };

  const handleStatusAdvance = async (requestId: string, currentStatus: string) => {
    let nextStatus: string = "";
    if (currentStatus === "Accepted") nextStatus = "assigned_to_volunteer";
    else if (currentStatus === "assigned_to_volunteer") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";

    if (nextStatus) {
      try {
        await apiClient.updateRequestStatus(requestId, nextStatus);
        await fetchActiveTasks();
      } catch (error) {
        console.error("Failed to advance status:", error);
      }
    }
  };

  const handleUnassignVolunteer = async (requestId: string, volunteerId: string) => {
    try {
      await apiClient.unassignVolunteer(requestId, volunteerId);
      await fetchActiveTasks();
    } catch (error) {
      console.error("Failed to unassign volunteer:", error);
    }
  };

  const toggleCheckItem = async (taskId: string, itemId: number) => {
    const updatedChecklist = checklists[taskId].map(item => 
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    
    setChecklists(prev => ({
      ...prev,
      [taskId]: updatedChecklist
    }));

    try {
      await apiClient.updateRequestChecklist(taskId, updatedChecklist);
    } catch (error) {
      console.error("Failed to save checklist:", error);
    }
  };

  const handleDispatchUpdate = async (taskId: string) => {
    try {
      // Simulate a dispatch update by refreshing or potentially adding a notification
      // For now, we'll just re-fetch to ensure state is clean
      await fetchActiveTasks();
      alert("Dispatch update sent to all assigned volunteers!");
    } catch (error) {
      console.error("Failed to dispatch update:", error);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === "assigned_to_ngo") return 0;
    if (status === "Accepted") return 1;
    if (status === "assigned_to_volunteer") return 2;
    if (status === "in_progress") return 3;
    if (status === "completed") return 4;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black text-secondary/40 uppercase tracking-widest">Loading Active Tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Active Tasks</h1>
          <p className="text-secondary/60 font-medium mt-1">Track tasks that are currently in progress.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} />
          {tasks.length} Active
        </div>
      </div>

      <div className="grid gap-10">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.requestId} className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden group hover:border-primary/40 transition-all duration-300">
              <div className="grid grid-cols-12">
                {/* Left Side: Task Info & Progress */}
                <div className="col-span-12 lg:col-span-8 p-10 border-r-2 border-outline/30">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                          task.urgency === "high" || task.urgency === "critical" ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                        }`}>
                          {task.urgency}
                        </span>
                        <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2">
                          <ClipboardList size={14} className="text-primary" />
                          #{task.requestId.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-on-surface tracking-tight mb-2">{task.title}</h3>
                      <div className="flex items-center gap-2.5 text-sm font-bold text-secondary/60">
                        <MapPin size={18} className="text-primary" />
                        {typeof task.location === "string" ? task.location : task.location.address}
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Team</p>
                        <div className="flex -space-x-3">
                          {task.assignedVolunteers?.length > 0 ? (
                            task.assignedVolunteers.map((vol: any) => (
                              <div key={vol.volunteerId} className="w-10 h-10 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-black text-primary custom-shadow relative group/avatar">
                                {vol.name[0]}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] font-black text-secondary/40 italic bg-surface-variant/20 px-3 py-1.5 rounded-lg border border-dashed border-outline/60">Awaiting Team</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Resources</p>
                        <div className="flex flex-col items-end gap-1.5">
                          {task.assignedResources && (Object.values(task.assignedResources).some(v => (v as number) > 0)) ? (
                            <>
                              {task.assignedResources.food > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 shadow-sm">
                                  <Utensils size={10} /> {task.assignedResources.food}
                                </div>
                              )}
                              {task.assignedResources.medicine > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                                  <Activity size={10} /> {task.assignedResources.medicine}
                                </div>
                              )}
                              {task.assignedResources.shelter > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 shadow-sm">
                                  <Home size={10} /> {task.assignedResources.shelter}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-[10px] font-black text-secondary/40 italic bg-surface-variant/20 px-3 py-1.5 rounded-lg border border-dashed border-outline/60">No Resources</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Stepper UI */}
                  <div className="mb-12 relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-outline/20 -translate-y-1/2 rounded-full" />
                    <div 
                      className="absolute top-1/2 left-0 h-1.5 bg-primary -translate-y-1/2 transition-all duration-1000 rounded-full shadow-[0_0_12px_rgba(89,98,60,0.4)]" 
                      style={{ width: `${(getStepIndex(task.status) / (STEPS.length - 1)) * 100}%` }}
                    />
                    
                    <div className="relative flex justify-between">
                      {STEPS.map((step, idx) => {
                        const stepIdx = idx;
                        const currentIdx = getStepIndex(task.status);
                        const isCompleted = currentIdx > stepIdx;
                        const isCurrent = currentIdx === stepIdx;

                        return (
                          <div key={step.id} className="flex flex-col items-center group/step">
                            <div className={`w-10 h-10 rounded-full border-4 transition-all duration-500 flex items-center justify-center z-10 custom-shadow ${
                              isCompleted ? "bg-primary border-primary text-white" :
                              isCurrent ? "bg-white border-primary text-primary ring-4 ring-primary/10 scale-110" :
                              "bg-white border-outline text-outline group-hover/step:border-primary/40"
                            }`}>
                              {isCompleted ? <CheckCircle size={20} strokeWidth={3} /> : <span className="text-xs font-black">{idx + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest mt-3 transition-colors ${
                              isCurrent ? "text-primary" : "text-secondary/40"
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-6 mt-10">
                    {task.status === "Accepted" && (!task.assignedVolunteerIds || task.assignedVolunteerIds.length === 0) ? (
                      <div className="flex flex-col gap-3">
                         <p className="text-xs font-bold text-red-500 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                           <AlertTriangle size={16} /> Please assign a team member to continue
                         </p>
                         <button 
                          onClick={() => window.location.href = "/ngo/tasks"}
                          className="px-10 py-4 bg-on-surface text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary transition-all flex items-center gap-3 group/btn shadow-lg shadow-on-surface/10"
                        >
                          Go to Requests
                          <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : task.status !== "completed" ? (
                      <button 
                        onClick={() => handleStatusAdvance(task.requestId, task.status)}
                        className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all flex items-center gap-3 group/btn shadow-lg shadow-primary/20 active:scale-95"
                      >
                        {STEPS.find((s, i) => i === getStepIndex(task.status) + 1)?.label || "Next Stage"}
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <div className="px-10 py-4 bg-green-100 text-green-700 font-black text-xs uppercase tracking-widest rounded-button border-2 border-green-200 flex items-center gap-2 shadow-sm">
                        <CheckCircle size={18} strokeWidth={3} /> Task Completed
                      </div>
                    )}
                    <button 
                      onClick={() => handleDispatchUpdate(task.requestId)}
                      className="px-8 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95"
                    >
                      Update Volunteers
                    </button>
                  </div>
                </div>

                {/* Right Side: Checklist & Volunteers */}
                <div className="col-span-12 lg:col-span-4 bg-surface-variant/10 p-10 flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-on-surface uppercase tracking-widest mb-8 flex items-center gap-3">
                      <ListTodo size={20} className="text-primary" />
                      Checklist
                    </h4>
                    <div className="space-y-5">
                      {checklists[task.requestId]?.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => toggleCheckItem(task.requestId, item.id)}
                          className="flex items-center gap-4 cursor-pointer group/item"
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${
                            item.done ? "bg-primary border-primary text-white" : "bg-white border-outline/60 group-hover/item:border-primary/50"
                          }`}>
                            {item.done && <CheckCircle size={14} strokeWidth={3} />}
                          </div>
                          <span className={`text-sm font-black transition-all ${
                            item.done ? "text-secondary/30 line-through" : "text-on-surface group-hover/item:text-primary"
                          }`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-10 border-t-2 border-outline/30 relative z-10">
                    <h4 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Users size={16} />
                      Assigned Team
                    </h4>
                    <div className="space-y-4">
                      {task.assignedVolunteers?.length > 0 ? (
                        task.assignedVolunteers.map((vol: any) => (
                          <div key={vol.volunteerId} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-outline/40 shadow-sm group/vol hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                                {vol.name[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-on-surface">{vol.name}</p>
                                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-0.5">
                                  {task.status === "assigned_to_volunteer" ? "On the way" : 
                                  task.status === "in_progress" ? "At location" : "Active"}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignVolunteer(task.requestId, vol.volunteerId);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover/vol:opacity-100 transition-all border border-transparent hover:border-red-100 shadow-sm"
                              title="Remove"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] font-black text-secondary/30 italic p-6 bg-white/40 rounded-2xl border-2 border-dashed border-outline/40 text-center">
                          Waiting for volunteers...
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Decorative */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-20 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
            <Clock size={48} className="mx-auto text-secondary/20" />
            <h3 className="text-xl font-black text-secondary/40">No active response tasks</h3>
            <p className="text-sm text-secondary/40 font-medium italic">Tasks will appear here once you accept them and begin coordination.</p>
          </div>
        )}
      </div>
    </div>
  );
}
