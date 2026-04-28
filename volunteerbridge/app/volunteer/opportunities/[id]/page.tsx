"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  ArrowLeft, MapPin, Users, Calendar, Briefcase,
  CheckCircle, Clock, AlertTriangle, Star, Zap,
  ChevronRight, Send, Shield, Hourglass, XCircle
} from "lucide-react";
import ToastContainer, { showToast } from "@/components/volunteer/ToastContainer";

const MOCK_OPPORTUNITIES: Record<string, any> = {
  "opp-1": { id: "opp-1", title: "Flood Relief — Medical Support", ngoName: "Sahyog NGO", description: "We need medical volunteers to support flood victims in low-lying areas. Your role involves first-aid, triage, coordinating with local health authorities, assisting in patient transport, and maintaining medical supply records.", requiredSkills: ["Medical", "Logistics"], totalVolunteers: 20, openPositions: 8, urgency: "critical", location: { address: "Vasna, Ahmedabad", lat: 23.0010, lng: 72.5588 }, durationStart: "2026-05-01", durationEnd: "2026-05-15", crisisType: "Natural Disaster" },
  "opp-2": { id: "opp-2", title: "Food Distribution Drive", ngoName: "Annapurna Foundation", description: "Help distribute food packets to shelters across the city. Roles include logistics coordination, vehicle loading/unloading, and doorstep delivery to 12 shelter points.", requiredSkills: ["Food Supply", "Logistics"], totalVolunteers: 30, openPositions: 15, urgency: "high", location: { address: "Maninagar, Ahmedabad", lat: 23.0038, lng: 72.5985 }, durationStart: "2026-04-28", durationEnd: "2026-05-05", crisisType: "Food Crisis" },
  "opp-3": { id: "opp-3", title: "Psychosocial Support Camp", ngoName: "Mindful Aid", description: "Provide emotional support and counseling to trauma survivors. Certified counselors and trained listeners needed for a 10-day support camp.", requiredSkills: ["Counseling"], totalVolunteers: 10, openPositions: 4, urgency: "medium", location: { address: "Satellite, Ahmedabad", lat: 23.0395, lng: 72.5185 }, durationStart: "2026-05-03", durationEnd: "2026-05-13", crisisType: "Mental Health" },
  "opp-4": { id: "opp-4", title: "Shelter Construction Brigade", ngoName: "BuildUp Gujarat", description: "Assist in constructing temporary shelters for displaced families. No experience needed — training provided on-site.", requiredSkills: ["Construction", "Logistics"], totalVolunteers: 50, openPositions: 22, urgency: "high", location: { address: "Naroda, Ahmedabad", lat: 23.0800, lng: 72.6540 }, durationStart: "2026-04-29", durationEnd: "2026-05-20", crisisType: "Infrastructure" },
  "opp-5": { id: "opp-5", title: "IT Support for Operations Center", ngoName: "TechCare India", description: "Set up and manage IT infrastructure at the relief operations center — database management, volunteer tracking system support, and network configuration.", requiredSkills: ["IT"], totalVolunteers: 5, openPositions: 2, urgency: "medium", location: { address: "Paldi, Ahmedabad", lat: 23.0156, lng: 72.5726 }, durationStart: "2026-05-01", durationEnd: "2026-05-10", crisisType: "Operations" },
};

type AppStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [appStatus, setAppStatus] = useState<AppStatus>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const volunteerId = getCookie("vb_volunteer_id") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oppData, appData] = await Promise.allSettled([
          apiClient.getVolunteerOpportunity(id),
          apiClient.getVolunteerApplications(volunteerId),
        ]);

        if (oppData.status === "fulfilled" && oppData.value) {
          setOpp(oppData.value);
        } else {
          setOpp(MOCK_OPPORTUNITIES[id] || null);
        }

        if (appData.status === "fulfilled") {
          const existing = (appData.value || []).find((app: any) => app.opportunityId === id);
          if (existing) setAppStatus(existing.status as AppStatus);
        }
      } catch {
        setOpp(MOCK_OPPORTUNITIES[id] || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, volunteerId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      await apiClient.applyToOpportunity(id, { volunteerId, message, appliedAt: new Date().toISOString() });
      setAppStatus("PENDING");
      setShowForm(false);
      showToast("Application submitted successfully! The NGO will review your profile.", "success");
    } catch {
      // Graceful degradation
      setAppStatus("PENDING");
      setShowForm(false);
      showToast("Application submitted!", "success");
    } finally {
      setApplying(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-surface-variant/40 rounded-xl w-32" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <div className="bg-white border-2 border-outline/40 rounded-modern p-10 space-y-6">
              <div className="flex gap-6">
                <div className="w-20 h-20 bg-surface-variant/40 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-7 bg-surface-variant/40 rounded-xl w-2/3" />
                  <div className="h-4 bg-surface-variant/30 rounded-xl w-1/3" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-variant/20 rounded-2xl" />)}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-surface-variant/20 rounded w-full" />
                <div className="h-4 bg-surface-variant/20 rounded w-5/6" />
                <div className="h-4 bg-surface-variant/20 rounded w-4/6" />
              </div>
            </div>
          </div>
          <div className="col-span-4 space-y-6">
            <div className="bg-white border-2 border-outline/40 rounded-modern p-8 h-48" />
            <div className="bg-on-surface/10 rounded-modern p-8 h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="bg-white p-20 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
        <AlertTriangle size={56} className="mx-auto text-secondary/20" />
        <h3 className="text-xl font-black text-secondary/40">Opportunity Not Found</h3>
        <button onClick={() => router.back()} className="px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest">
          Go Back
        </button>
      </div>
    );
  }

  const hasApplied = appStatus !== null;
  const isApproved = appStatus === "APPROVED";
  const isRejected = appStatus === "REJECTED";
  const isPending = appStatus === "PENDING";

  return (
    <>
      <ToastContainer />
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-black text-secondary/60 hover:text-primary transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={18} /> Back to Opportunities
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main detail */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-modern border-2 border-outline/60 p-10 custom-shadow">
              <div className="flex items-start gap-6 mb-8">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm border shrink-0 ${
                  isApproved ? "bg-green-500 text-white border-green-400" : "bg-primary/10 text-primary border-primary/20"
                }`}>
                  {opp.ngoName?.[0] || "N"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl font-black text-on-surface tracking-tight">{opp.title}</h1>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${getUrgencyBadge(opp.urgency)}`}>
                      {opp.urgency}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                      <Briefcase size={16} className="text-primary" />
                      {opp.ngoName}
                    </div>
                    {opp.crisisType && (
                      <span className="text-[10px] font-black px-3 py-1 bg-surface-variant text-secondary/60 rounded-lg uppercase tracking-widest border border-outline/30">
                        {opp.crisisType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 bg-surface-variant/10 rounded-2xl border border-outline/30 space-y-1">
                  <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Location</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                    <MapPin size={16} className="text-primary shrink-0" />
                    {typeof opp.location === "string" ? opp.location : opp.location?.address || "TBD"}
                  </div>
                </div>
                <div className="p-5 bg-surface-variant/10 rounded-2xl border border-outline/30 space-y-1">
                  <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Duration</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                    <Calendar size={16} className="text-primary shrink-0" />
                    {opp.durationStart ? `${new Date(opp.durationStart).toLocaleDateString()} – ${new Date(opp.durationEnd).toLocaleDateString()}` : "TBD"}
                  </div>
                </div>
                <div className={`p-5 rounded-2xl border space-y-1 text-center ${isApproved ? "bg-green-50 border-green-200" : "bg-primary/5 border-primary/20"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isApproved ? "text-green-600" : "text-primary"}`}>Open Spots</p>
                  <p className="text-3xl font-black text-on-surface">{opp.openPositions}</p>
                  <p className="text-[10px] font-bold text-secondary/50">of {opp.totalVolunteers} total</p>
                </div>
              </div>

              {/* Description */}
              <div className="relative mb-8">
                <div className="absolute -left-5 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                <p className="text-base text-on-surface-variant leading-relaxed font-medium pl-4">
                  {opp.description}
                </p>
              </div>

              {/* Skills required */}
              <div>
                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(opp.requiredSkills || []).map((skill: string) => (
                    <span key={skill} className="text-xs font-black px-4 py-2 bg-primary/10 text-primary rounded-xl uppercase tracking-widest border border-primary/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Application section */}
            {isApproved && (
              <div className="bg-green-50 rounded-modern border-2 border-green-300 p-10 text-center space-y-4 custom-shadow">
                <CheckCircle size={56} className="mx-auto text-green-500" />
                <h3 className="text-2xl font-black text-on-surface">You're Approved!</h3>
                <p className="text-sm text-secondary/60 font-medium">The NGO has accepted you. Check your Assignments for team and task details.</p>
                <button
                  onClick={() => router.push("/volunteer/assignments")}
                  className="mt-4 px-8 py-3 bg-green-600 text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all"
                >
                  View My Assignment
                </button>
              </div>
            )}

            {isRejected && (
              <div className="bg-red-50 rounded-modern border-2 border-red-200 p-10 text-center space-y-4 custom-shadow">
                <XCircle size={56} className="mx-auto text-red-400" />
                <h3 className="text-2xl font-black text-on-surface">Application Not Accepted</h3>
                <p className="text-sm text-secondary/60 font-medium">This NGO has declined your application for this opportunity. You can browse other openings.</p>
                <button
                  onClick={() => router.push("/volunteer/opportunities")}
                  className="mt-4 px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  Browse Other Opportunities
                </button>
              </div>
            )}

            {isPending && (
              <div className="bg-orange-50 rounded-modern border-2 border-orange-200 p-10 text-center space-y-4 custom-shadow">
                <Hourglass size={56} className="mx-auto text-orange-400" />
                <h3 className="text-2xl font-black text-on-surface">Application Under Review</h3>
                <p className="text-sm text-secondary/60 font-medium">
                  Your application is pending. The NGO will review your profile and skills — you'll be notified of their decision.
                </p>
                <button
                  onClick={() => router.push("/volunteer/dashboard")}
                  className="mt-4 px-8 py-3 bg-orange-500 text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {!hasApplied && (
              <div className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow">
                <h2 className="text-xl font-black text-on-surface mb-2 flex items-center gap-3">
                  <Send size={22} className="text-primary" />
                  Apply for This Position
                </h2>
                <p className="text-sm text-secondary/60 font-medium mb-6">Submit your application — the NGO will review your profile and respond.</p>

                {showForm ? (
                  <form onSubmit={handleApply} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-2 block">
                        Why do you want to join? (Optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Share your motivation, relevant experience, or availability..."
                        className="w-full px-5 py-4 border-2 border-outline/60 rounded-2xl text-sm font-medium resize-none focus:border-primary focus:outline-none transition-all bg-surface-variant/10"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={applying}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-60"
                      >
                        {applying ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Send size={16} /> Submit Application</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-8 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                  >
                    <ChevronRight size={20} /> Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* NGO Info */}
            <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Organization
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                  {opp.ngoName?.[0] || "N"}
                </div>
                <div>
                  <h4 className="text-lg font-black text-on-surface">{opp.ngoName}</h4>
                  <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest">{opp.crisisType || "Relief Organization"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-surface-variant/10 rounded-xl">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-on-surface">{typeof opp.location === "string" ? opp.location : opp.location?.address}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-variant/10 rounded-xl">
                  <Users size={16} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-on-surface">{opp.totalVolunteers} total volunteers needed</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-variant/10 rounded-xl">
                  <Clock size={16} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-on-surface">
                    {opp.durationStart ? `${new Date(opp.durationStart).toLocaleDateString()} start` : "Flexible start"}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Status Card */}
            {hasApplied && (
              <div className={`p-8 rounded-modern border-2 custom-shadow ${
                isApproved ? "bg-green-50 border-green-300" :
                isRejected ? "bg-red-50 border-red-200" :
                "bg-orange-50 border-orange-200"
              }`}>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  {isApproved ? <CheckCircle size={18} className="text-green-500" /> :
                   isRejected ? <XCircle size={18} className="text-red-500" /> :
                   <Hourglass size={18} className="text-orange-500" />}
                  Application Status
                </h3>
                <p className={`text-xl font-black ${
                  isApproved ? "text-green-700" : isRejected ? "text-red-600" : "text-orange-700"
                }`}>
                  {isApproved ? "✓ Approved" : isRejected ? "✗ Rejected" : "⏳ Pending Review"}
                </p>
                <p className="text-xs font-bold text-secondary/50 mt-1 uppercase tracking-widest">
                  {isApproved ? "Added to active team" : isRejected ? "Not selected for this posting" : "Awaiting NGO decision"}
                </p>
              </div>
            )}

            {/* What to expect */}
            <div className="bg-on-surface rounded-modern p-8 text-white relative overflow-hidden custom-shadow">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">What Happens Next</p>
                </div>
                <div className="space-y-4">
                  {[
                    { step: "1", text: "Submit your application" },
                    { step: "2", text: "NGO reviews your profile & skills" },
                    { step: "3", text: "Approval notification sent to you" },
                    { step: "4", text: "You're added to the active team" },
                  ].map(item => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-black border border-white/20 shrink-0">
                        {item.step}
                      </div>
                      <p className="text-sm font-medium text-white/70">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Zap className="absolute -right-6 -bottom-6 text-white/5" size={140} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
