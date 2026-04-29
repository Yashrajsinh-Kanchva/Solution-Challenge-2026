export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const { requestId } = params;
  const { db } = await import("@/lib/firebaseAdmin");

  try {
    const { ngoId } = await request.json();
    if (!ngoId) {
      return NextResponse.json({ error: "NGO ID is required" }, { status: 400 });
    }

    // Update the request with assigned NGO ID and status
    await db.ref(`Request/${requestId}`).update({ 
      assignedNgoId: ngoId,
      status: "assigned_to_ngo" 
    });

    return NextResponse.json({ success: true, requestId, ngoId });
  } catch (error) {
    console.error(`API Error (admin/requests/${requestId}/assign-ngo):`, error);
    return NextResponse.json({ error: "Failed to assign NGO" }, { status: 500 });
  }
}
