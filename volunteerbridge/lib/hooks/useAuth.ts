"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppRole, ROLES } from "@/constants/roles";

function readRoleFromCookie(): AppRole | null {
	if (typeof document === "undefined") {
		return null;
	}

	const cookie = document.cookie
		.split(";")
		.map((item) => item.trim())
		.find((item) => item.startsWith("vb_role="));

	if (!cookie) {
		return null;
	}

	const value = cookie.replace("vb_role=", "") as AppRole;
	const validRoles = Object.values(ROLES);

	return validRoles.includes(value) ? value : null;
}

export function useAuth() {
	const [role, setRoleState] = useState<AppRole | null>(null);

	useEffect(() => {
		setRoleState(readRoleFromCookie());
	}, []);

	const setRole = useCallback((nextRole: AppRole | null) => {
		if (typeof document !== "undefined") {
			if (nextRole) {
				document.cookie = `vb_role=${nextRole}; path=/`;
			} else {
				document.cookie = "vb_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			}
		}

		setRoleState(nextRole);
	}, []);

	const isAuthenticated = useMemo(() => role !== null, [role]);
	const isAdmin = useMemo(() => role === ROLES.ADMIN, [role]);

	return {
		role,
		isAuthenticated,
		isAdmin,
		setRole,
	};
}
