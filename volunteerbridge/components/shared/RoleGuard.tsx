"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRole } from "@/constants/roles";
import { useAuth } from "@/lib/hooks/useAuth";

type RoleGuardProps = {
  allowedRoles: AppRole[];
  children: ReactNode;
};

export default function Component({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (!role) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace("/login");
    }
  }, [allowedRoles, role, router]);

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="guard-message">
        <p>Checking your role permissions...</p>
      </div>
    );
  }

  return <>{children}</>;
}
