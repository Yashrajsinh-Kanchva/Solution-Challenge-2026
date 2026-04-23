import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord, RequestStatus } from "@/lib/types/rtdb";

export async function createRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, title, description, category, aiCategory, urgency, location } = req.body;

    if (!userId || !title || !description || !category || !urgency || !location) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const requestRef = dbRef("Request").push();
    const requestId = requestRef.key;

    if (!requestId) {
      res.status(500).json({ error: "Unable to generate request id" });
      return;
    }

    const payload: RequestRecord = {
      requestId,
      userId,
      title,
      description,
      category,
      aiCategory: aiCategory || category,
      urgency,
      location,
      status: "pending_admin",
      suggestedNGOs: [],
      assignedNgoId: null,
      assignedVolunteerId: null,
      createdAt: new Date().toISOString()
    };

    await requestRef.set(payload);

    res.status(201).json({ message: "Request created", request: payload });
  } catch (error) {
    res.status(500).json({ error: "Failed to create request", details: (error as Error).message });
  }
}

export async function getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const snapshot = await dbRef("Request").once("value");
    if (!snapshot.exists()) {
      res.status(200).json({ requests: [] });
      return;
    }

    const raw = snapshot.val() as Record<string, RequestRecord>;
    const requests = Object.values(raw);

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests", details: (error as Error).message });
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;

    const snapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!snapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.status(200).json({ request: snapshot.val() as RequestRecord });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch request", details: (error as Error).message });
  }
}

export async function updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { status } = req.body as { status?: RequestStatus };

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const requestPath = `Request/${requestId}`;
    const snapshot = await dbRef(requestPath).once("value");

    if (!snapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    await dbRef(requestPath).update({ status });

    res.status(200).json({ message: "Request status updated", requestId, status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update request status", details: (error as Error).message });
  }
}
