import os
from dotenv import load_dotenv
import pathlib
env_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)
from datetime import datetime, timedelta
from typing import Dict, List

import requests


# Default market locations in India
MARKET_LOCATIONS = {
    "default": {"state": "Andhra Pradesh", "market": "Vizianagaram", "district": "Vizianagaram"},
    "vizianagaram": {"state": "Andhra Pradesh", "market": "Vizianagaram", "district": "Vizianagaram"},
    "visakhapatnam": {"state": "Andhra Pradesh", "market": "Visakhapatnam", "district": "Visakhapatnam"},
    "guntur": {"state": "Andhra Pradesh", "market": "Guntur", "district": "Guntur"},
    "vijayawada": {"state": "Andhra Pradesh", "market": "Vijayawada", "district": "Krishna"},
    "warangal": {"state": "Telangana", "market": "Warangal", "district": "Warangal"},
    "hyderabad": {"state": "Telangana", "market": "Hyderabad", "district": "Hyderabad"},
    "pune": {"state": "Maharashtra", "market": "Pune", "district": "Pune"},
    "bangalore": {"state": "Karnataka", "market": "Bangalore", "district": "Bangalore"},
    "chennai": {"state": "Tamil Nadu", "market": "Chennai", "district": "Chennai"},
}

# List of available locations for UI dropdown
AVAILABLE_LOCATIONS = [
    {"key": "vizianagaram", "label": "Vizianagaram, AP"},
    {"key": "visakhapatnam", "label": "Visakhapatnam, AP"},
    {"key": "guntur", "label": "Guntur, AP"},
    {"key": "vijayawada", "label": "Vijayawada, AP"},
    {"key": "warangal", "label": "Warangal, TS"},
    {"key": "hyderabad", "label": "Hyderabad, TS"},
    {"key": "pune", "label": "Pune, MH"},
    {"key": "bangalore", "label": "Bangalore, KA"},
    {"key": "chennai", "label": "Chennai, TN"},
]

def get_available_locations():
    """Get list of available market locations for UI."""
    return AVAILABLE_LOCATIONS

