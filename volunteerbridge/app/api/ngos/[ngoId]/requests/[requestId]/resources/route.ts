export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { ngoId: string; requestId: string } }
) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const { ngoId, requestId } = params;
    const resources = await request.json();
    
    if (!resources || Object.keys(resources).length === 0) {
      return NextResponse.json({ error: "Resources data is required" }, { status: 400 });
    }
    const requestRef = db.ref(`Request/${requestId}`);
    const snap = await requestRef.once("value");
    const currentData = snap.val() || {};
    const existingResources = currentData.assignedResources || {};
    
    const updatedResources = {
      ...existingResources
    };

    // Add new resources to existing ones
    Object.entries(resources).forEach(([key, val]) => {
      updatedResources[key] = (updatedResources[key] || 0) + (val as number);
    });

    await requestRef.update({ 
      assignedResources: updatedResources,
      status: "assigned_to_volunteer" 
    });

    // 2. Deduct from NGO stock
    const ngoRef = db.ref(`NGO/${ngoId}`);
    const ngoSnap = await ngoRef.once("value");
    const ngoData = ngoSnap.val() || {};
    const available = ngoData.availableResources || { food: 0, medicine: 0, shelter: 0 };

    const newAvailable = { ...available };
    Object.entries(resources).forEach(([key, val]) => {
      newAvailable[key] = Math.max(0, (available[key] || 0) - (val as number));
    });

    await ngoRef.update({ availableResources: newAvailable });

    return NextResponse.json({ 
      message: "Resources allocated and stock updated", 
      requestId, 
      resources,
      newStock: newAvailable 
    });
  } catch (error) {
    console.error("API Error (allocate resources):", error);
    return NextResponse.json({ error: "Failed to allocate resources" }, { status: 500 });
  }
}
