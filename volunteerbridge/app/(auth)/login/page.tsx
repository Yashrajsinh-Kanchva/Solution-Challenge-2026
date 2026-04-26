"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLES } from "@/constants/roles";
import { apiClient } from "@/lib/api/client";
import { ShieldCheck, Zap, Plus, ArrowRight } from "lucide-react";

const roleOptions: AppRole[] = [ROLES.ADMIN, ROLES.NGO, ROLES.CITIZEN, ROLES.VOLUNTEER];

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(ROLES.ADMIN);
  const [selectedNgoId, setSelectedNgoId] = useState<string>("");
  const [ngos, setNgos] = useState<any[]>([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showVolunteerJoin, setShowVolunteerJoin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Registration Form State
  const [ngoForm, setNgoForm] = useState({
    ngoName: "",
    contactName: "",
    email: "",
    phone: "",
    mission: "",
    area: "",
  });

  const [volunteerForm, setVolunteerForm] = useState({
    name: "",
    skills: "",
    location: "",
    phone: "",
    email: "",
    ngoId: "",
    volunteerId: "",
  });

  const fetchNgos = () => {
    apiClient.getNgos().then(data => {
      if (data && data.length > 0) {
        // Filter out rejected NGOs
        const filtered = data.filter((n: any) => n.status !== "rejected");
        setNgos(filtered);
        const firstSelectable = filtered.find((n: any) => n.status === "approved");
        if (firstSelectable) {
          setSelectedNgoId(firstSelectable.ngoId || firstSelectable.id);
          setVolunteerForm(prev => ({ ...prev, ngoId: firstSelectable.ngoId || firstSelectable.id }));
        }
      }
    });
  };

  useEffect(() => {
    if (role === ROLES.NGO || role === ROLES.VOLUNTEER) {
      fetchNgos();
    }
  }, [role]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Check if selected NGO is pending
    const selected = ngos.find(n => (n.ngoId || n.id) === selectedNgoId);
    if (role === ROLES.NGO && selected?.status === "pending") {
      alert("This NGO registration is still pending approval.");
      return;
    }

    document.cookie = `vb_role=${role}; path=/`;
    
    if (role === ROLES.NGO) {
      document.cookie = `vb_ngo_id=${selectedNgoId}; path=/`;
    }

    if (role === ROLES.VOLUNTEER) {
      // Use the ID from the form or a default for simulation
      const volId = volunteerForm.volunteerId || "vol-101";
      document.cookie = `vb_volunteer_id=${volId}; path=/`;
    }

    switch (role) {
      case ROLES.ADMIN:
        router.push("/admin/dashboard");
        break;
      case ROLES.NGO:
        router.push("/ngo/dashboard");
        break;
      case ROLES.VOLUNTEER:
        router.push("/volunteer/dashboard");
        break;
      case ROLES.CITIZEN:
        router.push("/citizen/dashboard");
        break;
      default:
        router.push("/");
    }
  };

  const handleRegisterNgo = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.registerNgo(ngoForm);
      alert("NGO registration request submitted! It will appear in the list as (Requested) until approved.");
      setShowRegistration(false);
      fetchNgos();
    } catch (err) {
      alert("Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVolunteerJoin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...volunteerForm,
        volunteerId: `vol-${Date.now()}`,
        skills: volunteerForm.skills.split(",").map(s => s.trim())
      };
      await apiClient.submitVolunteerJoinRequest(volunteerForm.ngoId, payload);
      alert("Join request sent! The NGO will review your application.");
      setShowVolunteerJoin(false);
    } catch (err) {
      alert("Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showRegistration) {
    return (
      <section className="bg-white rounded-modern border-2 border-outline/60 p-12 custom-shadow w-full max-w-xl animate-in zoom-in duration-500">
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
              <input 
                required 
                value={ngoForm.ngoName} 
                onChange={e => setNgoForm({...ngoForm, ngoName: e.target.value})}
                placeholder="e.g. Hope Foundation"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Area of Operations</label>
              <input 
                required 
                value={ngoForm.area} 
                onChange={e => setNgoForm({...ngoForm, area: e.target.value})}
                placeholder="e.g. Gujarat Region"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Domain</label>
              <input 
                type="email" 
                required 
                value={ngoForm.email} 
                onChange={e => setNgoForm({...ngoForm, email: e.target.value})}
                placeholder="official@ngo.org"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Main Coordinator</label>
              <input 
                required 
                value={ngoForm.contactName} 
                onChange={e => setNgoForm({...ngoForm, contactName: e.target.value})}
                placeholder="Contact name"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Strategic Mission</label>
            <textarea 
              required 
              value={ngoForm.mission} 
              onChange={e => setNgoForm({...ngoForm, mission: e.target.value})}
              placeholder="Describe your organization's core objectives and emergency response capacity..."
              rows={4}
              className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner resize-none"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Processing Application..." : "Submit Application"}
            </button>
            <button 
              type="button" 
              className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95" 
              onClick={() => setShowRegistration(false)}
            >
              Return to Login
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (showVolunteerJoin) {
    return (
      <section className="bg-white rounded-modern border-2 border-outline/60 p-12 custom-shadow w-full max-w-xl animate-in zoom-in duration-500">
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
            <input 
              required 
              value={volunteerForm.name} 
              onChange={e => setVolunteerForm({...volunteerForm, name: e.target.value})}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={volunteerForm.email} 
                onChange={e => setVolunteerForm({...volunteerForm, email: e.target.value})}
                placeholder="rahul@example.com"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                required 
                value={volunteerForm.phone} 
                onChange={e => setVolunteerForm({...volunteerForm, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Skills (comma separated)</label>
            <input 
              required 
              value={volunteerForm.skills} 
              onChange={e => setVolunteerForm({...volunteerForm, skills: e.target.value})}
              placeholder="e.g. First Aid, Driving, Logistics"
              className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Select Organization</label>
            <select
              required
              value={volunteerForm.ngoId}
              onChange={(e) => setVolunteerForm({...volunteerForm, ngoId: e.target.value})}
              className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
            >
              {ngos.map((ngo) => (
                <option key={ngo.ngoId || ngo.id} value={ngo.ngoId || ngo.id}>
                  {ngo.ngoName || ngo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Sending Request..." : "Send Join Request"}
            </button>
            <button 
              type="button" 
              className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95" 
              onClick={() => setShowVolunteerJoin(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <section className="bg-white rounded-modern border-2 border-outline/60 p-12 custom-shadow w-full max-lg relative overflow-hidden group">
        {/* Logo/Icon */}
        <div className="flex flex-col items-center text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-4 group-hover:scale-110 transition-transform duration-500">
            <Zap size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">VolunteerBridge</h1>
          <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Emergency Coordination Command</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label htmlFor="role" className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Authentication Level</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {role === ROLES.NGO && (
            <div className="space-y-3 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="ngoId" className="text-[10px] font-black text-on-surface uppercase tracking-widest">Select NGO Entity</label>
                <button 
                  type="button" 
                  onClick={() => setShowRegistration(true)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={3} /> Request New
                </button>
              </div>
              <select
                id="ngoId"
                name="ngoId"
                value={selectedNgoId}
                onChange={(event) => setSelectedNgoId(event.target.value)}
                className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
              >
                {ngos.map((ngo) => {
                   const isPending = ngo.status === "pending";
                   return (
                    <option 
                      key={ngo.ngoId || ngo.id} 
                      value={ngo.ngoId || ngo.id} 
                      disabled={isPending}
                    >
                      {ngo.ngoName || ngo.name} {isPending ? "(Under Review)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {role === ROLES.VOLUNTEER && (
             <div className="space-y-3 animate-in slide-in-from-top duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Volunteer ID (for Login)</label>
                  <input 
                    value={volunteerForm.volunteerId}
                    onChange={(e) => setVolunteerForm({...volunteerForm, volunteerId: e.target.value})}
                    placeholder="e.g. vol-101"
                    className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowVolunteerJoin(true)}
                  className="w-full py-4 border-2 border-dashed border-outline/60 text-secondary/60 rounded-2xl font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Request to Join NGO
                </button>
             </div>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-on-surface text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-on-surface/10 active:scale-95 flex items-center justify-center gap-3 mt-8"
          >
            Initialize Session <ArrowRight size={18} />
          </button>
        </form>

        {/* Decorative Background */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      </section>
    </div>
  );
}
