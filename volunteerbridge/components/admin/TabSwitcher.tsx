type TabItem = {
	value: string;
	label: string;
	count?: number;
};

type TabSwitcherProps = {
	items: TabItem[];
	value: string;
	onChange: (value: string) => void;
};

export default function TabSwitcher({ items, value, onChange }: TabSwitcherProps) {
	return (
		<div className="tab-row" role="tablist" aria-label="Admin tabs">
			{items.map((item) => {
				const active = value === item.value;
				return (
					<button
						key={item.value}
						type="button"
						role="tab"
						aria-selected={active}
						className={active ? "tab-button active" : "tab-button"}
						onClick={() => onChange(item.value)}
					>
						<span>{item.label}</span>
						{typeof item.count === "number" ? <strong>{item.count}</strong> : null}
					</button>
				);
			})}
		</div>
	);
}
