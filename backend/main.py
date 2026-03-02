from fastapi import Body
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw, ImageFont
from starlette.requests import Request
from ultralytics import YOLO

from database import (
    authenticate_farmer,
    delete_device_registry,
    delete_farmer_profile,
    get_device_by_crop,
    get_device_registry,
    get_devices_for_farmer,
    get_farmer,
    get_rain_monitoring,
    get_latest_field_data,
    get_latest_storage_data,
    get_temperature_series,
    init_db,
    list_farmers,
    register_device,
    register_farmer,
    update_farmer_profile,
    insert_disease_result,
    insert_field_data,
    insert_recommendation,
    insert_storage_data,
)
from decision_engine import SpoilagePredictor, build_recommendation_payload, normalize_language
from market_service import fetch_market_prices, sell_timing_prediction, predict_tomorrow_price, get_market_location, get_commodity_unit, get_available_locations

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
FRONTEND_DIR = BASE_DIR.parent / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"
TEMPLATES_DIR = FRONTEND_DIR / "templates"
RICE_MODEL_PATH = BASE_DIR / "best.pt"
TOMATO_MODEL_PATH = BASE_DIR / "best(3).pt"
TOMATO_MODEL_PATH_ALT = BASE_DIR / "best (3).pt"
SPOILAGE_MODEL_PATH = BASE_DIR / "spoilage_rf.joblib"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="KisanVision 360", version="1.0.0")

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

RICE_MODEL = YOLO(str(RICE_MODEL_PATH))
TOMATO_MODEL = YOLO(str(TOMATO_MODEL_PATH if TOMATO_MODEL_PATH.exists() else TOMATO_MODEL_PATH_ALT))
spoilage_predictor = SpoilagePredictor(str(SPOILAGE_MODEL_PATH))

RICE_CLASS_MAP = {
    "BacterialBlinght": "Bacterial Leaf Blight",
    "Brownspot": "Brown Spot",
    # "Healthy": "Healthy",
    "Hispa": "Hispa",
    "Leafblast": "Leaf Blast",
}

RICE_ID_TO_CLASS = {
    0: "Bacterial Leaf Blight",
    1: "Brown Spot",
    # 2: "Healthy",
    3: "Hispa",
    4: "Leaf Blast",
}

TOMATO_CLASS_MAP = {
    "Leaf_Miner": "Leaf Miner",
    "Yellow Leaf Curl Virus": "Yellow Leaf Curl Virus",
}


class FieldDataIn(BaseModel):
    device_id: str = Field(..., examples=["field_01"])
    farmer_id: int | None = None
    temperature: float
    humidity: float
    soil_moisture: float
    rain_detected: int = 0
    rain_raw: float | None = None
    rain_mm_estimate: float | None = None
    days_since_planting: int = 0


class StorageDataIn(BaseModel):
    device_id: str = Field(..., examples=["storage_01"])
    temperature: float
    humidity: float
    days_in_storage: int


class FarmerRegisterIn(BaseModel):
    farmer_name: str
    phone: str | None = None
    village: str | None = None
    field_area_m2: float = 0
    pin: str | None = None


class DeviceRegisterIn(BaseModel):
    device_id: str
    device_type: str = Field(..., pattern="^(field|storage)$")
    farmer_id: int | None = None
    crop_name: str | None = None
    days_since_planting: int = 0


class DeleteSetupIn(BaseModel):
    device_id: str
    farmer_id: int | None = None
    delete_farmer: bool = False
    admin_pin: str


class SetupPinIn(BaseModel):
    admin_pin: str


class FarmerLoginIn(BaseModel):
    farmer_name: str
    pin: str


class FarmerUpdateIn(BaseModel):
    farmer_name: str
    phone: str | None = None
    village: str | None = None
    field_area_m2: float = 0
    pin: str | None = None


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in {"png", "jpg", "jpeg"}


def _normalize_crop_name(crop: str) -> str:
    normalized = str(crop or "rice").strip().lower()
    if normalized in {"tomato", "tomatoes"}:
        return "tomato"
    return "rice"


def _get_disease_model(crop: str) -> YOLO:
    return TOMATO_MODEL if _normalize_crop_name(crop) == "tomato" else RICE_MODEL


import numpy as np


