import type { AreaRiskSignal } from "@/lib/types/admin";

type NeedHeatmapProps = {
	areas: AreaRiskSignal[];
};

export default function NeedHeatmap({ areas }: NeedHeatmapProps) {
	return (
		<section className="priority-grid">
			{areas.map((area, index) => (
				<article key={area.id} className="priority-card">
					<div className="priority-card__head">
						<span>Priority #{index + 1}</span>
						<strong>{area.score}/100</strong>
					</div>
					<h3>{area.area}</h3>
					<p className="muted-copy">{area.category}</p>
					<p>{area.trigger}</p>
					<div className="priority-card__footer">
						<span className={`trend-indicator trend-indicator--${area.trend}`}>{area.trend}</span>
						<p>{area.outlook}</p>
					</div>
				</article>
			))}
		</section>
	);
}
