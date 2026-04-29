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
    const { checklist } = await request.json();
    if (!checklist) {
      return NextResponse.json({ error: "Checklist is required" }, { status: 400 });
    }

    await db.ref(`Request/${requestId}`).update({ checklist });
    return NextResponse.json({ success: true, requestId, checklist });
  } catch (error) {
    console.error(`API Error (requests/${requestId}/checklist):`, error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
