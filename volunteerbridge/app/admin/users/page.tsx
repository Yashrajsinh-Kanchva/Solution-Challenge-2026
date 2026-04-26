"use client";

import { useMemo, useState, useEffect } from "react";
import TabSwitcher from "@/components/admin/TabSwitcher";
import UserTable from "@/components/admin/UserTable";
import type { AdminUserFilter } from "@/lib/types/admin";
import { apiClient } from "@/lib/api/client";

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
      .then(data => setUsers(Array.isArray(data) ? data : []))
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

  const activeCount = filteredUsers.filter((u) => u.status === "active").length;
  const pendingCount = filteredUsers.filter((u) => u.status === "pending").length;

  const onToggleStatus = async (userId: string) => {
    // Note: To fully connect this to the backend, an endpoint like PATCH /users/:id/status is needed.
    // For now, we simulate the status toggle locally for UX.
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
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 2</p>
          <h2>User management</h2>
          <p>Review NGOs, citizens, and volunteers with quick profile access and status control.</p>
        </div>
      </section>

      <section className="tool-surface">
        <div className="surface-header">
          <div>
            <p className="section-kicker">User Segments</p>
            <h3>Role-specific user directory</h3>
            <p className="muted-copy">
              {`${filteredUsers.length} total accounts, ${activeCount} active, ${pendingCount} pending review.`}
            </p>
          </div>
        </div>
        <TabSwitcher items={tabItems} value={activeTab} onChange={(value) => setActiveTab(value as AdminUserFilter)} />
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#595C58" }}>Loading users database...</div>
        ) : (
          <UserTable users={filteredUsers} onToggleStatus={onToggleStatus} />
        )}
      </section>
    </div>
  );
}