# Price units for each commodity (Indian mandi standard)
COMMODITY_UNITS = {
    "Rice": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Wheat": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Maize": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Onion": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Potato": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Tomato": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Cabbage": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Carrot": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Beetroot": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Green Chilli": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
    "Banana": {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"},
}

def get_commodity_unit(commodity: str) -> Dict:
    """Get price unit info for a commodity."""
    return COMMODITY_UNITS.get(commodity, {"unit": "quintal", "unit_kg": 100, "display": "per Quintal (100 kg)"})

DEMO_PRICE_BY_COMMODITY = {
    "Rice": [3750, 4000, 4200, 4500, 4700, 4900, 5000],
    "Wheat": [2260, 2275, 2282, 2290, 2288, 2305, 2312],
    "Maize": [2010, 2022, 2035, 2028, 2040, 2055, 2062],
    "Onion": [1650, 1700, 1755, 1820, 1880, 1940, 1985],
    "Potato": [1420, 1445, 1470, 1490, 1510, 1525, 1540],
    "Tomato": [1200, 1280, 1350, 1420, 1380, 1460, 1525],
    "Cabbage": [980, 1020, 1065, 1040, 1080, 1110, 1145],
    "Carrot": [1720, 1750, 1790, 1815, 1840, 1860, 1885],
    "Beetroot": [1480, 1495, 1510, 1530, 1545, 1565, 1580],
    "Green Chilli": [2480, 2520, 2580, 2610, 2590, 2650, 2715],
    "Banana": [1860, 1885, 1905, 1930, 1940, 1960, 1985],
}

PERISHABLE_COLD_STORAGE_COMMODITIES = {
    "Onion",
    "Potato",
    "Tomato",
    "Cabbage",
    "Carrot",
    "Beetroot",
    "Green Chilli",
    "Banana",
}

STORAGE_PROFILE = {
    "Rice": {"temp": (12, 18), "humidity": (55, 65)},
    "Wheat": {"temp": (10, 18), "humidity": (55, 65)},
    "Maize": {"temp": (10, 18), "humidity": (55, 65)},
    "Onion": {"temp": (0, 4), "humidity": (65, 75)},
    "Potato": {"temp": (4, 8), "humidity": (85, 95)},
    "Tomato": {"temp": (10, 13), "humidity": (85, 95)},
    "Cabbage": {"temp": (0, 2), "humidity": (90, 95)},
    "Carrot": {"temp": (0, 2), "humidity": (90, 95)},
    "Beetroot": {"temp": (0, 2), "humidity": (90, 95)},
    "Green Chilli": {"temp": (7, 10), "humidity": (90, 95)},
    "Banana": {"temp": (13, 15), "humidity": (85, 90)},
}


def _demo_prices(commodity: str = "Rice") -> List[Dict]:
    series = DEMO_PRICE_BY_COMMODITY.get(commodity, DEMO_PRICE_BY_COMMODITY["Rice"])
    dates = [
        "2026-02-20",
        "2026-02-21",
        "2026-02-22",
        "2026-02-23",
        "2026-02-24",
        "2026-02-25",
        "2026-02-26",
    ]
    return [
        {"date": dates[index], "price": float(price)}
        for index, price in enumerate(series)
    ]


def fetch_market_prices(commodity: str = "Rice", state: str = None, market: str = None) -> Dict:
    # ...existing code...
    api_key = os.getenv("DATA_GOV_API_KEY", "")
    resource_id = os.getenv("DATA_GOV_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")
    limit = int(os.getenv("DATA_GOV_LIMIT", "14"))
    print("[DEBUG] api_key:", api_key)
    print("[DEBUG] resource_id:", resource_id)
    print("[DEBUG] limit:", limit)

    if not api_key:
        prices = _demo_prices(commodity)
        return {
            "source": "demo",
            "commodity": commodity,
            "records": prices,
            "note": "Set DATA_GOV_API_KEY for live mandi prices.",
        }

    url = f"https://api.data.gov.in/resource/{resource_id}"
    params = {
        "api-key": api_key,
        "format": "json",
        "limit": limit,
        "filters[commodity]": commodity,
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, params=params, timeout=8, headers=headers)
        print("[DEBUG] response.status_code:", response.status_code)
        print("[DEBUG] response.text (first 500 chars):", response.text[:500])
        if response.status_code >= 400:
            try:
                error_payload = response.json()
                error_message = error_payload.get("error") or error_payload.get("message") or response.text[:120]
            except Exception:
                error_message = response.text[:120]
            prices = _demo_prices(commodity)
            return {
                "source": "demo",
                "commodity": commodity,
                "records": prices,
                "note": f"Live API rejected request ({response.status_code}): {error_message}",
            }

        data = response.json()
        records = data.get("records", [])
        print("[DEBUG] records field:", records)

        normalized = []
        for item in records:
            # Handle both lowercase and capitalized keys
            raw_price = (
                item.get("modal_price") or item.get("Modal_Price") or
                item.get("max_price") or item.get("Max_Price") or
                item.get("min_price") or item.get("Min_Price")
            )
            if raw_price is None:
                continue
            try:
                price = float(str(raw_price).replace(",", "").strip())
            except ValueError:
                continue

            raw_date = (
                item.get("arrival_date") or item.get("Arrival_Date") or
                item.get("timestamp") or item.get("Timestamp") or ""
            )
            if raw_date:
                try:
                    # Try DD/MM/YYYY format first
                    if "/" in raw_date:
                        date = datetime.strptime(raw_date, "%d/%m/%Y").date().isoformat()
                    else:
                        parsed = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        date = parsed.date().isoformat()
                except Exception:
                    date = raw_date
            else:
                date = "unknown"

            normalized.append({"date": date, "price": price})

        if not normalized:
            prices = _demo_prices(commodity)
            return {
                "source": "demo",
                "commodity": commodity,
                "records": prices,
                "note": "Live API returned no usable records. Using demo fallback.",
            }

        normalized.sort(key=lambda row: row["date"])
        return {"source": "data.gov.in", "commodity": commodity, "records": normalized[-7:]}

    except Exception as exc:
        prices = _demo_prices(commodity)
        return {
            "source": "demo",
            "commodity": commodity,
            "records": prices,
            "note": f"Live API request failed ({type(exc).__name__}). Using offline demo prices.",
        }


def _trend_signal(records: List[Dict]) -> str:
    if len(records) < 2:
        return "flat"

    first = records[0]["price"]
    last = records[-1]["price"]
    change_pct = ((last - first) / first) * 100 if first else 0.0

    if change_pct >= 2.0:
        return "rising"
    if change_pct <= -2.0:
        return "falling"
    return "flat"


def predict_tomorrow_price(records: List[Dict], commodity: str = "Rice") -> Dict:
    """Predict tomorrow's price based on recent trend analysis."""
    if not records or len(records) < 2:
        return {"predicted_price": None, "confidence": "low", "change_pct": 0.0}
    
    # Get recent prices (last 7 days)
    recent = records[-7:] if len(records) >= 7 else records
    prices = [r["price"] for r in recent]
    
    # Calculate average daily change
    daily_changes = []
    for i in range(1, len(prices)):
        daily_changes.append(prices[i] - prices[i-1])
    
    if not daily_changes:
        return {"predicted_price": prices[-1], "confidence": "low", "change_pct": 0.0}
    
    avg_change = sum(daily_changes) / len(daily_changes)
    
    # Calculate weighted moving average (more recent days weighted higher)
    weights = list(range(1, len(prices) + 1))
    weighted_avg = sum(p * w for p, w in zip(prices, weights)) / sum(weights)
    
    # Predict tomorrow's price
    current_price = prices[-1]
    
    # Use trend momentum + weighted average
    momentum_prediction = current_price + avg_change
    trend_factor = 0.7  # 70% momentum, 30% mean reversion
    predicted_price = (momentum_prediction * trend_factor) + (weighted_avg * (1 - trend_factor))
    
    # Round to nearest integer for commodity prices
    predicted_price = round(predicted_price)
    
    # Calculate change percentage
    change_pct = ((predicted_price - current_price) / current_price) * 100 if current_price else 0.0
    
    # Determine confidence based on trend consistency
    trend_consistent = all(c >= 0 for c in daily_changes) or all(c <= 0 for c in daily_changes)
    if trend_consistent and len(recent) >= 5:
        confidence = "high"
    elif len(recent) >= 3:
        confidence = "medium"
    else:
        confidence = "low"
    
    # Calculate tomorrow's date
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    return {
        "predicted_price": predicted_price,
        "current_price": current_price,
        "change_pct": round(change_pct, 1),
        "confidence": confidence,
        "date": tomorrow,
        "trend_direction": "rising" if change_pct > 0.5 else ("falling" if change_pct < -0.5 else "stable"),
    }


def get_market_location(location_key: str = "default") -> Dict:
    """Get market location details."""
    loc = MARKET_LOCATIONS.get(location_key.lower(), MARKET_LOCATIONS["default"])
    return {
        "state": loc["state"],
        "market": loc["market"],
        "district": loc["district"],
        "country": "India",
        "source_type": "Mandi Prices",
    }


def cold_storage_suitability(
    commodity: str,
    temperature: float,
    humidity: float,
    spoilage_risk: str,
) -> Dict:
    profile = STORAGE_PROFILE.get(commodity, STORAGE_PROFILE["Rice"])
    temp_min, temp_max = profile["temp"]
    hum_min, hum_max = profile["humidity"]

    score = 100

    if temperature < temp_min:
        score -= min(35, int((temp_min - temperature) * 4))
    elif temperature > temp_max:
        score -= min(35, int((temperature - temp_max) * 4))

    if humidity < hum_min:
        score -= min(30, int((hum_min - humidity) * 2))
    elif humidity > hum_max:
        score -= min(30, int((humidity - hum_max) * 2))

    risk_penalty = {"Low": 0, "Medium": 8, "High": 16}.get(spoilage_risk, 0)
    score -= risk_penalty
    score = max(0, min(100, score))

    if score >= 80:
        level = "Good"
        guidance = "Storage settings are suitable for this commodity."
    elif score >= 60:
        level = "Moderate"
        guidance = "Storage is acceptable but needs correction in temperature/humidity."
    else:
        level = "Poor"
        guidance = "Storage conditions are not suitable. Sell quickly or adjust cold room settings immediately."

    return {
        "score": score,
        "level": level,
        "ideal_temp": f"{temp_min}-{temp_max} °C",
        "ideal_humidity": f"{hum_min}-{hum_max} %",
        "guidance": guidance,
    }


def sell_timing_prediction(spoilage_risk: str, market_prices: Dict, commodity: str = "Rice") -> Dict:
    records = market_prices.get("records", [])
    trend = _trend_signal(records)
    current_price = records[-1]["price"] if records else None

    spoilage = (spoilage_risk or "Low").strip().title()

    is_perishable = commodity in PERISHABLE_COLD_STORAGE_COMMODITIES
    storage_temp = float(market_prices.get("storage_temperature", 24.0))
    storage_humidity = float(market_prices.get("storage_humidity", 60.0))
    suitability = cold_storage_suitability(commodity, storage_temp, storage_humidity, spoilage)

    if spoilage == "High":
        decision = "Sell within 24-48 hours"
        reason = "Spoilage risk is high, so protecting produce quality is more important than waiting for higher prices."
    elif spoilage == "Medium":
        if trend == "rising" and not is_perishable:
            decision = "Hold for 1-2 days, then sell"
            reason = "Prices are rising and spoilage risk is moderate, so a short hold can improve returns."
        elif trend == "rising" and is_perishable:
            decision = "Sell within 24-48 hours"
            reason = "This commodity is highly perishable in cold storage; avoid quality drop even if prices are rising."
        else:
            decision = "Sell within 2-3 days"
            reason = "Moderate spoilage risk with non-rising prices favors near-term sale."
    else:
        if trend == "rising" and not is_perishable:
            decision = "Hold for up to 3 days and monitor"
            reason = "Low spoilage risk and rising prices support short-term holding for better profit."
        elif trend == "rising" and is_perishable:
            decision = "Hold for up to 1 day and monitor"
            reason = "Perishable commodity: keep holding period short to balance quality and better price."
        elif trend == "falling":
            decision = "Sell within 24-48 hours"
            reason = "Low spoilage risk but falling prices suggest selling soon to avoid lower returns."
        else:
            decision = "Sell in 2-4 days"
            reason = "Stable prices and low spoilage risk allow flexible selling over the next few days."

    return {
        "current_price": current_price,
        "trend": trend,
        "spoilage_risk": spoilage,
        "commodity": commodity,
        "decision": decision,
        "reason": reason,
        "cold_storage_suitability": suitability,
        "source": market_prices.get("source", "demo"),
        "records": records,
    }