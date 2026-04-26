export type NavigationRoute = {
	label: string;
	href: string;
	description: string;
};

export const ADMIN_ROUTES: NavigationRoute[] = [
	{
		label: "Dashboard",
		href: "/admin/dashboard",
		description: "System overview and metrics",
	},
	{
		label: "Users",
		href: "/admin/users",
		description: "Manage NGOs, citizens, and volunteers",
	},
	{
		label: "Analytics",
		href: "/admin/analytics",
		description: "Charts and trend visualizations",
	},
	{
		label: "Need Requests",
		href: "/admin/needs",
		description: "Create and moderate need requests",
	},
	{
		label: "Model Prediction",
		href: "/admin/predictions",
		description: "AI-prioritized high-need areas",
	},
	{
		label: "NGO Approvals",
		href: "/admin/ngo-approvals",
		description: "Approve or reject NGO registrations",
	},
	{
		label: "NGO Assignments",
		href: "/admin/assignments",
		description: "Assign NGOs to campuses and areas",
	},
	{
		label: "Maps",
		href: "/admin/maps",
		description: "Heatmap and presence map views",
	},
];

export const NGO_ROUTES: NavigationRoute[] = [
	{
		label: "Dashboard",
		href: "/ngo/dashboard",
		description: "NGO overview and stats",
	},
	{
		label: "Requests",
		href: "/ngo/tasks",
		description: "New requests assigned to you",
	},
	{
		label: "Active Tasks",
		href: "/ngo/active-tasks",
		description: "Track tasks in progress",
	},
	{
		label: "Task Map",
		href: "/ngo/map",
		description: "View tasks on the map",
	},
	{
		label: "Volunteers",
		href: "/ngo/volunteers",
		description: "Manage your volunteers",
	},
	{
		label: "Volunteer Requests",
		href: "/ngo/volunteer-requests",
		description: "Review and approve new volunteers",
	},
	{
		label: "Resources",
		href: "/ngo/resources",
		description: "Track inventory and supplies",
	},
	{
		label: "Surveys",
		href: "/ngo/surveys",
		description: "Paper surveys and field reports",
	},
];
