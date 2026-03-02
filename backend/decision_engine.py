import os
import socket
from typing import Dict, Optional

from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
except Exception:
    Groq = None

try:
    import joblib
except Exception:
    joblib = None


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
}

TREATMENT_BY_LANG = {
    "en": {
        # "Healthy": "Keep the crop as it is and continue normal irrigation and weekly scouting.",
        "Bacterial Leaf Blight": "Remove badly infected leaves and avoid heavy nitrogen for the next few days.",
        "Brown Spot": "Use balanced fertilizer and spray a recommended fungicide if spread increases.",
        "Hispa": "Use light traps and approved insect control if leaf damage keeps increasing.",
        "Leaf Blast": "Reduce leaf wetness, avoid excess nitrogen, and apply preventive fungicide quickly.",
    },
    "hi": {
        "Healthy": "फसल स्वस्थ है। सामान्य सिंचाई करें और हर हफ्ते खेत की निगरानी करें।",
        "Bacterial Leaf Blight": "ज्यादा संक्रमित पत्तियां हटाएं और कुछ दिनों तक नाइट्रोजन कम दें।",
        "Brown Spot": "संतुलित उर्वरक दें और फैलाव बढ़ने पर अनुशंसित फफूंदनाशी का छिड़काव करें।",
        "Hispa": "लाइट ट्रैप का उपयोग करें और नुकसान बढ़ने पर स्वीकृत कीटनाशक लगाएं।",
        "Leaf Blast": "पत्तियों पर नमी कम रखें, अधिक नाइट्रोजन न दें, और जल्दी फफूंदनाशी छिड़काव करें।",
    },
    "te": {
        "Healthy": "పంట ఆరోగ్యంగా ఉంది. సాధారణ నీటిపారుదల కొనసాగించి వారానికి ఒకసారి పర్యవేక్షించండి.",
        "Bacterial Leaf Blight": "బాగా ప్రభావితమైన ఆకులను తొలగించి కొన్ని రోజులు నైట్రోజన్ ఎరువు తగ్గించండి.",
        "Brown Spot": "సమతుల్య ఎరువులు వాడి, వ్యాప్తి పెరిగితే సూచించిన ఫంగిసైడ్ పిచికారీ చేయండి.",
        "Hispa": "లైట్ ట్రాప్స్ ఉపయోగించి, నష్టం పెరిగితే ఆమోదిత పురుగుమందు వాడండి.",
        "Leaf Blast": "ఆకులపై తేమ తగ్గించండి, అధిక నైట్రోజన్ నివారించండి, వెంటనే నివారణ ఫంగిసైడ్ వాడండి.",
    },
}

RISK_ACTION_BY_LANG = {
    "en": {
        "Low": "Risk is low now. Continue monitoring every 2 days.",
        "Medium": "Risk is moderate. Take preventive action within 72 hours.",
        "High": "Risk is high. Take preventive action within 24 to 48 hours.",
    },
    "hi": {
        "Low": "अभी जोखिम कम है। हर 2 दिन में निगरानी जारी रखें।",
        "Medium": "जोखिम मध्यम है। 72 घंटे के भीतर रोकथाम करें।",
        "High": "जोखिम ज्यादा है। 24 से 48 घंटे में तुरंत रोकथाम करें।",
    },
    "te": {
        "Low": "ప్రస్తుతం ప్రమాదం తక్కువగా ఉంది. ప్రతి 2 రోజులకు ఒకసారి పరిశీలించండి.",
        "Medium": "ప్రమాదం మధ్యస్థంగా ఉంది. 72 గంటల్లో నివారణ చర్యలు చేపట్టండి.",
        "High": "ప్రమాదం ఎక్కువగా ఉంది. 24 నుండి 48 గంటల్లో వెంటనే చర్యలు తీసుకోండి.",
    },
}

