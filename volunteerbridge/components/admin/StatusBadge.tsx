import { formatStatusLabel } from "@/lib/utils/formatters";

type StatusBadgeProps = {
	status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<span className={`status-badge status-badge--${status}`}>
			{formatStatusLabel(status)}
		</span>
	);
}
