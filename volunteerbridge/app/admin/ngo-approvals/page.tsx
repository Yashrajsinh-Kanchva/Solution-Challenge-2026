"use client";

import { useMemo, useState, useEffect } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatDateLabel } from "@/lib/utils/formatters";
import { apiClient } from "@/lib/api/client";
import {
  Search, RefreshCw, Download, ChevronDown, ChevronUp,
  Check, X, Mail, Phone, MapPin, FileText, Building2,
  Clock, CheckCircle, XCircle, Users, LayoutGrid
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function NgoApprovalsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reasons,       setReasons]       = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState(true);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [statusF,       setStatusF]       = useState<StatusFilter>("all");
  const [processing,    setProcessing]    = useState<string | null>(null);

  useEffect(() => {
    apiClient.getNgos()
      .then(data => {
        console.log("Fetched NGOs from Next.js API:", data);
        setRegistrations(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total:    registrations.length,
    pending:  registrations.filter(r => r.status === "pending").length,
    approved: registrations.filter(r => r.status === "approved").length,
    rejected: registrations.filter(r => r.status === "rejected").length,
  }), [registrations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (q && !r.ngoName?.toLowerCase().includes(q) &&
               !r.contactName?.toLowerCase().includes(q) &&
               !r.area?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [registrations, search, statusF]);

  const onApprove = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "approved");
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "approved" } : r));
      setExpandedId(null);
    } catch { alert("Failed to approve NGO."); }
    finally { setProcessing(null); }
  };

  const onReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) { alert("Please enter a rejection reason before rejecting."); return; }
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "rejected", reason);
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "rejected", reviewReason: reason } : r));
      setExpandedId(null);
    } catch { alert("Failed to reject NGO."); }
    finally { setProcessing(null); }
  };

  const onRevoke = async (id: string) => {
    if (!confirm("Revoke approval and move back to pending?")) return;
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "pending" as any);
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "pending", reviewReason: undefined } : r));
    } catch { alert("Failed to revoke."); }
    finally { setProcessing(null); }
  };

  const onExport = () => {
    const rows = [
      ["ID","Name","Contact","Email","Phone","Area","Status","Submitted"],
      ...filtered.map(r => [r.id, r.ngoName, r.contactName, r.email, r.phone, r.area, r.status, r.submittedAt]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ngo-approvals.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            NGO Registration Approvals
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Validate submitted organizations, review documents, and approve or reject with recorded reasons.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          {stats.pending > 0 && (
            <div className="flex-1 xl:flex-none px-4 py-3 bg-red-50 border-2 border-red-100 text-red-700 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
              <Clock size={14} /> {stats.pending} Awaiting Review
            </div>
          )}
          <button 
            onClick={onExport}
            className="flex-1 xl:flex-none px-6 py-4 bg-white border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={16} strokeWidth={2.5} /> Export CSV
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total NGOs", val: stats.total, Icon: Building2, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]", filter: "all" },
          { label: "Pending", val: stats.pending, Icon: Clock, color: "text-[#B45309]", bg: "bg-[#FEF3C7]", filter: "pending" },
          { label: "Approved", val: stats.approved, Icon: CheckCircle, color: "text-[#166534]", bg: "bg-[#DCFCE7]", filter: "approved" },
          { label: "Rejected", val: stats.rejected, Icon: XCircle, color: "text-[#991B1B]", bg: "bg-[#FEE2E2]", filter: "rejected" },
        ].map((item) => (
          <div 
            key={item.label}
            onClick={() => setStatusF(item.filter as StatusFilter)}
            className={`bg-white p-7 rounded-[32px] border-2 shadow-sm flex flex-col gap-5 cursor-pointer transition-all hover:translate-y-[-4px] ${statusF === item.filter ? "border-[#4D5A2C] bg-[#F7F5EE]" : "border-transparent hover:border-[#E8EDD0]"}`}
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

      {/* Filter Bar */}
      <section className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-6 mb-12 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B7160]" />
            <input 
              className="w-full pl-14 pr-6 py-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all"
              placeholder="Search by organization, contact, or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-[#F7F5EE] p-1.5 rounded-xl border-2 border-[#E8EDD0] flex-1 sm:flex-none">
              {(["all","pending","approved","rejected"] as StatusFilter[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusF(s)}
                  className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none whitespace-nowrap ${statusF === s ? "bg-white text-[#4D5A2C] shadow-sm" : "text-[#6B7160] hover:text-[#4D5A2C]"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {(search || statusF !== "all") && (
              <button 
                onClick={() => { setSearch(""); setStatusF("all"); }}
                className="p-4 text-[#BA1A1A] hover:bg-red-50 rounded-xl transition-all"
                title="Reset Filters"
              >
                <RefreshCw size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-12 h-12 border-4 border-[#D4DCA8] border-t-[#4D5A2C] rounded-full animate-spin" />
          <p className="text-xs font-black text-[#6B7160] uppercase tracking-[0.3em]">Synchronizing Registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-[#F7F5EE] border-2 border-dashed border-[#E8EDD0] rounded-[48px]">
          <Building2 size={48} className="mx-auto text-[#9CA396] mb-4 opacity-20" />
          <p className="text-[15px] font-bold text-[#6B7160]">No organizations found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((reg) => {
            const isPending  = reg.status === "pending";
            const isApproved = reg.status === "approved";
            const isExpanded = expandedId === reg.id;
            const isBusy     = processing === reg.id;

            return (
              <article key={reg.id} className={`bg-white border-2 rounded-[40px] p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all ${isPending ? "border-amber-200" : isApproved ? "border-green-200" : "border-red-200"}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-2">
                      Submitted {formatDateLabel(reg.submittedAt)}
                    </p>
                    <h3 className="text-xl font-black text-[#1A1C15] leading-tight mb-2 truncate">{reg.ngoName}</h3>
                  </div>
                  <StatusBadge status={reg.status} />
                </div>

                <p className="text-sm font-medium text-[#404535] leading-relaxed line-clamp-3">
                  {reg.mission}
                </p>

                <div className="grid gap-4 py-6 border-y-2 border-[#F7F5EE]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F7F5EE] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest">Lead Contact</p>
                      <p className="text-[13px] font-black text-[#1A1C15]">{reg.contactName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F7F5EE] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest">Base of Operations</p>
                      <p className="text-[13px] font-black text-[#1A1C15]">{reg.area}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                  className="w-full py-4 bg-[#F7F5EE] border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#EEF3D2]"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? "Hide Submission" : "Review Submission"}
                </button>

                {isExpanded && (
                  <div className="bg-[#F7F5EE] rounded-3xl p-6 border-2 border-[#E8EDD0] animate-in slide-in-from-top-2 duration-300 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-1">Email</p>
                        <a href={`mailto:${reg.email}`} className="text-sm font-bold text-[#4D5A2C] hover:underline flex items-center gap-2"><Mail size={14} /> {reg.email}</a>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-1">Phone</p>
                        <a href={`tel:${reg.phone}`} className="text-sm font-bold text-[#4D5A2C] hover:underline flex items-center gap-2"><Phone size={14} /> {reg.phone}</a>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-1">Operational Coverage</p>
                      <p className="text-[13px] font-medium text-[#404535] leading-relaxed">{reg.coverage}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-3">Verification Documents</p>
                      <div className="grid gap-2">
                        {["Registration Certificate", "Tax ID", "Annual Report"].map(doc => (
                          <div key={doc} className="flex items-center gap-2 text-[11px] font-black text-[#4D5A2C]">
                            <CheckCircle size={14} className="text-[#2E7D32]" /> {doc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-widest ml-1">Internal Review Notes</p>
                    <textarea 
                      className="w-full p-4 bg-[#F7F5EE] border-2 border-transparent focus:border-[#4D5A2C] rounded-2xl text-sm font-bold outline-none transition-all h-24 resize-none"
                      placeholder="Enter reason for rejection or special approval notes..."
                      value={reasons[reg.id] || ""}
                      onChange={e => setReasons(c => ({ ...c, [reg.id]: e.target.value }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  {isPending ? (
                    <>
                      <button onClick={() => onApprove(reg.id)} disabled={isBusy} className="py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                        <Check size={18} strokeWidth={2.5} /> {isBusy ? "..." : "Approve"}
                      </button>
                      <button onClick={() => onReject(reg.id)} disabled={isBusy || !reasons[reg.id]?.trim()} className="py-4 bg-[#BA1A1A] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#93000A] transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-sm">
                        <X size={18} strokeWidth={2.5} /> {isBusy ? "..." : "Reject"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => onRevoke(reg.id)} disabled={isBusy} className="col-span-2 py-4 bg-white border-2 border-[#E8EDD0] text-[#6B7160] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] hover:text-[#BA1A1A] transition-all flex items-center justify-center gap-2">
                      <RefreshCw size={16} /> {isBusy ? "Reverting..." : "Reopen Registration"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