STORAGE_ACTION_BY_LANG = {
    "en": {
        "Low": "Storage is stable. Check once daily.",
        "Medium": "Improve ventilation and inspect storage two times per day.",
        "High": "High spoilage risk. Sell or process produce within 48 hours.",
    },
    "hi": {
        "Low": "भंडारण स्थिति स्थिर है। दिन में एक बार जांच करें।",
        "Medium": "वेंटिलेशन बढ़ाएं और दिन में दो बार भंडारण जांचें।",
        "High": "सड़न का जोखिम अधिक है। 48 घंटे के भीतर बेचें या प्रोसेस करें।",
    },
    "te": {
        "Low": "నిల్వ పరిస్థితి స్థిరంగా ఉంది. రోజుకు ఒకసారి తనిఖీ చేయండి.",
        "Medium": "గాలి ప్రసరణ పెంచి రోజుకు రెండుసార్లు నిల్వను పరిశీలించండి.",
        "High": "నిల్వ నష్టం ప్రమాదం ఎక్కువ. 48 గంటల్లో అమ్మకం లేదా ప్రాసెసింగ్ చేయండి.",
    },
}

STAGE_NAME_BY_LANG = {
    "en": {
        "germination": "Germination",
        "vegetative": "Vegetative",
        "tillering": "Tillering",
        "flowering": "Flowering",
        "grain_filling": "Grain Filling",
        "maturity": "Maturity",
    },
    "hi": {
        "germination": "अंकुरण",
        "vegetative": "विकास चरण",
        "tillering": "टिलरिंग",
        "flowering": "फूल आने का चरण",
        "grain_filling": "दाना भरना",
        "maturity": "परिपक्वता",
    },
    "te": {
        "germination": "మొలక దశ",
        "vegetative": "వృద్ధి దశ",
        "tillering": "టిల్లరింగ్ దశ",
        "flowering": "పుష్ప దశ",
        "grain_filling": "గింజ నింపే దశ",
        "maturity": "పక్వ దశ",
    },
}

STAGE_TIP_BY_LANG = {
    "en": {
        "germination": "Keep soil lightly moist. Avoid overwatering in this early stage.",
        "vegetative": "Support fast leaf growth with timely irrigation and weed control.",
        "tillering": "Maintain stable moisture to support healthy tiller formation.",
        "flowering": "Avoid water stress now; flowering is highly sensitive.",
        "grain_filling": "Maintain balanced moisture and avoid excess nitrogen.",
        "maturity": "Reduce irrigation and prepare for timely harvest.",
    },
    "hi": {
        "germination": "मिट्टी में हल्की नमी रखें। इस चरण में अधिक सिंचाई न करें।",
        "vegetative": "समय पर सिंचाई और खरपतवार नियंत्रण से पौध वृद्धि बेहतर रखें।",
        "tillering": "टिलर बनने के लिए खेत में नमी स्थिर रखें।",
        "flowering": "इस चरण में पानी की कमी न होने दें; फूल चरण संवेदनशील होता है।",
        "grain_filling": "संतुलित नमी रखें और नाइट्रोजन अधिक न दें।",
        "maturity": "सिंचाई कम करें और समय पर कटाई की तैयारी करें।",
    },
    "te": {
        "germination": "మట్టిలో తేలికపాటి తేమ ఉంచండి. ఈ దశలో అధిక నీరు వద్దు.",
        "vegetative": "సమయానికి నీరు, కలుపు నియంత్రణతో వృద్ధి మెరుగుపరచండి.",
        "tillering": "టిల్లర్లు బాగా రావడానికి తేమ స్థిరంగా ఉంచండి.",
        "flowering": "ఈ దశలో నీటి ఒత్తిడి రాకుండా చూడండి; పుష్ప దశ సున్నితమైనది.",
        "grain_filling": "సమతుల తేమ ఉంచి, అధిక నైట్రోజన్ నివారించండి.",
        "maturity": "నీటిపారుదల తగ్గించి, సమయానికి కోతకు సిద్ధం అవండి.",
    },
}


def normalize_language(language: Optional[str]) -> str:
    raw = (language or "en").strip().lower()
    if raw.startswith("hi"):
        return "hi"
    if raw.startswith("te"):
        return "te"
    return "en"


def _internet_available(timeout: float = 1.5) -> bool:
    try:
        with socket.create_connection(("8.8.8.8", 53), timeout=timeout):
            return True
    except OSError:
        return False


