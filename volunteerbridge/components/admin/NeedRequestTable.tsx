"use client";

import { useState, Fragment } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import type { ManagedNeedRequest } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";
import { 
  Check, X, Eye, ChevronDown, ChevronUp, 
  MapPin, Users, Tag, AlertTriangle, 
  Trash2, ExternalLink, UserPlus, CheckCircle 
} from "lucide-react";

type Props = {
  requests: ManagedNeedRequest[];
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  ngos?: any[];
  onAssignNgo?: (requestId: string, ngoId: string) => void;
};

const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high:     "bg-red-50 text-red-700 border-red-200",
  medium:   "bg-amber-50 text-amber-700 border-amber-200",
  low:      "bg-green-50 text-green-700 border-green-200",
};

export default function NeedRequestTable({ requests, onStatusChange, onDelete, ngos = [], onAssignNgo }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedNgo, setSelectedNgo] = useState<Record<string, string>>({});

  if (requests.length === 0) {
    return (
      <div className="py-20 text-center bg-[#F7F5EE] border-2 border-dashed border-[#E8EDD0] rounded-[24px]">
        <Tag size={48} className="mx-auto text-[#9CA396] mb-4 opacity-20" />
        <p className="text-[15px] font-bold text-[#6B7160]">No requests found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em] px-4 bg-[#F7F5EE]/50 rounded-xl">
              <th className="pb-4 pt-2 pl-6 text-left first:rounded-l-xl">Request Details</th>
              <th className="pb-4 pt-2 text-left">Context</th>
              <th className="pb-4 pt-2 text-left">Location</th>
              <th className="pb-4 pt-2 text-left">Urgency</th>
              <th className="pb-4 pt-2 text-left">Impact</th>
              <th className="pb-4 pt-2 text-left">Status</th>
              <th className="pb-4 pt-2 pr-6 text-right last:rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const isExpanded = expandedId === req.id;
              const isPending  = req.status === "pending" || req.status === "pending_admin";

              return (
                <Fragment key={req.id}>
                  <tr className={`group transition-all duration-200 ${isExpanded ? "bg-[#F7F5EE]/50" : "bg-white hover:shadow-md"}`}>
                    <td className={`py-5 pl-6 rounded-l-[24px] border-y-2 border-l-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <div className="flex flex-col gap-1 max-w-[280px]">
                        <span className="text-sm font-black text-[#1A1C15] leading-tight">{req.title}</span>
                        <span className="text-xs font-medium text-[#6B7160] line-clamp-1">{req.summary}</span>
                      </div>
                    </td>
                    <td className={`py-5 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#4D5A2C] bg-[#EEF3D2] px-2 py-0.5 rounded-md uppercase tracking-wider w-fit mb-1">
                          {req.requestType || "ISSUE"}
                        </span>
                        <span className="text-xs font-bold text-[#6B7160]">{req.category}</span>
                      </div>
                    </td>
                    <td className={`py-5 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1C15]">
                        <MapPin size={12} className="text-[#6B7160]" />
                        <span className="truncate max-w-[120px]">
                          {typeof req.location === "string" 
                            ? req.location 
                            : (req.location?.area_name || req.location?.address || "Unknown")}
                        </span>
                      </div>
                    </td>
                    <td className={`py-5 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${URGENCY_STYLES[req.urgency] || URGENCY_STYLES.medium}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className={`py-5 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#4D5A2C]" />
                        <span className="text-sm font-black text-[#1A1C15]">{(req.beneficiaries || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className={`py-5 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""}`}>
                      <StatusBadge status={req.status} />
                    </td>
                    <td className={`py-5 pr-6 rounded-r-[24px] border-y-2 border-r-2 border-transparent group-hover:border-[#E8EDD0] ${isExpanded ? "border-[#E8EDD0]" : ""} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className={`p-2 rounded-lg transition-all ${isExpanded ? "bg-[#4D5A2C] text-white" : "text-[#4D5A2C] hover:bg-[#EEF3D2]"}`}
                        >
                          <Eye size={18} strokeWidth={2.5} />
                        </button>
                        {isPending && (
                          <>
                            <button onClick={() => onStatusChange(req.id, "approved")} className="p-2 text-[#2E7D32] hover:bg-green-50 rounded-lg transition-all">
                              <Check size={18} strokeWidth={3} />
                            </button>
                            <button onClick={() => onStatusChange(req.id, "rejected")} className="p-2 text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-all">
                              <X size={18} strokeWidth={3} />
                            </button>
                          </>
                        )}
                        {!isPending && onDelete && (
                          <button onClick={() => onDelete(req.id)} className="p-2 text-[#6B7160] hover:text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-6 pb-6">
                        <div className="bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-[32px] p-8 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Impact Summary</h4>
                              <p className="text-sm font-medium text-[#1A1C15] leading-relaxed">
                                {req.description || req.summary || "No detailed description provided."}
                              </p>
                              {req.location && typeof req.location !== "string" && (
                                <div className="pt-4 flex items-center gap-4 text-[#6B7160]">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                                    <MapPin size={14} /> Latitude: {req.location.lat}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                                    <MapPin size={14} /> Longitude: {req.location.lng}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Administrative Assignment</h4>
                              
                              {(req.status as string) === "approved" || (req.status as string) === "assigned_to_ngo" ? (
                                <div className="space-y-4">
                                  <div className="flex gap-3">
                                    <select 
                                      className="flex-1 p-4 bg-white border-2 border-[#E8EDD0] rounded-2xl text-sm font-bold text-[#1A1C15] outline-none focus:border-[#4D5A2C] transition-colors"
                                      value={selectedNgo[req.id] || (req as any).assignedNgoId || ""}
                                      onChange={(e) => setSelectedNgo(prev => ({ ...prev, [req.id]: e.target.value }))}
                                    >
                                      <option value="" disabled>Choose an Organization...</option>
                                      {ngos.map(n => (
                                        <option key={n.ngoId} value={n.ngoId}>{n.ngoName || n.name}</option>
                                      ))}
                                    </select>
                                    <button 
                                      onClick={() => onAssignNgo?.(req.id, selectedNgo[req.id] || (req as any).assignedNgoId || "")}
                                      disabled={!(selectedNgo[req.id] || (req as any).assignedNgoId)}
                                      className="px-8 py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all disabled:opacity-50 shadow-lg shadow-[#4D5A2C]/10 flex items-center gap-2"
                                    >
                                      <UserPlus size={16} /> Assign
                                    </button>
                                  </div>
                                  {(req as any).assignedNgoId && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-xl text-[#2E7D32] text-[10px] font-black uppercase tracking-widest">
                                      <CheckCircle size={14} /> Assigned to: {ngos.find(n => n.ngoId === (req as any).assignedNgoId)?.ngoName || "NGO Partners"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-6 bg-amber-50 border-2 border-amber-100 rounded-[24px] text-amber-800">
                                  <AlertTriangle size={20} />
                                  <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest">Pending Review</p>
                                    <p className="text-[10px] font-bold opacity-80">Approve this request first to unlock NGO assignment tools.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-6 xl:hidden">
        {requests.map((req) => (
          <div key={req.id} className="bg-white p-6 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 transition-all">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-2">
                  {formatDateLabel(req.createdAt)}
                </p>
                <h4 className="text-base font-black text-[#1A1C15] leading-tight mb-1">{req.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#4D5A2C] bg-[#EEF3D2] px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {req.requestType || "ISSUE"}
                  </span>
                  <span className="text-xs font-bold text-[#6B7160]">{req.category}</span>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y-2 border-[#F7F5EE]">
              <div>
                <p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Urgency</p>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${URGENCY_STYLES[req.urgency] || URGENCY_STYLES.medium}`}>
                  {req.urgency}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Impact</p>
                <div className="flex items-center gap-1.5 font-black text-sm text-[#1A1C15]">
                  <Users size={14} className="text-[#4D5A2C]" />
                  {(req.beneficiaries || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                className="w-full py-3.5 flex items-center justify-center gap-2 bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-xl text-[11px] font-black text-[#4D5A2C] uppercase tracking-widest"
              >
                {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expandedId === req.id ? "Close Details" : "Review & Manage"}
              </button>
              
              {(req.status === "pending" || req.status === "pending_admin") && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onStatusChange(req.id, "approved")} className="py-3 bg-[#4D5A2C] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Check size={14} strokeWidth={3} /> Approve
                  </button>
                  <button onClick={() => onStatusChange(req.id, "rejected")} className="py-3 bg-[#BA1A1A] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <X size={14} strokeWidth={3} /> Reject
                  </button>
                </div>
              )}
            </div>

            {expandedId === req.id && (
              <div className="bg-[#F7F5EE] rounded-2xl p-5 border-2 border-[#E8EDD0] flex flex-col gap-6 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-widest mb-2">Full Summary</p>
                  <p className="text-sm font-medium text-[#404535] leading-relaxed">{req.summary}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-widest">NGO Assignment</p>
                  {(req.status as string) === "approved" || (req.status as string) === "assigned_to_ngo" ? (
                    <div className="flex flex-col gap-3">
                      <select 
                        className="w-full p-3 bg-white border-2 border-[#E8EDD0] rounded-xl text-sm font-bold text-[#1A1C15] outline-none"
                        value={selectedNgo[req.id] || (req as any).assignedNgoId || ""}
                        onChange={(e) => setSelectedNgo(prev => ({ ...prev, [req.id]: e.target.value }))}
                      >
                        <option value="" disabled>Select Organization</option>
                        {ngos.map(n => (
                          <option key={n.ngoId} value={n.ngoId}>{n.ngoName || n.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => onAssignNgo?.(req.id, selectedNgo[req.id] || (req as any).assignedNgoId || "")}
                        disabled={!(selectedNgo[req.id] || (req as any).assignedNgoId)}
                        className="w-full py-3 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={14} />
                        {(req as any).assignedNgoId ? "Update Assignment" : "Confirm Assignment"}
                      </button>
                      {(req as any).assignedNgoId && (
                        <p className="text-[10px] font-black text-[#2E7D32] uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle size={12} /> Currently: {ngos.find(n => n.ngoId === (req as any).assignedNgoId)?.ngoName || "Assigned"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-bold uppercase tracking-wide">
                      <AlertTriangle size={14} /> Approve request to assign NGO
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

