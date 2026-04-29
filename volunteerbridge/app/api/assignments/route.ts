import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await db.ref("Assignment").once("value");
    const assignments = snapshot.exists() ? Object.values(snapshot.val()) : [];
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("API Error (assignments):", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ngoName, campus, coordinator } = await request.json();
    const assignmentId = `assign-${Date.now()}`;
    const newAssignment = {
      id: assignmentId,
      ngoName,
      campus,
      coordinator,
      assignedAt: new Date().toISOString().slice(0, 10),
    };
    
    await db.ref(`Assignment/${assignmentId}`).set(newAssignment);
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error("API Error (assignments POST):", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
