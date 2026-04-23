import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import apiRouter from "@/api/routes";
import { initFirebaseAdmin } from "@/lib/firebase/config";
import { startRealtimeListeners } from "@/lib/utils/realtime-listeners";

initFirebaseAdmin();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRouter);

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 5000);
const unsubscribeRealtimeListeners = startRealtimeListeners();

const server = app.listen(port, () => {
  console.log(`VolunteerBridge API running on port ${port}`);
});

process.on("SIGINT", () => {
  unsubscribeRealtimeListeners();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  unsubscribeRealtimeListeners();
  server.close(() => process.exit(0));
});
