export interface Task {
	id: string;
	title: string;
	category: string;
	ngoId: string;
	assignedVolunteers: number;
	status: "open" | "in_progress" | "completed";
}