def _is_plant_image(image_path: Path, green_threshold: float = 0.08) -> Dict:
    """
    Check if the image contains plant/vegetation content using color analysis.
    Returns dict with is_plant (bool), green_ratio (float), and reason (str).
    """
    try:
        image = Image.open(image_path).convert("RGB")
        # Resize for faster processing
        image = image.resize((200, 200))
        pixels = np.array(image)
        
        # Convert RGB to HSV-like analysis for green detection
        r, g, b = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
        
        # Detect green pixels: green channel dominant and reasonably high
        # Green leaves typically have: G > R, G > B, and G > 50
        green_mask = (g > r) & (g > b) & (g > 50) & (g < 220)
        
        # Detect yellow/brown diseased leaves (common in plant disease images)
        # Yellowed leaves: high R, high G, low B
        yellow_mask = (
            (r > 120) & (r < 255) &
            (g > 100) & (g < 230) &
            (b < 120) &
            (abs(r.astype(int) - g.astype(int)) < 80)  # R and G are close
        )
        
        # Detect plant-specific brown/tan (dead leaves, stems)
        brown_mask = (
            (r > 80) & (r < 200) & 
            (g > 50) & (g < 170) & 
            (b < 100) &
            (r > b) & (g > b)  # Both R and G higher than B (organic brown)
        )
        
        # Combine plant-related colors (green + yellow + brown)
        plant_mask = green_mask | yellow_mask | brown_mask
        
        total_pixels = pixels.shape[0] * pixels.shape[1]
        green_pixels = np.sum(green_mask)
        plant_pixels = np.sum(plant_mask)
        
        green_ratio = green_pixels / total_pixels
        plant_ratio = plant_pixels / total_pixels
        
        # Skin tone detection - focus on high skin concentration
        skin_mask = (
            (r > 95) & (g > 40) & (b > 20) &
            (r > g) & (r > b) &
            (abs(r.astype(int) - g.astype(int)) > 15) &
            (r - b > 15) &
            (r < 250)  # Not overexposed
        )
        skin_ratio = np.sum(skin_mask) / total_pixels
        
        # Detect gray/beige tones (walls, clothing, indoor backgrounds)
        gray_mask = (
            (abs(r.astype(int) - g.astype(int)) < 20) &
            (abs(g.astype(int) - b.astype(int)) < 20) &
            (abs(r.astype(int) - b.astype(int)) < 25) &
            (r > 100) & (r < 220)
        )
        gray_ratio = np.sum(gray_mask) / total_pixels
        
        # PRIORITY: If significant green/plant content exists, accept it
        # This prevents rejecting valid plant images with a small finger visible
        if green_ratio > 0.10:
            return {
                "is_plant": True,
                "green_ratio": green_ratio,
                "plant_ratio": plant_ratio,
                "skin_ratio": skin_ratio,
                "reason": "Significant green vegetation detected"
            }
        
        # If good plant content (including yellowed leaves), accept
        if plant_ratio > 0.25:
            return {
                "is_plant": True,
                "green_ratio": green_ratio,
                "plant_ratio": plant_ratio,
                "skin_ratio": skin_ratio,
                "reason": "Plant content detected"
            }
        
        # Only reject for skin if it's dominant AND green is very low
        if skin_ratio > 0.20 and green_ratio < 0.05:
            return {
                "is_plant": False,
                "green_ratio": green_ratio,
                "plant_ratio": plant_ratio,
                "skin_ratio": skin_ratio,
                "reason": "Image appears to contain human/skin content, not plant material"
            }
        
        # If mostly gray/beige (indoor background) and very little green, reject
        if gray_ratio > 0.50 and green_ratio < 0.03 and plant_ratio < 0.10:
            return {
                "is_plant": False,
                "green_ratio": green_ratio,
                "plant_ratio": plant_ratio,
                "skin_ratio": skin_ratio,
                "gray_ratio": gray_ratio,
                "reason": "Image appears to be an indoor photo without plant content"
            }
        
        # Check if enough plant-like colors present
        is_plant = green_ratio >= 0.03 or plant_ratio >= green_threshold
        
        if not is_plant:
            return {
                "is_plant": False,
                "green_ratio": green_ratio,
                "plant_ratio": plant_ratio,
                "skin_ratio": skin_ratio,
                "reason": "Insufficient plant content detected in image"
            }
        
        return {
            "is_plant": True,
            "green_ratio": green_ratio,
            "plant_ratio": plant_ratio,
            "skin_ratio": skin_ratio,
            "reason": "Plant content detected"
        }
        
    except Exception as e:
        # If analysis fails, allow the image through
        return {
            "is_plant": True,
            "green_ratio": 0.0,
            "plant_ratio": 0.0,
            "skin_ratio": 0.0,
            "reason": f"Could not analyze image: {str(e)}"
        }


