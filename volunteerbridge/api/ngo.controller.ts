import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord } from "@/lib/types/rtdb";

export async function getAssignedRequestsForNgo(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { ngoId } = req.params;

    const snapshot = await dbRef("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value");

    if (!snapshot.exists()) {
      res.status(200).json({ requests: [] });
      return;
    }

    const assigned = Object.values(snapshot.val() as Record<string, RequestRecord>);
    res.status(200).json({ requests: assigned });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGO requests", details: (error as Error).message });
  }
}

export async function updateNgoResources(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const { food, medicine } = req.body as { food?: number; medicine?: number };

    if (food === undefined && medicine === undefined) {
      res.status(400).json({ error: "Provide at least one resource value" });
      return;
    }

    const updates: Record<string, number> = {};
    if (food !== undefined) {
      updates.food = food;
    }
    if (medicine !== undefined) {
      updates.medicine = medicine;
    }

    await dbRef(`NGO/${ngoId}/availableResources`).update(updates);

    res.status(200).json({ message: "NGO resources updated", ngoId, updated: updates });
  } catch (error) {
    res.status(500).json({ error: "Failed to update resources", details: (error as Error).message });
  }
}
