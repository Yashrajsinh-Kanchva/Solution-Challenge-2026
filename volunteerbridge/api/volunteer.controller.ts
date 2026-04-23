import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord, VolunteerRecord, VolunteerStatus } from "@/lib/types/rtdb";
import { findBestVolunteerForRequest } from "@/lib/utils/matching";

export async function assignVolunteer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;

    const requestSnapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!requestSnapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnapshot.val() as RequestRecord;

    const volunteersSnapshot = await dbRef("Volunteer").once("value");
    const volunteerMap = (volunteersSnapshot.val() || {}) as Record<string, VolunteerRecord>;
    const volunteers = Object.values(volunteerMap);

    const selectedVolunteer = findBestVolunteerForRequest(request, volunteers);

    if (!selectedVolunteer) {
      res.status(404).json({ error: "No suitable volunteer found" });
      return;
    }

    await dbRef(`Request/${requestId}`).update({
      assignedVolunteerId: selectedVolunteer.volunteerId,
      status: "assigned_to_volunteer"
    });

    await dbRef(`Volunteer/${selectedVolunteer.volunteerId}`).update({
      status: "assigned",
      availability: false,
      currentRequestId: requestId
    });

    res.status(200).json({
      message: "Volunteer assigned",
      requestId,
      volunteerId: selectedVolunteer.volunteerId
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign volunteer", details: (error as Error).message });
  }
}

export async function updateVolunteerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const { status, availability, currentRequestId } = req.body as {
      status?: VolunteerStatus;
      availability?: boolean;
      currentRequestId?: string | null;
    };

    if (status === undefined && availability === undefined && currentRequestId === undefined) {
      res.status(400).json({ error: "Provide at least one field to update" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (availability !== undefined) {
      updates.availability = availability;
    }
    if (currentRequestId !== undefined) {
      updates.currentRequestId = currentRequestId;
    }

    await dbRef(`Volunteer/${volunteerId}`).update(updates);

    res.status(200).json({ message: "Volunteer updated", volunteerId, updated: updates });
  } catch (error) {
    res.status(500).json({ error: "Failed to update volunteer", details: (error as Error).message });
  }
}
