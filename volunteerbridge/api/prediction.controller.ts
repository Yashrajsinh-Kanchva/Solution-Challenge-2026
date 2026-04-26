import { Request, Response } from "express";
import KNN from "ml-knn";
import { dbRef } from "@/lib/firebase/firestore";

// ─── Inline ML model (avoids relative-import resolution issues with tsx) ───

const trainingData = [
  [8, 9, 85, 2],
  [9, 8, 90, 5],
  [7, 9, 75, 4],
  [10, 10, 100, 1],
  [5, 5, 40, 15],
  [6, 6, 50, 12],
  [4, 7, 60, 20],
  [2, 2, 10, 45],
  [3, 1, 5, 40],
  [1, 3, 15, 35],
];

const labels = [3, 3, 3, 3, 2, 2, 2, 0, 0, 0];

let knnModel: InstanceType<typeof KNN> | null = null;

function getModel(): InstanceType<typeof KNN> {
  if (!knnModel) {
    knnModel = new KNN(trainingData, labels, { k: 3 });
    console.log("✅ KNN model trained on startup.");
  }
  return knnModel;
}

function predictArea(pop: number, poverty: number, requests: number, vols: number) {
  const model = getModel();
  const prediction = model.predict([pop, poverty, requests, vols]) as number;
  const categories = ["Low", "Medium", "High", "Critical"];
  const category = categories[prediction] ?? "Unknown";
  const rawScore = pop * 2 + poverty * 3 + requests * 0.5 - vols * 0.5;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let recommendedAction = "No immediate action required.";
  if (category === "Critical") recommendedAction = "Deploy emergency teams immediately and reroute resources.";
  else if (category === "High") recommendedAction = "Increase volunteer assignments within 24 hours.";
  else if (category === "Medium") recommendedAction = "Monitor situation and stage supplies.";

  return { category, score, recommendedAction };
}

// ─── Regions to score ────────────────────────────────────────────────────────
const REGIONS = [
  { id: "R1", area: "Downtown District", pop: 9, poverty: 8, requests: 80, vols: 5 },
  { id: "R2", area: "North Hills", pop: 4, poverty: 2, requests: 10, vols: 40 },
  { id: "R3", area: "Eastside Industrial", pop: 7, poverty: 7, requests: 60, vols: 10 },
  { id: "R4", area: "West End Suburbs", pop: 5, poverty: 4, requests: 30, vols: 20 },
  { id: "R5", area: "Southside Valley", pop: 8, poverty: 9, requests: 85, vols: 3 },
];

export async function getPredictions(_req: Request, res: Response) {
  try {
    const snapshot = await dbRef("Prediction").once("value");
    if (snapshot.exists()) {
      const predictions = Object.values(snapshot.val() as Record<string, unknown>);
      predictions.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
      res.status(200).json(predictions);
      return;
    }

    const predictions = REGIONS.map((r) => {
      const result = predictArea(r.pop, r.poverty, r.requests, r.vols);
      return { id: r.id, area: r.area, ...result };
    });
    predictions.sort((a, b) => b.score - a.score);
    res.status(200).json(predictions);
  } catch (error) {
    console.error("Prediction Error:", error);
    res.status(500).json({ error: "Failed to generate AI predictions." });
  }
}
