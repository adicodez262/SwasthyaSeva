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


# Pydantic model for incoming patient vital signs
class PatientData(BaseModel):
    age: int
    bp_systolic: int
    bp_diastolic: int
    sugar_level: float
    heart_rate: int


@app.post("/api/predict")
def predict_risk(data: PatientData):
    """
    Temporary mock prediction endpoint.
    Accepts patient vitals and returns a simulated risk prediction.
    """
    return {
        "risk_level": "moderate",
        "confidence": 0.82
    }
