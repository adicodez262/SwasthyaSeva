import os
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize the FastAPI application
app = FastAPI(
    title="Rural Health Risk Detection API",
    description="Backend API for Rural Health Risk Detection (SIH Project)",
    version="1.0.0",
)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows the frontend (running on a different port or device) to make requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all HTTP headers
)

# ---------------------------------------------------------------------------
# MODEL LOADING (Once at Startup)
# ---------------------------------------------------------------------------
# Calculate project-relative path so it works across macOS, Linux, and Windows:
# __file__ -> backend/main.py; parent -> backend; parent.parent -> project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "ultimate_ensemble_model.pkl")

# Load the trained VotingClassifier ensemble model into memory once
model = joblib.load(MODEL_PATH)

# Exact 25 features in the precise order expected by the model
FEATURE_NAMES = [
    "Age",
    "is_pregnant",
    "height_cm",
    "weight_kg",
    "bmi",
    "smoking_status",
    "alcohol_use",
    "physical_activity",
    "known_diabetic",
    "known_hypertensive",
    "on_medication",
    "family_history_diabetes",
    "family_history_hypertension",
    "family_history_heart_disease",
    "acute_fever_symptoms",
    "Body_Temp_F",
    "pulse_rate",
    "Systolic_BP",
    "Diastolic_BP",
    "Blood_Sugar_Fasting",
    "SPO2",
    "Hemoglobin_Level",
    "Delta_SystolicBP",
    "Delta_Hemoglobin",
    "Delta_BloodSugar",
]

# Mapping numerical target output to risk category strings
RISK_LABELS = {
    0: "GREEN",
    1: "YELLOW",
    2: "RED (Emergency)",
}


# ---------------------------------------------------------------------------
# EXISTING ENDPOINTS (Unchanged)
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    """
    Root endpoint to verify that the backend API is online and running.
    """
    return {
        "status": "online",
        "message": "Welcome to Rural Health Risk Detection API",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring server status.
    """
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------------------------
# REQUEST SCHEMA & PREDICTION ENDPOINT
# ---------------------------------------------------------------------------
class PatientData(BaseModel):
    Age: int
    is_pregnant: int
    height_cm: float
    weight_kg: float
    bmi: float
    smoking_status: int
    alcohol_use: int
    physical_activity: int
    known_diabetic: int
    known_hypertensive: int
    on_medication: int
    family_history_diabetes: int
    family_history_hypertension: int
    family_history_heart_disease: int
    acute_fever_symptoms: int
    Body_Temp_F: float
    pulse_rate: int
    Systolic_BP: float
    Diastolic_BP: float
    Blood_Sugar_Fasting: float
    SPO2: float
    Hemoglobin_Level: float
    Delta_SystolicBP: float
    Delta_Hemoglobin: float
    Delta_BloodSugar: float


@app.post("/api/predict")
def predict_risk(data: PatientData):
    """
    Accepts 25 patient vitals, invokes the trained ensemble ML model,
    and returns the predicted risk level along with the model's confidence.
    """
    # 1. Convert incoming validated data into a single-row DataFrame with the exact column order
    input_df = pd.DataFrame([data.model_dump()])[FEATURE_NAMES]

    # 2. Call the model's predict() method to get the predicted class (0, 1, or 2)
    prediction = int(model.predict(input_df)[0])

    # 3. Call predict_proba() to get confidence for the predicted class
    probabilities = model.predict_proba(input_df)[0]
    confidence = round(float(probabilities[prediction]), 4)

    # 4. Map integer target to user-facing risk level and return JSON response
    return {
        "risk_level": RISK_LABELS[prediction],
        "confidence": confidence,
    }
