export type NavigationRoute = {
	label: string;
	href: string;
	description: string;
};

export const CITIZEN_ROUTES: NavigationRoute[] = [
	{
		label: "Dashboard",
		href: "/citizen/dashboard",
		description: "Your submitted reports and updates",
	},
	{
		label: "Report Issue",
		href: "/citizen/report",
		description: "Report a local community issue",
	},
	{
		label: "My Reports",
		href: "/citizen/history",
		description: "Track status of your past reports",
	},
];

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
