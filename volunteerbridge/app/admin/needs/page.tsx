"use client";

import { FormEvent, useMemo, useState } from "react";
import NeedRequestTable from "@/components/admin/NeedRequestTable";
import { needRequests } from "@/lib/mock/admin";
import type { ManagedNeedRequest } from "@/lib/types/admin";

const categoryOptions = ["Food", "Health", "Shelter", "Education", "Employment", "Safety"];
type UrgencyLevel = ManagedNeedRequest["urgency"];

type NeedRequestFormState = {
	title: string;
	category: string;
	location: string;
	urgency: UrgencyLevel;
	requestedBy: string;
	beneficiaries: string;
	summary: string;
};

export default function NeedsPage() {
	const [requests, setRequests] = useState<ManagedNeedRequest[]>(needRequests);
	const [formState, setFormState] = useState<NeedRequestFormState>({
		title: "",
		category: categoryOptions[0],
		location: "",
		urgency: "medium",
		requestedBy: "",
		beneficiaries: "50",
		summary: "",
	});

	const pendingCount = useMemo(
		() => requests.filter((request) => request.status === "pending").length,
		[requests]
	);

	const onCreateRequest = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextRequest: ManagedNeedRequest = {
			id: `need-${Date.now()}`,
			title: formState.title,
			category: formState.category,
			location: formState.location,
			urgency: formState.urgency,
			requestedBy: formState.requestedBy,
			status: "pending",
			createdAt: new Date().toISOString().slice(0, 10),
			beneficiaries: Number(formState.beneficiaries),
			summary: formState.summary,
		};

		setRequests((current) => [nextRequest, ...current]);
		setFormState({
			title: "",
			category: categoryOptions[0],
			location: "",
			urgency: "medium",
			requestedBy: "",
			beneficiaries: "50",
			summary: "",
		});
	};

	const onStatusChange = (requestId: string, nextStatus: "approved" | "rejected") => {
		setRequests((current) =>
			current.map((request) =>
				request.id === requestId ? { ...request, status: nextStatus } : request
			)
		);
	};

	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 4</p>
					<h2>NGO need request management</h2>
					<p>Create manual requests, review submissions, and approve or reject based on urgency and fit.</p>
				</div>
				<div className="highlight-chip">{pendingCount} pending</div>
			</section>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Create Need Request</p>
						<h3>Raise a new NGO request manually</h3>
					</div>
				</div>
				<form className="form-grid" onSubmit={onCreateRequest}>
					<input
						className="text-input"
						placeholder="Request title"
						value={formState.title}
						onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
						required
					/>
					<select
						className="text-input"
						value={formState.category}
						onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
					>
						{categoryOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<input
						className="text-input"
						placeholder="Location / area"
						value={formState.location}
						onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
						required
					/>
					<input
						className="text-input"
						placeholder="NGO / requester"
						value={formState.requestedBy}
						onChange={(event) => setFormState((current) => ({ ...current, requestedBy: event.target.value }))}
						required
					/>
					<select
						className="text-input"
						value={formState.urgency}
						onChange={(event) =>
							setFormState((current) => ({
								...current,
								urgency: event.target.value as UrgencyLevel,
							}))
						}
					>
						<option value="low">Low urgency</option>
						<option value="medium">Medium urgency</option>
						<option value="high">High urgency</option>
					</select>
					<input
						className="text-input"
						type="number"
						min="1"
						placeholder="Beneficiaries"
						value={formState.beneficiaries}
						onChange={(event) => setFormState((current) => ({ ...current, beneficiaries: event.target.value }))}
					/>
					<textarea
						className="text-area"
						placeholder="Request summary"
						value={formState.summary}
						onChange={(event) => setFormState((current) => ({ ...current, summary: event.target.value }))}
						required
					/>
					<div className="form-actions">
						<button type="submit" className="primary-button">
							Create request
						</button>
					</div>
				</form>
			</section>

			<section className="tool-surface">
				<div className="surface-header">
					<div>
						<p className="section-kicker">Submitted Requests</p>
						<h3>Approval workflow</h3>
					</div>
				</div>
				<NeedRequestTable requests={requests} onStatusChange={onStatusChange} />
			</section>
		</div>
	);
}
