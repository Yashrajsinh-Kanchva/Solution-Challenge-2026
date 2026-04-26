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
		<div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
			<Sidebar title="VolunteerBridge" items={ADMIN_ROUTES} />
			{/* min-w-0 prevents flex child expanding beyond parent width */}
			<main style={{
				marginLeft: "18rem",
				flex: 1,
				minWidth: 0,
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				background: "#FCF9F3",
				overflowX: "hidden",
			}}>
				<Navbar />
				<div style={{
					flex: 1,
					overflowY: "auto",
					overflowX: "hidden",
					padding: "1.75rem 2rem",
					display: "flex",
					flexDirection: "column",
					gap: "1.5rem",
					scrollBehavior: "smooth",
				}}>
					{children}
					<Footer />
				</div>
			</main>
		</div>
	);
}
