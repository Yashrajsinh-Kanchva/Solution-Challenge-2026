import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord, RequestStatus } from "@/lib/types/rtdb";

function toAdminNeedRequest(request: RequestRecord & Record<string, any>) {
  return {
    ...request,
    id: request.id || request.requestId,
    requestId: request.requestId,
    location:
      typeof request.location === "string"
        ? request.location
        : request.location?.address || "Unknown area",
    rawLocation: request.location,
    requestedBy: request.requestedBy || request.userName || request.userId,
    beneficiaries: request.beneficiaries || request.affectedPeople || 1,
    summary: request.summary || request.description,
    status: request.status === "pending_admin" ? "pending" : request.status,
    requestType: request.requestType || "ISSUE",
    createdAt: request.createdAt || new Date().toISOString(),
  };
}

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
      id: requestId,
      requestId,
      userId,
      requestType: req.body.requestType || "ISSUE",
      title,
      description,
      summary: description?.slice(0, 120) || "",
      text: description || "",
      category,
      aiCategory: aiCategory || category,
      urgency,
      location,
      requestedBy: userId,
      beneficiaries: 1,
      status: "pending_admin",
      suggestedNGOs: [],
      assignedNgoId: null,
      assignedVolunteerIds: [],
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
      res.status(200).json([]);
      return;
    }

    const raw = snapshot.val() as Record<string, RequestRecord>;
    const requests = Object.values(raw)
      .map(toAdminNeedRequest)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json(requests);
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

    const dbStatus = status === "pending" ? "pending_admin" : status;
    await dbRef(requestPath).update({ status: dbStatus });

    // If task is completed, free up all assigned volunteers
    if ((dbStatus as string) === "completed" || (dbStatus as string) === "Completed") {
      const request = snapshot.val() as RequestRecord;
      const volunteerIds = request.assignedVolunteerIds || [];

      if (volunteerIds.length > 0) {
        const updates: Record<string, any> = {};
        volunteerIds.forEach(id => {
          updates[`Volunteer/${id}/status`] = "idle";
          updates[`Volunteer/${id}/availability`] = true;
          updates[`Volunteer/${id}/currentRequestId`] = null;
        });
        await dbRef("/").update(updates);
      }
    }

    res.status(200).json({ message: "Request status updated", requestId, status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update request status", details: (error as Error).message });
  }
}

export async function updateRequestChecklist(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { checklist } = req.body as { checklist: any[] };

    if (!checklist) {
      res.status(400).json({ error: "checklist is required" });
      return;
    }

    await dbRef(`Request/${requestId}`).update({ checklist });

    res.status(200).json({ message: "Request checklist updated", requestId });
  } catch (error) {
    res.status(500).json({ error: "Failed to update checklist", details: (error as Error).message });
  }
}
