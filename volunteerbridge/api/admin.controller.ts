import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { NgoRecord, RequestRecord } from "@/lib/types/rtdb";
import { suggestNgoIdsForRequest } from "@/lib/utils/matching";

export async function approveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const requestPath = `Request/${requestId}`;

    const snapshot = await dbRef(requestPath).once("value");
    if (!snapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    await dbRef(requestPath).update({ status: "approved" });

    res.status(200).json({ message: "Request approved", requestId });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve request", details: (error as Error).message });
  }
}

export async function assignNgoForRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;

    const requestSnapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!requestSnapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnapshot.val() as RequestRecord;

    const ngoSnapshot = await dbRef("NGO").once("value");
    const ngoMap = (ngoSnapshot.val() || {}) as Record<string, NgoRecord>;
    const ngos = Object.values(ngoMap);

    const suggestedNGOs = suggestNgoIdsForRequest(request, ngos);

    const assignedNgoId = suggestedNGOs[0] ?? null;

    await dbRef(`Request/${requestId}`).update({
      suggestedNGOs,
      assignedNgoId,
      status: assignedNgoId ? "assigned_to_ngo" : request.status
    });

    res.status(200).json({
      message: "NGO assignment evaluated",
      requestId,
      suggestedNGOs,
      assignedNgoId
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign NGO", details: (error as Error).message });
  }
}
