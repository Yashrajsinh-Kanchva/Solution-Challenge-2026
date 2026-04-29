export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { requestId } = params;
    const body = await request.json();
    const volunteerId = body?.volunteerId;

    if (!volunteerId) {
      return NextResponse.json({ error: "Volunteer ID is required" }, { status: 400 });
    }

    // Update request with assigned volunteer
    const requestRef = db.ref(`Request/${requestId}`);
    const snap = await requestRef.once("value");
    const currentData = snap.val() || {};
    const existingIds = currentData.assignedVolunteerIds || [];
    
    // Add to list if not already there
    const updatedIds = existingIds.includes(volunteerId) 
      ? existingIds 
      : [...existingIds, volunteerId];

    await requestRef.update({
      assignedVolunteerId: volunteerId, // Primary/Legacy
      assignedVolunteerIds: updatedIds,  // Array for dashboard fetch
      status: "assigned_to_volunteer"
    });

    // Update volunteer status
    await db.ref(`Volunteer/${volunteerId}`).update({
      status: "busy",
      availability: false,
      currentRequestId: requestId
    });

    return NextResponse.json({ message: "Volunteer assigned successfully", requestId, volunteerId });
  } catch (error) {
    console.error("API Error (assign volunteer):", error);
    return NextResponse.json({ error: "Failed to assign volunteer" }, { status: 500 });
  }
}
