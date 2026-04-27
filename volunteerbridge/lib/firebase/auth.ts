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

		if (
			idToken === "MOCK_NGO_TOKEN" &&
			process.env.NODE_ENV !== "production"
		) {
			const ngoId = req.headers["x-ngo-id"] as string || "ngo-1";
			req.user = {
				uid: ngoId,
				email: `${ngoId}@volunteerbridge.local`,
				role: "ngo",
			} as unknown as DecodedIdToken;
			next();
			return;
		}

		if (
			idToken === "MOCK_VOLUNTEER_TOKEN" &&
			process.env.NODE_ENV !== "production"
		) {
			const volunteerId = req.headers["x-volunteer-id"] as string || "vol-unknown";
			req.user = {
				uid: volunteerId,
				email: `${volunteerId}@volunteerbridge.local`,
				role: "volunteer",
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