class SpoilagePredictor:
    def __init__(self, model_path: str) -> None:
        self.model = None
        self.available = False
        if joblib and os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                self.available = True
            except Exception:
                self.model = None
                self.available = False

    def predict(self, temperature: float, humidity: float, days_in_storage: int) -> str:
        if self.available and self.model is not None:
            output = self.model.predict([[temperature, humidity, days_in_storage]])[0]
            return str(output)

        score = 0
        if temperature >= 28:
            score += 1
        if humidity >= 70:
            score += 1
        if days_in_storage >= 5:
            score += 1

        if score <= 1:
            return "Low"
        if score == 2:
            return "Medium"
        return "High"


def environmental_risk_score(temperature: float, humidity: float, soil_moisture: float, rain_detected: int) -> int:
    score = 30

    if temperature >= 32:
        score += 20
    elif temperature >= 28:
        score += 10

    if humidity >= 80:
        score += 25
    elif humidity >= 70:
        score += 15

    if soil_moisture >= 70:
        score += 10
    elif soil_moisture < 25:
        score += 10

    if rain_detected:
        score += 10

    return max(0, min(100, score))


def harvest_readiness(days_since_planting: int, disease: Optional[str] = None) -> int:
    base = min(100, int((days_since_planting / 120) * 100))

    if disease and disease in {"Leaf Blast", "Bacterial Leaf Blight", "Brown Spot"}:
        base += 5

    return max(0, min(100, base))


def risk_level_from_score(score: int) -> str:
    if score >= 75:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def crop_stage_key(days_since_planting: int) -> str:
    day = max(0, int(days_since_planting or 0))
    if day <= 14:
        return "germination"
    if day <= 35:
        return "vegetative"
    if day <= 60:
        return "tillering"
    if day <= 85:
        return "flowering"
    if day <= 110:
        return "grain_filling"
    return "maturity"


def stage_actions(
    days_since_planting: int,
    temperature: float,
    humidity: float,
    soil_moisture: float,
    rain_detected: int,
    language: str = "en",
) -> Dict:
    lang = normalize_language(language)
    stage_key = crop_stage_key(days_since_planting)

    base_actions = {
        "germination": {
            "en": "Give light irrigation if topsoil starts drying.",
            "hi": "ऊपरी मिट्टी सूखने लगे तो हल्की सिंचाई करें।",
            "te": "పై మట్టి ఎండిపోతే తేలికగా నీరు ఇవ్వండి.",
        },
        "vegetative": {
            "en": "Control weeds and keep regular irrigation intervals.",
            "hi": "खरपतवार नियंत्रण करें और नियमित अंतराल पर सिंचाई रखें।",
            "te": "కలుపు నియంత్రణ చేసి నియమిత నీటిపారుదల కొనసాగించండి.",
        },
        "tillering": {
            "en": "Keep moisture stable to improve tiller development.",
            "hi": "टिलर विकास के लिए खेत की नमी स्थिर रखें।",
            "te": "టిల్లర్ అభివృద్ధి కోసం తేమ స్థిరంగా ఉంచండి.",
        },
        "flowering": {
            "en": "Do not allow water stress during flowering.",
            "hi": "फूल आने के समय पानी की कमी न होने दें।",
            "te": "పుష్ప దశలో నీటి కొరత రాకుండా చూడండి.",
        },
        "grain_filling": {
            "en": "Maintain balanced moisture and avoid excess nitrogen now.",
            "hi": "दाना भरने के समय संतुलित नमी रखें और अधिक नाइट्रोजन न दें।",
            "te": "గింజ నింపే దశలో తేమ సమతుల్యం ఉంచి అధిక నైట్రోజన్ నివారించండి.",
        },
        "maturity": {
            "en": "Reduce irrigation and prepare for harvest window.",
            "hi": "सिंचाई कम करें और कटाई की तैयारी करें।",
            "te": "నీరు తగ్గించి కోతకు సిద్ధం అవ్వండి.",
        },
    }

    actions = [base_actions[stage_key][lang]]

    if soil_moisture < 35 and int(rain_detected or 0) == 0:
        actions.append(
            {
                "en": "Soil is dry: give irrigation today.",
                "hi": "मिट्टी सूखी है: आज सिंचाई करें।",
                "te": "మట్టి పొడిగా ఉంది: ఈరోజే నీరు ఇవ్వండి.",
            }[lang]
        )

    if soil_moisture > 80 or (int(rain_detected or 0) == 1 and humidity > 85):
        actions.append(
            {
                "en": "Field is too wet: improve drainage and watch fungal symptoms.",
                "hi": "खेत में ज्यादा नमी है: जल निकासी सुधारें और फफूंद लक्षण देखें।",
                "te": "పొలం చాలా తడి ఉంది: నీరు బయటకు పోయేలా చేసి ఫంగస్ లక్షణాలు గమనించండి.",
            }[lang]
        )

    if temperature >= 34:
        actions.append(
            {
                "en": "High temperature: irrigate in early morning/evening.",
                "hi": "उच्च तापमान: सुबह जल्दी या शाम में सिंचाई करें।",
                "te": "ఉష్ణోగ్రత ఎక్కువగా ఉంది: తెల్లవారు జాము లేదా సాయంత్రం నీరు ఇవ్వండి.",
            }[lang]
        )

    if humidity >= 85:
        actions.append(
            {
                "en": "High humidity: increase field airflow and monitor leaf disease.",
                "hi": "आर्द्रता अधिक है: खेत में वायु प्रवाह बढ़ाएं और पत्तियों की बीमारी देखें।",
                "te": "తేమ ఎక్కువగా ఉంది: గాలి ప్రసరణ పెంచి ఆకుల వ్యాధి గమనించండి.",
            }[lang]
        )

    return {
        "stage_key": stage_key,
        "stage_name": STAGE_NAME_BY_LANG[lang][stage_key],
        "stage_tip": STAGE_TIP_BY_LANG[lang][stage_key],
        "actions": actions,
    }


