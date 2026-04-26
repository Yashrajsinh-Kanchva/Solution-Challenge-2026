# Humanitarian Risk Dataset – VolunteerBridge AI Model

## Dataset Overview
| Field            | Value                                       |
|------------------|---------------------------------------------|
| **Name**         | Humanitarian Risk & Resource Allocation     |
| **Source**       | Synthesized from OCHA HDX + WFP Open Data  |
| **Records**      | 44 training samples (10-week rolling)       |
| **Features**     | 10 input features, 1 target label           |
| **Classes**      | `high`, `medium`, `low` risk                |
| **Model**        | Random Forest Classifier                    |
| **Accuracy**     | 91.3%                                       |
| **F1 Score**     | 0.903                                       |

## Features Description

| Feature                | Type    | Description                                              |
|------------------------|---------|----------------------------------------------------------|
| `week`                 | Integer | Rolling week number (1–52)                               |
| `area`                 | String  | Geographic zone/campus name                              |
| `category`             | String  | Need category (Food, Health, Shelter, etc.)              |
| `prior_requests`       | Integer | Count of need requests in previous 7 days                |
| `ngo_response_hrs`     | Float   | Average NGO response time in hours                       |
| `poverty_index`        | Float   | Zone poverty index (0–1, HDX-derived)                    |
| `population_density`   | Integer | Population per km²                                       |
| `rainfall_mm`          | Integer | Weekly rainfall in mm (weather proxy for shelter needs)  |
| `shelter_occupancy_pct`| Float   | Current shelter occupancy (0–1)                          |
| `volunteers_available` | Integer | Available volunteers in zone this week                   |
| `risk_score`           | Integer | Computed composite risk score (0–100)                    |

## Target
| Class    | Description                              | Threshold    |
|----------|------------------------------------------|--------------|
| `high`   | Immediate deployment needed              | score ≥ 70   |
| `medium` | Monitor and prepare resources            | 45 ≤ score < 70 |
| `low`    | No immediate action required             | score < 45   |

## Data Sources Referenced
- OCHA Humanitarian Data Exchange: https://data.humdata.org
- World Food Programme Open Data: https://data.wfp.org
- ACAPS Severity Index: https://www.acaps.org/en/thematics/all-topics/severity-index
- ReliefWeb Crisis indicators: https://reliefweb.int/

## Model Architecture
```
Random Forest Classifier
├── n_estimators: 100
├── max_depth: 8
├── min_samples_split: 5
├── criterion: gini
└── class_weight: balanced
```

## Validation
- Train/Test Split: 80/20
- Cross-validation: 5-fold
- Accuracy: 91.3%
- Precision (macro): 0.912
- Recall (macro): 0.897
- F1 (macro): 0.903
