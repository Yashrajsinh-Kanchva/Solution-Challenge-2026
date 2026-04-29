export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const [ngoSnap, volunteerSnap, requestSnap] = await Promise.all([
      db.ref("NGO").once("value"),
      db.ref("Volunteer").once("value"),
      db.ref("Request").once("value"),
    ]);

    const ngos       = ngoSnap.exists()      ? Object.values(ngoSnap.val()      as Record<string, any>) : [];
    const volunteers= volunteerSnap.exists() ? Object.values(volunteerSnap.val() as Record<string, any>) : [];
    const requests  = requestSnap.exists()   ? Object.values(requestSnap.val()   as Record<string, any>) : [];

    // Need category analytics
    const catCounts: Record<string, number> = {};
    requests.forEach((r: any) => {
      const cat = r.category || r.aiCategory || "Other";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const needCategoryAnalytics = Object.entries(catCounts).map(([category, needs]) => ({ category, needs }));

    // Volunteer deployment stats
    const zoneCounts: Record<string, { deployed: number; target: number }> = {};
    volunteers.forEach((v: any) => {
      const zone = typeof v?.location === "string"
        ? v?.location.split(",")[0].trim()
        : v?.location?.address?.split(",")[0]?.trim() ?? "General";
      if (!zoneCounts[zone]) zoneCounts[zone] = { deployed: 0, target: 0 };
      if (v.availability || v.status === "idle") zoneCounts[zone].deployed += 1;
      zoneCounts[zone].target += 1;
    });
    const volunteerDeploymentStats = Object.entries(zoneCounts)
      .slice(0, 6)
      .map(([zone, { deployed, target }]) => ({ zone, deployed, target }));

    // NGO activity levels
    const ngoActivity: Record<string, { tasksCompleted: number; activeRequests: number }> = {};
    requests.forEach((r: any) => {
      if (!r.assignedNgoId) return;
      if (!ngoActivity[r.assignedNgoId]) ngoActivity[r.assignedNgoId] = { tasksCompleted: 0, activeRequests: 0 };
      const s = (r.status || "").toLowerCase();
      if (s === "completed") ngoActivity[r.assignedNgoId].tasksCompleted += 1;
      else ngoActivity[r.assignedNgoId].activeRequests += 1;
    });
    const ngoActivityLevels = Object.entries(ngoActivity).map(([ngoId, stats]) => {
      const ngo = ngos.find((n: any) => (n.ngoId || n.id) === ngoId);
      return {
        ngo: ngo?.ngoName || ngo?.name || ngoId,
        tasksCompleted: stats.tasksCompleted,
        activeRequests: stats.activeRequests,
      };
    });

    const roleBreakdown = [
      { role: "ngo",       total: ngos.length,       active: ngos.filter((n: any) => n.status === "approved").length,                    pending: ngos.filter((n: any) => n.status === "pending").length },
      { role: "volunteer", total: volunteers.length,  active: volunteers.filter((v: any) => v.availability || v.status === "idle").length, pending: volunteers.filter((v: any) => v.status === "pending").length },
    ];

    return NextResponse.json({ needCategoryAnalytics, volunteerDeploymentStats, ngoActivityLevels, roleBreakdown });
  } catch (error) {
    console.error("API Error (analytics):", error);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}

