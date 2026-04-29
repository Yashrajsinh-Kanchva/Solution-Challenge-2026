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

    const [specificSnap, sharedSnap, volunteersSnap] = await Promise.all([
      db.ref("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value"),
      db.ref("Request").orderByChild("assignedNgoId").equalTo("ALL").once("value"),
      db.ref("Volunteer").once("value")
    ]);

    const specificData = specificSnap.val() || {};
    const sharedData = sharedSnap.val() || {};
    
    // Merge data while preserving keys
    const allRequests = { ...sharedData, ...specificData };
    const volunteers = (volunteersSnap.val() || {}) as Record<string, any>;
    
    const assigned = Object.entries(allRequests).map(([key, val]: [string, any]) => {
      // Ensure the object has both 'id' and 'requestId' matching the DB key
      const req = { 
        ...val, 
        id: key, 
        requestId: key 
      };
      
      const volunteerIds = req.assignedVolunteerIds || (req.assignedVolunteerId ? [req.assignedVolunteerId] : []);
      const assignedVolunteers = volunteerIds.map((id: string) => volunteers[id]).filter(Boolean);
      
      return {
        ...req,
        assignedVolunteers
      };
    });

    return NextResponse.json({ requests: assigned });
  } catch (error) {
    console.error("API Error (NGO requests):", error);
    return NextResponse.json({ error: "Failed to fetch NGO requests" }, { status: 500 });
  }
}
