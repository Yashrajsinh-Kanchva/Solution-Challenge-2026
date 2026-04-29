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
    const snapshot = await db.ref(`Volunteer/${volunteerId}`).once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
    }

    const volunteer = snapshot.val();
    
    return NextResponse.json({
      ...volunteer,
      id: volunteer.id || volunteerId,
      name: volunteer.name || volunteer.id || volunteerId,
      email: volunteer.email || "-",
      phone: volunteer.phone || "-",
      location: volunteer.location || "-",
      bio: volunteer.bio || "No bio provided yet.",
      skills: volunteer.skills || [],
      availability: volunteer.availability !== undefined ? volunteer.availability : true,
      status: volunteer.status || "available"
    });
  } catch (error) {
    console.error("API Error (get volunteer):", error);
    return NextResponse.json({ error: "Failed to fetch volunteer details" }, { status: 500 });
  }
}
