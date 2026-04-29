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
    const snapshot = await db.ref(`NGO/${ngoId}`).once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "NGO not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot.val());
  } catch (error) {
    console.error("API Error (get NGO):", error);
    return NextResponse.json({ error: "Failed to fetch NGO details" }, { status: 500 });
  }
}
