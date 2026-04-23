"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLES } from "@/constants/roles";

const roleOptions: AppRole[] = [ROLES.ADMIN, ROLES.NGO, ROLES.CITIZEN, ROLES.VOLUNTEER];

export default function Page() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(ROLES.ADMIN);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.cookie = `vb_role=${role}; path=/`;

    if (role === ROLES.ADMIN) {
      router.push("/admin/dashboard");
      return;
    }

    router.push("/");
  };

  return (
    <section className="auth-card">
      <h1>Login</h1>
      <p>Select a role to simulate authentication.</p>
      <form onSubmit={onSubmit} className="auth-form">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as AppRole)}
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="submit">Continue</button>
      </form>
    </section>
  );
}
