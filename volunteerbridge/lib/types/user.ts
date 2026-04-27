export type UserRole = "admin" | "ngo" | "citizen" | "volunteer";
export type UserStatus = "active" | "inactive" | "pending";

export interface AppUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	trustScore?: number; // Credibility score for voting/validation
	registeredAt: string;
}

export interface NgoRegistration {
	id: string;
	ngoName: string;
	contactName: string;
	email: string;
	area: string;
	documents: string[];
	status: "pending" | "approved" | "rejected";
}
