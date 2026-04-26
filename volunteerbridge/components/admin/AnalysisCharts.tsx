"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { CategoryAnalytics, DeploymentStat, NgoActivityStat } from "@/lib/types/admin";

type AnalysisChartsProps = {
	categoryData: CategoryAnalytics[];
	deploymentData: DeploymentStat[];
	ngoData: NgoActivityStat[];
};

const pieColors = ["#1f7aec", "#22a06b", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function AnalysisCharts({
	categoryData,
	deploymentData,
	ngoData,
}: AnalysisChartsProps) {
	return (
		<div className="chart-grid">
			<section className="chart-surface">
				<div className="section-copy">
					<p className="section-kicker">Community Needs</p>
					<h3>Category demand mix</h3>
				</div>
				<div className="chart-box">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={categoryData}
								dataKey="needs"
								nameKey="category"
								innerRadius={58}
								outerRadius={88}
								paddingAngle={2}
							>
								{categoryData.map((entry, index) => (
									<Cell key={entry.category} fill={pieColors[index % pieColors.length]} />
								))}
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</section>
			<section className="chart-surface">
				<div className="section-copy">
					<p className="section-kicker">Volunteer Deployment</p>
					<h3>Coverage vs target</h3>
				</div>
				<div className="chart-box">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={deploymentData} barGap={6}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="zone" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey="deployed" fill="#1f7aec" radius={[6, 6, 0, 0]} />
							<Bar dataKey="target" fill="#9fc0ff" radius={[6, 6, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</section>
			<section className="chart-surface chart-surface--wide">
				<div className="section-copy">
					<p className="section-kicker">NGO Activity</p>
					<h3>Tasks completed and open requests</h3>
				</div>
				<div className="chart-box">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={ngoData}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="ngo" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey="tasksCompleted" fill="#22a06b" radius={[6, 6, 0, 0]} />
							<Bar dataKey="activeRequests" fill="#f59e0b" radius={[6, 6, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</section>
		</div>
	);
}
