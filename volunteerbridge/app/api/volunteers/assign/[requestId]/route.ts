export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const body = await request.json();
    const volunteerId = body?.volunteerId;

    if (!volunteerId) {
      return NextResponse.json({ error: "Volunteer ID is required" }, { status: 400 });
    }

    // Update request with assigned volunteer
    await db.ref(`Request/${requestId}`).update({
      assignedVolunteerId: volunteerId,
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
