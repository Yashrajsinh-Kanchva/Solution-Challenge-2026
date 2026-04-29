export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { requestId: string; taskId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { requestId, taskId } = params;
    const { status, volunteerId } = await request.json();
    
    const requestRef = db.ref(`Request/${requestId}`);
    const snap = await requestRef.once("value");
    
    if (!snap.exists()) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = snap.val();
    
    // Normalize checklist from DB (could be array or object)
    let rawChecklist = data.checklist;
    if (rawChecklist && !Array.isArray(rawChecklist)) {
      rawChecklist = Object.values(rawChecklist);
    }

    const checklist = rawChecklist || [
      { id: 1, title: "Verify location and security", status: "Not Started", done: false },
      { id: 2, title: "Dispatch assigned volunteers", status: "Not Started", done: false },
      { id: 3, title: "Arrival and situation assessment", status: "Not Started", done: false },
      { id: 4, title: "Distribution of resources", status: "Not Started", done: false }
    ];
    
    // Update the specific task in the checklist
    let found = false;
    const updatedChecklist = checklist.map((item: any) => {
      if (String(item.id) === String(taskId)) {
        found = true;
        return { 
          ...item, 
          status, 
          done: status === "Done",
          updatedBy: volunteerId || "volunteer",
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    if (!found) {
      return NextResponse.json({ error: `Task ID ${taskId} not found in checklist` }, { status: 400 });
    }

    // Check if all items are done to auto-complete the request
    const allDone = updatedChecklist.every((item: any) => item.status === "Done" || item.done === true);
    
    const updates: any = { checklist: updatedChecklist };
    if (allDone) {
      updates.status = "completed";
      updates.completedAt = new Date().toISOString();
    } else if (status === "In Progress" || status === "Done") {
      if (data.status !== "completed") {
        updates.status = "in_progress";
      }
    }

    await requestRef.update(updates);

    return NextResponse.json({ 
      message: "Task status updated", 
      allDone,
      status: updates.status || data.status
    });
  } catch (error) {
    console.error("API Error (update task status):", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}
