export type Urgency = "low" | "medium" | "high";

export type RequestStatus =
  | "pending"
  | "pending_admin"
  | "approved"
  | "rejected"
  | "assigned_to_ngo"
  | "assigned_to_volunteer"
  | "in_progress"
  | "completed";

export type VolunteerStatus = "idle" | "assigned" | "offline";

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface CitizenRecord {
  userId: string;
  name: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  isVerified: boolean;
  trustScore?: number;
  location: GeoLocation;
  createdAt: string;
}

export interface AdminRecord {
  adminId: string;
  name: string;
  email: string;
  phone: string;
}

export interface NgoResources {
  food: number;
  medicine: number;
  shelter: number;
}

export interface NgoRecord {
  ngoId: string;
  name: string;
  phone: string;
  location: GeoLocation;
  categories: string[];
  serviceRadius: number;
  availableResources: NgoResources;
  verified: boolean;
  rating: number;
}

export interface VolunteerRecord {
  volunteerId: string;
  name: string;
  phone: string;
  skills: string[];
  location: GeoLocation;
  availability: boolean;
  status: VolunteerStatus;
  currentRequestId: string | null;
  ngoId: string | null;
}

export interface RequestRecord {
  id: string;
  requestId: string;
  userId: string;
  requestType?: "ISSUE" | "HELP";
  title: string;
  description: string;
  summary: string;
  text: string;
  category: string;
  aiCategory: string;
  urgency: Urgency;
  location: GeoLocation;
  requestedBy: string;
  beneficiaries: number;
  status: RequestStatus;
  suggestedNGOs: string[];
  assignedNgoId: string | null;
  assignedVolunteerIds?: string[];
  assignedResources?: NgoResources;
  checklist?: { id: number; text: string; done: boolean }[];
  createdAt: string;

  // Trust & Verification System
  upvotes?: number;
  downvotes?: number;
  verifiedCount?: number;
  credibilityScore?: number;
}

export interface VoteRecord {
  id: string;
  requestId: string;
  userId: string;
  voteType: "UPVOTE" | "DOWNVOTE";
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  requestId: string;
  userId: string;
  createdAt: string;
}
