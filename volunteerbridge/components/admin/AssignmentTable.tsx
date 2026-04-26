"use client";

import type { NgoAssignment } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";
import { Trash2, Pencil, Check, X, MapPin, User } from "lucide-react";
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
      <div style={{ padding:"2rem", textAlign:"center", color:"#6b7466" }}>
        No assignments found. Create one above.
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>NGO Name</th>
            <th>Campus / Area</th>
            <th>Coordinator</th>
            <th>Assigned On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, i) => {
            const isEditing = editingId === a.id;
            return (
              <tr key={a.id} style={{ background: isEditing ? "#f6f3ed" : undefined }}>
                {/* # */}
                <td style={{ color:"#9ca3af", fontWeight:700, fontSize:"0.8rem", width:36 }}>{i + 1}</td>

                {/* NGO */}
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"#dce4b8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#59623c" }}>
                        {a.ngoName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <strong style={{ fontSize:"0.875rem" }}>{a.ngoName}</strong>
                  </div>
                </td>

                {/* Campus — editable */}
                <td>
                  {isEditing ? (
                    <select
                      className="text-input"
                      style={{ margin:0, padding:"0.4rem 0.6rem", fontSize:"0.8rem", minWidth:140 }}
                      value={editState.campus}
                      onChange={e => setEditState(s => ({ ...s, campus: e.target.value }))}
                    >
                      {areaOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.875rem" }}>
                      <MapPin size={13} color="#9ca3af" />
                      {a.campus}
                    </div>
                  )}
                </td>

                {/* Coordinator — editable */}
                <td>
                  {isEditing ? (
                    <input
                      className="text-input"
                      style={{ margin:0, padding:"0.4rem 0.6rem", fontSize:"0.8rem", minWidth:140 }}
                      value={editState.coordinator}
                      onChange={e => setEditState(s => ({ ...s, coordinator: e.target.value }))}
                    />
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.875rem" }}>
                      <User size={13} color="#9ca3af" />
                      {a.coordinator}
                    </div>
                  )}
                </td>

                {/* Date */}
                <td style={{ fontSize:"0.82rem", color:"#6b7466" }}>
                  {formatDateLabel(a.assignedAt)}
                </td>

                {/* Actions */}
                <td>
                  <div className="inline-actions" style={{ flexWrap:"nowrap" }}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => saveEdit(a.id)}
                          style={{ display:"flex", alignItems:"center", gap:"0.35rem" }}
                        >
                          <Check size={13} /> Save
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={cancelEdit}
                          style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.65rem" }}
                        >
                          <X size={13} /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => startEdit(a)}
                          style={{ display:"flex", alignItems:"center", gap:"0.35rem", background:"#f6f3ed", border:"1px solid #ccd6a6", color:"#59623c" }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="action-button action-button--danger"
                          onClick={() => onDelete(a.id)}
                          style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.65rem" }}
                        >
                          <Trash2 size={13} />
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
  );
}
