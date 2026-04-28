"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AssignmentTable from "@/components/admin/AssignmentTable";
import { areaOptions } from "@/lib/mock/admin";
import { apiClient } from "@/lib/api/client";
import {
  Plus, X, Search, RefreshCw, Download,
  Building2, MapPin, Users, CheckCircle,
  LayoutGrid, AlertCircle, Map, ExternalLink
} from "lucide-react";

export default function AssignmentsPage() {
  const [approvedNgos, setApprovedNgos] = useState<string[]>([]);
  const [assignments,  setAssignments]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);

  // Form state
  const [ngoName,     setNgoName]     = useState("");
  const [campus,      setCampus]      = useState(areaOptions[0]);
  const [coordinator, setCoordinator] = useState("Admin Desk");

  // Filters
  const [search,    setSearch]    = useState("");
  const [campusF,   setCampusF]   = useState("all");

  useEffect(() => {
    Promise.all([apiClient.getNgos(), apiClient.getAssignments()])
      .then(([ngos, assigns]) => {
        const approved = ngos
          .filter((n: any) => n.status === "approved")
          .map((n: any) => n.ngoName || n.name);
        setApprovedNgos(approved);
        if (approved.length > 0) setNgoName(approved[0]);
        setAssignments(Array.isArray(assigns) ? assigns : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const uniqueNgos   = new Set(assignments.map((a: any) => a.ngoName)).size;
    const uniqueAreas  = new Set(assignments.map((a: any) => a.campus)).size;
    const uncovered    = areaOptions.filter(
      area => !assignments.some((a: any) => a.campus === area)
    ).length;
    return { total: assignments.length, uniqueNgos, uniqueAreas, uncovered };
  }, [assignments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter((a: any) => {
      if (campusF !== "all" && a.campus !== campusF) return false;
      if (q && !a.ngoName?.toLowerCase().includes(q) &&
               !a.campus?.toLowerCase().includes(q) &&
               !a.coordinator?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assignments, search, campusF]);

  const areaCoverage = useMemo(() =>
    areaOptions.map(area => ({
      area,
      ngos: assignments.filter((a: any) => a.campus === area).map((a: any) => a.ngoName),
    })),
  [assignments]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ngoName || !campus || !coordinator) return;
    setSubmitting(true);
    try {
      const newAssign = await apiClient.createAssignment({ ngoName, campus, coordinator });
      setAssignments(cur => [newAssign, ...cur]);
      setShowForm(false);
    } catch { alert("Failed to create assignment."); }
    finally { setSubmitting(false); }
  };

  const onDelete = (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    setAssignments(cur => cur.filter((a: any) => a.id !== id));
  };

  const onEdit = (id: string, updates: any) => {
    setAssignments(cur => cur.map((a: any) => a.id === id ? { ...a, ...updates } : a));
  };

  const onExport = () => {
    const rows = [
      ["ID","NGO","Campus","Coordinator","Assigned At"],
      ...filtered.map((a: any) => [a.id, a.ngoName, a.campus, a.coordinator, a.assignedAt]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "assignments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            NGO Assignment Management
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Assign approved NGOs to campuses, manage coordinators, and track area coverage.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button onClick={onExport} className="flex-1 xl:flex-none px-6 py-4 bg-white border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all flex items-center justify-center gap-2 shadow-sm">
            <Download size={16} strokeWidth={2.5} /> Export CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className={`flex-1 xl:flex-none px-8 py-4 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${showForm ? "bg-[#BA1A1A] text-white hover:bg-[#93000A]" : "bg-[#4D5A2C] text-white hover:bg-[#647A39]"}`}>
            {showForm ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
            {showForm ? "Close Form" : "New Assignment"}
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Active Pool", val: stats.total, Icon: CheckCircle, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
          { label: "Organizations", val: stats.uniqueNgos, Icon: Building2, color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
          { label: "Areas Covered", val: stats.uniqueAreas, Icon: MapPin, color: "text-[#B45309]", bg: "bg-[#FEF3C7]" },
          { label: "Uncovered", val: stats.uncovered, Icon: Users, color: "text-[#991B1B]", bg: "bg-[#FEE2E2]" },
        ].map((item) => (
          <div key={item.label} className="bg-white p-7 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 transition-all hover:translate-y-[-4px]">
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
              <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">New Assignment</h3>
              <p className="text-xs font-bold text-[#6B7160] uppercase tracking-widest">Connect NGO to Campus</p>
            </div>
          </div>

          {approvedNgos.length === 0 ? (
            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-[24px] text-amber-800 flex items-start gap-4">
              <AlertCircle size={24} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-black uppercase tracking-wider mb-1">No Approved NGOs Found</p>
                <p className="text-sm font-medium mb-3">You must approve an NGO registration before you can assign them to a campus area.</p>
                <a href="/admin/ngo-approvals" className="inline-flex items-center gap-2 text-xs font-black text-[#4D5A2C] uppercase tracking-widest hover:underline">
                  Go to Approvals <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">NGO / Organization</label>
                <select className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all appearance-none" value={ngoName} onChange={e => setNgoName(e.target.value)} required>
                  <option value="" disabled>Select NGO</option>
                  {approvedNgos.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Campus / Area</label>
                <select className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all appearance-none" value={campus} onChange={e => setCampus(e.target.value)}>
                  {areaOptions.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest ml-1">Internal Coordinator</label>
                <input className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all" placeholder="Enter name" value={coordinator} onChange={e => setCoordinator(e.target.value)} required />
              </div>
              <div className="flex gap-4 md:col-span-2 lg:col-span-3 pt-4">
                <button type="submit" disabled={submitting} className="px-10 py-4 bg-[#4D5A2C] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#647A39] transition-all disabled:opacity-50 shadow-lg">
                  {submitting ? "Processing..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Coverage Grid */}
      <section className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-8 sm:p-12 mb-12 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
            <Map size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Area Coverage Map</h3>
            <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Global NGO presence tracking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areaCoverage.map(({ area, ngos }) => (
            <div key={area} onClick={() => setCampusF(campusF === area ? "all" : area)} className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer ${ngos.length > 0 ? (campusF === area ? "bg-[#4D5A2C] border-[#4D5A2C]" : "bg-[#F7F5EE] border-[#E8EDD0] hover:border-[#4D5A2C]") : "bg-white border-dashed border-[#E8EDD0] opacity-60 hover:opacity-100 hover:border-[#BA1A1A]"}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest ${campusF === area && ngos.length > 0 ? "text-white/80" : "text-[#6B7160]"}`}>
                  {area}
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${ngos.length > 0 ? (campusF === area ? "bg-white/20 text-white" : "bg-[#EEF3D2] text-[#4D5A2C]") : "bg-red-50 text-red-600"}`}>
                  {ngos.length > 0 ? `${ngos.length} NGO` : "None"}
                </span>
              </div>
              {ngos.length > 0 ? (
                <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${campusF === area ? "text-white" : "text-[#1A1C15]"}`}>
                  {ngos.join(", ")}
                </p>
              ) : (
                <p className="text-xs font-bold text-[#BA1A1A]">No active NGO</p>
              )}
            </div>
          ))}
        </div>
        {campusF !== "all" && (
          <button onClick={() => setCampusF("all")} className="mt-8 px-6 py-3 bg-[#F7F5EE] border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#EEF3D2] transition-all flex items-center gap-2 mx-auto sm:mx-0">
            <RefreshCw size={14} /> Clear Area Filter
          </button>
        )}
      </section>

      {/* Table Section */}
      <section className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-8 sm:p-12 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={14} className="text-[#4D5A2C]" />
              <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em]">Live Registry</p>
            </div>
            <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Assignment Table</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7160]" />
              <input className="w-full pl-12 pr-4 py-3 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-xl text-sm font-bold outline-none transition-all" placeholder="Quick search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="w-full sm:w-auto p-3 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all appearance-none px-6" value={campusF} onChange={e => setCampusF(e.target.value)}>
              <option value="all">All Areas</option>
              {areaOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-[#D4DCA8] border-t-[#4D5A2C] rounded-full animate-spin" />
            <p className="text-xs font-black text-[#6B7160] uppercase tracking-[0.3em]">Synchronizing Registry...</p>
          </div>
        ) : (
          <AssignmentTable
            assignments={filtered}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </section>
    </div>
  );
}

