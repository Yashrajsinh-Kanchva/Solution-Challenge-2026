"use client";

import { useMemo, useState, useEffect } from "react";
import TabSwitcher from "@/components/admin/TabSwitcher";
import UserTable from "@/components/admin/UserTable";
import type { AdminUserFilter } from "@/lib/types/admin";
import { apiClient } from "@/lib/api/client";
import { Users as UsersIcon, ShieldCheck, UserPlus } from "lucide-react";

const tabs = [
  { value: "ngo", label: "NGOs" },
  { value: "citizen", label: "Citizens" },
  { value: "volunteer", label: "Volunteers" },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<AdminUserFilter>("ngo");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getUsers()
      .then(data => {
        console.log("Fetched users from Next.js API:", data);
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((user) => user.role === activeTab),
    [activeTab, users]
  );

  const tabItems = tabs.map((tab) => ({
    ...tab,
    count: users.filter((user) => user.role === tab.value).length,
  }));

  const activeCount = filteredUsers.filter((u) => u?.status === "active").length;
  const pendingCount = filteredUsers.filter((u) => u?.status === "pending").length;

  const onToggleStatus = async (userId: string) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== userId) return user;
        return {
          ...user,
          status: user.status === "active" ? "inactive" : "active",
        };
      })
    );
  };

  return (
    <div className="page-stack max-w-[1400px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-[#1A1C15] tracking-tight leading-tight mb-2">User Directory</h1>
          <p className="text-[#6B7160] font-medium leading-relaxed">
            Review NGOs, citizens, and volunteers with quick profile access and status control.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-3 bg-[#4D5A2C] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#647A39] transition-all flex items-center justify-center gap-2 shadow-sm">
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="space-y-8">
        <div className="bg-white border-2 border-[#E8EDD0] rounded-[32px] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-[#4D5A2C]" />
                <p className="text-[10px] font-black text-[#6B7160]/60 uppercase tracking-[0.2em]">Verified Access Control</p>
              </div>
              <h3 className="text-2xl font-black text-[#1A1C15] mb-2 tracking-tight">Role-specific directory</h3>
              <p className="text-sm font-bold text-[#6B7160]/60">
                {`${filteredUsers.length} total accounts · `}
                <span className="text-[#2E7D32]">{activeCount} active</span>
                {` · `}
                <span className="text-[#B45309]">{pendingCount} pending</span>
              </p>
            </div>
            
            <TabSwitcher 
              items={tabItems} 
              value={activeTab} 
              onChange={(value) => setActiveTab(value as AdminUserFilter)} 
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#D4DCA8] border-t-[#4D5A2C] rounded-full animate-spin" />
              <p className="text-sm font-black text-[#6B7160] uppercase tracking-widest">Accessing records...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-[#F7F5EE] border-2 border-dashed border-[#E8EDD0] rounded-[24px] py-20 text-center">
              <UsersIcon size={48} className="mx-auto text-[#9CA396] mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-[#6B7160]">No users found in this segment.</p>
            </div>
          ) : (
            <UserTable users={filteredUsers} onToggleStatus={onToggleStatus} />
          )}
        </div>
      </section>
    </div>
  );
}

