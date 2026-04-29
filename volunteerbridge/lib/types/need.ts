export type NeedStatus = "pending" | "pending_admin" | "approved" | "assigned_to_ngo" | "rejected" | "completed" | "in_progress";

export interface NeedRequest {
	id: string;
	title: string;
	category: string;
	location: string | {
		lat?: number;
		lng?: number;
		address?: string;
		area_name?: string;
	};
	urgency: "low" | "medium" | "high" | "critical" | string;
	requestedBy: string;
	status: NeedStatus;
	createdAt: string;
	description?: string;
}

export interface PredictedArea {
	id: string;
	area: string;
	category: string;
	score: number;
	trend: "up" | "stable" | "down";
}
