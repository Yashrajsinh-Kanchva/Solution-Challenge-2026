"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLES } from "@/constants/roles";
import { Loader2, User, ChevronRight, CheckCircle2, ShieldCheck, Plus, Zap } from "lucide-react";
import { apiClient } from "@/lib/api/client";

type CitizenSlim    = { id: string; name: string; area: string; status: string };
type VolunteerSlim  = { volunteerId: string; name: string; skills: string[]; ngoId?: string; status?: string };

const roleOptions: AppRole[] = [ROLES.ADMIN, ROLES.NGO, ROLES.CITIZEN, ROLES.VOLUNTEER];

const ROLE_LABELS: Record<AppRole, string> = {
  admin:     "👑 Admin",
  ngo:       "🏢 NGO",
  citizen:   "🧑 Citizen",
  volunteer: "🙋 Volunteer",
};

export default function LoginPage() {
  const router = useRouter();

  // Shared
  const [role, setRole] = useState<AppRole>(ROLES.ADMIN);

  // Citizen
  const [citizens,      setCitizens]      = useState<CitizenSlim[]>([]);
  const [citizenId,     setCitizenId]     = useState<string>("");
  const [loadingList,   setLoadingList]   = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [citizenError,  setCitizenError]  = useState("");

  // NGO / Volunteer (from mihir/ngo branch)
  const [selectedNgoId,     setSelectedNgoId]     = useState<string>("");
  const [ngos,              setNgos]              = useState<any[]>([]);
  const [showRegistration,  setShowRegistration]  = useState(false);
  const [showVolunteerJoin, setShowVolunteerJoin] = useState(false);
  const [submitting,        setSubmitting]        = useState(false);

  // Volunteer login dropdown
  const [volunteers,      setVolunteers]      = useState<VolunteerSlim[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [loadingVolunteers,   setLoadingVolunteers]   = useState(false);
  const [volunteerError,      setVolunteerError]      = useState("");

  const [ngoForm, setNgoForm] = useState({
    ngoName: "", contactName: "", email: "", phone: "", mission: "", area: "",
  });
  const [volunteerForm, setVolunteerForm] = useState({
    name: "", skills: "", location: "", phone: "", email: "", ngoId: "", volunteerId: "",
  });

  /* ── Fetch citizens when Citizen role selected ── */
  useEffect(() => {
    if (role !== ROLES.CITIZEN) return;
    setLoadingList(true);
    setCitizenError("");
    fetch("/api/citizens")
      .then(r => r.json())
      .then(data => {
        setCitizens(data.citizens ?? []);
        setCitizenId(data.citizens?.[0]?.id ?? "");
      })
      .catch(() => setCitizenError("Failed to load citizens from database."))
      .finally(() => setLoadingList(false));
  }, [role]);

  /* ── Fetch NGOs when NGO/Volunteer role selected ── */
  const fetchNgos = () => {
    apiClient.getNgos().then((data: any[]) => {
      if (data && data.length > 0) {
        const filtered = data.filter((n: any) => n.status !== "rejected");
        setNgos(filtered);
        const first = filtered.find((n: any) => n.status === "approved");
        if (first) {
          setSelectedNgoId(first.ngoId || first.id);
          setVolunteerForm(prev => ({ ...prev, ngoId: first.ngoId || first.id }));
        }
      }
    });
  };

  useEffect(() => {
    if (role === ROLES.NGO || role === ROLES.VOLUNTEER) fetchNgos();
  }, [role]);

  /* ── Fetch volunteers when Volunteer role selected ── */
  useEffect(() => {
    if (role !== ROLES.VOLUNTEER) return;
    setLoadingVolunteers(true);
    setVolunteerError("");
    apiClient.getAllVolunteers()
      .then((data: VolunteerSlim[]) => {
        setVolunteers(data);
        if (data.length > 0) setSelectedVolunteerId(data[0].volunteerId);
        else setVolunteerError("No volunteers found. Register a volunteer via 'Request to Join' below.");
      })
      .catch(() => setVolunteerError("Failed to load volunteers from database."))
      .finally(() => setLoadingVolunteers(false));
  }, [role]);

  /* ── Submit ── */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role === ROLES.CITIZEN && !citizenId) {
      setCitizenError("Please select a citizen."); return;
    }
    if (role === ROLES.VOLUNTEER && !selectedVolunteerId) {
      setVolunteerError("Please select a volunteer."); return;
    }
    const selected = ngos.find(n => (n.ngoId || n.id) === selectedNgoId);
    if (role === ROLES.NGO && selected?.status === "pending") {
      alert("This NGO registration is still pending approval."); return;
    }

    setLoadingSubmit(true);
    document.cookie = `vb_role=${role}; path=/`;
    if (role === ROLES.CITIZEN)   document.cookie = `vb_citizen_id=${citizenId}; path=/`;
    if (role === ROLES.NGO)       document.cookie = `vb_ngo_id=${selectedNgoId}; path=/`;
    if (role === ROLES.VOLUNTEER) document.cookie = `vb_volunteer_id=${selectedVolunteerId}; path=/`;

    const destinations: Record<AppRole, string> = {
      [ROLES.ADMIN]:     "/admin/dashboard",
      [ROLES.CITIZEN]:   "/citizen/report",
      [ROLES.NGO]:       "/ngo/dashboard",
      [ROLES.VOLUNTEER]: "/volunteer/dashboard",
    };
    router.push(destinations[role] ?? "/");
  };

  /* ── NGO Registration ── */
  const handleRegisterNgo = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.registerNgo(ngoForm);
      alert("NGO registration submitted! It will appear as (Under Review) until approved.");
      setShowRegistration(false);
      fetchNgos();
    } catch { alert("Failed to submit registration."); }
    finally { setSubmitting(false); }
  };

  /* ── Volunteer Join ── */
  const handleVolunteerJoin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...volunteerForm,
        volunteerId: `vol-${Date.now()}`,
        skills: volunteerForm.skills.split(",").map(s => s.trim()),
      };
      await apiClient.submitVolunteerJoinRequest(volunteerForm.ngoId, payload);
      alert("Join request sent! The NGO will review your application.");
      setShowVolunteerJoin(false);
    } catch { alert("Failed to send request."); }
    finally { setSubmitting(false); }
  };

  /* ── NGO Registration Screen ── */
  if (showRegistration) {
    return (
      <section className="bg-white rounded-modern border border-outline-light p-12 shadow-card w-full max-w-xl animate-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight leading-none">Organization Onboarding</h1>
            <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Apply to join the VolunteerBridge network</p>
          </div>
        </div>
        <form onSubmit={handleRegisterNgo} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">NGO Name</label>
              <input required value={ngoForm.ngoName} onChange={e => setNgoForm({...ngoForm, ngoName: e.target.value})} placeholder="e.g. Hope Foundation" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Area of Operations</label>
              <input required value={ngoForm.area} onChange={e => setNgoForm({...ngoForm, area: e.target.value})} placeholder="e.g. Gujarat Region" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Domain</label>
              <input type="email" required value={ngoForm.email} onChange={e => setNgoForm({...ngoForm, email: e.target.value})} placeholder="official@ngo.org" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Main Coordinator</label>
              <input required value={ngoForm.contactName} onChange={e => setNgoForm({...ngoForm, contactName: e.target.value})} placeholder="Contact name" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Strategic Mission</label>
            <textarea required value={ngoForm.mission} onChange={e => setNgoForm({...ngoForm, mission: e.target.value})} placeholder="Describe your organization's core objectives..." rows={4} className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card resize-none" />
          </div>
          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
              {submitting ? "Processing..." : "Submit Application"}
            </button>
            <button type="button" onClick={() => setShowRegistration(false)} className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95">
              Return to Login
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* ── Volunteer Join Screen ── */
  if (showVolunteerJoin) {
    return (
      <section className="bg-white rounded-modern border border-outline-light p-12 shadow-card w-full max-w-xl animate-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight leading-none">Join Organization</h1>
            <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Send a request to join an NGO</p>
          </div>
        </div>
        <form onSubmit={handleVolunteerJoin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Your Full Name</label>
            <input required value={volunteerForm.name} onChange={e => setVolunteerForm({...volunteerForm, name: e.target.value})} placeholder="e.g. Rahul Sharma" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" required value={volunteerForm.email} onChange={e => setVolunteerForm({...volunteerForm, email: e.target.value})} placeholder="rahul@example.com" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Phone Number</label>
              <input required value={volunteerForm.phone} onChange={e => setVolunteerForm({...volunteerForm, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Skills (comma separated)</label>
            <input required value={volunteerForm.skills} onChange={e => setVolunteerForm({...volunteerForm, skills: e.target.value})} placeholder="e.g. First Aid, Driving, Logistics" className="w-full px-5 py-3.5 bg-surface-2 border border-outline-light rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-card" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Select Organization</label>
            <select required value={volunteerForm.ngoId} onChange={e => setVolunteerForm({...volunteerForm, ngoId: e.target.value})} className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer">
              {ngos.map(ngo => <option key={ngo.ngoId || ngo.id} value={ngo.ngoId || ngo.id}>{ngo.ngoName || ngo.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
              {submitting ? "Sending..." : "Send Join Request"}
            </button>
            <button type="button" onClick={() => setShowVolunteerJoin(false)} className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95">
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* ── Main Login Screen ── */
  return (
    <div className="min-h-screen bg-[#F7F5EE] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4DCA8]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4D5A2C]/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-[520px] bg-white border-[1.5px] border-[#D4DCA8] rounded-[32px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(77,90,44,0.1)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#4D5A2C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_rgba(77,90,44,0.35)]">
            <Zap size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-[#1A1C15] tracking-tight mb-2">VolunteerBridge</h1>
          <p className="text-[#6B7160] text-sm font-medium">Select your role to enter the platform</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">

          {/* Role picker grid */}
          <div className="space-y-4">
            <label className="block font-bold text-sm text-[#404535] uppercase tracking-[0.12em]">Identity Profile</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roleOptions.map(r => (
                <button 
                  key={r} 
                  type="button" 
                  onClick={() => setRole(r)} 
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl border-[1.5px] transition-all text-sm font-bold
                    ${role === r 
                      ? "bg-[#EEF3D2] border-[#4D5A2C] text-[#1A1C15] shadow-[0_4px_12px_rgba(77,90,44,0.1)] scale-[1.02]" 
                      : "bg-[#FAFAF7] border-[#D4DCA8] text-[#6B7160] hover:border-[#4D5A2C]/40 hover:bg-white"
                    }
                  `}
                >
                  <span className="text-base leading-none">{ROLE_LABELS[r].split(" ")[0]}</span>
                  <span>{ROLE_LABELS[r].split(" ")[1]}</span>
                  {role === r && <CheckCircle2 size={16} className="text-[#4D5A2C] ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen — Firebase picker */}
          {role === ROLES.CITIZEN && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block font-bold text-sm text-[#404535] uppercase tracking-[0.12em]">
                Select Identity
                <span className="font-medium normal-case text-[#6B7160]/70 ml-2 tracking-normal">(Live database)</span>
              </label>
              {loadingList ? (
                <div className="flex items-center gap-3 p-4 bg-[#F7F5EE] border-[1.5px] border-[#E8EDD0] rounded-2xl text-sm font-medium text-[#6B7160]">
                  <Loader2 size={18} className="animate-spin" />
                  Synchronizing records…
                </div>
              ) : (
                <div className="relative group">
                  <select 
                    id="citizen-select" 
                    value={citizenId} 
                    onChange={e => setCitizenId(e.target.value)} 
                    className="w-full px-5 py-4 bg-[#FAFAF7] border-[1.5px] border-[#D4DCA8] rounded-2xl text-[15px] font-bold text-[#1A1C15] outline-none transition-all focus:border-[#4D5A2C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(77,90,44,0.08)] appearance-none cursor-pointer"
                  >
                    {citizens.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.area})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              )}
              {citizenId && !loadingList && (() => {
                const sel = citizens.find(c => c.id === citizenId);
                return sel ? (
                  <div className="flex items-center gap-3 bg-[#EEF3D2] border-[1.5px] border-[#D4DCA8] rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4D5A2C] shadow-sm">
                      <User size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-[#1A1C15]">{sel.name}</strong>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sel.status === "active" ? "bg-[#2E6B32]/10 text-[#2E6B32]" : "bg-[#B45309]/10 text-[#B45309]"}`}>
                          {sel.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#6B7160]/70">{sel.area}</p>
                    </div>
                  </div>
                ) : null;
              })()}
              {citizenError && <p className="text-red-600 text-xs font-bold mt-2 ml-1">{citizenError}</p>}
            </div>
          )}

          {/* NGO — select existing or register new */}
          {role === ROLES.NGO && (
            <div className="space-y-3 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="ngoId" className="text-[10px] font-black text-on-surface uppercase tracking-widest">Select NGO Entity</label>
                <button type="button" onClick={() => setShowRegistration(true)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  <Plus size={12} strokeWidth={3} /> Request New
                </button>
              </div>
              <select id="ngoId" value={selectedNgoId} onChange={e => setSelectedNgoId(e.target.value)} className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer">
                {ngos.map(ngo => {
                  const isPending = ngo.status === "pending";
                  return (
                    <option key={ngo.ngoId || ngo.id} value={ngo.ngoId || ngo.id} disabled={isPending}>
                      {ngo.ngoName || ngo.name}{isPending ? " (Under Review)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Volunteer — dropdown from database */}
          {role === ROLES.VOLUNTEER && (
            <div className="space-y-3 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-1">
                <label style={labelStyle}>
                  Select Volunteer
                  <span style={{ fontWeight: 400, color: "#6b7466", marginLeft: "0.4rem" }}>(fetched from database)</span>
                </label>
              </div>

              {loadingVolunteers ? (
                <div style={loadingBox}>
                  <Loader2 size={18} style={{ animation: "vb-spin 1s linear infinite" }} />
                  Loading volunteers from database…
                </div>
              ) : volunteers.length > 0 ? (
                <>
                  <select
                    id="volunteer-select"
                    value={selectedVolunteerId}
                    onChange={e => setSelectedVolunteerId(e.target.value)}
                    style={selectStyle}
                  >
                    {volunteers.map((v, idx) => (
                      <option key={v.volunteerId} value={v.volunteerId}>
                        {idx + 1}. {v.name || v.volunteerId}
                        {v.status ? ` — ${v.status}` : ""}
                        {v.skills?.length ? ` (${v.skills.slice(0, 2).join(", ")})` : ""}
                      </option>
                    ))}
                  </select>
                  {/* Preview chip */}
                  {(() => {
                    const sel = volunteers.find(v => v.volunteerId === selectedVolunteerId);
                    return sel ? (
                      <div style={previewChip}>
                        <User size={14} />
                        <strong>{sel.name || sel.volunteerId}</strong>
                        {sel.skills?.length > 0 && (
                          <>
                            <span style={{ color: "#6b7466" }}>·</span>
                            <span>{sel.skills.slice(0, 3).join(", ")}</span>
                          </>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: sel.status?.toUpperCase() === "ACTIVE" ? "#2e7d32" : "#b45309" }}>
                          {(sel.status || "ACTIVE").toUpperCase()}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </>
              ) : null}

              {volunteerError && <p style={{ color: "#ba1a1a", fontSize: "0.8rem", marginTop: "0.4rem" }}>{volunteerError}</p>}

              <button type="button" onClick={() => setShowVolunteerJoin(true)} className="w-full py-4 border-2 border-dashed border-outline/60 text-secondary/60 rounded-2xl font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> Not listed? Request to Join an NGO
              </button>
            </div>
          )}

          <button 
            id="login-submit-btn" 
            type="submit" 
            disabled={loadingSubmit || (role === ROLES.CITIZEN && loadingList)} 
            className="group w-full py-4.5 bg-[#4D5A2C] text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:bg-[#647A39] shadow-[0_8px_20px_rgba(77,90,44,0.2)] hover:shadow-[0_12px_25px_rgba(77,90,44,0.3)] active:scale-[0.98] disabled:opacity-50 mt-6"
          >
            {loadingSubmit ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Enter as {ROLE_LABELS[role].split(" ")[1]}</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-[13px] font-bold text-[#5A614F] uppercase tracking-widest">
          Simulated environment · Demo access only
        </p>
      </div>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes vb-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const shell: React.CSSProperties        = { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F5EE", padding:"1rem" };
const card: React.CSSProperties         = { background:"#fff", border:"1.5px solid #E8EDD0", borderRadius:"20px", padding:"2.75rem 2.25rem", width:"min(500px,100%)", boxShadow:"0 4px 16px rgba(45,55,20,0.08), 0 20px 48px rgba(45,55,20,0.10)" };
const logoBox: React.CSSProperties      = { width:"52px", height:"52px", borderRadius:"14px", background:"#4D5A2C", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"0.75rem", boxShadow:"0 8px 20px rgba(77,90,44,0.35)" };
const heading: React.CSSProperties      = { fontSize:"1.55rem", fontWeight:900, color:"#1A1C15", letterSpacing:"-0.03em", margin:"0 0 0.35rem" };
const subtext: React.CSSProperties      = { color:"#6B7160", fontSize:"0.875rem" };
const labelStyle: React.CSSProperties   = { display:"block", fontWeight:700, fontSize:"0.78rem", color:"#404535", marginBottom:"0.6rem", textTransform:"uppercase", letterSpacing:"0.08em" };
const roleGrid: React.CSSProperties     = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" };
const roleBtn: React.CSSProperties      = { border:"1.5px solid", borderRadius:"10px", padding:"0.7rem 1rem", fontSize:"0.875rem", cursor:"pointer", transition:"all 0.18s", display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"'Public Sans', sans-serif" };
const selectStyle: React.CSSProperties  = { width:"100%", border:"1.5px solid #D4DCA8", borderRadius:"10px", padding:"0.75rem 1rem", fontSize:"0.875rem", color:"#1A1C15", background:"#FAFAF7", outline:"none", fontFamily:"'Public Sans', sans-serif", cursor:"pointer" };
const previewChip: React.CSSProperties  = { marginTop:"0.6rem", display:"flex", alignItems:"center", gap:"0.5rem", background:"#EEF3D2", border:"1.5px solid #D4DCA8", borderRadius:"10px", padding:"0.6rem 0.9rem", fontSize:"0.82rem", color:"#1A1C15" };
const loadingBox: React.CSSProperties   = { display:"flex", alignItems:"center", gap:"0.5rem", color:"#6B7160", fontSize:"0.85rem", padding:"0.75rem", background:"#F7F5EE", borderRadius:"10px", border:"1.5px solid #E8EDD0" };
const submitBtn: React.CSSProperties    = { width:"100%", padding:"0.9rem", background:"#4D5A2C", color:"#fff", border:"none", borderRadius:"12px", fontWeight:800, fontSize:"0.95rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", cursor:"pointer", fontFamily:"'Public Sans', sans-serif", boxShadow:"0 4px 14px rgba(77,90,44,0.35)", transition:"all 0.2s", letterSpacing:"0.01em" };

