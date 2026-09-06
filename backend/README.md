# Backend – Rural Health Risk Detection

## Overview

This directory contains the backend/API of the Rural Health Risk Detection system.

The backend acts as the communication layer between the frontend, ML model, and database.

## Current Responsibility

Backend development is being handled by Adarsh.

The backend is responsible for:

- Receiving patient information from the frontend
- Providing API endpoints for the system
- Sending patient data to the ML model
- Receiving the risk prediction from the ML model
- Handling high-risk cases and alerts
- Communicating with the database
- Supporting the online consultation workflow

## Current Progress

### Stage 1 – FastAPI Backend Foundation ✅

Completed:

- FastAPI application created
- Uvicorn added as the local server
- Root endpoint created (`GET /`)
- Health-check endpoint created (`GET /health`)
- CORS configured
- Backend tested locally
- FastAPI interactive documentation available (`/docs` & `/redoc`)

### Stage 2 – Patient Risk Prediction API ✅

Created:

`POST /api/predict`

This endpoint currently accepts:

- Age (`age`)
- Systolic blood pressure (`bp_systolic`)
- Diastolic blood pressure (`bp_diastolic`)
- Sugar level (`sugar_level`)
- Heart rate (`heart_rate`)

Example request:

```json
{
    "age": 55,
    "bp_systolic": 150,
    "bp_diastolic": 95,
    "sugar_level": 180,
    "heart_rate": 100
}
```

Example response:

```json
{
    "risk_level": "moderate",
    "confidence": 0.82
}
```

## Running the Backend

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the development server:

```bash
uvicorn main:app --reload
```

Interactive documentation:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
