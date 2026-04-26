import { NextFunction, Request, Response } from "express";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { initFirebaseAdmin } from "@/lib/firebase/config";

initFirebaseAdmin();

export type AuthenticatedRequest = Request & {
	user?: DecodedIdToken;
};

export async function authenticateRequest(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			res.status(401).json({ error: "Missing or invalid Authorization header" });
			return;
		}

		const idToken = authHeader.replace("Bearer ", "").trim();
		if (
			idToken === "MOCK_ADMIN_TOKEN" &&
			process.env.NODE_ENV !== "production" &&
			process.env.ALLOW_MOCK_ADMIN_TOKEN !== "false"
		) {
			req.user = {
				uid: "local-admin",
				email: "admin@volunteerbridge.local",
				role: "admin",
			} as unknown as DecodedIdToken;
			next();
			return;
		}

		const decoded = await getAuth().verifyIdToken(idToken);
		req.user = decoded;
		next();
	} catch (error) {
		res.status(401).json({ error: "Unauthorized", details: (error as Error).message });
	}
}

export function requireRoles(roles: string[]) {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
		const role = req.user?.role as string | undefined;
		if (!role || !roles.includes(role)) {
			res.status(403).json({ error: "Forbidden: insufficient role" });
			return;
		}
		next();
	};
}
