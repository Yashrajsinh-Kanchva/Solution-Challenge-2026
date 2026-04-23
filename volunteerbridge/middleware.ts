import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLE = "admin";

export function middleware(request: NextRequest) {
	const role = request.cookies.get("vb_role")?.value;

	if (role !== ADMIN_ROLE) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", request.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
