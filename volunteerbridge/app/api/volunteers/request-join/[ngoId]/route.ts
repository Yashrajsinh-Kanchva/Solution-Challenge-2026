export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { ngoId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { ngoId } = params;
    const payload = await request.json();
    
    const requestId = `vjr-${Date.now()}`;
    const newRequest = {
      ...payload,
      id: requestId,
      requestId,
      ngoId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await db.ref(`VolunteerJoinRequest/${requestId}`).set(newRequest);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("API Error (volunteer request join POST):", error);
    return NextResponse.json({ error: "Failed to submit join request" }, { status: 500 });
  }
}
