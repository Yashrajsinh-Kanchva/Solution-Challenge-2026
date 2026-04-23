import NeedHeatmap from "@/components/admin/NeedHeatmap";
import StatsCard from "@/components/admin/StatsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { allUsers, metricSummary, ngoRegistrations, predictedAreas } from "@/lib/mock/admin";
import { formatDateLabel } from "@/lib/utils/formatters";

const cardConfig = [
	{
		label: "Registered Users",
		value: metricSummary.totalUsers,
		icon: "users" as const,
		helperText: "All active and pending platform accounts",
	},
	{
		label: "NGOs",
		value: metricSummary.totalNgos,
		icon: "ngo" as const,
		helperText: "Approved and pending organizations",
	},
	{
		label: "Volunteers",
		value: metricSummary.totalVolunteers,
		icon: "volunteers" as const,
		helperText: "Field-ready volunteer pool",
	},
	{
		label: "Citizens",
		value: metricSummary.totalCitizens,
		icon: "citizens" as const,
		helperText: "Citizens reporting and tracking needs",
	},
	{
		label: "Pending NGO Approvals",
		value: metricSummary.pendingNgoApprovals,
		icon: "pending" as const,
		helperText: "Registrations waiting for admin review",
		tone: "warning" as const,
	},
];

export default function DashboardPage() {
	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">C Dashboard</p>
					<h2>Admin overview</h2>
					<p>
						A live snapshot of account growth, approval queues, and high-need locations
						needing attention.
					</p>
				</div>
			</section>

			<section className="metric-grid">
				{cardConfig.map((card) => (
					<StatsCard key={card.label} {...card} />
				))}
			</section>

			<section className="content-grid">
				<div className="tool-surface">
					<div className="surface-header">
						<div>
							<p className="section-kicker">Review Queue</p>
							<h3>Pending NGO approvals</h3>
						</div>
					</div>
					<div className="list-stack">
						{ngoRegistrations.slice(0, 3).map((ngo) => (
							<div key={ngo.id} className="list-row">
								<div>
									<strong>{ngo.ngoName}</strong>
									<p>{ngo.contactName}</p>
								</div>
								<div className="list-row__meta">
									<span>{ngo.area}</span>
									<StatusBadge status={ngo.status} />
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="tool-surface">
					<div className="surface-header">
						<div>
							<p className="section-kicker">Recent Signups</p>
							<h3>Latest platform registrations</h3>
						</div>
					</div>
					<div className="list-stack">
						{allUsers.slice(-4).reverse().map((user) => (
							<div key={user.id} className="list-row">
								<div>
									<strong>{user.name}</strong>
									<p>{user.email}</p>
								</div>
								<div className="list-row__meta">
									<span>{formatDateLabel(user.registeredAt)}</span>
									<StatusBadge status={user.status} />
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Model Prediction</p>
						<h3>High-need areas to watch next</h3>
					</div>
				</div>
				<NeedHeatmap areas={predictedAreas.slice(0, 3)} />
			</section>
		</div>
	);
}
