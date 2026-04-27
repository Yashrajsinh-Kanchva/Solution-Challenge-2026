"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  Search, Filter, MapPin, Users, Clock,
  ChevronRight, Briefcase, AlertTriangle,
  Calendar, RefreshCw, CheckCircle, Hourglass, XCircle
} from "lucide-react";

const SKILL_OPTIONS = ["Medical", "Food Supply", "Logistics", "Construction", "Counseling", "IT", "Other"];
const URGENCY_OPTIONS = ["all", "critical", "high", "medium", "low"];

const MOCK_OPPORTUNITIES = [
  { id: "opp-1", opportunityId: "opp-1", title: "Flood Relief — Medical Support", ngoName: "Sahyog NGO", description: "We need medical volunteers to support flood victims in low-lying areas. Your role involves first-aid, triage, and coordination with local health authorities.", requiredSkills: ["Medical", "Logistics"], totalVolunteers: 20, openPositions: 8, urgency: "critical", location: { address: "Vasna, Ahmedabad", lat: 23.0010, lng: 72.5588 }, durationStart: "2026-05-01", durationEnd: "2026-05-15", crisisType: "Natural Disaster" },
  { id: "opp-2", opportunityId: "opp-2", title: "Food Distribution Drive", ngoName: "Annapurna Foundation", description: "Help distribute food packets to shelters across the city.", requiredSkills: ["Food Supply", "Logistics"], totalVolunteers: 30, openPositions: 15, urgency: "high", location: { address: "Maninagar, Ahmedabad", lat: 23.0038, lng: 72.5985 }, durationStart: "2026-04-28", durationEnd: "2026-05-05", crisisType: "Food Crisis" },
  { id: "opp-3", opportunityId: "opp-3", title: "Psychosocial Support Camp", ngoName: "Mindful Aid", description: "Provide emotional support and counseling to trauma survivors.", requiredSkills: ["Counseling"], totalVolunteers: 10, openPositions: 4, urgency: "medium", location: { address: "Satellite, Ahmedabad", lat: 23.0395, lng: 72.5185 }, durationStart: "2026-05-03", durationEnd: "2026-05-13", crisisType: "Mental Health" },
  { id: "opp-4", opportunityId: "opp-4", title: "Shelter Construction Brigade", ngoName: "BuildUp Gujarat", description: "Assist in constructing temporary shelters for displaced families.", requiredSkills: ["Construction", "Logistics"], totalVolunteers: 50, openPositions: 22, urgency: "high", location: { address: "Naroda, Ahmedabad", lat: 23.0800, lng: 72.6540 }, durationStart: "2026-04-29", durationEnd: "2026-05-20", crisisType: "Infrastructure" },
  { id: "opp-5", opportunityId: "opp-5", title: "IT Support for Operations Center", ngoName: "TechCare India", description: "Set up and manage IT infrastructure at the relief operations center.", requiredSkills: ["IT"], totalVolunteers: 5, openPositions: 2, urgency: "medium", location: { address: "Paldi, Ahmedabad", lat: 23.0156, lng: 72.5726 }, durationStart: "2026-05-01", durationEnd: "2026-05-10", crisisType: "Operations" },
];

type AppStatus = "PENDING" | "APPROVED" | "REJECTED";
type ApplicationMap = Record<string, AppStatus>;

