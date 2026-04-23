import type { NeedRequest, PredictedArea } from "@/lib/types/need";
import type { AppUser, NgoRegistration, UserRole } from "@/lib/types/user";

export type MetricCardTone = "default" | "warning";
export type MetricCardIcon = "users" | "ngo" | "volunteers" | "citizens" | "pending";
export type AdminUserFilter = Exclude<UserRole, "admin">;

export interface MetricSummary {
	totalUsers: number;
	totalNgos: number;
	totalVolunteers: number;
	totalCitizens: number;
	pendingNgoApprovals: number;
}

export interface CategoryAnalytics {
	category: string;
	needs: number;
}

export interface DeploymentStat {
	zone: string;
	deployed: number;
	target: number;
}

export interface NgoActivityStat {
	ngo: string;
	tasksCompleted: number;
	activeRequests: number;
}

export interface AdminUserProfile extends AppUser {
	phone: string;
	area: string;
	location: string;
	lastActive: string;
	focusLabel: string;
	notes: string;
}

export interface ManagedNeedRequest extends NeedRequest {
	beneficiaries: number;
	summary: string;
}

export interface PendingNgoApproval extends NgoRegistration {
	phone: string;
	submittedAt: string;
	coverage: string;
	mission: string;
	reviewReason?: string;
}

export interface NgoAssignment {
	id: string;
	ngoName: string;
	campus: string;
	coordinator: string;
	assignedAt: string;
}

export interface MapDataPoint {
	id: string;
	label: string;
	position: [number, number];
	intensity?: number;
	description?: string;
}

export interface AreaRiskSignal extends PredictedArea {
	trigger: string;
	recommendedAction: string;
	outlook: string;
}

export interface RoleBreakdown {
	role: AdminUserFilter;
	total: number;
	active: number;
	pending: number;
}
