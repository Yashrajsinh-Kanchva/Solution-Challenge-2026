export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { ngoId: string; requestId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { ngoId, requestId } = params;
    const { action } = await request.json();
    
    const requestRef = db.ref(`VolunteerJoinRequest/${requestId}`);
    const snap = await requestRef.once("value");
    
    if (!snap.exists()) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const vjr = snap.val();

    if (action === "APPROVE") {
      // 1. Create the Volunteer record
      const volunteerId = vjr.volunteerId || `vol-${Date.now()}`;
      const newVolunteer = {
        volunteerId,
        id: volunteerId,
        name: vjr.name,
        email: vjr.email,
        phone: vjr.phone,
        skills: vjr.skills || [],
        location: vjr.location || { address: "Main Area" },
        ngoId: ngoId,
        availability: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      };

      await db.ref(`Volunteer/${volunteerId}`).set(newVolunteer);
      
      // 2. Update the request status
      await requestRef.update({ status: "APPROVED" });
    } else {
      await requestRef.update({ status: "REJECTED" });
    }

    return NextResponse.json({ message: `Request ${action.toLowerCase()}ed` });
  } catch (error) {
    console.error("API Error (handle volunteer request):", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