def canonical_name(raw_name: str, cls_id: int, crop: str) -> str:
    normalized_crop = _normalize_crop_name(crop)

    if normalized_crop == "tomato":
        mapped = TOMATO_CLASS_MAP.get(raw_name, raw_name)
        return str(mapped).replace("_", " ").strip()

    if raw_name in RICE_CLASS_MAP:
        return RICE_CLASS_MAP[raw_name]
    return RICE_ID_TO_CLASS.get(cls_id, raw_name)


def _draw_detections(image_path: Path, detections: List[Dict]) -> str:
    image = Image.open(image_path)
    if image.mode != "RGB":
        image = image.convert("RGB")
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except OSError:
        font = ImageFont.load_default()

    for item in detections:
        x1, y1, x2, y2 = item["bounding_box"]
        label = f"{item['class_name']} {item['confidence']:.2f}"
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        draw.text((x1, max(0, y1 - 20)), label, fill="red", font=font)

    output_name = f"predicted_{image_path.name}"
    output_path = UPLOAD_DIR / output_name
    image.save(output_path)
    return f"/uploads/{output_name}"


def _run_detection(image_path: Path, crop: str = "rice") -> Dict:
    selected_crop = _normalize_crop_name(crop)
    
    # First, validate if the image contains plant content
    plant_check = _is_plant_image(image_path)
    
    if not plant_check["is_plant"]:
        # Return a special response for non-plant images
        return {
            "crop": selected_crop,
            "detections": [],
            "disease": "Not a Plant",
            "confidence": 0.0,
            "is_plant_image": False,
            "validation_reason": plant_check["reason"],
            "green_ratio": plant_check.get("green_ratio", 0.0),
        }
    
    model = _get_disease_model(selected_crop)
    results = model(str(image_path))
    detections: List[Dict] = []

    for result in results:
        names = result.names
        for box in result.boxes:
            cls_id = int(box.cls[0])
            raw_name = names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id)
            disease_name = canonical_name(raw_name, cls_id, selected_crop)
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            confidence = float(box.conf[0])

            detections.append(
                {
                    "class_name": disease_name,
                    "confidence": confidence,
                    "bounding_box": [x1, y1, x2, y2],
                }
            )

    detections.sort(key=lambda item: item["confidence"], reverse=True)
    top = detections[0] if detections else {"class_name": "No detection", "confidence": 0.0}

    return {
        "crop": selected_crop,
        "detections": detections,
        "disease": top["class_name"],
        "confidence": round(float(top["confidence"]), 4),
        "is_plant_image": True,
    }