function ApplicationBadge({ status }: { status: AppStatus }) {
  if (status === "APPROVED") return (
    <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 bg-green-50 text-green-700 border border-green-300 rounded-full uppercase tracking-widest">
      <CheckCircle size={12} /> Approved
    </span>
  );
  if (status === "REJECTED") return (
    <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full uppercase tracking-widest">
      <XCircle size={12} /> Rejected
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full uppercase tracking-widest">
      <Hourglass size={12} /> Applied · Pending
    </span>
  );
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<ApplicationMap>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterSkill, setFilterSkill] = useState("all");

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oppData, appData] = await Promise.allSettled([
          apiClient.getVolunteerOpportunities(),
          apiClient.getVolunteerApplications(volunteerId),
        ]);

        if (oppData.status === "fulfilled" && oppData.value?.length > 0) {
          setOpportunities(oppData.value);
        } else {
          setOpportunities(MOCK_OPPORTUNITIES);
        }

        if (appData.status === "fulfilled") {
          const appMap: ApplicationMap = {};
          (appData.value || []).forEach((app: any) => {
            appMap[app.opportunityId] = app.status as AppStatus;
          });
          setApplications(appMap);
        }
      } catch {
        setOpportunities(MOCK_OPPORTUNITIES);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [oppData, appData] = await Promise.allSettled([
        apiClient.getVolunteerOpportunities(),
        apiClient.getVolunteerApplications(volunteerId),
      ]);
      if (oppData.status === "fulfilled" && oppData.value?.length > 0) setOpportunities(oppData.value);
      else setOpportunities(MOCK_OPPORTUNITIES);
      if (appData.status === "fulfilled") {
        const appMap: ApplicationMap = {};
        (appData.value || []).forEach((app: any) => { appMap[app.opportunityId] = app.status; });
        setApplications(appMap);
      }
    } catch { setOpportunities(MOCK_OPPORTUNITIES); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return opportunities.filter(opp => {
      const matchSearch =
        opp.title?.toLowerCase().includes(search.toLowerCase()) ||
        opp.ngoName?.toLowerCase().includes(search.toLowerCase()) ||
        opp.description?.toLowerCase().includes(search.toLowerCase());
      const matchUrgency = filterUrgency === "all" || opp.urgency?.toLowerCase() === filterUrgency;
      const matchSkill = filterSkill === "all" || opp.requiredSkills?.some((s: string) => s.toLowerCase() === filterSkill.toLowerCase());
      return matchSearch && matchUrgency && matchSkill;
    });
  }, [opportunities, search, filterUrgency, filterSkill]);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  const getUrgencyBorder = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "border-red-200 hover:border-red-400";
      case "high": return "border-orange-200 hover:border-orange-400";
      case "medium": return "border-yellow-200 hover:border-yellow-400";
      default: return "border-green-200 hover:border-green-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface-variant/50 rounded-2xl w-1/3" />
        <div className="h-24 bg-white border-2 border-outline/40 rounded-modern" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-white border-2 border-outline/40 rounded-modern" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Open Opportunities</h1>
          <p className="text-secondary/60 font-medium mt-1">Browse and apply to active NGO volunteer postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="p-3 border-2 border-outline/60 rounded-2xl bg-white hover:border-primary transition-all shadow-sm">
            <RefreshCw size={18} className={`text-secondary/60 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="px-5 py-2.5 bg-white border-2 border-outline/60 rounded-2xl shadow-sm text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
            <Search size={16} />
            {filtered.length} Results
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-modern border-2 border-outline/60 p-6 custom-shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={18} />
            <input
              type="text"
              placeholder="Search by title, NGO, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all bg-surface-variant/10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-secondary/40" />
            <div className="flex gap-2 flex-wrap">
              {URGENCY_OPTIONS.map(u => (
                <button
                  key={u}
                  onClick={() => setFilterUrgency(u)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${
                    filterUrgency === u ? "bg-primary border-primary text-white" : "bg-white border-outline/60 text-secondary hover:border-primary/40"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <select
            value={filterSkill}
            onChange={e => setFilterSkill(e.target.value)}
            className="px-4 py-3 border-2 border-outline/60 rounded-2xl text-xs font-bold text-on-surface focus:border-primary focus:outline-none bg-white"
          >
            <option value="all">All Skills</option>
            {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Opportunity Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((opp: any) => {
            const id = opp.id || opp.opportunityId;
            const appStatus = applications[id];
            const hasApplied = !!appStatus;
            const isApproved = appStatus === "APPROVED";

            return (
              <div
                key={id}
                className={`bg-white rounded-modern border-2 custom-shadow overflow-hidden group transition-all duration-300 cursor-pointer ${
                  isApproved ? "border-green-300 ring-4 ring-green-50" : getUrgencyBorder(opp.urgency)
                }`}
                onClick={() => router.push(`/volunteer/opportunities/${id}`)}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border transition-all shrink-0 ${
                        isApproved ? "bg-green-500 text-white border-green-400" : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white"
                      }`}>
                        {opp.ngoName?.[0] || "N"}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-2xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{opp.title}</h3>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${getUrgencyBadge(opp.urgency)}`}>
                            {opp.urgency}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-secondary/60 flex items-center gap-2">
                          <Briefcase size={14} className="text-primary" />
                          {opp.ngoName}
                          {opp.crisisType && <span className="text-[10px] font-black px-2 py-0.5 bg-surface-variant text-secondary/60 rounded-lg uppercase tracking-widest border border-outline/30 ml-1">{opp.crisisType}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {/* Application status badge */}
                      {hasApplied ? (
                        <ApplicationBadge status={appStatus} />
                      ) : (
                        <div className="px-6 py-3 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Open</p>
                          <p className="text-2xl font-black text-on-surface">{opp.openPositions}</p>
                          <p className="text-[10px] font-bold text-secondary/50">of {opp.totalVolunteers} spots</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed font-medium mb-6 line-clamp-2">{opp.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                      <MapPin size={16} className="text-primary" />
                      {typeof opp.location === "string" ? opp.location : opp.location?.address || "TBD"}
                    </div>
                    {opp.durationStart && (
                      <div className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                        <Calendar size={16} className="text-primary" />
                        {new Date(opp.durationStart).toLocaleDateString()} – {new Date(opp.durationEnd).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary/60">
                      <Users size={16} className="text-primary" />
                      {opp.openPositions} positions available
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t-2 border-outline/30">
                    <div className="flex flex-wrap gap-2">
                      {(opp.requiredSkills || []).map((skill: string) => (
                        <span key={skill} className="text-[10px] font-black px-3 py-1.5 bg-surface-variant text-on-surface-variant rounded-lg uppercase tracking-widest border border-outline/40">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button className={`flex items-center gap-2 px-8 py-3 font-black text-xs uppercase tracking-widest rounded-button transition-all shadow-lg active:scale-95 ${
                      hasApplied
                        ? "bg-surface-variant text-secondary/60 border-2 border-outline/40 shadow-none"
                        : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                    }`}>
                      {hasApplied ? `Status: ${appStatus}` : <><ChevronRight size={16} /> View & Apply</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
          <AlertTriangle size={56} className="mx-auto text-secondary/15" />
          <h3 className="text-xl font-black text-secondary/40">No matching opportunities</h3>
          <p className="text-sm text-secondary/30 italic">Try adjusting your filters or check back later.</p>
          <button onClick={() => { setSearch(""); setFilterUrgency("all"); setFilterSkill("all"); }}
            className="mt-4 px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
