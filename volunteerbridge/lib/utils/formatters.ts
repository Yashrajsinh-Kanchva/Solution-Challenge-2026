import type { AppUser, UserRole } from "@/lib/types/user";

const roleLabels: Record<UserRole, string> = {
	admin: "Admin",
	ngo: "NGO",
	citizen: "Citizen",
	volunteer: "Volunteer",
};

export function formatDateLabel(value: string): string {
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

export function formatRoleLabel(role: AppUser["role"]): string {
	return roleLabels[role];
}

export function formatStatusLabel(value: string): string {
	if (!value) {
		return "";
	}

	return value.charAt(0).toUpperCase() + value.slice(1);
}
