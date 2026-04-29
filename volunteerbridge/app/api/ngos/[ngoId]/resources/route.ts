export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { ngoId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { ngoId } = params;
    const resources = await request.json();
    
    // The NGO stats API expects 'availableResources'
    await db.ref(`NGO/${ngoId}`).update({ 
      availableResources: resources 
    });

    return NextResponse.json({ message: "Inventory updated", resources });
  } catch (error) {
    console.error("API Error (update resources):", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
