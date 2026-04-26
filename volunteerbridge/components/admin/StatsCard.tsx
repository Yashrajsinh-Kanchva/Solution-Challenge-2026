import type { MetricCardIcon, MetricCardTone } from "@/lib/types/admin";

type StatsCardProps = {
	label: string;
	value: number;
	icon: MetricCardIcon;
	helperText: string;
	tone?: MetricCardTone;
};

const iconMap: Record<MetricCardIcon, JSX.Element> = {
	users: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 2a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm8 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4Zm-8 0c-.41 0-.86.02-1.33.06C4.38 15.26 0 16.3 0 19v1h6v-1c0-1.46.78-2.78 2-3.72A8.86 8.86 0 0 0 8 15Z" />
		</svg>
	),
	ngo: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M3 21h18v-2h-1V8l-8-5-8 5v11H3Zm5-4v-4h2v4Zm6 0v-4h2v4Zm-3-7a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z" />
		</svg>
	),
	volunteers: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="m12 21-1.45-1.32C5.4 15.02 2 11.93 2 8.14A4.94 4.94 0 0 1 7 3a5.43 5.43 0 0 1 5 3 5.43 5.43 0 0 1 5-3 4.94 4.94 0 0 1 5 5.14c0 3.79-3.4 6.88-8.55 11.54Z" />
		</svg>
	),
	citizens: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
		</svg>
	),
	pending: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 11.59 3.3 3.29-1.41 1.42L11 13V6h2Z" />
		</svg>
	),
};

export default function StatsCard({
	label,
	value,
	icon,
	helperText,
	tone = "default",
}: StatsCardProps) {
	return (
		<article className={`metric-card metric-card--${tone}`}>
			<div className="metric-card__meta">
				<p>{label}</p>
				<h3>{new Intl.NumberFormat("en-IN").format(value)}</h3>
				<span>{helperText}</span>
			</div>
			<div className="metric-card__icon">{iconMap[icon]}</div>
		</article>
	);
}
