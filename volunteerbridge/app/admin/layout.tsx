import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { ADMIN_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";

type AdminLayoutProps = {
	children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	const role = cookies().get("vb_role")?.value;

	if (role !== ROLES.ADMIN) {
		redirect("/login");
	}

	return (
		<div className="admin-shell">
			<Sidebar title="Control Center" items={ADMIN_ROUTES} />
			<div className="admin-main">
				<Navbar />
				<main className="admin-content">{children}</main>
				<Footer />
			</div>
		</div>
	);
}
