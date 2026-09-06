-- =====================================================================
-- SIH Rural Healthcare Project — Database Schema v3 (PostgreSQL / Supabase)
-- patients table rebuilt to match the ML engineer's exact feature list.
-- CONFIRM THE INT ENCODINGS BELOW WITH THE ML ENGINEER BEFORE BACKEND
-- BUILDS AGAINST THIS — placeholders are marked with "ASSUMED".
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLE: asha_workers  (unchanged)
-- ---------------------------------------------------------------------
CREATE TABLE asha_workers (
    asha_id         TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    phone_number    TEXT NOT NULL UNIQUE,
    pin_hash        TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- TABLE: patients
-- One row per visit. Identity/bookkeeping fields kept from the
-- original contract; health/vitals fields replaced with the ML
-- engineer's exact feature list below.
-- ---------------------------------------------------------------------
CREATE TABLE patients (
    -- ---- Identity / bookkeeping (kept — app needs these regardless of ML) ----
    record_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id           TEXT NOT NULL,
    name                  TEXT NOT NULL,
    gender                TEXT,                      -- NOT an ML feature in the current list; kept for app/display use only
    timestamp             TIMESTAMPTZ NOT NULL,       -- when vitals were recorded on-device
    device_id             TEXT NOT NULL,
    asha_id               TEXT REFERENCES asha_workers (asha_id),
    synced_at             TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- ---- ML feature set (exact fields the model trains on) ----
    "Age"                       INT NOT NULL CHECK ("Age" >= 0 AND "Age" <= 130),
    is_pregnant                 INT CHECK (is_pregnant IN (0, 1)),                  -- 0 = no, 1 = yes
    height_cm                   FLOAT,
    weight_kg                   FLOAT,
    bmi                          FLOAT GENERATED ALWAYS AS (
                                     CASE
                                         WHEN height_cm IS NOT NULL AND height_cm > 0 AND weight_kg IS NOT NULL
                                         THEN ROUND((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 2)::float
                                         ELSE NULL
                                     END
                                  ) STORED,                                          -- auto-calculated, never sent by client
    smoking_status               INT CHECK (smoking_status IN (0, 1, 2)),           -- ASSUMED: 0=no, 1=yes, 2=former — CONFIRM
    alcohol_use                  INT CHECK (alcohol_use IN (0, 1)),                 -- ASSUMED: 0=no, 1=yes — CONFIRM
    physical_activity            INT CHECK (physical_activity IN (0, 1, 2)),        -- ASSUMED: 0=low, 1=moderate, 2=high — CONFIRM
    known_diabetic                INT CHECK (known_diabetic IN (0, 1)),
    known_hypertensive            INT CHECK (known_hypertensive IN (0, 1)),
    on_medication                  INT CHECK (on_medication IN (0, 1)),
    family_history_diabetes        INT CHECK (family_history_diabetes IN (0, 1)),
    family_history_hypertension    INT CHECK (family_history_hypertension IN (0, 1)),
    family_history_heart_disease   INT CHECK (family_history_heart_disease IN (0, 1)),
    acute_fever_symptoms            INT CHECK (acute_fever_symptoms IN (0, 1)),
    "Body_Temp_F"                    FLOAT,
    pulse_rate                        INT,
    "Systolic_BP"                     FLOAT NOT NULL,
    "Diastolic_BP"                    FLOAT NOT NULL,
    "Blood_Sugar_Fasting"             FLOAT,
    "SPO2"                             FLOAT,
    "Hemoglobin_Level"                 FLOAT,

    -- ---- Deltas (computed at insert time from the patient's previous visit;
    --      NULL on a patient's first-ever visit — never default to 0) ----
    "Delta_SystolicBP"                  FLOAT,
    "Delta_Hemoglobin"                   FLOAT,
    "Delta_BloodSugar"                    FLOAT,

    -- ---- ML output / target label ----
    "Triage_Action"                        INT CHECK ("Triage_Action" IN (0, 1, 2))  -- ASSUMED: 0=low, 1=moderate, 2=critical — CONFIRM, NULL until ML runs
);

CREATE INDEX idx_patients_patient_id ON patients (patient_id);
CREATE INDEX idx_patients_triage     ON patients ("Triage_Action");
CREATE INDEX idx_patients_unsynced   ON patients (synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_patients_device_id  ON patients (device_id);
CREATE INDEX idx_patients_asha_id    ON patients (asha_id);

-- ---------------------------------------------------------------------
-- TABLE: alerts  (unchanged — still keyed off record_id)
-- Note: alert-triggering logic (moderate -> teleconsult, critical -> referral)
-- now reads Triage_Action instead of the old text risk_level. Backend needs
-- to know the confirmed int mapping above before wiring this up.
-- ---------------------------------------------------------------------
CREATE TABLE alerts (
    alert_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID NOT NULL REFERENCES patients (record_id) ON DELETE CASCADE,
    patient_id      TEXT NOT NULL,
    alert_type      TEXT NOT NULL CHECK (alert_type IN ('teleconsult', 'referral')),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    target          TEXT,
    payload         JSONB,
    retry_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ
);

CREATE INDEX idx_alerts_status     ON alerts (status);
CREATE INDEX idx_alerts_patient_id ON alerts (patient_id);
CREATE INDEX idx_alerts_record_id  ON alerts (record_id);

-- ---------------------------------------------------------------------
-- API endpoint mapping
-- ---------------------------------------------------------------------
-- POST /api/patient       -> INSERT INTO patients (omit record_id, bmi, created_at, Delta_* on first visit)
-- GET  /api/patient/{id}  -> SELECT * FROM patients WHERE record_id = $1
-- GET  /api/patients      -> SELECT * FROM patients ORDER BY created_at DESC
-- POST /api/predict       -> hits ML service; response {Triage_Action, confidence} written back to this row
-- POST /api/alert         -> INSERT INTO alerts (status='pending'), later UPDATE status/sent_at
--                            triggered when Triage_Action = 1 (teleconsult) or 2 (referral) -- CONFIRM mapping first
