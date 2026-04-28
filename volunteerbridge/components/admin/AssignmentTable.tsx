"use client";

import type { NgoAssignment } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";
import { Trash2, Pencil, Check, X, MapPin, User, Building2, Save } from "lucide-react";
import { useState } from "react";
import { areaOptions } from "@/lib/mock/admin";

type Props = {
  assignments: NgoAssignment[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<NgoAssignment>) => void;
};

export default function AssignmentTable({ assignments, onDelete, onEdit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<NgoAssignment>>({});

  const startEdit = (a: NgoAssignment) => {
    setEditingId(a.id);
    setEditState({ campus: a.campus, coordinator: a.coordinator });
  };
  const cancelEdit = () => { setEditingId(null); setEditState({}); };
  const saveEdit = (id: string) => {
    onEdit(id, editState);
    setEditingId(null);
    setEditState({});
  };

  if (assignments.length === 0) {
    return (
      <div className="py-20 text-center bg-[#F7F5EE] border-2 border-dashed border-[#E8EDD0] rounded-[24px]">
        <Building2 size={48} className="mx-auto text-[#9CA396] mb-4 opacity-20" />
        <p className="text-[15px] font-bold text-[#6B7160]">No active assignments found. Start by assigning an NGO above.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em] px-4">
              <th className="pb-4 pl-6 text-left">Organization</th>
              <th className="pb-4 text-left">Campus / Area</th>
              <th className="pb-4 text-left">Internal Coordinator</th>
              <th className="pb-4 text-left">Assigned</th>
              <th className="pb-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const isEditing = editingId === a.id;
              return (
                <tr key={a.id} className={`group transition-all duration-200 ${isEditing ? "bg-[#F7F5EE]" : "bg-white hover:shadow-md"}`}>
                  <td className={`py-4 pl-6 rounded-l-[24px] border-y-2 border-l-2 border-transparent group-hover:border-[#E8EDD0] ${isEditing ? "border-[#4D5A2C]" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center font-black text-xs">
                        {a.ngoName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-black text-[#1A1C15]">{a.ngoName}</span>
                    </div>
                  </td>
                  <td className={`py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isEditing ? "border-[#4D5A2C]" : ""}`}>
                    {isEditing ? (
                      <select 
                        className="p-2 bg-white border border-[#E8EDD0] rounded-lg text-xs font-bold outline-none"
                        value={editState.campus}
                        onChange={e => setEditState(s => ({ ...s, campus: e.target.value }))}
                      >
                        {areaOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#6B7160]">
                        <MapPin size={14} /> {a.campus}
                      </div>
                    )}
                  </td>
                  <td className={`py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isEditing ? "border-[#4D5A2C]" : ""}`}>
                    {isEditing ? (
                      <input 
                        className="p-2 bg-white border border-[#E8EDD0] rounded-lg text-xs font-bold outline-none"
                        value={editState.coordinator}
                        onChange={e => setEditState(s => ({ ...s, coordinator: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#6B7160]">
                        <User size={14} /> {a.coordinator}
                      </div>
                    )}
                  </td>
                  <td className={`py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0] ${isEditing ? "border-[#4D5A2C]" : ""}`}>
                    <span className="text-xs font-medium text-[#9CA396]">
                      {formatDateLabel(a.assignedAt)}
                    </span>
                  </td>
                  <td className={`py-4 pr-6 rounded-r-[24px] border-y-2 border-r-2 border-transparent group-hover:border-[#E8EDD0] ${isEditing ? "border-[#4D5A2C]" : ""} text-right`}>
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(a.id)} className="p-2 text-[#2E7D32] hover:bg-green-50 rounded-lg transition-all" title="Save Changes">
                            <Save size={18} />
                          </button>
                          <button onClick={cancelEdit} className="p-2 text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-all" title="Cancel">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(a)} className="p-2 text-[#4D5A2C] hover:bg-[#EEF3D2] rounded-lg transition-all" title="Edit Assignment">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => onDelete(a.id)} className="p-2 text-[#6B7160] hover:text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-all" title="Remove Assignment">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-6 lg:hidden">
        {assignments.map((a) => {
          const isEditing = editingId === a.id;
          return (
            <div key={a.id} className={`bg-white p-6 rounded-[32px] border-2 shadow-sm flex flex-col gap-5 transition-all ${isEditing ? "border-[#4D5A2C]" : "border-transparent hover:border-[#E8EDD0]"}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center font-black text-xs">
                    {a.ngoName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#1A1C15]">{a.ngoName}</h4>
                    <p className="text-[10px] font-black text-[#9CA396] uppercase tracking-widest">
                      {formatDateLabel(a.assignedAt)}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(a)} className="p-2 text-[#4D5A2C] hover:bg-[#EEF3D2] rounded-lg"><Pencil size={16} /></button>
                    <button onClick={() => onDelete(a.id)} className="p-2 text-[#6B7160] hover:text-[#BA1A1A]"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y-2 border-[#F7F5EE]">
                <div>
                  <p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Campus / Area</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-[#F7F5EE] border-2 border-transparent rounded-lg text-xs font-bold outline-none"
                      value={editState.campus}
                      onChange={e => setEditState(s => ({ ...s, campus: e.target.value }))}
                    >
                      {areaOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1C15]">
                      <MapPin size={12} className="text-[#6B7160]" /> {a.campus}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Coordinator</p>
                  {isEditing ? (
                    <input 
                      className="w-full p-2 bg-[#F7F5EE] border-2 border-transparent rounded-lg text-xs font-bold outline-none"
                      value={editState.coordinator}
                      onChange={e => setEditState(s => ({ ...s, coordinator: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1C15]">
                      <User size={12} className="text-[#6B7160]" /> {a.coordinator}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => saveEdit(a.id)} className="py-3 bg-[#4D5A2C] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={cancelEdit} className="py-3 bg-white border-2 border-[#E8EDD0] text-[#BA1A1A] rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

