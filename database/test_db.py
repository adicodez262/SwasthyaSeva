"""
Read/write test for schema v3 (ML-feature patients table).

Setup:
    pip install psycopg2-binary python-dotenv
    cp .env.example .env
    python test_db.py
"""

import os
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor, Json
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ["DATABASE_URL"]


def run_test():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ---- 1. Dummy ASHA worker ----
    cur.execute(
        """
        INSERT INTO asha_workers (asha_id, name, phone_number, pin_hash)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (asha_id) DO NOTHING;
        """,
        ("TEST-ASHA-001", "Test Worker", "9999999999", "dummy_hashed_pin"),
    )
    print("[OK] ASHA worker inserted (or already existed).")

    # ---- 2. Dummy patient visit — note the quoted mixed-case column names ----
    cur.execute(
        """
        INSERT INTO patients (
            patient_id, name, gender, timestamp, device_id, asha_id,
            "Age", is_pregnant, height_cm, weight_kg,
            smoking_status, alcohol_use, physical_activity,
            known_diabetic, known_hypertensive, on_medication,
            family_history_diabetes, family_history_hypertension, family_history_heart_disease,
            acute_fever_symptoms, "Body_Temp_F", pulse_rate,
            "Systolic_BP", "Diastolic_BP", "Blood_Sugar_Fasting", "SPO2", "Hemoglobin_Level"
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        RETURNING record_id, bmi;
        """,
        (
            "TEST-PID-001", "Test Patient", "female", datetime.now(timezone.utc), "DEVICE-01", "TEST-ASHA-001",
            45, 0, 158.0, 68.0,
            0, 0, 0,
            1, 1, 1,
            1, 1, 0,
            0, 98.6, 92,
            160.0, 100.0, 145.0, 97.0, 12.5,
        ),
    )
    inserted = cur.fetchone()
    record_id = inserted["record_id"]
    print(f"[OK] Patient visit inserted. record_id={record_id} bmi={inserted['bmi']}")

    # ---- 3. Fetch it back ----
    cur.execute('SELECT * FROM patients WHERE record_id = %s;', (record_id,))
    fetched = cur.fetchone()
    assert fetched is not None
    print(f"[OK] Fetched: {fetched['name']}, Systolic_BP={fetched['Systolic_BP']}")

    # ---- 4. Simulate ML writing back Triage_Action ----
    cur.execute(
        'UPDATE patients SET "Triage_Action" = %s WHERE record_id = %s RETURNING "Triage_Action";',
        (2, record_id),  # 2 = critical, per ASSUMED mapping in schema.sql
    )
    updated = cur.fetchone()
    print(f"[OK] Triage_Action set to {updated['Triage_Action']}")

    # ---- 5. Linked alert ----
    cur.execute(
        """
        INSERT INTO alerts (record_id, patient_id, alert_type, status, target, payload)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING alert_id;
        """,
        (
            record_id, "TEST-PID-001", "referral", "pending", "District Hospital, Nashik",
            Json({"Systolic_BP": 160.0, "Triage_Action": 2}),
        ),
    )
    alert_id = cur.fetchone()["alert_id"]
    print(f"[OK] Alert inserted. alert_id={alert_id}")

    # ---- 6. Cleanup ----
    cur.execute("DELETE FROM patients WHERE record_id = %s;", (record_id,))  # cascades to alerts
    cur.execute("DELETE FROM asha_workers WHERE asha_id = %s;", ("TEST-ASHA-001",))
    print("[OK] Cleaned up dummy rows.")

    cur.close()
    conn.close()
    print("\nAll checks passed.")


if __name__ == "__main__":
    run_test()
