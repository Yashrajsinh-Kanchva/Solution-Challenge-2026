import { NgoRegistration } from "@/lib/types/user";

type NgoTableProps = {
  rows: NgoRegistration[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export default function Component({ rows, onApprove, onReject }: NgoTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>NGO</th>
            <th>Contact</th>
            <th>Area</th>
            <th>Documents</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.ngoName}</td>
              <td>{row.contactName}</td>
              <td>{row.area}</td>
              <td>{row.documents.join(", ")}</td>
              <td>
                <span className={`pill status-${row.status}`}>{row.status}</span>
              </td>
              <td className="table-actions">
                <button type="button" onClick={() => onApprove(row.id)}>
                  Approve
                </button>
                <button type="button" onClick={() => onReject(row.id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
