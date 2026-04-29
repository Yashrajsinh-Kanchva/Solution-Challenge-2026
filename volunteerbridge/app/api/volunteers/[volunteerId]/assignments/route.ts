export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { volunteerId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { volunteerId } = params;
    
    const [requestsSnap, ngosSnap] = await Promise.all([
      db.ref("Request").once("value"),
      db.ref("NGO").once("value")
    ]);

    const allRequests = requestsSnap.val() || {};
    const allNgos = ngosSnap.val() || {};
    
    const assignments = Object.entries(allRequests)
      .filter(([_, val]: [string, any]) => {
        const ids = val.assignedVolunteerIds || (val.assignedVolunteerId ? [val.assignedVolunteerId] : []);
        return ids.includes(volunteerId);
      })
      .map(([key, val]: [string, any]) => {
        const ngo = allNgos[val.assignedNgoId] || {};
        
        const resourcesMap = val.assignedResources || val.allocatedResources || {};
        const resourcesList = Object.entries(resourcesMap).map(([type, qty]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          quantity: qty,
          deliveryStatus: val.status === "completed" ? "Delivered" : "In Transit"
        }));

        // Normalize checklist
        let rawChecklist = val.checklist;
        if (rawChecklist && !Array.isArray(rawChecklist)) {
          rawChecklist = Object.values(rawChecklist);
        }

        const checklist = rawChecklist || [
          { id: 1, title: "Verify location and security", status: "Not Started", done: false },
          { id: 2, title: "Dispatch assigned volunteers", status: "Not Started", done: false },
          { id: 3, title: "Arrival and situation assessment", status: "Not Started", done: false },
          { id: 4, title: "Distribution of resources", status: "Not Started", done: false }
        ];

        return {
          assignmentId: key,
          requestId: key,
          requestTitle: val.title || "Community Need",
          ngoName: ngo.ngoName || ngo.name || "Assigned NGO",
          status: val.status || "assigned_to_volunteer",
          teamName: val.teamName || "Emergency Response Team",
          teamLeader: val.teamLeader || "Field Coordinator",
          campLocation: val.location || { address: "Main Area" },
          checklist: checklist,
          resources: resourcesList,
          teamMembers: [] 
        };
      });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("API Error (volunteer assignments):", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