def _latest_state_payload(language: str = "en", commodity: str = "Rice") -> Dict:
    lang = normalize_language(language)
    
    # Check if there's a device registered for this commodity
    device_for_crop = get_device_by_crop(commodity)
    
    latest_field = get_latest_field_data()
    latest_storage = get_latest_storage_data()

    # Determine if the device is linked to the requested commodity
    device_linked = False
    if latest_field and device_for_crop:
        # Check if the latest field data is from a device registered for this crop
        registry = get_device_registry(str(latest_field.get("device_id", "")))
        if registry and registry.get("crop_name", "").lower() == commodity.lower():
            device_linked = True

    field_live = _is_fresh_real_node(latest_field) if device_linked else False
    storage_live = _is_fresh_real_node(latest_storage)

    # Only show field data if device is linked to this commodity
    field_for_ui = latest_field if (field_live and device_linked) else None
    storage_for_ui = latest_storage if storage_live else None

    # Recommendation payload should not claim sensor-derived conditions when the node is offline.
    # Preserve lifecycle stage using `days_since_planting` even if telemetry is stale.
    # Only use field data for recommendations if device is linked to this commodity
    field_for_reco = None
    if device_linked:
        field_for_reco = latest_field if field_live else (
            {"days_since_planting": (latest_field or {}).get("days_since_planting", 0)} if latest_field else None
        )
    storage_for_reco = latest_storage if storage_live else (
        {"days_in_storage": (latest_storage or {}).get("days_in_storage", 0)} if latest_storage else None
    )

    recommendation_payload = build_recommendation_payload(
        field_for_reco,
        storage_for_reco,
        None,
        spoilage_predictor,
        lang,
        include_disease_context=False,
    )
    insert_recommendation(recommendation_payload)

    market_prices = fetch_market_prices(commodity)
    market_prices["storage_temperature"] = float((latest_storage or {}).get("temperature", 24.0))
    market_prices["storage_humidity"] = float((latest_storage or {}).get("humidity", 60.0))
    sell_prediction = sell_timing_prediction(
        recommendation_payload["spoilage_risk"],
        market_prices,
        commodity,
    )

    rain_monitoring = None
    farmer_context = None
    temperature_series_24h: List[Dict] = []
    
    # Only include farmer context and monitoring if device is linked to this commodity
    if device_linked and latest_field:
        registry = get_device_registry(str(latest_field.get("device_id", ""))) or {}
        resolved_farmer_id = latest_field.get("farmer_id") or registry.get("farmer_id")
        farmer = get_farmer(int(resolved_farmer_id)) if resolved_farmer_id else None

        if farmer:
            farmer_context = {
                "id": farmer.get("id"),
                "farmer_name": farmer.get("farmer_name"),
                "village": farmer.get("village"),
                "field_area_m2": farmer.get("field_area_m2", 0),
            }

        # Always return rain monitoring (it's historical data) - not dependent on live status
        rain_monitoring = get_rain_monitoring(
            str(latest_field.get("device_id", "field_01")),
            int(latest_field.get("days_since_planting", 0) or 0),
            float((farmer or {}).get("field_area_m2", 0) or 0),
        )

        temperature_series_24h = get_temperature_series(
            str(latest_field.get("device_id", "")) or "field_01",
            hours=24,
            limit=480,
        )

    return {
        "field_data": field_for_ui,
        "storage_data": storage_for_ui,
        "temperature_series_24h": temperature_series_24h,
        "node_status": {
            "field_live": field_live,
            "storage_live": storage_live,
            "device_linked": device_linked,
            "linked_crop": device_for_crop.get("crop_name") if device_for_crop else None,
        },
        "farmer_context": farmer_context,
        "rain_monitoring": rain_monitoring,
        "risk_scores": {
            "risk_level": recommendation_payload["risk_level"],
            "environmental_risk_score": recommendation_payload["environmental_risk_score"],
            "harvest_readiness": recommendation_payload["harvest_readiness"],
            "spoilage_risk": recommendation_payload["spoilage_risk"],
        },
        "lifecycle": {
            "crop_stage": recommendation_payload.get("crop_stage", "--"),
            "crop_stage_tip": recommendation_payload.get("crop_stage_tip", ""),
            "crop_stage_actions": recommendation_payload.get("crop_stage_actions", []),
            "days_since_planting": int(latest_field.get("days_since_planting", 0) or 0) if latest_field else 0,
        },
        "recommendation": recommendation_payload["recommendation"],
        "language": recommendation_payload["language"],
        "commodity": commodity,
        "market": {
            "source": market_prices.get("source", "demo"),
            "records": market_prices.get("records", []),
            "sell_prediction": sell_prediction,
            "note": market_prices.get("note", ""),
        },
    }


