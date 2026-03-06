import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "agri_edge.db"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_name TEXT NOT NULL,
                phone TEXT,
                village TEXT,
                field_area_m2 REAL DEFAULT 0,
                pin TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS device_registry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                device_type TEXT NOT NULL,
                farmer_id INTEGER,
                crop_name TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id),
                UNIQUE(farmer_id, device_id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS field_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                farmer_id INTEGER,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                soil_moisture REAL NOT NULL,
                rain_detected INTEGER DEFAULT 0,
                rain_raw REAL,
                rain_mm_estimate REAL DEFAULT 0,
                days_since_planting INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS storage_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                days_in_storage INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        field_cols = {row[1] for row in conn.execute("PRAGMA table_info(field_data)").fetchall()}
        if "farmer_id" not in field_cols:
            conn.execute("ALTER TABLE field_data ADD COLUMN farmer_id INTEGER")
        if "rain_raw" not in field_cols:
            conn.execute("ALTER TABLE field_data ADD COLUMN rain_raw REAL")
        if "rain_mm_estimate" not in field_cols:
            conn.execute("ALTER TABLE field_data ADD COLUMN rain_mm_estimate REAL DEFAULT 0")
        
        # Migration: Add pin column to farmers table if it doesn't exist
        farmer_cols = {row[1] for row in conn.execute("PRAGMA table_info(farmers)").fetchall()}
        if "pin" not in farmer_cols:
            conn.execute("ALTER TABLE farmers ADD COLUMN pin TEXT")

        # Migration: Fix device_registry constraint (allow same device for multiple farmers)
        # Check if old schema (UNIQUE on device_id only) - migrate to UNIQUE(farmer_id, device_id)
        try:
            # Test by trying to insert two entries with same device_id but different farmer_id
            conn.execute("INSERT INTO device_registry (device_id, device_type, farmer_id, crop_name, created_at) VALUES ('__migration_test__', 'field', 1, 'Test', '2000-01-01')")
            conn.execute("INSERT INTO device_registry (device_id, device_type, farmer_id, crop_name, created_at) VALUES ('__migration_test__', 'field', 2, 'Test', '2000-01-01')")
            # If we get here, the new schema is already in place
            conn.execute("DELETE FROM device_registry WHERE device_id = '__migration_test__'")
        except Exception:
            # Old schema - need to migrate
            conn.rollback()
            conn.execute("DROP TABLE IF EXISTS device_registry")
            conn.execute("""
                CREATE TABLE device_registry (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT NOT NULL,
                    device_type TEXT NOT NULL,
                    farmer_id INTEGER,
                    crop_name TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (farmer_id) REFERENCES farmers (id),
                    UNIQUE(farmer_id, device_id)
                )
            """)

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS disease_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                disease TEXT NOT NULL,
                confidence REAL NOT NULL,
                image_path TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                risk_level TEXT NOT NULL,
                harvest_readiness INTEGER NOT NULL,
                spoilage_risk TEXT NOT NULL,
                recommendation TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def insert_field_data(payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO field_data (
                device_id, farmer_id, temperature, humidity, soil_moisture,
                rain_detected, rain_raw, rain_mm_estimate, days_since_planting, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["device_id"],
                payload.get("farmer_id"),
                payload["temperature"],
                payload["humidity"],
                payload["soil_moisture"],
                payload.get("rain_detected", 0),
                payload.get("rain_raw"),
                payload.get("rain_mm_estimate", 0),
                payload.get("days_since_planting", 0),
                utc_now_iso(),
            ),
        )
        return int(cursor.lastrowid)


def insert_storage_data(payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO storage_data (
                device_id, temperature, humidity, days_in_storage, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["device_id"],
                payload["temperature"],
                payload["humidity"],
                payload["days_in_storage"],
                utc_now_iso(),
            ),
        )
        return int(cursor.lastrowid)


def insert_disease_result(disease: str, confidence: float, image_path: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO disease_results (disease, confidence, image_path, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (disease, confidence, image_path, utc_now_iso()),
        )
        return int(cursor.lastrowid)


def insert_recommendation(payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO recommendations (
                risk_level, harvest_readiness, spoilage_risk, recommendation, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["risk_level"],
                payload["harvest_readiness"],
                payload["spoilage_risk"],
                payload["recommendation"],
                utc_now_iso(),
            ),
        )
        return int(cursor.lastrowid)


def _latest_row(table_name: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute(
            f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT 1"
        ).fetchone()
        return dict(row) if row else None


def get_latest_field_data() -> Optional[Dict[str, Any]]:
    return _latest_row("field_data")


def get_latest_storage_data() -> Optional[Dict[str, Any]]:
    return _latest_row("storage_data")


def get_latest_disease_result() -> Optional[Dict[str, Any]]:
    return _latest_row("disease_results")


def get_latest_recommendation() -> Optional[Dict[str, Any]]:
    return _latest_row("recommendations")


def register_farmer(payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO farmers (farmer_name, phone, village, field_area_m2, pin, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload["farmer_name"],
                payload.get("phone"),
                payload.get("village"),
                payload.get("field_area_m2", 0),
                payload.get("pin"),
                utc_now_iso(),
            ),
        )
        return int(cursor.lastrowid)


def authenticate_farmer(farmer_name: str, pin: str) -> Optional[Dict[str, Any]]:
    """Authenticate a farmer by name and PIN. Returns farmer data if valid, None otherwise."""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, farmer_name, phone, village, field_area_m2, created_at
            FROM farmers
            WHERE farmer_name = ? AND pin = ?
            """,
            (farmer_name, pin),
        ).fetchone()
        return dict(row) if row else None


def list_farmers() -> list[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                f.id,
                f.farmer_name,
                f.phone,
                f.village,
                f.field_area_m2,
                f.pin,
                f.created_at,
                COALESCE((
                    SELECT GROUP_CONCAT(dr.device_id, ', ')
                    FROM device_registry dr
                    WHERE dr.farmer_id = f.id
                ), '') AS linked_devices,
                COALESCE((
                    SELECT COUNT(*)
                    FROM device_registry dr
                    WHERE dr.farmer_id = f.id
                ), 0) AS linked_device_count
            FROM farmers f
            ORDER BY f.id DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]


def update_farmer_profile(farmer_id: int, payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE farmers
            SET farmer_name = ?, phone = ?, village = ?, field_area_m2 = ?, pin = ?
            WHERE id = ?
            """,
            (
                payload["farmer_name"],
                payload.get("phone"),
                payload.get("village"),
                payload.get("field_area_m2", 0),
                payload.get("pin"),
                farmer_id,
            ),
        )
        return int(cursor.rowcount or 0)


def register_device(payload: Dict[str, Any]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO device_registry (device_id, device_type, farmer_id, crop_name, days_since_planting, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(farmer_id, device_id) DO UPDATE SET
                device_type=excluded.device_type,
                crop_name=excluded.crop_name,
                days_since_planting=excluded.days_since_planting
            """,
            (
                payload["device_id"],
                payload["device_type"],
                payload.get("farmer_id"),
                payload.get("crop_name"),
                payload.get("days_since_planting", 0),
                utc_now_iso(),
            ),
        )
        return int(cursor.lastrowid or 0)


def get_devices_for_farmer(farmer_id: int) -> list:
    """Get all devices linked to a specific farmer."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM device_registry WHERE farmer_id = ?",
            (farmer_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_device_registry(device_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM device_registry WHERE device_id = ? LIMIT 1",
            (device_id,),
        ).fetchone()
        return dict(row) if row else None


def get_device_by_crop(crop_name: str) -> Optional[Dict[str, Any]]:
    """Get a device registered for a specific crop (case-insensitive)."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM device_registry WHERE LOWER(crop_name) = LOWER(?) AND device_type = 'field' LIMIT 1",
            (crop_name,),
        ).fetchone()
        return dict(row) if row else None


def get_farmer(farmer_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM farmers WHERE id = ? LIMIT 1",
            (farmer_id,),
        ).fetchone()
        return dict(row) if row else None


def delete_device_registry(device_id: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM device_registry WHERE device_id = ?",
            (device_id,),
        )
        return int(cursor.rowcount or 0)


def delete_farmer_profile(farmer_id: int) -> int:
    with get_connection() as conn:
        conn.execute(
            "UPDATE device_registry SET farmer_id = NULL WHERE farmer_id = ?",
            (farmer_id,),
        )
        conn.execute(
            "UPDATE field_data SET farmer_id = NULL WHERE farmer_id = ?",
            (farmer_id,),
        )
        cursor = conn.execute(
            "DELETE FROM farmers WHERE id = ?",
            (farmer_id,),
        )
        return int(cursor.rowcount or 0)


def get_rain_monitoring(device_id: str, days_since_planting: int, field_area_m2: float = 0) -> Dict[str, Any]:
    safe_days = max(0, int(days_since_planting or 0))
    season_start = datetime.now(timezone.utc) - timedelta(days=safe_days)
    season_start_iso = season_start.isoformat()

    with get_connection() as conn:
        totals = conn.execute(
            """
            SELECT
                COUNT(*) AS total_samples,
                SUM(CASE WHEN rain_detected = 1 THEN 1 ELSE 0 END) AS rainy_samples,
                SUM(COALESCE(rain_mm_estimate, 0)) AS cumulative_rain_mm
            FROM field_data
            WHERE device_id = ? AND created_at >= ?
            """,
            (device_id, season_start_iso),
        ).fetchone()

        rainy_days_row = conn.execute(
            """
            SELECT COUNT(DISTINCT substr(created_at, 1, 10)) AS rainy_days
            FROM field_data
            WHERE device_id = ? AND created_at >= ? AND rain_detected = 1
            """,
            (device_id, season_start_iso),
        ).fetchone()

    total_samples = int((totals["total_samples"] if totals else 0) or 0)
    rainy_samples = int((totals["rainy_samples"] if totals else 0) or 0)
    cumulative_rain_mm = float((totals["cumulative_rain_mm"] if totals else 0) or 0)
    rainy_days = int((rainy_days_row["rainy_days"] if rainy_days_row else 0) or 0)

    rain_exposure_pct = round((rainy_samples / total_samples) * 100, 2) if total_samples else 0.0
    area_m2 = max(0.0, float(field_area_m2 or 0))
    rainwater_volume_m3 = round((cumulative_rain_mm / 1000.0) * area_m2, 4)

    return {
        "device_id": device_id,
        "days_since_planting": safe_days,
        "season_start": season_start_iso,
        "total_samples": total_samples,
        "rainy_samples": rainy_samples,
        "rainy_days": rainy_days,
        "rain_exposure_pct": rain_exposure_pct,
        "cumulative_rain_mm": round(cumulative_rain_mm, 2),
        "field_area_m2": area_m2,
        "rainwater_volume_m3": rainwater_volume_m3,
    }


def get_temperature_series(device_id: str, hours: int = 24, limit: int = 500) -> list[Dict[str, Any]]:
    safe_device_id = str(device_id or "").strip()
    if not safe_device_id:
        return []

    safe_hours = max(1, min(168, int(hours or 24)))
    safe_limit = max(2, min(5000, int(limit or 500)))
    since_iso = (datetime.now(timezone.utc) - timedelta(hours=safe_hours)).isoformat()

    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT created_at, temperature
            FROM field_data
            WHERE device_id = ? AND created_at >= ?
            ORDER BY created_at ASC
            LIMIT ?
            """,
            (safe_device_id, since_iso, safe_limit),
        ).fetchall()

    points: list[Dict[str, Any]] = []
    for row in rows or []:
        created_at = row["created_at"]
        temperature = row["temperature"]
        if created_at is None or temperature is None:
            continue
        try:
            points.append({"t": str(created_at), "v": float(temperature)})
        except (TypeError, ValueError):
            continue
    return points
