export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { ngoId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { ngoId } = params;

    const [specificSnap, sharedSnap, volunteersSnap, ngoSnap] = await Promise.all([
      db.ref("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value"),
      db.ref("Request").orderByChild("assignedNgoId").equalTo("ALL").once("value"),
      db.ref("Volunteer").orderByChild("ngoId").equalTo(ngoId).once("value"),
      db.ref(`NGO/${ngoId}`).once("value")
    ]);

    const specificRequests = Object.values((specificSnap.val() || {}) as Record<string, any>);
    const sharedRequests = Object.values((sharedSnap.val() || {}) as Record<string, any>);
    const requests = [...specificRequests, ...sharedRequests];
    
    const volunteers = Object.values((volunteersSnap.val() || {}) as Record<string, any>).filter((v: any) => v && (v.volunteerId || v.id) && v.name);
    const ngo = ngoSnap.val();

    // Volunteer Insights: Top 3 Skills
    const allSkills = volunteers.flatMap(v => v.skills || []);
    const skillCounts: Record<string, number> = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const stats = {
      totalRequests: requests.length,
      activeTasks: requests.filter(r => (r.status as string)?.toLowerCase() !== "completed").length,
      completedTasks: requests.filter(r => (r.status as string)?.toLowerCase() === "completed").length,
      availableVolunteers: volunteers.filter(v => v.availability).length,
      totalVolunteers: volunteers.length,
      topSkills,
      resources: ngo?.availableResources || { food: 0, medicine: 0, shelter: 0 },
      recentActivity: requests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("API Error (NGO stats):", error);
    return NextResponse.json({ error: "Failed to fetch NGO stats" }, { status: 500 });
  }
}