def _parse_iso_datetime(raw_value: str) -> datetime | None:
    if not raw_value:
        return None
    normalized = str(raw_value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _freshness(timestamp: str | None, max_age_seconds: int = 90) -> Dict:
    parsed = _parse_iso_datetime(timestamp) if timestamp else None
    if parsed is None:
        return {
            "connected": False,
            "age_seconds": None,
            "last_seen": timestamp,
        }

    age_seconds = int((datetime.now(timezone.utc) - parsed).total_seconds())
    return {
        "connected": age_seconds <= max_age_seconds,
        "age_seconds": age_seconds,
        "last_seen": timestamp,
    }


def _is_fresh_real_node(payload: Dict | None, max_age_seconds: int = 120) -> bool:
    record = payload or {}
    device_id = str(record.get("device_id", "")).strip().lower()
    created_at = record.get("created_at")
    if not device_id or device_id.startswith("demo") or "demo" in device_id:
        return False
    return bool(_freshness(created_at, max_age_seconds=max_age_seconds).get("connected", False))


def _estimate_rain_mm(rain_detected: int, rain_raw: float | None) -> float:
    if int(rain_detected or 0) == 0:
        return 0.0
    if rain_raw is None:
        return 0.2

    raw = max(0.0, min(4095.0, float(rain_raw)))
    wetness = (4095.0 - raw) / 4095.0
    return round(max(0.1, 0.1 + wetness * 1.9), 3)


def _is_valid_setup_pin(admin_pin: str) -> bool:
    expected_pin = os.getenv("SETUP_ADMIN_PIN", "1234")
    return str(admin_pin or "").strip() == str(expected_pin).strip()


def _seed_demo_data_if_empty() -> None:
    latest_field = get_latest_field_data()
    latest_storage = get_latest_storage_data()

    if not latest_field:
        insert_field_data(
            {
                "device_id": "demo_field_01",
                "farmer_id": None,
                "temperature": 28.4,
                "humidity": 71.0,
                "soil_moisture": 54.0,
                "rain_detected": 0,
                "rain_raw": 2650.0,
                "rain_mm_estimate": 0.0,
                "days_since_planting": 32,
            }
        )

    if not latest_storage:
        insert_storage_data(
            {
                "device_id": "demo_storage_01",
                "temperature": 23.0,
                "humidity": 61.0,
                "days_in_storage": 2,
            }
        )


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    _seed_demo_data_if_empty()


@app.get("/")
def root(request: Request):
    template_path = TEMPLATES_DIR / "home_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "home_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )
    home_path = FRONTEND_DIR / "home.html"
    if not home_path.exists():
        raise HTTPException(status_code=404, detail="Home page not found")
    return FileResponse(home_path)

# Chatbot advisory endpoint for farmers
@app.post("/chatbot-advisory")
async def chatbot_advisory(question: str = Body(...), language: str = Body("en")) -> Dict:
    from decision_engine import Groq
    lang = normalize_language(language)
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if not api_key or Groq is None:
        return {"answer": "Sorry, advisory service is not available right now."}
    try:
        client = Groq(api_key=api_key)
        prompt = f"A farmer asked: '{question}'. Please answer in {lang} in simple, actionable language, under 80 words, with 3-4 short numbered steps."
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            temperature=0.2,
        )
        content = completion.choices[0].message.content
        return {"answer": content.strip() if content else "No advisory available."}
    except Exception:
        return {"answer": "Sorry, advisory service is not available right now."}

@app.get("/disease")
def disease_page(request: Request):
    template_path = TEMPLATES_DIR / "disease_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "disease_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Disease page not found")
    return FileResponse(index_path)


@app.get("/dashboard")
def dashboard_page(request: Request) -> JSONResponse:
    template_path = TEMPLATES_DIR / "dashboard_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "dashboard_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )

    page_path = FRONTEND_DIR / "dashboard.html"
    if not page_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard page not found")
    return FileResponse(page_path)


@app.get("/market")
def market_page(request: Request):
    template_path = TEMPLATES_DIR / "market_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "market_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )
    page_path = FRONTEND_DIR / "market.html"
    if not page_path.exists():
        raise HTTPException(status_code=404, detail="Market page not found")
    return FileResponse(page_path)


@app.get("/login")
def login_page(request: Request):
    template_path = TEMPLATES_DIR / "login_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "login_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )
    raise HTTPException(status_code=404, detail="Login page not found")


@app.get("/farmer")
@app.get("/far")
def farmer_page(request: Request):
    template_path = TEMPLATES_DIR / "farmer_saas.html"
    if template_path.exists():
        return templates.TemplateResponse(
            "farmer_saas.html",
            {
                "request": request,
                "lang": "en",
                "current_year": datetime.now(timezone.utc).year,
            },
        )
    page_path = FRONTEND_DIR / "farmer.html"
    if not page_path.exists():
        raise HTTPException(status_code=404, detail="Farmer setup page not found")
    return FileResponse(page_path)


@app.get("/health")
def health() -> Dict:
    return {
        "status": "ok",
        "mode": "ONLINE_ENHANCED" if os.getenv("ENABLE_ONLINE_ADVISORY", "false").lower() == "true" else "LOCAL_ONLY",
    }


