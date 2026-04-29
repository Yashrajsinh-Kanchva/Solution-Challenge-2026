"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import NeedRequestTable from "@/components/admin/NeedRequestTable";
import TabSwitcher from "@/components/admin/TabSwitcher";
import { apiClient } from "@/lib/api/client";
import type { ManagedNeedRequest } from "@/lib/types/admin";
import {
  Plus, X, Search, Filter, Download, RefreshCw,
  ClipboardList, CheckCircle, XCircle, Clock,
  LayoutGrid, List, AlertCircle
} from "lucide-react";

const CATEGORIES = ["Food", "Health", "Shelter", "Education", "Employment", "Safety"];
type UrgencyLevel = ManagedNeedRequest["urgency"];
type StatusFilter  = "all" | "pending" | "approved" | "rejected";

const DEFAULT_FORM = {
  title: "", category: CATEGORIES[0], location: "",
  urgency: "medium" as UrgencyLevel, requestedBy: "",
  beneficiaries: "50", summary: "",
};

export default function NeedsPage() {
  const [requests,   setRequests]   = useState<any[]>([]);
  const [ngos,       setNgos]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [formState,  setFormState]  = useState(DEFAULT_FORM);

  // Filters
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState<StatusFilter>("all");
  const [categoryF,  setCategoryF]  = useState("all");
  const [urgencyF,   setUrgencyF]   = useState("all");
  const [typeF,      setTypeF]      = useState("all");

  useEffect(() => {
    Promise.all([
      apiClient.getRequests(),
      apiClient.getNgos()
    ])
      .then(([reqData, ngoData]) => {
        setRequests(Array.isArray(reqData) ? reqData : []);
        setNgos(Array.isArray(ngoData) ? ngoData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onAssignNgo = async (requestId: string, ngoId: string) => {
    try {
      await apiClient.assignNgoToRequest(requestId, ngoId);
      setRequests(cur => cur.map(r => r.id === requestId ? { ...r, assignedNgoId: ngoId, status: "assigned_to_ngo" } : r));
    } catch {
      alert("Failed to assign NGO.");
    }
  };

  const stats = useMemo(() => {
    const validRequests = requests.filter(Boolean);
    return {
      all:      validRequests.length,
      pending:  validRequests.filter(r => r?.status === "pending" || r?.status === "pending_admin").length,
      approved: validRequests.filter(r => r?.status === "approved" || r?.status === "assigned_to_ngo").length,
      rejected: validRequests.filter(r => r?.status === "rejected").length,
    };
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(Boolean).filter(r => {
      if (statusF !== "all") {
        if (statusF === "pending") {
          if (r?.status !== "pending" && r?.status !== "pending_admin") return false;
        } else if (statusF === "approved") {
          if (r?.status !== "approved" && r?.status !== "assigned_to_ngo") return false;
        } else if (r?.status !== statusF) {
          return false;
        }
      }
      if (categoryF !== "all" && r.category !== categoryF) return false;
      if (urgencyF  !== "all" && r.urgency  !== urgencyF)  return false;
      if (typeF     !== "all" && (r.requestType || "ISSUE") !== typeF) return false;
      if (q && !r.title?.toLowerCase().includes(q) &&
               !r.requestedBy?.toLowerCase().includes(q) &&
               !String(typeof r.location === "string" ? r.location : r.location?.address || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, search, statusF, categoryF, urgencyF, typeF]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dbReq = await apiClient.createRequest({
        ...formState,
        beneficiaries: Number(formState.beneficiaries),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setRequests(cur => [dbReq, ...cur]);
      setFormState(DEFAULT_FORM);
      setShowForm(false);
    } catch {
      alert("Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const onStatusChange = async (id: string, next: "approved" | "rejected") => {
    try {
      await apiClient.updateRequestStatus(id, next);
      setRequests(cur => cur.map(r => r.id === id ? { ...r, status: next } : r));
    } catch {
      alert("Failed to update status.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this request permanently?")) return;
    try {
      await apiClient.deleteRequest(id);
      setRequests(cur => cur.filter(r => r.id !== id));
    } catch {
      alert("Failed to delete request.");
    }
  };

  const onExport = () => {
    const rows = [
      ["ID", "Title", "Category", "Location", "Urgency", "Beneficiaries", "Status", "Requested By", "Created"],
      ...filtered.map(r => [r.id, r.title, r.category, r.location, r.urgency, r.beneficiaries, r.status, r.requestedBy, r.createdAt]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "need-requests.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const field = (key: keyof typeof formState) => ({
    value: formState[key],
    onChange: (e: any) => setFormState(c => ({ ...c, [key]: e.target.value })),
  });

  const tabItems = (["all","pending","approved","rejected"] as StatusFilter[]).map(s => ({
    value: s,
    label: s,
    count: stats[s as keyof typeof stats]
  }));

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            Need Request Management
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Monitor and coordinate community needs. Approve incoming reports and assign them to active NGOs for fulfillment.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button 
            onClick={onExport}
            className="flex-1 xl:flex-none px-6 py-4 bg-white border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={16} strokeWidth={2.5} /> Export Registry
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`flex-1 xl:flex-none px-8 py-4 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${
              showForm ? "bg-[#BA1A1A] text-white hover:bg-[#93000A]" : "bg-[#4D5A2C] text-white hover:bg-[#647A39]"
            }`}
          >
            {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
            {showForm ? "Close Form" : "Create Request"}
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Active Pool", val: stats.all, Icon: LayoutGrid, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
          { label: "Action Required", val: stats.pending, Icon: Clock, color: "text-[#B45309]", bg: "bg-[#FEF3C7]" },
          { label: "In Progress", val: stats.approved, Icon: CheckCircle, color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
          { label: "Dismissed", val: stats.rejected, Icon: XCircle, color: "text-[#991B1B]", bg: "bg-[#FEE2E2]" },
        ].map((item) => (
          <div 
            key={item.label}
            onClick={() => setStatusF(item.label.toLowerCase().includes("action") ? "pending" : item.label.toLowerCase().includes("progress") ? "approved" : item.label.toLowerCase().includes("dismissed") ? "rejected" : "all")}
            className="bg-white p-7 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 cursor-pointer transition-all hover:translate-y-[-4px]"
          >
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
              <item.Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#4D5A2C] uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className="text-4xl font-black text-[#1A1C15]">{item.val}</h3>
            </div>
          </div>
        ))}
      </section>


      {/* Form Overlay */}
      {showForm && (
        <section className="mb-12 bg-white border-2 border-[#4D5A2C] rounded-[40px] p-8 sm:p-12 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">New Need Request</h3>
              <p className="text-xs font-bold text-[#6B7160] uppercase tracking-widest">Manual entry system</p>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" onSubmit={onSubmit}>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Request Title</label>
              <input className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all" placeholder="e.g. Urgent Medical Supply for Sector 7" required {...field("title")} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Category</label>
              <select className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all appearance-none" {...field("category")}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Location</label>
              <input className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all" placeholder="Enter specific area" required {...field("location")} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Requester Name</label>
              <input className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all" placeholder="NGO or Citizen Name" required {...field("requestedBy")} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Urgency Level</label>
              <select className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all appearance-none" {...field("urgency")}>
                <option value="low">Low Urgency</option>
                <option value="medium">Medium Urgency</option>
                <option value="high">High Urgency</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Impact Summary</label>
              <textarea className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-3xl text-sm font-bold outline-none transition-all h-32 resize-none" placeholder="Describe the situation and required items in detail..." required {...field("summary")} />
            </div>
            
            <div className="flex gap-4 md:col-span-2 lg:col-span-3 pt-4">
              <button type="submit" disabled={submitting} className="px-10 py-4 bg-[#4D5A2C] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#647A39] transition-all disabled:opacity-50 shadow-lg">
                {submitting ? "Processing..." : "Publish Request"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Section */}
      <section className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-6 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B7160]" />
            <input 
              className="w-full pl-14 pr-6 py-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all"
              placeholder="Filter by title, location, or requester..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select className="flex-1 lg:flex-none p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all" value={typeF} onChange={e => setTypeF(e.target.value)}>
              <option value="all">All Types</option>
              <option value="ISSUE">Issues</option>
              <option value="HELP">Help</option>
            </select>
            <select className="flex-1 lg:flex-none p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all" value={categoryF} onChange={e => setCategoryF(e.target.value)}>
              <option value="all">Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="flex-1 lg:flex-none p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all" value={urgencyF} onChange={e => setUrgencyF(e.target.value)}>
              <option value="all">Urgency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            {(search || statusF !== "all" || categoryF !== "all" || urgencyF !== "all" || typeF !== "all") && (
              <button 
                onClick={() => { setSearch(""); setStatusF("all"); setCategoryF("all"); setUrgencyF("all"); setTypeF("all"); }}
                className="p-4 text-[#BA1A1A] hover:bg-red-50 rounded-xl transition-all"
                title="Reset Filters"
              >
                <RefreshCw size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-8 sm:p-12 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-[#4D5A2C]" />
              <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em]">Incoming Pipeline</p>
            </div>
            <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Need Registry</h3>
          </div>
          
          <TabSwitcher 
            items={tabItems}
            value={statusF}
            onChange={(v) => setStatusF(v as StatusFilter)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-[#D4DCA8] border-t-[#4D5A2C] rounded-full animate-spin" />
            <p className="text-xs font-black text-[#6B7160] uppercase tracking-[0.3em]">Synchronizing Registry...</p>
          </div>
        ) : (
          <NeedRequestTable
            requests={filtered}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            ngos={ngos}
            onAssignNgo={onAssignNgo}
          />
        )}
      </section>
    </div>
  );
}

