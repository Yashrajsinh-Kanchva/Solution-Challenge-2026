import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { adminUserProfiles } from "@/lib/mock/admin";
import { formatDateLabel, formatRoleLabel } from "@/lib/utils/formatters";

type UserDetailPageProps = {
	params: {
		id: string;
	};
};

export default function UserDetailPage({ params }: UserDetailPageProps) {
	const user = adminUserProfiles.find((profile) => profile.id === params.id);

	if (!user) {
		notFound();
	}

	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Profile</p>
					<h2>{user.name}</h2>
					<p>{user.focusLabel}</p>
				</div>
				<Link href="/admin/users" className="action-link">
					Back to users
				</Link>
			</section>

			<section className="detail-grid">
				<article className="tool-surface">
					<p className="section-kicker">Account Summary</p>
					<h3>{user.email}</h3>
					<div className="detail-list">
						<div>
							<span>Role</span>
							<strong>{formatRoleLabel(user.role)}</strong>
						</div>
						<div>
							<span>Status</span>
							<StatusBadge status={user.status} />
						</div>
						<div>
							<span>Registered</span>
							<strong>{formatDateLabel(user.registeredAt)}</strong>
						</div>
						<div>
							<span>Last Active</span>
							<strong>{formatDateLabel(user.lastActive)}</strong>
						</div>
					</div>
				</article>
				<article className="tool-surface">
					<p className="section-kicker">Contact & Region</p>
					<h3>{typeof user.location === "string" ? user.location : (user.location as any)?.address || "No Location"}</h3>
					<div className="detail-list">
						<div>
							<span>Phone</span>
							<strong>{user.phone}</strong>
						</div>
						<div>
							<span>Area</span>
							<strong>{user.area}</strong>
						</div>
						<div>
							<span>Notes</span>
							<strong>{user.notes}</strong>
						</div>
					</div>
				</article>
			</section>
		</div>
	);
}
