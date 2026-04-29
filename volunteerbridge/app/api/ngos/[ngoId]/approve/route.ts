import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { ngoId: string } }
) {
  try {
    const { ngoId } = params;
    const { status, reviewReason } = await request.json();
    
    await db.ref(`NGO/${ngoId}`).update({ 
      status: status || "approved",
      reviewReason: reviewReason || null
    });

    return NextResponse.json({ message: `NGO ${status}`, ngoId });
  } catch (error) {
    console.error("API Error (approve NGO):", error);
    return NextResponse.json({ error: "Failed to update NGO status" }, { status: 500 });
  }
}
