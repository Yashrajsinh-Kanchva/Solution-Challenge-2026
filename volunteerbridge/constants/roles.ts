export const ROLES = {
	ADMIN: "admin",
	NGO: "ngo",
	CITIZEN: "citizen",
	VOLUNTEER: "volunteer",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<AppRole, string> = {
	[ROLES.ADMIN]: "Administrator",
	[ROLES.NGO]: "NGO",
	[ROLES.CITIZEN]: "Citizen",
	[ROLES.VOLUNTEER]: "Volunteer",
};
