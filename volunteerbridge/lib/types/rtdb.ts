export type Urgency = "low" | "medium" | "high";

export type RequestStatus =
  | "pending_admin"
  | "approved"
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
  requestId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  aiCategory: string;
  urgency: Urgency;
  location: GeoLocation;
  status: RequestStatus;
  suggestedNGOs: string[];
  assignedNgoId: string | null;
  assignedVolunteerId: string | null;
  createdAt: string;
}
