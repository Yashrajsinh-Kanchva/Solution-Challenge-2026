export type NeedStatus = "pending" | "approved" | "rejected";

export interface NeedRequest {
	id: string;
	title: string;
	category: string;
	location: string;
	urgency: "low" | "medium" | "high";
	requestedBy: string;
	status: NeedStatus;
	createdAt: string;
}

export interface PredictedArea {
	id: string;
	area: string;
	category: string;
	score: number;
	trend: "up" | "stable" | "down";
}