@app.get("/uploads/{filename}")
def get_upload(filename: str) -> FileResponse:
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@app.post("/predict-disease")
async def predict_disease(file: UploadFile = File(...), language: str = Form("en"), crop: str = Form("rice")) -> Dict:
    lang = normalize_language(language)
    selected_crop = _normalize_crop_name(crop)
    if not file.filename or not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Please upload a png/jpg/jpeg image")

    image_path = UPLOAD_DIR / file.filename
    with image_path.open("wb") as target:
        target.write(await file.read())

    detection_output = _run_detection(image_path, selected_crop)
    image_url = _draw_detections(image_path, detection_output["detections"])

    # Only insert to database if it's a valid plant image
    if detection_output.get("is_plant_image", True):
        insert_disease_result(detection_output["disease"], detection_output["confidence"], image_url)

    return {
        "language": lang,
        "crop": selected_crop,
        "disease": detection_output["disease"],
        "confidence": detection_output["confidence"],
        "detections": detection_output["detections"],
        "image_url": image_url,
        "is_plant_image": detection_output.get("is_plant_image", True),
        "validation_reason": detection_output.get("validation_reason", ""),
    }


@app.post("/predict")
async def predict_legacy(file: UploadFile = File(...), language: str = Form("en"), crop: str = Form("rice")) -> Dict:
    lang = normalize_language(language)
    prediction = await predict_disease(file, lang, crop)

    # If not a plant image, return early with the validation message
    if not prediction.get("is_plant_image", True):
        return {
            "crop": prediction.get("crop", _normalize_crop_name(crop)),
            "boxes": [],
            "suggestions": {},
            "image_url": prediction["image_url"],
            "is_plant_image": False,
            "validation_reason": prediction.get("validation_reason", "Not a plant image"),
        }

    suggestions = {}
    for item in prediction["detections"]:
        if item["class_name"] not in suggestions:
            payload = build_recommendation_payload(
                get_latest_field_data(),
                get_latest_storage_data(),
                {
                    "disease": item["class_name"],
                    "confidence": item["confidence"],
                },
                spoilage_predictor,
                lang,
                disease_only_advisory=True,
            )
            suggestions[item["class_name"]] = payload["recommendation"]

    return {
        "crop": prediction.get("crop", _normalize_crop_name(crop)),
        "boxes": prediction["detections"],
        "suggestions": suggestions,
        "image_url": prediction["image_url"],
        "is_plant_image": True,
    }


@app.post("/submit-field-data")
def submit_field_data(payload: FieldDataIn) -> Dict:
    incoming = payload.model_dump()

    registry = get_device_registry(incoming["device_id"])
    if not incoming.get("farmer_id") and registry and registry.get("farmer_id"):
        incoming["farmer_id"] = registry.get("farmer_id")

    if incoming.get("rain_mm_estimate") is None:
        incoming["rain_mm_estimate"] = _estimate_rain_mm(
            int(incoming.get("rain_detected", 0)),
            incoming.get("rain_raw"),
        )

    insert_field_data(incoming)
    dashboard_payload = _latest_state_payload("en", "Rice")
    rain_monitoring = dashboard_payload.get("rain_monitoring") or {}
    return {
        "status": "ok",
        "message": "Field data received",
        "risk_level": dashboard_payload["risk_scores"]["risk_level"],
        "rain_mm_estimate": incoming.get("rain_mm_estimate", 0),
        "cumulative_rain_mm": rain_monitoring.get("cumulative_rain_mm", 0),
    }


@app.post("/register-farmer")
def register_farmer_endpoint(payload: FarmerRegisterIn) -> Dict:
    farmer_id = register_farmer(payload.model_dump())
    return {
        "status": "ok",
        "farmer_id": farmer_id,
        "farmer_name": payload.farmer_name,
        "message": "Farmer registered successfully",
    }


@app.post("/farmer-login")
def farmer_login_endpoint(payload: FarmerLoginIn) -> Dict:
    """Authenticate farmer by name and PIN."""
    farmer = authenticate_farmer(payload.farmer_name, payload.pin)
    if not farmer:
        raise HTTPException(status_code=401, detail="Invalid name or PIN")
    return {
        "status": "ok",
        "farmer": farmer,
        "message": "Login successful",
    }


@app.get("/farmers")
def farmers_list_endpoint() -> Dict:
    return {
        "status": "ok",
        "farmers": list_farmers(),
    }


