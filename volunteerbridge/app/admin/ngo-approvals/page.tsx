"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { ngoRegistrations } from "@/lib/mock/admin";
import type { PendingNgoApproval } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";

export default function NgoApprovalsPage() {
	const [registrations, setRegistrations] = useState<PendingNgoApproval[]>(ngoRegistrations);
	const [reasons, setReasons] = useState<Record<string, string>>({});

	const pendingCount = useMemo(
		() => registrations.filter((item) => item.status === "pending").length,
		[registrations]
	);

	const onApprove = (id: string) => {
		setRegistrations((current) =>
			current.map((item) => (item.id === id ? { ...item, status: "approved", reviewReason: undefined } : item))
		);
	};

	const onReject = (id: string) => {
		const reason = reasons[id]?.trim();

		if (!reason) {
			return;
		}

		setRegistrations((current) =>
			current.map((item) =>
				item.id === id ? { ...item, status: "rejected", reviewReason: reason } : item
			)
		);
	};

	return (
		<div className="page-stack">
			<section className="page-header">
				<div>
					<p className="page-header__eyebrow">Feature 6</p>
					<h2>NGO registration approval</h2>
					<p>Validate submitted organizations, review their uploaded documents, and record rejection reasons when needed.</p>
				</div>
				<div className="highlight-chip">{pendingCount} awaiting review</div>
			</section>

			<section className="approval-grid">
				{registrations.map((registration) => (
					<article key={registration.id} className="approval-card">
						<div className="approval-card__top">
							<div>
								<p className="section-kicker">Submitted {formatDateLabel(registration.submittedAt)}</p>
								<h3>{registration.ngoName}</h3>
								<p>{registration.mission}</p>
							</div>
							<StatusBadge status={registration.status} />
						</div>
						<div className="detail-list">
							<div>
								<span>Contact</span>
								<strong>{registration.contactName}</strong>
							</div>
							<div>
								<span>Email</span>
								<strong>{registration.email}</strong>
							</div>
							<div>
								<span>Phone</span>
								<strong>{registration.phone}</strong>
							</div>
							<div>
								<span>Area</span>
								<strong>{registration.area}</strong>
							</div>
							<div>
								<span>Coverage</span>
								<strong>{registration.coverage}</strong>
							</div>
							<div>
								<span>Documents uploaded</span>
								<strong>{registration.documents.join(", ")}</strong>
							</div>
						</div>
						<textarea
							className="text-area"
							placeholder="Reason for rejection"
							value={reasons[registration.id] ?? registration.reviewReason ?? ""}
							onChange={(event) =>
								setReasons((current) => ({ ...current, [registration.id]: event.target.value }))
							}
						/>
						<div className="inline-actions">
							<button type="button" className="action-button" onClick={() => onApprove(registration.id)}>
								Approve
							</button>
							<button
								type="button"
								className="action-button action-button--danger"
								onClick={() => onReject(registration.id)}
							>
								Reject
							</button>
						</div>
					</article>
				))}
			</section>
		</div>
	);
}
