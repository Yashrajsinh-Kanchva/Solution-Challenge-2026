"use client";

import { useMemo, useState } from "react";
import TabSwitcher from "@/components/admin/TabSwitcher";
import UserTable from "@/components/admin/UserTable";
import { allUsers, roleBreakdown } from "@/lib/mock/admin";
import type { AdminUserFilter } from "@/lib/types/admin";

const tabs = [
	{ value: "ngo", label: "NGOs" },
	{ value: "citizen", label: "Citizens" },
	{ value: "volunteer", label: "Volunteers" },
];

export default function UsersPage() {
	const [activeTab, setActiveTab] = useState<AdminUserFilter>("ngo");
	const [users, setUsers] = useState(allUsers);

	const filteredUsers = useMemo(
		() => users.filter((user) => user.role === activeTab),
		[activeTab, users]
	);

	const tabItems = tabs.map((tab) => ({
		...tab,
		count: users.filter((user) => user.role === tab.value).length,
	}));

	const summary = roleBreakdown.find((item) => item.role === activeTab);

	const onToggleStatus = (userId: string) => {
		setUsers((current) =>
			current.map((user) => {
				if (user.id !== userId) {
					return user;
				}

				return {
					...user,
					status: user.status === "active" ? "inactive" : "active",
				};
			})
		);
	};

	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 2</p>
					<h2>User management</h2>
					<p>Review NGOs, citizens, and volunteers with quick profile access and status control.</p>
				</div>
			</section>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">User Segments</p>
						<h3>Role-specific user directory</h3>
						<p className="muted-copy">
							{summary
								? `${summary.total} total accounts, ${summary.active} active, ${summary.pending} pending review.`
								: "Browse platform users by role."}
						</p>
					</div>
				</div>
				<TabSwitcher items={tabItems} value={activeTab} onChange={(value) => setActiveTab(value as AdminUserFilter)} />
				<UserTable users={filteredUsers} onToggleStatus={onToggleStatus} />
			</section>
		</div>
	);
}
