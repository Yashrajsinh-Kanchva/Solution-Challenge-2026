import KNN from "ml-knn";

// Sample Historical Training Data
// Features: [populationDensity (0-10), povertyLevel (0-10), historicalRequests (0-100), activeVolunteers (0-50)]
// Output Class: 0 = Low, 1 = Medium, 2 = High, 3 = Critical

const trainingData = [
  // High need areas (High poverty, many past requests, few volunteers)
  [8, 9, 85, 2],
  [9, 8, 90, 5],
  [7, 9, 75, 4],
  [10, 10, 100, 1],
  // Medium need areas
  [5, 5, 40, 15],
  [6, 6, 50, 12],
  [4, 7, 60, 20],
  // Low need areas (Low poverty, few requests, many volunteers)
  [2, 2, 10, 45],
  [3, 1, 5, 40],
  [1, 3, 15, 35],
];

const labels = [
  3, 3, 3, 3, // Critical
  2, 2, 2,    // High
  0, 0, 0     // Low
];

let knnModel: any | null = null;

export function trainModel() {
  knnModel = new KNN(trainingData, labels, { k: 3 });
  console.log("✅ ML Model trained successfully on historical data.");
}

export function predictAreaUrgency(populationDensity: number, povertyLevel: number, historicalRequests: number, activeVolunteers: number) {
  if (!knnModel) {
    trainModel();
  }
  
  const prediction = knnModel!.predict([populationDensity, povertyLevel, historicalRequests, activeVolunteers]);
  
  const categories = ["Low", "Medium", "High", "Critical"];
  const category = categories[prediction as number];
  
  // Generate a fake confidence/severity score based on inputs
  const rawScore = (populationDensity * 2) + (povertyLevel * 3) + (historicalRequests * 0.5) - (activeVolunteers * 0.5);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let recommendedAction = "";
  if (category === "Critical") recommendedAction = "Deploy emergency teams immediately and reroute resources.";
  else if (category === "High") recommendedAction = "Increase volunteer assignments within 24 hours.";
  else if (category === "Medium") recommendedAction = "Monitor situation and stage supplies.";
  else recommendedAction = "No immediate action required.";

  return { category, score, recommendedAction };
}
