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
    
    const [volSnap, reqSnap] = await Promise.all([
      db.ref("Volunteer").orderByChild("ngoId").equalTo(ngoId).once("value"),
      db.ref("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value")
    ]);
    
    const volunteerMap = (volSnap.val() || {}) as Record<string, any>;
    const requests = Object.values((reqSnap.val() || {}) as Record<string, any>);
    
    const activeVolunteerIds = new Set<string>();
    const activeTasksMap: Record<string, string> = {};

    requests.forEach(req => {
      const status = (req.status as string)?.toLowerCase();
      const isActive = status !== "completed" && status !== "rejected";
      if (isActive && req.assignedVolunteerIds) {
        req.assignedVolunteerIds.forEach((id: string) => {
          activeVolunteerIds.add(id);
          activeTasksMap[id] = req.requestId;
        });
      }
    });

    const volunteers = Object.values(volunteerMap)
      .filter((v: any) => v && (v.volunteerId || v.id) && v.name)
      .map((v: any) => {
        const volunteerId = v.volunteerId || v.id;
        const isOnActiveTask = activeVolunteerIds.has(volunteerId);
        return {
          ...v,
          status: isOnActiveTask ? "assigned" : "idle",
          availability: !isOnActiveTask,
          currentRequestId: isOnActiveTask ? activeTasksMap[volunteerId] : null
        };
      });

    return NextResponse.json(volunteers);
  } catch (error) {
    console.error("API Error (NGO volunteers):", error);
    return NextResponse.json({ error: "Failed to fetch NGO volunteers" }, { status: 500 });
  }
}
