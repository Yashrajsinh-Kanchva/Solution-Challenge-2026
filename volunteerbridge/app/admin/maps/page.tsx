import MapTabs from "@/components/admin/MapTabs";

export default function MapsPage() {
	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 8</p>
					<h2>Maps</h2>
					<p>Three operational map views for problem intensity, NGO presence, and volunteer coverage.</p>
				</div>
			</section>
			<MapTabs />
		</div>
	);
}
