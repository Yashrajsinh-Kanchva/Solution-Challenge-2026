import AnalysisCharts from "@/components/admin/AnalysisCharts";
import { needCategoryAnalytics, ngoActivityLevels, predictedAreas, volunteerDeploymentStats } from "@/lib/mock/admin";

export default function AnalyticsPage() {
	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 3</p>
					<h2>Analysis dashboard</h2>
					<p>Visualize where needs are rising, how volunteers are deployed, and which NGOs are most active.</p>
				</div>
			</section>

			<AnalysisCharts
				categoryData={needCategoryAnalytics}
				deploymentData={volunteerDeploymentStats}
				ngoData={ngoActivityLevels}
			/>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Hotspot Summary</p>
						<h3>Top predicted intervention areas</h3>
					</div>
				</div>
				<div className="list-stack">
					{predictedAreas.slice(0, 3).map((area) => (
						<div key={area.id} className="list-row">
							<div>
								<strong>{area.area}</strong>
								<p>{area.recommendedAction}</p>
							</div>
							<div className="list-row__meta">
								<span>{area.category}</span>
								<strong>{area.score}/100</strong>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
