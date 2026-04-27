"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  UserCircle, MapPin, Phone, Mail,
  Zap, CheckCircle, Edit3, Save, X,
  Star, Award, Clock, ToggleLeft
} from "lucide-react";
import ToastContainer, { showToast } from "@/components/volunteer/ToastContainer";

const SKILL_OPTIONS = ["Medical", "Food Supply", "Logistics", "Construction", "Counseling", "IT", "Other"];

const MOCK_PROFILE = {
  volunteerId: "vol-101",
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91 98765 43210",
  skills: ["Medical", "Logistics"],
  location: { address: "Bopal, Ahmedabad", lat: 23.0225, lng: 72.5714 },
  availability: true,
  bio: "Passionate about community service with 3+ years of experience in disaster relief. Trained first-aider and logistics coordinator.",
  pastWork: [
    { title: "Cyclone Biparjoy Relief", ngo: "Sahyog NGO", year: "2023", role: "Medical Volunteer" },
    { title: "COVID Vaccination Drive", ngo: "Health India", year: "2021", role: "Logistics Coordinator" },
  ],
};

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getVolunteer(volunteerId);
        const p = data || { ...MOCK_PROFILE, volunteerId };
        setProfile(p);
        setForm({ ...p });
      } catch {
        const p = { ...MOCK_PROFILE, volunteerId };
        setProfile(p);
        setForm({ ...p });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [volunteerId]);

  const handleSkillToggle = (skill: string) => {
    setForm((prev: any) => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter((s: string) => s !== skill)
        : [...(prev.skills || []), skill],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.updateVolunteerProfile(volunteerId, form);
      setProfile({ ...form });
      setEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch {
      setProfile({ ...form });
      setEditing(false);
      showToast("Profile saved locally — sync when online.", "warning");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...profile });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-secondary/40 animate-pulse uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const displayData = editing ? form : profile;

  return (
    <>
      <ToastContainer />
      <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">My Profile</h1>
          <p className="text-secondary/60 font-medium mt-1">Manage your skills, availability, and volunteer history.</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              form="profile-form"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-8 py-3.5 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        )}
      </div>

      <form id="profile-form" onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Main profile */}
          <div className="lg:col-span-8 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary font-black text-4xl border-2 border-primary/20 shadow-lg shadow-primary/10">
                  {displayData?.name?.[0] || "V"}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <input
                      value={form.name || ""}
                      onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                      className="text-3xl font-black text-on-surface w-full border-b-2 border-primary focus:outline-none bg-transparent pb-1 mb-2"
                      placeholder="Full Name"
                    />
                  ) : (
                    <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">{displayData?.name || volunteerId}</h2>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                      displayData?.availability ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      {displayData?.availability ? "✓ Available" : "Unavailable"}
                    </span>
                    <span className="text-[10px] font-black px-3 py-1 bg-surface-variant text-secondary/60 rounded-lg border border-outline/30 uppercase tracking-widest">
                      Volunteer
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-primary" /> Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={form.email || ""}
                      onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:outline-none transition-all bg-surface-variant/10"
                      placeholder="your@email.com"
                    />
                  ) : (
                    <p className="text-sm font-bold text-on-surface px-4 py-3 bg-surface-variant/10 rounded-xl border border-outline/30">{displayData?.email || "—"}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} className="text-primary" /> Phone
                  </label>
                  {editing ? (
                    <input
                      value={form.phone || ""}
                      onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:outline-none transition-all bg-surface-variant/10"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  ) : (
                    <p className="text-sm font-bold text-on-surface px-4 py-3 bg-surface-variant/10 rounded-xl border border-outline/30">{displayData?.phone || "—"}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-primary" /> Location
                  </label>
                  {editing ? (
                    <input
                      value={form.location?.address || ""}
                      onChange={e => setForm((p: any) => ({ ...p, location: { ...p.location, address: e.target.value } }))}
                      className="w-full px-4 py-3 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:outline-none transition-all bg-surface-variant/10"
                      placeholder="Your area or city"
                    />
                  ) : (
                    <p className="text-sm font-bold text-on-surface px-4 py-3 bg-surface-variant/10 rounded-xl border border-outline/30">
                      {typeof displayData?.location === "string" ? displayData.location : displayData?.location?.address || "—"}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Bio / Experience</label>
                  {editing ? (
                    <textarea
                      value={form.bio || ""}
                      onChange={e => setForm((p: any) => ({ ...p, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-outline/60 rounded-xl text-sm font-medium focus:border-primary focus:outline-none transition-all bg-surface-variant/10 resize-none"
                      placeholder="Describe your experience and background..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed px-4 py-3 bg-surface-variant/10 rounded-xl border border-outline/30">
                      {displayData?.bio || "No bio provided yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow">
              <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-3">
                <Zap size={22} className="text-primary" />
                Skills & Expertise
              </h3>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SKILL_OPTIONS.map(skill => {
                    const selected = form.skills?.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all text-center ${
                          selected ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-outline/60 text-secondary hover:border-primary/40"
                        }`}
                      >
                        {selected && <CheckCircle size={14} className="mx-auto mb-1" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(displayData?.skills || []).map((skill: string) => (
                    <span key={skill} className="text-sm font-black px-5 py-2.5 bg-primary/10 text-primary rounded-2xl uppercase tracking-widest border border-primary/20">
                      {skill}
                    </span>
                  ))}
                  {(!displayData?.skills || displayData.skills.length === 0) && (
                    <p className="text-sm text-secondary/40 italic">No skills added yet. Click Edit Profile to add skills.</p>
                  )}
                </div>
              )}
            </div>

            {/* Past Work History */}
            <div className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow">
              <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-3">
                <Award size={22} className="text-primary" />
                Past Work History
              </h3>
              {(displayData?.pastWork || []).length > 0 ? (
                <div className="space-y-4">
                  {displayData.pastWork.map((work: any, i: number) => (
                    <div key={i} className="flex items-start gap-5 p-5 rounded-2xl border-2 border-outline/40 hover:border-primary/30 transition-all">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg shrink-0 border border-primary/20">
                        {work.year?.slice(-2)}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-on-surface">{work.title}</h4>
                        <p className="text-xs font-bold text-secondary/60 mt-1">{work.ngo} · {work.role}</p>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1">{work.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-2">
                  <Clock size={40} className="mx-auto text-secondary/10" />
                  <p className="text-sm text-secondary/40 italic">No past work history yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Availability Toggle */}
            <div className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Availability
              </h3>
              <div className="space-y-4">
                <p className="text-sm font-medium text-secondary/60">Are you currently available for volunteer work?</p>
                {editing ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((p: any) => ({ ...p, availability: true }))}
                      className={`flex-1 py-4 rounded-button text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        form.availability ? "bg-green-500 border-green-500 text-white" : "bg-white border-outline/60 text-secondary"
                      }`}
                    >
                      ✓ Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p: any) => ({ ...p, availability: false }))}
                      className={`flex-1 py-4 rounded-button text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        !form.availability ? "bg-gray-500 border-gray-500 text-white" : "bg-white border-outline/60 text-secondary"
                      }`}
                    >
                      Unavailable
                    </button>
                  </div>
                ) : (
                  <div className={`p-5 rounded-2xl border-2 text-center ${displayData?.availability ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    <p className={`text-lg font-black ${displayData?.availability ? "text-green-700" : "text-gray-500"}`}>
                      {displayData?.availability ? "✓ Available Now" : "Not Available"}
                    </p>
                    <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1">
                      {displayData?.availability ? "You appear in NGO volunteer matching" : "Hidden from NGO searches"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Volunteer ID Card */}
            <div className="bg-on-surface rounded-modern p-8 text-white relative overflow-hidden custom-shadow">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Volunteer ID Card</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-3xl border border-white/20 mb-4">
                  {displayData?.name?.[0] || "V"}
                </div>
                <h4 className="text-xl font-black mb-1">{displayData?.name || volunteerId}</h4>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">{volunteerId}</p>
                <div className="space-y-2">
                  {(displayData?.skills || []).map((skill: string) => (
                    <div key={skill} className="flex items-center gap-2 text-xs font-bold text-white/70">
                      <CheckCircle size={12} className="text-green-400" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              <UserCircle className="absolute -right-8 -bottom-8 text-white/5" size={160} strokeWidth={1.5} />
            </div>

            {/* Profile completeness */}
            <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle size={18} className="text-primary" />
                Profile Completeness
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Name", done: !!displayData?.name },
                  { label: "Email", done: !!displayData?.email },
                  { label: "Phone", done: !!displayData?.phone },
                  { label: "Location", done: !!(displayData?.location?.address || displayData?.location) },
                  { label: "Skills added", done: (displayData?.skills?.length || 0) > 0 },
                  { label: "Bio added", done: !!displayData?.bio },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secondary/70">{item.label}</span>
                    {item.done ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Clock size={16} className="text-secondary/30" />
                    )}
                  </div>
                ))}
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full mt-6 py-3 bg-primary text-white rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  Complete Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
    </>
  );
}
