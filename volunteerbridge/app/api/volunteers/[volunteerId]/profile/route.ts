export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { volunteerId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { volunteerId } = params;
    const updates = await request.json();

    await db.ref(`Volunteer/${volunteerId}`).update(updates);

    return NextResponse.json({ message: "Profile updated", updates });
  } catch (error) {
    console.error("API Error (update volunteer profile):", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
