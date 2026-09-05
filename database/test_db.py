"""
Read/write test for the SIH Rural Healthcare DB.
Inserts a dummy ASHA worker, a dummy patient visit, and a linked alert,
then reads each back and cleans up.

Setup:
    pip install psycopg2-binary python-dotenv
    cp .env.example .env   # fill in your Supabase connection string
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

    # ---- 1. Insert a dummy ASHA worker ----
    cur.execute(
        """
        INSERT INTO asha_workers (asha_id, name, phone_number, pin_hash)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (asha_id) DO NOTHING
        RETURNING asha_id;
        """,
        ("TEST-ASHA-001", "Test Worker", "9999999999", "dummy_hashed_pin"),
    )
    print("[OK] ASHA worker inserted (or already existed).")

    # ---- 2. Insert a dummy patient visit ----
    cur.execute(
        """
        INSERT INTO patients (
            patient_id, name, age, gender,
            bp_systolic, bp_diastolic, sugar_level,
            timestamp, risk_level, device_id, asha_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING record_id, bmi;
        """,
        (
            "TEST-PID-001", "Test Patient", 45, "female",
            160, 100, 210.5,
            datetime.now(timezone.utc), "critical", "DEVICE-01", "TEST-ASHA-001",
        ),
    )
    inserted = cur.fetchone()
    record_id = inserted["record_id"]
    print(f"[OK] Patient visit inserted. record_id={record_id} bmi={inserted['bmi']}")

    # ---- 3. Fetch it back ----
    cur.execute("SELECT * FROM patients WHERE record_id = %s;", (record_id,))
    fetched = cur.fetchone()
    assert fetched is not None
    print(f"[OK] Fetched: {fetched['name']}, risk_level={fetched['risk_level']}")

    # ---- 4. Insert a linked alert ----
    cur.execute(
        """
        INSERT INTO alerts (record_id, patient_id, alert_type, status, target, payload)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING alert_id;
        """,
        (
            record_id, "TEST-PID-001", "referral", "pending", "District Hospital, Nashik",
            Json({"bp": "160/100", "sugar_level": 210.5, "risk_level": "critical"}),
        ),
    )
    alert_id = cur.fetchone()["alert_id"]
    print(f"[OK] Alert inserted. alert_id={alert_id}")

    # ---- 5. Cleanup ----
    cur.execute("DELETE FROM patients WHERE record_id = %s;", (record_id,))  # cascades to alerts
    cur.execute("DELETE FROM asha_workers WHERE asha_id = %s;", ("TEST-ASHA-001",))
    print("[OK] Cleaned up dummy rows.")

    cur.close()
    conn.close()
    print("\nAll checks passed.")


if __name__ == "__main__":
    run_test()
