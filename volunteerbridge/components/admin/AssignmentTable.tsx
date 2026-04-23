import type { NgoAssignment } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";

type AssignmentTableProps = {
	assignments: NgoAssignment[];
};

export default function AssignmentTable({ assignments }: AssignmentTableProps) {
	return (
		<div className="table-scroll">
			<table className="admin-table">
				<thead>
					<tr>
						<th>NGO</th>
						<th>Campus / Area</th>
						<th>Coordinator</th>
						<th>Assigned On</th>
					</tr>
				</thead>
				<tbody>
					{assignments.map((assignment) => (
						<tr key={assignment.id}>
							<td>{assignment.ngoName}</td>
							<td>{assignment.campus}</td>
							<td>{assignment.coordinator}</td>
							<td>{formatDateLabel(assignment.assignedAt)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
