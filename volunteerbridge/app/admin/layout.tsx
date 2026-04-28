"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { ADMIN_ROUTES } from "@/constants/routes";

type AdminLayoutProps = {
	children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden bg-[#F7F5EE]">
			<Sidebar 
				title="VolunteerBridge" 
				items={ADMIN_ROUTES} 
				isOpen={sidebarOpen} 
				onClose={() => setSidebarOpen(false)} 
			/>
			
			<main className="flex-1 flex flex-col min-w-0 h-screen lg:ml-[17rem] transition-all duration-300">
				<Navbar onMenuClick={() => setSidebarOpen(true)} />
				<div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 flex flex-col gap-6 scroll-smooth">
					{children}
					<Footer />
				</div>
			</main>
		</div>
	);
}

