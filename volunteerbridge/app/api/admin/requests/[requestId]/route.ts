export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { requestId } = params;
    await db.ref(`Request/${requestId}`).remove();
    return NextResponse.json({ message: "Request deleted successfully", requestId });
  } catch (error) {
    console.error("API Error (delete request):", error);
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
