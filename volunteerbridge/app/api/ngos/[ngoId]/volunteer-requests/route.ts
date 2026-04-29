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
    
    const snapshot = await db.ref("VolunteerJoinRequest")
      .orderByChild("ngoId")
      .equalTo(ngoId)
      .once("value");

    const requests = snapshot.exists() ? Object.values(snapshot.val()) : [];
    
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("API Error (fetch volunteer requests):", error);
    return NextResponse.json({ error: "Failed to fetch volunteer requests" }, { status: 500 });
  }
}
