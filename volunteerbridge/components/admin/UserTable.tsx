import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import type { AppUser } from "@/lib/types/user";
import { formatDateLabel, formatRoleLabel } from "@/lib/utils/formatters";

type UserTableProps = {
	users: AppUser[];
	onToggleStatus: (userId: string) => void;
};

export default function UserTable({ users, onToggleStatus }: UserTableProps) {
	return (
		<div className="table-scroll">
			<table className="admin-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Role</th>
						<th>Status</th>
						<th>Registered</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id}>
							<td>{user.name}</td>
							<td>{user.email}</td>
							<td>{formatRoleLabel(user.role)}</td>
							<td>
								<StatusBadge status={user.status} />
							</td>
							<td>{formatDateLabel(user.registeredAt)}</td>
							<td>
								<div className="inline-actions">
									<Link href={`/admin/users/${user.id}`} className="action-link">
										View profile
									</Link>
									<button type="button" className="action-button" onClick={() => onToggleStatus(user.id)}>
										{user.status === "active" ? "Deactivate" : "Activate"}
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
