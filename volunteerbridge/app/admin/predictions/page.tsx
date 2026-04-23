import NeedHeatmap from "@/components/admin/NeedHeatmap";
import { predictedAreas } from "@/lib/mock/admin";

export default function PredictionsPage() {
	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 5</p>
					<h2>Model prediction</h2>
					<p>AI-prioritized hotspots based on historical demand patterns, escalation signals, and response latency.</p>
				</div>
			</section>

			<NeedHeatmap areas={predictedAreas} />

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Action Guidance</p>
						<h3>Recommended next moves</h3>
					</div>
				</div>
				<div className="list-stack">
					{predictedAreas.map((area) => (
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
