export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const { requestId } = params;
  const { db } = await import("@/lib/firebaseAdmin");

  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    await db.ref(`Request/${requestId}`).update({ status });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error(`API Error (requests/${requestId}/status):`, error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
