import os
from datetime import datetime
from typing import Optional
import joblib
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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
# DATABASE CONFIGURATION
# ---------------------------------------------------------------------------
# Load environment variables from .env located at project root
load_dotenv(os.path.join(BASE_DIR, ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    """
    Establishes and returns a connection to the Supabase PostgreSQL database.
    """
    return psycopg2.connect(DATABASE_URL)


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


@app.get("/db-test")
def db_test():
    """
    Tests database connectivity by executing SELECT 1 against PostgreSQL.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        try:
            cur.execute("SELECT 1;")
            result = cur.fetchone()[0]
            return {
                "database": "connected",
                "test_result": result,
            }
        finally:
            cur.close()
    finally:
        conn.close()


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


# ---------------------------------------------------------------------------
# PATIENT ASSESSMENT & DATABASE PERSISTENCE ENDPOINT
# ---------------------------------------------------------------------------
class PatientAssessmentRequest(PatientData):
    patient_id: str
    name: str
    gender: Optional[str] = None
    device_id: str
    asha_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    bmi: Optional[float] = None
    Delta_SystolicBP: Optional[float] = 0.0
    Delta_Hemoglobin: Optional[float] = 0.0
    Delta_BloodSugar: Optional[float] = 0.0


@app.post("/api/patient")
@app.post("/api/assessment")
def create_patient_assessment(data: PatientAssessmentRequest):
    """
    Creates a new patient assessment record:
    1. Validates patient metadata and clinical features.
    2. Runs the ensemble ML model to predict Triage_Action risk level and confidence.
    3. Saves the record into the Supabase 'patients' table using parameterized SQL.
    4. Returns patient_id, risk_level, and confidence.
    """
    # 1. Prepare features dictionary for ML inference
    data_dict = data.model_dump()

    # Calculate bmi if not explicitly provided
    if data_dict.get("bmi") is None and data_dict.get("height_cm") and data_dict.get("weight_kg"):
        height_m = data_dict["height_cm"] / 100.0
        if height_m > 0:
            data_dict["bmi"] = round(data_dict["weight_kg"] / (height_m ** 2), 2)
        else:
            data_dict["bmi"] = 0.0
    elif data_dict.get("bmi") is None:
        data_dict["bmi"] = 0.0

    # Ensure delta values are numeric floats for model inference
    for delta_col in ["Delta_SystolicBP", "Delta_Hemoglobin", "Delta_BloodSugar"]:
        if data_dict.get(delta_col) is None:
            data_dict[delta_col] = 0.0

    # 2. Run existing ML model using exact 25 FEATURE_NAMES
    input_df = pd.DataFrame([data_dict])[FEATURE_NAMES]
    prediction = int(model.predict(input_df)[0])
    probabilities = model.predict_proba(input_df)[0]
    confidence = round(float(probabilities[prediction]), 4)

    # 3. Save patient record into Supabase patients table (bmi, record_id, created_at handled by DB)
    query = """
        INSERT INTO patients (
            patient_id, name, gender, timestamp, device_id, asha_id,
            "Age", is_pregnant, height_cm, weight_kg,
            smoking_status, alcohol_use, physical_activity,
            known_diabetic, known_hypertensive, on_medication,
            family_history_diabetes, family_history_hypertension, family_history_heart_disease,
            acute_fever_symptoms, "Body_Temp_F", pulse_rate,
            "Systolic_BP", "Diastolic_BP", "Blood_Sugar_Fasting", "SPO2", "Hemoglobin_Level",
            "Delta_SystolicBP", "Delta_Hemoglobin", "Delta_BloodSugar",
            "Triage_Action"
        ) VALUES (
            %s, %s, %s, COALESCE(%s, NOW()), %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s
        ) RETURNING record_id;
    """
    params = (
        data.patient_id,
        data.name,
        data.gender,
        data.timestamp,
        data.device_id,
        data.asha_id,
        data.Age,
        data.is_pregnant,
        data.height_cm,
        data.weight_kg,
        data.smoking_status,
        data.alcohol_use,
        data.physical_activity,
        data.known_diabetic,
        data.known_hypertensive,
        data.on_medication,
        data.family_history_diabetes,
        data.family_history_hypertension,
        data.family_history_heart_disease,
        data.acute_fever_symptoms,
        data.Body_Temp_F,
        data.pulse_rate,
        data.Systolic_BP,
        data.Diastolic_BP,
        data.Blood_Sugar_Fasting,
        data.SPO2,
        data.Hemoglobin_Level,
        data.Delta_SystolicBP,
        data.Delta_Hemoglobin,
        data.Delta_BloodSugar,
        prediction,
    )

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

    # 4. Return created patient_id, risk_level, and confidence
    return {
        "patient_id": data.patient_id,
        "risk_level": RISK_LABELS[prediction],
        "confidence": confidence,
    }
