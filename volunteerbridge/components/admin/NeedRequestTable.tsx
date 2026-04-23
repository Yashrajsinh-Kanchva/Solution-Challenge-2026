import StatusBadge from "@/components/admin/StatusBadge";
import type { ManagedNeedRequest } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";

type NeedRequestTableProps = {
	requests: ManagedNeedRequest[];
	onStatusChange: (requestId: string, nextStatus: "approved" | "rejected") => void;
};

export default function NeedRequestTable({
	requests,
	onStatusChange,
}: NeedRequestTableProps) {
	return (
		<div className="table-scroll">
			<table className="admin-table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Category</th>
						<th>Location</th>
						<th>Beneficiaries</th>
						<th>Status</th>
						<th>Requested By</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((request) => (
						<tr key={request.id}>
							<td>
								<div className="table-primary">
									<strong>{request.title}</strong>
									<span>{request.summary}</span>
								</div>
							</td>
							<td>{request.category}</td>
							<td>{request.location}</td>
							<td>{request.beneficiaries}</td>
							<td>
								<StatusBadge status={request.status} />
							</td>
							<td>{request.requestedBy}</td>
							<td>{formatDateLabel(request.createdAt)}</td>
							<td>
								<div className="inline-actions">
									<button
										type="button"
										className="action-button"
										onClick={() => onStatusChange(request.id, "approved")}
									>
										Approve
									</button>
									<button
										type="button"
										className="action-button action-button--danger"
										onClick={() => onStatusChange(request.id, "rejected")}
									>
										Reject
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