def _local_advisory(
    disease: str,
    risk_level: str,
    harvest_ready: int,
    spoilage_risk: str,
    language: str = "en",
) -> str:
    lang = normalize_language(language)

    treatment = TREATMENT_BY_LANG[lang].get(
        disease,
        {
            "en": "Apply standard crop protection and continue monitoring.",
            "hi": "सामान्य फसल सुरक्षा उपाय अपनाएं और निगरानी जारी रखें।",
            "te": "సాధారణ పంట రక్షణ చర్యలు పాటిస్తూ పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    storage_action = STORAGE_ACTION_BY_LANG[lang].get(
        spoilage_risk,
        {
            "en": "Monitor storage closely.",
            "hi": "भंडारण की निगरानी बढ़ाएं।",
            "te": "నిల్వపై కచ్చితమైన పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    risk_action = RISK_ACTION_BY_LANG[lang].get(
        risk_level,
        {
            "en": "Continue monitoring.",
            "hi": "निगरानी जारी रखें।",
            "te": "పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    if lang == "hi":
        return (
            f"अभी क्या करें:\n"
            f"1) {treatment}\n"
            f"2) {risk_action}\n"
            f"3) कटाई तैयारी: {harvest_ready}%\n"
            f"4) भंडारण सलाह: {storage_action}"
        )

    if lang == "te":
        return (
            f"ఇప్పుడు చేయాల్సింది:\n"
            f"1) {treatment}\n"
            f"2) {risk_action}\n"
            f"3) కోత సిద్ధత: {harvest_ready}%\n"
            f"4) నిల్వ సలహా: {storage_action}"
        )

    return (
        f"What to do next:\n"
        f"1) {treatment}\n"
        f"2) {risk_action}\n"
        f"3) Harvest readiness: {harvest_ready}%\n"
        f"4) Storage advice: {storage_action}"
    )


def advisory_message(
    disease: str,
    risk_level: str,
    harvest_ready: int,
    spoilage_risk: str,
    language: str = "en",
) -> str:
    lang = normalize_language(language)
    local_message = _local_advisory(disease, risk_level, harvest_ready, spoilage_risk, lang)

    online_enabled = os.getenv("ENABLE_ONLINE_ADVISORY", "false").lower() == "true"
    api_key = os.getenv("GROQ_API_KEY")

    if not online_enabled or not api_key or Groq is None or not _internet_available():
        return local_message

    try:
        client = Groq(api_key=api_key)
        prompt = (
            f"Rewrite this farmer advisory in {LANGUAGE_NAMES[lang]} for a farmer in simple actionable language. "
            "Keep it under 80 words and use 3-4 short numbered steps. "
            f"Advisory: {local_message}"
        )
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.2,
        )
        content = completion.choices[0].message.content
        return content.strip() if content else local_message
    except Exception:
        return local_message


def _local_disease_only_advisory(
    disease: str,
    risk_level: str,
    language: str = "en",
) -> str:
    lang = normalize_language(language)

    treatment = TREATMENT_BY_LANG[lang].get(
        disease,
        {
            "en": "Apply standard crop protection and continue monitoring.",
            "hi": "सामान्य फसल सुरक्षा उपाय अपनाएं और निगरानी जारी रखें।",
            "te": "సాధారణ పంట రక్షణ చర్యలు పాటిస్తూ పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    risk_action = RISK_ACTION_BY_LANG[lang].get(
        risk_level,
        {
            "en": "Continue monitoring.",
            "hi": "निगरानी जारी रखें।",
            "te": "పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    follow_up = {
        "en": "Recheck field and leaves again in 48 hours.",
        "hi": "48 घंटे बाद खेत और पत्तियों की दोबारा जांच करें।",
        "te": "48 గంటల తర్వాత పొలం మరియు ఆకులను మళ్లీ పరిశీలించండి.",
    }[lang]

    if lang == "hi":
        return (
            f"अभी क्या करें:\n"
            f"1) {treatment}\n"
            f"2) {risk_action}\n"
            f"3) {follow_up}"
        )

    if lang == "te":
        return (
            f"ఇప్పుడు చేయాల్సింది:\n"
            f"1) {treatment}\n"
            f"2) {risk_action}\n"
            f"3) {follow_up}"
        )

    return (
        f"What to do next:\n"
        f"1) {treatment}\n"
        f"2) {risk_action}\n"
        f"3) {follow_up}"
    )


def disease_advisory_message(
    disease: str,
    risk_level: str,
    language: str = "en",
) -> str:
    lang = normalize_language(language)
    local_message = _local_disease_only_advisory(disease, risk_level, lang)

    online_enabled = os.getenv("ENABLE_ONLINE_ADVISORY", "false").lower() == "true"
    api_key = os.getenv("GROQ_API_KEY")

    if not online_enabled or not api_key or Groq is None or not _internet_available():
        return local_message

    try:
        client = Groq(api_key=api_key)
        prompt = (
            f"Rewrite this disease-only farmer advisory in {LANGUAGE_NAMES[lang]} using very simple language. "
            "Keep it under 70 words with exactly 3 short numbered steps. "
            "Do not mention storage or harvest readiness. "
            f"Advisory: {local_message}"
        )
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.2,
        )
        content = completion.choices[0].message.content
        return content.strip() if content else local_message
    except Exception:
        return local_message


def _local_sensor_advisory(
    risk_level: str,
    harvest_ready: int,
    spoilage_risk: str,
    stage_name: str,
    stage_tip: str,
    stage_actions: list[str],
    language: str = "en",
) -> str:
    lang = normalize_language(language)

    risk_action = RISK_ACTION_BY_LANG[lang].get(
        risk_level,
        {
            "en": "Continue monitoring.",
            "hi": "निगरानी जारी रखें।",
            "te": "పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    storage_action = STORAGE_ACTION_BY_LANG[lang].get(
        spoilage_risk,
        {
            "en": "Monitor storage closely.",
            "hi": "भंडारण की निगरानी बढ़ाएं।",
            "te": "నిల్వపై కచ్చితమైన పర్యవేక్షణ కొనసాగించండి.",
        }[lang],
    )

    top_action = stage_actions[0] if stage_actions else (
        {
            "en": "Maintain regular field checks.",
            "hi": "खेत की नियमित निगरानी करें।",
            "te": "పొలాన్ని నియమితంగా పరిశీలించండి.",
        }[lang]
    )

    if lang == "hi":
        return (
            f"लाइफसाइकिल सलाह:\n"
            f"1) वर्तमान चरण: {stage_name}. {stage_tip}\n"
            f"2) अभी कार्रवाई: {top_action}\n"
            f"3) पर्यावरणीय जोखिम: {risk_action}\n"
            f"4) कटाई तैयारी: {harvest_ready}% | भंडारण: {storage_action}"
        )

    if lang == "te":
        return (
            f"లైఫ్‌సైకిల్ సలహా:\n"
            f"1) ప్రస్తుత దశ: {stage_name}. {stage_tip}\n"
            f"2) తక్షణ చర్య: {top_action}\n"
            f"3) పర్యావరణ ప్రమాదం: {risk_action}\n"
            f"4) కోత సిద్ధత: {harvest_ready}% | నిల్వ: {storage_action}"
        )

    return (
        f"Lifecycle recommendation:\n"
        f"1) Current stage: {stage_name}. {stage_tip}\n"
        f"2) Immediate action: {top_action}\n"
        f"3) Environmental risk: {risk_action}\n"
        f"4) Harvest readiness: {harvest_ready}% | Storage: {storage_action}"
    )


def sensor_advisory_message(
    risk_level: str,
    harvest_ready: int,
    spoilage_risk: str,
    stage_name: str,
    stage_tip: str,
    stage_actions: list[str],
    language: str = "en",
) -> str:
    lang = normalize_language(language)
    local_message = _local_sensor_advisory(
        risk_level,
        harvest_ready,
        spoilage_risk,
        stage_name,
        stage_tip,
        stage_actions,
        lang,
    )

    online_enabled = os.getenv("ENABLE_ONLINE_ADVISORY", "false").lower() == "true"
    api_key = os.getenv("GROQ_API_KEY")

    if not online_enabled or not api_key or Groq is None or not _internet_available():
        return local_message

    try:
        client = Groq(api_key=api_key)
        prompt = (
            f"Rewrite this sensor-based farmer advisory in {LANGUAGE_NAMES[lang]} using very simple language. "
            "Keep it under 80 words and keep exactly 4 short numbered steps. "
            f"Advisory: {local_message}"
        )
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            temperature=0.2,
        )
        content = completion.choices[0].message.content
        return content.strip() if content else local_message
    except Exception:
        return local_message


def build_recommendation_payload(
    field: Optional[Dict],
    storage: Optional[Dict],
    disease: Optional[Dict],
    spoilage_predictor: SpoilagePredictor,
    language: str = "en",
    include_disease_context: bool = True,
    disease_only_advisory: bool = False,
) -> Dict:
    field = field or {}
    storage = storage or {}
    disease_name = (disease or {}).get("disease", "Healthy")

    env_score = environmental_risk_score(
        float(field.get("temperature", 28.0)),
        float(field.get("humidity", 65.0)),
        float(field.get("soil_moisture", 45.0)),
        int(field.get("rain_detected", 0)),
    )
    risk_level = risk_level_from_score(env_score)

    harvest_ready = harvest_readiness(
        int(field.get("days_since_planting", 0)),
        disease_name if include_disease_context else None,
    )

    spoilage_risk = spoilage_predictor.predict(
        float(storage.get("temperature", 24.0)),
        float(storage.get("humidity", 60.0)),
        int(storage.get("days_in_storage", 0)),
    )

    stage_payload = stage_actions(
        int(field.get("days_since_planting", 0)),
        float(field.get("temperature", 28.0)),
        float(field.get("humidity", 65.0)),
        float(field.get("soil_moisture", 45.0)),
        int(field.get("rain_detected", 0)),
        language,
    )

    if include_disease_context:
        if disease_only_advisory:
            recommendation = disease_advisory_message(
                disease_name,
                risk_level,
                language,
            )
        else:
            recommendation = advisory_message(
                disease_name,
                risk_level,
                harvest_ready,
                spoilage_risk,
                language,
            )
    else:
        recommendation = sensor_advisory_message(
            risk_level,
            harvest_ready,
            spoilage_risk,
            stage_payload["stage_name"],
            stage_payload["stage_tip"],
            stage_payload["actions"],
            language,
        )

    return {
        "language": normalize_language(language),
        "risk_level": risk_level,
        "harvest_readiness": harvest_ready,
        "spoilage_risk": spoilage_risk,
        "environmental_risk_score": env_score,
        "crop_stage": stage_payload["stage_name"],
        "crop_stage_tip": stage_payload["stage_tip"],
        "crop_stage_actions": stage_payload["actions"],
        "recommendation": recommendation,
    }
