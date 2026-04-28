"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import type { AppUser } from "@/lib/types/user";
import { formatDateLabel, formatRoleLabel } from "@/lib/utils/formatters";
import { MoreHorizontal, ExternalLink, ShieldAlert, UserCheck } from "lucide-react";

type UserTableProps = {
	users: AppUser[];
	onToggleStatus: (userId: string) => void;
};

export default function UserTable({ users, onToggleStatus }: UserTableProps) {
	return (
		<div className="w-full">
			{/* Desktop Table View */}
			<div className="hidden md:block overflow-x-auto">
				<table className="w-full border-separate border-spacing-y-2">
					<thead>
						<tr className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em] px-4 bg-[#F7F5EE]/50 rounded-xl">
							<th className="pb-4 pt-2 pl-6 text-left first:rounded-l-xl">User Details</th>
							<th className="pb-4 pt-2 text-left">Role</th>
							<th className="pb-4 pt-2 text-left">Status</th>
							<th className="pb-4 pt-2 text-left">Registered</th>
							<th className="pb-4 pt-2 pr-6 text-right last:rounded-r-xl">Actions</th>
						</tr>
					</thead>
					<tbody className="space-y-4">
						{users.map((user) => (
							<tr key={user.id} className="bg-white group hover:shadow-md transition-all duration-200">
								<td className="py-4 pl-6 rounded-l-[24px] border-y-2 border-l-2 border-transparent group-hover:border-[#E8EDD0]">
									<div className="flex flex-col">
										<span className="text-sm font-black text-[#1A1C15]">{user.name}</span>
										<span className="text-xs font-medium text-[#6B7160]">{user.email}</span>
									</div>
								</td>
								<td className="py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0]">
									<span className="text-[11px] font-black uppercase tracking-widest text-[#4D5A2C] bg-[#EEF3D2] px-2.5 py-1 rounded-lg">
										{formatRoleLabel(user.role)}
									</span>
								</td>
								<td className="py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0]">
									<StatusBadge status={user.status} />
								</td>
								<td className="py-4 border-y-2 border-transparent group-hover:border-[#E8EDD0]">
									<span className="text-[13px] font-bold text-[#6B7160]">
										{formatDateLabel(user.registeredAt)}
									</span>
								</td>
								<td className="py-4 pr-6 rounded-r-[24px] border-y-2 border-r-2 border-transparent group-hover:border-[#E8EDD0] text-right">
									<div className="flex items-center justify-end gap-2">
										<Link 
											href={`/admin/users/${user.id}`} 
											className="p-2 text-[#4D5A2C] hover:bg-[#EEF3D2] rounded-lg transition-all"
											title="View Profile"
										>
											<ExternalLink size={18} strokeWidth={2.5} />
										</Link>
										<button 
											onClick={() => onToggleStatus(user.id)}
											className={`p-2 rounded-lg transition-all ${
												user.status === "active" 
													? "text-[#BA1A1A] hover:bg-red-50" 
													: "text-[#2E7D32] hover:bg-green-50"
											}`}
											title={user.status === "active" ? "Deactivate" : "Activate"}
										>
											{user.status === "active" ? <ShieldAlert size={18} /> : <UserCheck size={18} />}
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Card View */}
			<div className="grid gap-4 md:hidden">
				{users.map((user) => (
					<div key={user.id} className="bg-white p-6 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 transition-all">
						<div className="flex justify-between items-start gap-4">
							<div className="min-w-0">
								<h4 className="text-base font-black text-[#1A1C15] truncate">{user.name}</h4>
								<p className="text-xs font-bold text-[#6B7160] truncate">{user.email}</p>
							</div>
							<StatusBadge status={user.status} />
						</div>

						<div className="grid grid-cols-2 gap-4 py-4 border-y-2 border-[#F7F5EE]">
							<div>
								<p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Role</p>
								<span className="text-xs font-black text-[#4D5A2C] uppercase tracking-widest bg-[#EEF3D2] px-2 py-0.5 rounded-lg">
									{formatRoleLabel(user.role)}
								</span>
							</div>
							<div>
								<p className="text-[10px] font-black text-[#6B7160]/50 uppercase tracking-widest mb-1">Registered</p>
								<p className="text-xs font-bold text-[#1A1C15]">{formatDateLabel(user.registeredAt)}</p>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<Link 
								href={`/admin/users/${user.id}`} 
								className="w-full py-3 flex items-center justify-center gap-2 bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-xl text-[11px] font-black text-[#4D5A2C] uppercase tracking-widest"
							>
								<ExternalLink size={14} strokeWidth={2.5} /> View Profile
							</Link>
							<button 
								onClick={() => onToggleStatus(user.id)}
								className={`w-full py-3 flex items-center justify-center gap-2 border-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
									user.status === "active" 
										? "bg-red-50 border-red-100 text-[#BA1A1A]" 
										: "bg-green-50 border-green-100 text-[#2E7D32]"
								}`}
							>
								{user.status === "active" ? <ShieldAlert size={14} /> : <UserCheck size={14} />}
								{user.status === "active" ? "Disable Account" : "Enable Account"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