@app.put("/farmers/{farmer_id}")
def farmer_update_endpoint(farmer_id: int, payload: FarmerUpdateIn) -> Dict:
    updated = update_farmer_profile(farmer_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {
        "status": "ok",
        "farmer_id": farmer_id,
        "message": "Farmer updated successfully",
    }


@app.delete("/farmers/{farmer_id}")
def farmer_delete_endpoint(farmer_id: int) -> Dict:
    deleted = delete_farmer_profile(farmer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {
        "status": "ok",
        "farmer_id": farmer_id,
        "message": "Farmer deleted successfully",
    }


@app.get("/farmers/{farmer_id}/devices")
def farmer_devices_endpoint(farmer_id: int) -> Dict:
    devices = get_devices_for_farmer(farmer_id)
    return {
        "status": "ok",
        "farmer_id": farmer_id,
        "devices": devices,
    }


@app.post("/register-device")
def register_device_endpoint(payload: DeviceRegisterIn) -> Dict:
    register_device(payload.model_dump())
    return {
        "status": "ok",
        "device_id": payload.device_id,
        "days_since_planting": payload.days_since_planting,
        "message": "Device linked successfully",
    }


@app.post("/verify-setup-pin")
def verify_setup_pin_endpoint(payload: SetupPinIn) -> Dict:
    valid = _is_valid_setup_pin(payload.admin_pin)
    return {
        "status": "ok" if valid else "invalid",
        "valid": valid,
    }


@app.post("/delete-setup")
def delete_setup_endpoint(payload: DeleteSetupIn) -> Dict:
    if not _is_valid_setup_pin(payload.admin_pin):
        raise HTTPException(status_code=403, detail="Invalid admin PIN")

    removed_device = delete_device_registry(payload.device_id)
    removed_farmer = 0
    if payload.delete_farmer and payload.farmer_id:
        removed_farmer = delete_farmer_profile(int(payload.farmer_id))

    return {
        "status": "ok",
        "removed_device_links": removed_device,
        "removed_farmer_records": removed_farmer,
        "message": "Setup deleted successfully",
    }


@app.post("/submit-storage-data")
def submit_storage_data(payload: StorageDataIn) -> Dict:
    insert_storage_data(payload.model_dump())
    dashboard_payload = _latest_state_payload("en", "Rice")
    return {
        "status": "ok",
        "message": "Storage data received",
        "spoilage_risk": dashboard_payload["risk_scores"]["spoilage_risk"],
    }


@app.get("/dashboard-data")
def dashboard_data(language: str = Query("en"), commodity: str = Query("Rice")) -> Dict:
    return _latest_state_payload(language, commodity)


@app.get("/recommendation")
def recommendation(language: str = Query("en"), commodity: str = Query("Rice")) -> Dict:
    payload = _latest_state_payload(language, commodity)
    return {
        "risk_level": payload["risk_scores"]["risk_level"],
        "harvest_readiness": payload["risk_scores"]["harvest_readiness"],
        "spoilage_risk": payload["risk_scores"]["spoilage_risk"],
        "recommendation": payload["recommendation"],
        "language": payload.get("language", "en"),
    }


@app.get("/market-prices")
def market_prices(commodity: str = Query("Rice"), language: str = Query("en")) -> Dict:
    lang = normalize_language(language)
    prices = fetch_market_prices(commodity)
    latest_field = get_latest_field_data() or {}
    latest_storage = get_latest_storage_data() or {}

    field_live = _is_fresh_real_node(latest_field)
    storage_live = _is_fresh_real_node(latest_storage)

    prices["storage_temperature"] = float(latest_storage.get("temperature", 24.0))
    prices["storage_humidity"] = float(latest_storage.get("humidity", 60.0))
    spoilage_risk = spoilage_predictor.predict(
        float(latest_storage.get("temperature", 24.0)),
        float(latest_storage.get("humidity", 60.0)),
        int(latest_storage.get("days_in_storage", 0)),
    )

    lifecycle_payload = build_recommendation_payload(
        latest_field,
        latest_storage,
        None,
        spoilage_predictor,
        lang,
        include_disease_context=False,
    )

    sell_prediction = sell_timing_prediction(spoilage_risk, prices, commodity)
    return {
        "commodity": commodity,
        "source": prices.get("source", "demo"),
        "records": prices.get("records", []),
        "sell_prediction": sell_prediction,
        "monitoring": {
            "field_snapshot": {
                "temperature": float(latest_field.get("temperature", 28.0)),
                "humidity": float(latest_field.get("humidity", 65.0)),
                "soil_moisture": float(latest_field.get("soil_moisture", 45.0)),
                "rain_detected": int(latest_field.get("rain_detected", 0)),
                "days_since_planting": int(latest_field.get("days_since_planting", 0)),
                "source": "live" if field_live else "demo",
            },
            "storage_snapshot": {
                "temperature": float(latest_storage.get("temperature", 24.0)),
                "humidity": float(latest_storage.get("humidity", 60.0)),
                "days_in_storage": int(latest_storage.get("days_in_storage", 0)),
                "source": "live" if storage_live else "demo",
            },
            "lifecycle": {
                "crop_stage": lifecycle_payload.get("crop_stage", "--"),
                "crop_stage_tip": lifecycle_payload.get("crop_stage_tip", ""),
                "crop_stage_actions": lifecycle_payload.get("crop_stage_actions", []),
                "risk_level": lifecycle_payload.get("risk_level", "Low"),
                "recommendation": lifecycle_payload.get("recommendation", ""),
            },
        },
        "note": prices.get("note", ""),
    }


@app.get("/home-data")
def home_data(language: str = Query("en"), location: str = Query("default")) -> Dict:
    lang = normalize_language(language)
    payload = _latest_state_payload(lang, "Rice")
    latest_storage = get_latest_storage_data() or {}
    spoilage_risk = spoilage_predictor.predict(
        float(latest_storage.get("temperature", 24.0)),
        float(latest_storage.get("humidity", 60.0)),
        int(latest_storage.get("days_in_storage", 0)),
    )

    # Get market location
    market_location = get_market_location(location)

    commodities = ["Rice", "Onion", "Tomato", "Potato", "Cabbage"]
    daily_prices: List[Dict] = []
    for commodity in commodities:
        prices = fetch_market_prices(commodity)
        records = prices.get("records", []) or []
        prediction = sell_timing_prediction(spoilage_risk, prices, commodity)
        latest_price = records[-1].get("price") if records else None
        latest_date = records[-1].get("date") if records else None
        
        # Get tomorrow's predicted price
        tomorrow_prediction = predict_tomorrow_price(records, commodity)
        
        # Get unit info
        unit_info = get_commodity_unit(commodity)
        
        daily_prices.append(
            {
                "commodity": commodity,
                "date": latest_date,
                "price": latest_price,
                "unit": unit_info["unit"],
                "unit_display": unit_info["display"],
                "unit_kg": unit_info["unit_kg"],
                "trend": prediction.get("trend", "stable"),
                "source": prices.get("source", "demo"),
                "tomorrow": {
                    "predicted_price": tomorrow_prediction.get("predicted_price"),
                    "change_pct": tomorrow_prediction.get("change_pct", 0),
                    "confidence": tomorrow_prediction.get("confidence", "low"),
                    "date": tomorrow_prediction.get("date"),
                    "trend_direction": tomorrow_prediction.get("trend_direction", "stable"),
                },
            }
        )

    return {
        "app_name": "KisanVision 360",
        "lifecycle": {
            "risk_level": payload.get("risk_scores", {}).get("risk_level", "--"),
            "crop_stage": payload.get("lifecycle", {}).get("crop_stage", "--"),
            "crop_stage_tip": payload.get("lifecycle", {}).get("crop_stage_tip", "--"),
            "days_since_planting": payload.get("lifecycle", {}).get("days_since_planting", 0),
            "field": payload.get("field_data") or {},
            "node_status": payload.get("node_status") or {},
            "recommendation": payload.get("recommendation", "--"),
        },
        "market": {
            "location": market_location,
            "selected_location": location,
            "available_locations": get_available_locations(),
            "daily_prices": daily_prices,
        },
    }


@app.get("/presentation-status")
def presentation_status(commodity: str = Query("Rice")) -> Dict:
    mode = "ONLINE_ENHANCED" if os.getenv("ENABLE_ONLINE_ADVISORY", "false").lower() == "true" else "LOCAL_ONLY"
    latest_field = get_latest_field_data() or {}
    latest_storage = get_latest_storage_data() or {}
    market = fetch_market_prices(commodity)

    field_state = _freshness(latest_field.get("created_at"))
    storage_state = _freshness(latest_storage.get("created_at"))

    return {
        "status": "ok",
        "mode": mode,
        "commodity": commodity,
        "field_node": field_state,
        "storage_node": storage_state,
        "market_source": market.get("source", "demo"),
        "market_note": market.get("note", ""),
        "ready_for_demo": bool(field_state["connected"]),
    }


@app.exception_handler(Exception)
async def handle_exception(_, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc)})
