# DB Handoff — SIH Rural Healthcare Project

**Engine:** PostgreSQL (Supabase). Three tables: `asha_workers`, `patients`, `alerts`.

## Setup

1. Create a Supabase project, note the DB password.
2. Run `schema.sql` in the Supabase SQL Editor.
3. Confirm `asha_workers`, `patients`, `alerts` exist in Table Editor.
4. Copy `.env.example` → `.env`, fill in your connection string (Project Settings → Database → Connection string).
5. `pip install psycopg2-binary python-dotenv` then `python test_db.py`.

## Tables

### `asha_workers` — login
| Field | Type | Notes |
|---|---|---|
| asha_id (PK) | text | ASHA card number |
| name | text | |
| phone_number | text | unique |
| pin_hash | text | hashed, never plaintext |

### `patients` — one row per visit
Matches the agreed contract field-for-field, plus:
- `record_id` (UUID, PK) — surrogate key for `GET /api/patient/{id}`
- `bmi` — auto-calculated by the DB from weight/height, client never sends it
- `asha_id` — FK to `asha_workers`, **added beyond the original contract** so each visit can be traced to the worker who recorded it. Confirm with the team; drop if `device_id` alone is enough.
- `created_at` — server-side insert time

All other fields (patient_id, name, age, gender, bp_systolic, bp_diastolic, sugar_level, weight_kg, height_cm, waist_circumference_cm, pulse_rate, smoking_status, alcohol_use, physical_activity, family_history_*, existing_diagnosis, on_medication, pregnancy_status, symptoms, timestamp, risk_level, synced_at, device_id) are exactly as specified in the contract.

### `alerts` — teleconsult/referral queue
| Field | Type | Notes |
|---|---|---|
| alert_id (PK) | UUID | |
| record_id (FK) | UUID | → patients.record_id |
| patient_id | text | denormalized for quick lookup |
| alert_type | text | teleconsult / referral |
| status | text | pending / sent / failed |
| target | text | hospital / e-Sanjeevani endpoint |
| payload | jsonb | vitals snapshot at alert time |
| retry_count | int | |
| created_at, sent_at | timestamptz | |

## API mapping

- `POST /api/patient` → INSERT into `patients` (omit `record_id`, `bmi`, `created_at`)
- `GET /api/patient/{id}` → SELECT WHERE `record_id = {id}`
- `GET /api/patients` → SELECT * ORDER BY `created_at` DESC
- `POST /api/predict` → hits ML service, not this DB
- `POST /api/alert` → INSERT into `alerts`, later UPDATE `status`/`sent_at`

## Credentials

Real `DATABASE_URL` goes to Backend dev only, over a private channel. `.env` is gitignored — only `.env.example` lives in the repo.

## Open item

`asha_id` on `patients` is an addition beyond your original contract text — flag it to the team before Backend builds against it.
