-- =====================================================================
-- SIH Rural Healthcare Project — Database Schema (PostgreSQL / Supabase)
-- Owner: DB module
-- Do not change field names/types without notifying the team.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLE: asha_workers
-- Login/identity for the ASHA/ANM worker using the app.
-- ---------------------------------------------------------------------
CREATE TABLE asha_workers (
    asha_id         TEXT PRIMARY KEY,       -- government-issued ASHA card number
    name            TEXT NOT NULL,
    phone_number    TEXT NOT NULL UNIQUE,
    pin_hash        TEXT NOT NULL           -- store a HASHED pin (e.g. bcrypt), never plaintext
);

-- ---------------------------------------------------------------------
-- TABLE: patients
-- One row per vitals-recording VISIT (a person can have multiple visits
-- over time — needed for history and future trend-based ML features).
-- Fields exactly match the agreed contract.
-- ---------------------------------------------------------------------
CREATE TABLE patients (
    record_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- surrogate key for GET /api/patient/{id}

    -- ---- Core ----
    patient_id               TEXT NOT NULL,
    name                      TEXT NOT NULL,
    age                       INT NOT NULL CHECK (age >= 0 AND age <= 130),
    gender                    TEXT NOT NULL,
    bp_systolic               INT NOT NULL,
    bp_diastolic              INT NOT NULL,
    sugar_level               NUMERIC(6,2) NOT NULL,   -- random blood sugar, mg/dL

    -- ---- Additional (for ML accuracy) ----
    weight_kg                 NUMERIC(5,2),
    height_cm                 NUMERIC(5,2),
    bmi                       NUMERIC(5,2) GENERATED ALWAYS AS (
                                  CASE
                                      WHEN height_cm IS NOT NULL AND height_cm > 0 AND weight_kg IS NOT NULL
                                      THEN ROUND((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 2)
                                      ELSE NULL
                                  END
                               ) STORED,               -- auto-calculated, client never sends this
    waist_circumference_cm    NUMERIC(5,2),            -- optional
    pulse_rate                INT,
    smoking_status            TEXT CHECK (smoking_status IN ('yes', 'no', 'former')),
    alcohol_use               TEXT CHECK (alcohol_use IN ('yes', 'no')),
    physical_activity         TEXT CHECK (physical_activity IN ('low', 'moderate', 'high')),
    family_history_diabetes         BOOLEAN,
    family_history_hypertension     BOOLEAN,
    family_history_heart_disease    BOOLEAN,
    existing_diagnosis         TEXT CHECK (existing_diagnosis IN ('diabetes', 'hypertension', 'both', 'none')),
    on_medication               BOOLEAN,
    pregnancy_status            TEXT CHECK (pregnancy_status IN ('yes', 'no', 'na')),
    symptoms                    TEXT,                  -- optional

    -- ---- ML output ----
    timestamp                    TIMESTAMPTZ NOT NULL,  -- when vitals were recorded on-device
    risk_level                   TEXT CHECK (risk_level IN ('low', 'moderate', 'critical')), -- NULL until ML runs

    -- ---- Offline-sync support ----
    synced_at                    TIMESTAMPTZ,           -- NULL = not yet synced
    device_id                    TEXT NOT NULL,         -- per contract

    -- ---- Link to worker (addition — confirm with team) ----
    asha_id                      TEXT REFERENCES asha_workers (asha_id),

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_patient_id ON patients (patient_id);
CREATE INDEX idx_patients_risk_level ON patients (risk_level);
CREATE INDEX idx_patients_unsynced   ON patients (synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_patients_device_id  ON patients (device_id);
CREATE INDEX idx_patients_asha_id    ON patients (asha_id);

-- ---------------------------------------------------------------------
-- TABLE: alerts
-- Separate queue table — has its own pending/sent lifecycle and
-- snapshots vitals at alert time via `payload`.
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
-- API endpoint mapping (for Backend dev)
-- ---------------------------------------------------------------------
-- POST /api/patient       -> INSERT INTO patients (omit record_id, bmi, created_at)
-- GET  /api/patient/{id}  -> SELECT * FROM patients WHERE record_id = $1
-- GET  /api/patients      -> SELECT * FROM patients ORDER BY created_at DESC
-- POST /api/predict       -> hits ML service, not this DB
-- POST /api/alert         -> INSERT INTO alerts (status='pending'), later UPDATE status/sent_at
