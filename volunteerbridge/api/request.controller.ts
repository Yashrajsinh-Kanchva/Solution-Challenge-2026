import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord, RequestStatus } from "@/lib/types/rtdb";

function toAdminNeedRequest(request: RequestRecord & Record<string, any>) {
  return {
    ...request,
    id: request?.id ?? request?.requestId,
    requestId: request?.requestId,
    location:
      typeof request?.location === "string"
        ? request?.location
        : request?.location?.address ?? "Unknown area",
    rawLocation: request?.location,
    requestedBy: request?.requestedBy ?? request?.userName ?? request?.userId,
    beneficiaries: request?.beneficiaries ?? request?.affectedPeople ?? 1,
    summary: request?.summary ?? request?.description ?? "No details provided",
    status: request?.status === "pending_admin" ? "pending" : (request?.status ?? "pending"),
    requestType: request?.requestType ?? "ISSUE",
    createdAt: request?.createdAt ?? new Date().toISOString(),
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
      summary: description?.slice(0, 120) ?? "",
      text: description ?? "",
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
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      verifiedCount: 0,
      credibilityScore: 0,
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

    const request = snapshot.val() as RequestRecord;
    if (dbStatus === "approved" && request.userId) {
      await updateTrustScore(request.userId, 10);
    } else if (dbStatus === "rejected" && request.userId) {
      await updateTrustScore(request.userId, -10);
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

    if (!checklist || !Array.isArray(checklist)) {
      res.status(400).json({ error: "checklist must be an array" });
      return;
    }

    // Write directly to the checklist sub-path with .set() — NOT .update() on the parent.
    // Using .update({checklist}) on the Request node causes Firebase RTDB to store the array
    // as a keyed object {"0":{...},"1":{...}} instead of a proper array, breaking findIndex.
    await dbRef(`Request/${requestId}/checklist`).set(checklist);

    res.status(200).json({ message: "Request checklist updated", requestId });
  } catch (error) {
    res.status(500).json({ error: "Failed to update checklist", details: (error as Error).message });
  }
}

// Helper to update trust score
async function updateTrustScore(userId: string, delta: number) {
  try {
    const userRef = dbRef(`Citizen/${userId}/trustScore`);
    const snap = await userRef.once("value");
    let currentScore = snap.exists() ? snap.val() : 1;
    let newScore = currentScore + delta;
    if (newScore < 0) newScore = 0; // Prevent negative scores if we want
    await userRef.set(newScore);
  } catch (err) {
    console.error("Failed to update trust score", err);
  }
}

// Calculate credibility score
function calculateCredibility(upvotes: number, downvotes: number, verifiedCount: number): number {
  return upvotes - (downvotes * 1.5) + (verifiedCount * 2);
}

export async function voteOnRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { userId, voteType } = req.body;

    if (!userId || !voteType || !["UPVOTE", "DOWNVOTE"].includes(voteType)) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    // Check request
    const reqSnap = await dbRef(`Request/${requestId}`).once("value");
    if (!reqSnap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    const requestData = reqSnap.val();

    if (requestData.requestedBy === userId || requestData.userId === userId) {
      res.status(403).json({ error: "Cannot vote on your own request" });
      return;
    }

    // Check if already voted
    const voteSnap = await dbRef(`Votes/${requestId}/${userId}`).once("value");
    if (voteSnap.exists()) {
      res.status(400).json({ error: "Already voted" });
      return;
    }

    // Get user trust score
    const citizenSnap = await dbRef(`Citizen/${userId}`).once("value");
    let trustScore = 1;
    if (citizenSnap.exists()) {
      trustScore = citizenSnap.val().trustScore ?? 1;
    }

    if (trustScore < 1) {
      res.status(403).json({ error: "Trust score too low to vote" });
      return;
    }

    // Today's vote count check for abuse limit
    const userVotesSnap = await dbRef(`Votes`).once("value");
    if (userVotesSnap.exists()) {
      let dailyVotes = 0;
      const today = new Date().toISOString().split("T")[0];
      userVotesSnap.forEach(reqNode => {
        const userVote = reqNode.child(userId).val();
        if (userVote && userVote.createdAt.startsWith(today)) {
          dailyVotes++;
        }
      });
      if (dailyVotes >= 20) {
        res.status(429).json({ error: "Daily vote limit reached" });
        return;
      }
    }

    // Apply vote
    const newVote = {
      id: `vote-${requestId}-${userId}`,
      requestId,
      userId,
      voteType,
      createdAt: new Date().toISOString()
    };

    await dbRef(`Votes/${requestId}/${userId}`).set(newVote);

    let upvotes = requestData.upvotes || 0;
    let downvotes = requestData.downvotes || 0;
    const verifiedCount = requestData.verifiedCount || 0;

    if (voteType === "UPVOTE") upvotes += trustScore;
    if (voteType === "DOWNVOTE") downvotes += trustScore;

    const credibilityScore = calculateCredibility(upvotes, downvotes, verifiedCount);

    await dbRef(`Request/${requestId}`).update({
      upvotes,
      downvotes,
      credibilityScore
    });

    res.status(200).json({ message: "Vote registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to vote", details: (error as Error).message });
  }
}

export async function verifyRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const reqSnap = await dbRef(`Request/${requestId}`).once("value");
    if (!reqSnap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    const requestData = reqSnap.val();

    if (requestData.requestedBy === userId || requestData.userId === userId) {
      res.status(403).json({ error: "Cannot verify your own request" });
      return;
    }

    // Check if already verified
    const verifySnap = await dbRef(`Verifications/${requestId}/${userId}`).once("value");
    if (verifySnap.exists()) {
      res.status(400).json({ error: "Already verified this request" });
      return;
    }

    const newVerification = {
      id: `ver-${requestId}-${userId}`,
      requestId,
      userId,
      createdAt: new Date().toISOString()
    };

    await dbRef(`Verifications/${requestId}/${userId}`).set(newVerification);

    const verifiedCount = (requestData.verifiedCount || 0) + 1;
    const upvotes = requestData.upvotes || 0;
    const downvotes = requestData.downvotes || 0;
    const credibilityScore = calculateCredibility(upvotes, downvotes, verifiedCount);

    await dbRef(`Request/${requestId}`).update({
      verifiedCount,
      credibilityScore
    });

    // Reward the user who correctly verified
    await updateTrustScore(userId, 3);
    
    // Reward the user who created the issue
    if (requestData.userId) {
      await updateTrustScore(requestData.userId, 5);
    }

    res.status(200).json({ message: "Request verified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify request", details: (error as Error).message });
  }
}
