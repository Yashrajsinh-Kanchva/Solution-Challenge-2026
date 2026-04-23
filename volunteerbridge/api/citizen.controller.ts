import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { CitizenRecord } from "@/lib/types/rtdb";
import { encryptAadhaar, maskAadhaar } from "@/lib/utils/encryption";

export async function registerCitizen(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId, name, phone, email, aadhaarNumber, isVerified, location } = req.body;

    if (!userId || !name || !phone || !email || !aadhaarNumber || !location) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Aadhaar is encrypted for storage and masked value is returned for display use.
    const encryptedAadhaar = encryptAadhaar(aadhaarNumber);
    const maskedAadhaar = maskAadhaar(aadhaarNumber);

    const citizen: CitizenRecord = {
      userId,
      name,
      phone,
      email,
      aadhaarNumber: encryptedAadhaar,
      isVerified: Boolean(isVerified),
      location,
      createdAt: new Date().toISOString()
    };

    await dbRef(`Citizen/${userId}`).set(citizen);

    res.status(201).json({
      message: "Citizen registered successfully",
      citizen: { ...citizen, aadhaarNumber: maskedAadhaar }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to register citizen", details: (error as Error).message });
  }
}

export async function getCitizenById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const snapshot = await dbRef(`Citizen/${userId}`).once("value");
    if (!snapshot.exists()) {
      res.status(404).json({ error: "Citizen not found" });
      return;
    }

    const citizen = snapshot.val() as CitizenRecord;

    res.status(200).json({
      citizen: {
        ...citizen,
        aadhaarNumber: "************"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch citizen", details: (error as Error).message });
  }
}
