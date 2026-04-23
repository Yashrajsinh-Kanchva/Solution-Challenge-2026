"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import TabSwitcher from "@/components/admin/TabSwitcher";
import {
	heatmapPoints,
	mapCenter,
	ngoPresencePoints,
	volunteerPresencePoints,
} from "@/lib/mock/admin";

const DynamicMapView = dynamic(() => import("@/components/shared/MapView"), {
	ssr: false,
});

const mapItems = [
	{ value: "heat", label: "Problem Heatmap" },
	{ value: "ngo", label: "NGO Presence" },
	{ value: "volunteer", label: "Volunteer Presence" },
];

export default function MapTabs() {
	const [activeTab, setActiveTab] = useState("heat");

	const config = useMemo(() => {
		if (activeTab === "ngo") {
			return {
				mode: "ngo" as const,
				points: ngoPresencePoints,
				title: "Live NGO footprint",
				description: "Markers show approved NGOs and their operating base across service zones.",
			};
		}

		if (activeTab === "volunteer") {
			return {
				mode: "volunteer" as const,
				points: volunteerPresencePoints,
				title: "Volunteer density",
				description: "Markers reflect clustered volunteer activity and current deployment density.",
			};
		}

		return {
			mode: "heat" as const,
			points: heatmapPoints,
			title: "Problem heatmap",
			description: "High-intensity circles mark neighborhoods with a recent surge in issue reports.",
		};
	}, [activeTab]);

	return (
		<div className="page-stack">
			<TabSwitcher items={mapItems} value={activeTab} onChange={setActiveTab} />
			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Map View</p>
						<h3>{config.title}</h3>
						<p className="muted-copy">{config.description}</p>
					</div>
					<div className="map-legend">
						<span className={`legend-dot legend-dot--${config.mode}`} />
						<span>{config.mode === "heat" ? "Higher issue intensity" : "Active location marker"}</span>
					</div>
				</div>
				<DynamicMapView center={mapCenter} points={config.points} mode={config.mode} />
			</section>
		</div>
	);
}
