"use client";

import { FormEvent, useMemo, useState } from "react";
import AssignmentTable from "@/components/admin/AssignmentTable";
import { allUsers, areaOptions, ngoAssignmentSeed } from "@/lib/mock/admin";
import type { NgoAssignment } from "@/lib/types/admin";

export default function AssignmentsPage() {
	const approvedNgoOptions = useMemo(
		() => allUsers.filter((user) => user.role === "ngo" && user.status === "active").map((user) => user.name),
		[]
	);
	const [assignments, setAssignments] = useState<NgoAssignment[]>(ngoAssignmentSeed);
	const [ngoName, setNgoName] = useState(approvedNgoOptions[0] ?? "");
	const [campus, setCampus] = useState(areaOptions[0]);
	const [coordinator, setCoordinator] = useState("Admin Desk");

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!ngoName || !campus || !coordinator) {
			return;
		}

		setAssignments((current) => [
			{
				id: `assign-${Date.now()}`,
				ngoName,
				campus,
				coordinator,
				assignedAt: new Date().toISOString().slice(0, 10),
			},
			...current,
		]);
	};

	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 7</p>
					<h2>NGO assignment</h2>
					<p>Assign approved NGOs to campuses and geographic areas, then track current coverage in one place.</p>
				</div>
			</section>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Create Assignment</p>
						<h3>Campus and area mapping</h3>
					</div>
				</div>
				<form className="assignment-form" onSubmit={onSubmit}>
					<select className="text-input" value={ngoName} onChange={(event) => setNgoName(event.target.value)}>
						{approvedNgoOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select className="text-input" value={campus} onChange={(event) => setCampus(event.target.value)}>
						{areaOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<input
						className="text-input"
						placeholder="Coordinator"
						value={coordinator}
						onChange={(event) => setCoordinator(event.target.value)}
					/>
					<button type="submit" className="primary-button">
						Assign NGO
					</button>
				</form>
			</section>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Current Assignments</p>
						<h3>Live campus coverage table</h3>
					</div>
				</div>
				<AssignmentTable assignments={assignments} />
			</section>
		</div>
	);
}
