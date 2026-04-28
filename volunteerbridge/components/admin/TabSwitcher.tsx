"use client";

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
		<div className="flex bg-[#F7F5EE] p-1.5 rounded-[18px] border border-[#E8EDD0] w-full sm:w-fit overflow-x-auto no-scrollbar" role="tablist" aria-label="Admin tabs">
			<div className="flex min-w-max">
				{items.map((item) => {
					const active = value === item.value;
					return (
						<button
							key={item.value}
							type="button"
							role="tab"
							aria-selected={active}
							className={`
								flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
								${active 
									? "bg-white text-[#4D5A2C] shadow-sm" 
									: "text-[#6B7160] hover:text-[#4D5A2C]"
								}
							`}
							onClick={() => onChange(item.value)}
						>
							<span>{item.label}</span>
							{typeof item.count === "number" && (
								<span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-[#EEF3D2] text-[#4D5A2C]" : "bg-[#E8EDD0] text-[#6B7160]"}`}>
									{item.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

