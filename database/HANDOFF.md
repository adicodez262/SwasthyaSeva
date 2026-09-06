# DB Handoff — SIH Rural Healthcare Project (v3)

**Engine:** PostgreSQL (Supabase). Tables: `asha_workers`, `patients`, `alerts`.

## ⚠️ Open items — confirm before Backend/ML build against this

1. **Int encodings are placeholders.** These need sign-off from the ML engineer:
   - `smoking_status`: assumed 0=no, 1=yes, 2=former
   - `alcohol_use`: assumed 0=no, 1=yes
   - `physical_activity`: assumed 0=low, 1=moderate, 2=high
   - `Triage_Action`: assumed 0=low, 1=moderate, 2=critical
   All other `_int` fields (is_pregnant, known_diabetic, known_hypertensive, on_medication, family_history_*, acute_fever_symptoms) are assumed simple 0/1 flags.
   If any of these are wrong, update the `CHECK` constraints in `schema.sql` and re-run.

2. **Mixed-case column names.** A few columns (`Age`, `Body_Temp_F`, `Systolic_BP`, `Diastolic_BP`, `Blood_Sugar_Fasting`, `SPO2`, `Hemoglobin_Level`, `Delta_SystolicBP`, `Delta_Hemoglobin`, `Delta_BloodSugar`, `Triage_Action`) were kept in the exact casing the ML engineer specified. Postgres is case-sensitive for quoted identifiers — any SQL touching these **must** wrap them in double quotes (e.g. `"Systolic_BP"`), or Postgres will silently fold them to lowercase and fail to find them. This is a common source of confusing bugs — if the team wants to avoid it, we can rename everything to lowercase (`systolic_bp`) and have the ML engineer rename columns on their end instead. Recommend deciding now rather than after Backend has code written against one casing.

3. **`gender` is kept but not an ML feature.** It's in the table for app/display purposes only; it's not sent to the model.

## Setup

1. Run `schema.sql` in Supabase SQL Editor.
2. Copy `.env.example` → `.env`, fill in your connection string.
3. `pip install psycopg2-binary python-dotenv`, then `python test_db.py`.

## `patients` table — field reference

**Identity/bookkeeping (not ML features):**
record_id, patient_id, name, gender, timestamp, device_id, asha_id, synced_at, created_at

**ML feature set (exact list from ML engineer):**
Age, is_pregnant, height_cm, weight_kg, bmi (auto-calculated, never sent by client), smoking_status, alcohol_use, physical_activity, known_diabetic, known_hypertensive, on_medication, family_history_diabetes, family_history_hypertension, family_history_heart_disease, acute_fever_symptoms, Body_Temp_F, pulse_rate, Systolic_BP, Diastolic_BP, Blood_Sugar_Fasting, SPO2, Hemoglobin_Level

**Deltas** (computed at insert time as this-visit minus previous-visit for the same `patient_id`; NULL on a patient's first visit — never 0):
Delta_SystolicBP, Delta_Hemoglobin, Delta_BloodSugar

**ML output:**
Triage_Action (int, NULL until `/api/predict` runs)

## API mapping

- `POST /api/patient` → INSERT into `patients` (omit `record_id`, `bmi`, `created_at`; omit Delta_* on a patient's first visit or compute them from the last row with matching `patient_id`)
- `GET /api/patient/{id}` → SELECT WHERE `record_id = {id}`
- `GET /api/patients` → SELECT * ORDER BY `created_at` DESC
- `POST /api/predict` → hits ML service; response written back as `Triage_Action` (+ confidence, if you decide to store it)
- `POST /api/alert` → triggered based on `Triage_Action` (1 = teleconsult, 2 = referral, per assumed mapping above — confirm before wiring this into Backend)

## Credentials

Real `DATABASE_URL` goes to Backend dev only, over a private channel — never committed. `.env` is gitignored; only `.env.example` lives in the repo.
