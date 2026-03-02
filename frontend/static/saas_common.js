(() => {
  const THEME_KEY = 'kv360-theme';
  const LANG_KEY = 'kv360-language';

  // ========== Translations ==========
  const TRANSLATIONS = {
    en: {
      // Header
      'nav.home': 'Home',
      'nav.disease': 'Disease',
      'nav.lifecycle': 'Lifecycle',
      'nav.postharvest': 'Post‑Harvest',
      'backend.checking': 'Checking',
      'backend.online': 'Backend online',
      'backend.offline': 'Backend offline',
      'backend.local': 'Local mode',
      // Home Page
      'home.welcome': 'Welcome to KisanVision 360',
      'home.subtitle': "Today's farm status, what to do now, and market prices in one screen.",
      'home.lastUpdated': 'Last updated:',
      // Farm Section
      'farm.title': 'Today on Your Farm',
      'farm.subtitle': 'Field health and current conditions',
      'farm.live': 'Live',
      'farm.loading': 'Loading...',
      'farm.cropStage': 'Crop Stage',
      'farm.riskLevel': 'Risk Level',
      'farm.temperature': 'Temperature',
      'farm.soilMoisture': 'Soil Moisture',
      // Actions Section
      'actions.title': 'What To Do Today',
      'actions.subtitle': 'Recommended actions for your field',
      'actions.loading': 'Loading recommendations...',
      // Market Section
      'market.title': 'Market Prices',
      'market.subtitle': "Today's prices & tomorrow's prediction",
      'market.mandiPrices': 'Mandi Prices',
      'market.today': 'Today',
      'market.tomorrow': 'Tomorrow',
      'market.perQuintal': 'per Quintal (100 kg)',
      'market.predictionInfo': "Tomorrow's Prediction: Based on 7-day price trend analysis using weighted moving average + momentum. Confidence levels:",
      'market.high': 'High',
      'market.medium': 'Medium',
      'market.low': 'Low',
      'market.consistentTrend': '(consistent trend)',
      'market.moderateData': '(moderate data)',
      'market.limitedData': '(limited data)',
      // Quick Nav
      'quicknav.disease': 'Disease Detection',
      'quicknav.diseaseDesc': 'Scan leaves for disease diagnosis',
      'quicknav.lifecycle': 'Lifecycle Monitoring',
      'quicknav.lifecycleDesc': 'Track your crop growth stages',
      'quicknav.postharvest': 'Post-Harvest',
      'quicknav.postharvestDesc': 'Market prices and sell timing',
      // Crop Stage Timeline
      'timeline.title': 'Crop Stage Timeline Guide',
      'timeline.subtitle': 'Your crop stage is detected based on days since planting',
      'timeline.progress': 'Current Progress',
      'timeline.harvestIn': 'Est. Harvest In',
      'timeline.days': 'days',
      'timeline.planted': 'Planted',
      'timeline.harvest': 'Harvest (~120 days)',
      'timeline.germination': 'Germination',
      'timeline.vegetative': 'Vegetative',
      'timeline.tillering': 'Tillering',
      'timeline.flowering': 'Flowering',
      'timeline.grainFill': 'Grain Fill',
      'timeline.maturity': 'Maturity',
      'timeline.germinationDesc': 'Seed sprouting',
      'timeline.vegetativeDesc': 'Leaf development',
      'timeline.tilleringDesc': 'Stem branching',
      'timeline.floweringDesc': 'Bloom period',
      'timeline.grainFillDesc': 'Grain maturing',
      'timeline.maturityDesc': 'Ready to harvest',
      'timeline.day': 'Day',
      'timeline.howItWorks': 'How it works:',
      'timeline.howItWorksDesc': 'Your crop stage is automatically determined based on the number of days since you recorded the planting date. The typical rice crop cycle is ~120 days from planting to harvest.',
      // Commodities
      'commodity.rice': 'Rice',
      'commodity.onion': 'Onion',
      'commodity.tomato': 'Tomato',
      'commodity.potato': 'Potato',
      'commodity.cabbage': 'Cabbage',
      // Dashboard/Lifecycle
      'dashboard.title': 'Lifecycle Monitoring',
      'dashboard.subtitle': 'Real‑time field node telemetry + risk intelligence.',
      'dashboard.lastUpdated': 'Last updated:',
      'dashboard.commodity': 'Commodity',
      'dashboard.temperature': 'Temperature',
      'dashboard.humidity': 'Humidity',
      'dashboard.soilMoisture': 'Soil Moisture',
      'dashboard.nodeStatus': 'Node Status',
      'dashboard.tempTrend': 'Temperature Trend',
      'dashboard.last24h': 'Last 24 hours',
      'dashboard.opSummary': 'Operational Summary',
      'dashboard.opSummaryDesc': 'Lifecycle stage + risk posture',
      'dashboard.stage': 'Stage',
      'dashboard.risk': 'Risk',
      'dashboard.topActions': 'Top actions',
      'dashboard.aiInsights': 'AI Field Analysis',
      'dashboard.aiInsightsDesc': 'Smart interpretations from sensor data',
      'dashboard.poweredByAI': 'Powered by KisanVision AI',
      'dashboard.live': 'Live',
      'dashboard.rainMonitoring': 'Rain Monitoring',
      'dashboard.rainMonitoringDesc': 'Season rainfall tracking',
      'dashboard.rainStatus': 'Rain Status',
      'dashboard.totalRainfall': 'Total Rainfall',
      'dashboard.thisSeason': 'This season',
      'dashboard.rainEvents': 'Rain Events',
      'dashboard.daysWithRain': 'Days with rain',
      'dashboard.lastRain': 'Last rain',
      'dashboard.whenToAct': 'When to Take Action',
      'dashboard.whenToActDesc': 'Simple rules for your field',
      'dashboard.soilDry': 'Soil Dry',
      'dashboard.irrigateToday': '→ Irrigate today',
      'dashboard.highHumidity': 'High Humidity',
      'dashboard.checkDisease': '→ Check for disease',
      'dashboard.heatStress': 'Heat Stress',
      'dashboard.irrigateAM': '→ Irrigate early AM',
      'dashboard.rainDetected': 'Rain Detected',
      'dashboard.pauseIrrigation': '→ Pause irrigation',
      'dashboard.nextCheck': 'Next check recommended',
      'dashboard.basedOnRisk': 'Based on current risk level',
      'dashboard.optimalConditions': 'Optimal Growing Conditions',
      'dashboard.optimalConditionsDesc': 'AI-recommended for current stage to minimize spoilage',
      'dashboard.optimalTemp': 'Optimal Temp',
      'dashboard.optimalHumidity': 'Optimal Humidity',
      'dashboard.bestIrrigation': 'Best Irrigation',
      'dashboard.waterNeeds': 'Water Needs',
      'dashboard.stageTips': 'Tips to Reduce Spoilage',
      // Optimal Conditions Status
      'optimal.tooCold': 'Too cold',
      'optimal.tooHot': 'Too hot',
      'optimal.inRange': 'In range',
      'optimal.tooDry': 'Too dry',
      'optimal.tooHumid': 'Too humid',
      'optimal.currentNA': 'Current: --',
      'optimal.unknown': 'Unknown',
      // Rice Germination
      'optimal.rice.germination.irrigation': '6:00 AM',
      'optimal.rice.germination.irrigationReason': 'Before heat buildup',
      'optimal.rice.germination.waterNeeds': 'High',
      'optimal.rice.germination.waterTip': 'Keep soil saturated',
      'optimal.rice.germination.tip1': 'Maintain standing water 2-3cm for seed germination',
      'optimal.rice.germination.tip2': 'Avoid temperatures below 20°C - delays sprouting',
      'optimal.rice.germination.tip3': 'Check for seed rot if no germination in 5-7 days',
      // Rice Seedling
      'optimal.rice.seedling.irrigation': '6:00 AM',
      'optimal.rice.seedling.irrigationReason': 'Reduces transplant shock',
      'optimal.rice.seedling.waterNeeds': 'High',
      'optimal.rice.seedling.waterTip': 'Shallow flooding 3-5cm',
      'optimal.rice.seedling.tip1': 'Transplant when seedlings are 20-25 days old',
      'optimal.rice.seedling.tip2': 'Irrigate early morning to prevent leaf burn',
      'optimal.rice.seedling.tip3': 'Monitor for blast disease in high humidity',
      // Rice Vegetative
      'optimal.rice.vegetative.irrigation': '5:30 - 6:30 AM',
      'optimal.rice.vegetative.irrigationReason': 'Maximum leaf uptake',
      'optimal.rice.vegetative.waterNeeds': 'Medium-High',
      'optimal.rice.vegetative.waterTip': '5-7cm standing water',
      'optimal.rice.vegetative.tip1': 'Apply nitrogen fertilizer during active tillering',
      'optimal.rice.vegetative.tip2': 'Drain field briefly every 10 days to strengthen roots',
      'optimal.rice.vegetative.tip3': 'Watch for stem borers - check for deadhearts',
      // Rice Reproductive
      'optimal.rice.reproductive.irrigation': '5:00 - 6:00 AM',
      'optimal.rice.reproductive.irrigationReason': 'Critical for grain fill',
      'optimal.rice.reproductive.waterNeeds': 'High',
      'optimal.rice.reproductive.waterTip': 'Never let soil dry out',
      'optimal.rice.reproductive.tip1': 'Temperature above 35°C causes sterile grains - irrigate to cool',
      'optimal.rice.reproductive.tip2': 'This is the most water-sensitive stage',
      'optimal.rice.reproductive.tip3': 'Apply potassium for better grain quality',
      // Rice Maturity
      'optimal.rice.maturity.irrigation': 'Stop 10-15 days before harvest',
      'optimal.rice.maturity.irrigationReason': 'Allows field drying',
      'optimal.rice.maturity.waterNeeds': 'Low',
      'optimal.rice.maturity.waterTip': 'Drain field gradually',
      'optimal.rice.maturity.tip1': 'Harvest when 80-85% grains are straw colored',
      'optimal.rice.maturity.tip2': 'Avoid harvest delays - causes grain shattering',
      'optimal.rice.maturity.tip3': 'Low humidity helps reduce post-harvest losses',
      // Default Germination
      'optimal.default.germination.irrigation': '6:00 - 7:00 AM',
      'optimal.default.germination.irrigationReason': 'Cool morning application',
      'optimal.default.germination.waterNeeds': 'Medium',
      'optimal.default.germination.waterTip': 'Keep soil moist',
      'optimal.default.germination.tip1': 'Ensure consistent soil moisture for seed germination',
      'optimal.default.germination.tip2': 'Protect from extreme temperatures',
      'optimal.default.germination.tip3': 'Check for pests after emergence',
      // Default Seedling
      'optimal.default.seedling.irrigation': '6:00 - 7:00 AM',
      'optimal.default.seedling.irrigationReason': 'Before heat stress',
      'optimal.default.seedling.waterNeeds': 'Medium',
      'optimal.default.seedling.waterTip': 'Light, frequent watering',
      'optimal.default.seedling.tip1': 'Young plants are sensitive to water stress',
      'optimal.default.seedling.tip2': 'Apply balanced fertilizer at first true leaves',
      'optimal.default.seedling.tip3': 'Monitor for damping-off disease',
      // Default Vegetative
      'optimal.default.vegetative.irrigation': '5:30 - 6:30 AM',
      'optimal.default.vegetative.irrigationReason': 'Maximum leaf uptake',
      'optimal.default.vegetative.waterNeeds': 'Medium-High',
      'optimal.default.vegetative.waterTip': 'Deep watering promotes roots',
      'optimal.default.vegetative.tip1': 'Split nitrogen applications for best uptake',
      'optimal.default.vegetative.tip2': 'Good ventilation reduces disease pressure',
      'optimal.default.vegetative.tip3': 'Mulching conserves soil moisture',
      // Default Reproductive
      'optimal.default.reproductive.irrigation': '5:00 - 6:00 AM',
      'optimal.default.reproductive.irrigationReason': 'Critical growth period',
      'optimal.default.reproductive.waterNeeds': 'High',
      'optimal.default.reproductive.waterTip': 'Consistent moisture essential',
      'optimal.default.reproductive.tip1': 'Water stress now severely impacts yield',
      'optimal.default.reproductive.tip2': 'Apply potassium for fruit/grain quality',
      'optimal.default.reproductive.tip3': 'Monitor closely for pests and diseases',
      // Default Maturity
      'optimal.default.maturity.irrigation': 'Reduce before harvest',
      'optimal.default.maturity.irrigationReason': 'Improves storage quality',
      'optimal.default.maturity.waterNeeds': 'Low',
      'optimal.default.maturity.waterTip': 'Allow natural drying',
      'optimal.default.maturity.tip1': 'Harvest at optimal maturity for best quality',
      'optimal.default.maturity.tip2': 'Lower humidity reduces post-harvest losses',
      'optimal.default.maturity.tip3': 'Plan harvest timing to avoid rain',
      'dashboard.normalRange': 'Normal range',
      'dashboard.needsIrrigation': 'Needs irrigation',
      'dashboard.online': 'Online',
      'dashboard.offline': 'Offline',
      'dashboard.lastSeen': 'Last seen',
      // Disease Page
      'disease.title': 'Disease Detection',
      'disease.subtitle': 'Scan leaf images and get farmer-friendly action steps.',
      'disease.uploadCapture': 'Upload or Capture',
      'disease.camera': 'Camera',
      'disease.chooseImage': 'Choose Image',
      'disease.analyze': 'Analyze',
      'disease.noFile': 'No file selected',
      'disease.capturePhoto': 'Capture Photo',
      'disease.predictionResults': 'Prediction Results',
      'disease.whatDetect': 'What This Can Detect',
      'disease.riceDiseases': 'Rice Diseases',
      'disease.tomatoDiseases': 'Tomato Diseases',
      'disease.bacterialLeafBlight': 'Bacterial Leaf Blight',
      'disease.brownSpot': 'Brown Spot',
      'disease.healthy': 'Not a plant image or No disease detected',
      'disease.hispa': 'Hispa',
      'disease.leafBlast': 'Leaf Blast',
      'disease.bacterialSpot': 'Bacterial Spot',
      'disease.earlyBlight': 'Early Blight',
      'disease.lateBlight': 'Late Blight',
      'disease.leafMold': 'Leaf Mold',
      'disease.mosaicVirus': 'Mosaic Virus',
      'disease.septoria': 'Septoria',
      'disease.yellowLeafCurl': 'Yellow Leaf Curl',
      'disease.howItWorks': 'How It Works',
      'disease.step1Title': 'Take or Upload Photo',
      'disease.step1Desc': 'Capture a clear image of the affected leaf',
      'disease.step2Title': 'AI Analysis',
      'disease.step2Desc': 'Our model identifies the disease pattern',
      'disease.step3Title': 'Get Action Steps',
      'disease.step3Desc': 'Receive treatment recommendations',
      // Footer
      'footer.copyright': '© 2026 KisanVision 360',
      'footer.tagline': 'Secure monitoring • Edge + Cloud ready'
    },
    hi: {
      // Header
      'nav.home': 'होम',
      'nav.disease': 'रोग',
      'nav.lifecycle': 'जीवनचक्र',
      'nav.postharvest': 'कटाई उपरांत',
      'backend.checking': 'जाँच रहा है',
      'backend.online': 'बैकएंड ऑनलाइन',
      'backend.offline': 'बैकएंड ऑफलाइन',
      'backend.local': 'स्थानीय मोड',
      // Home Page
      'home.welcome': 'किसानविज़न 360 में आपका स्वागत है',
      'home.subtitle': 'आज की खेत की स्थिति, क्या करना है और बाज़ार की कीमतें एक ही स्क्रीन पर।',
      'home.lastUpdated': 'अंतिम अपडेट:',
      // Farm Section
      'farm.title': 'आज आपके खेत में',
      'farm.subtitle': 'खेत का स्वास्थ्य और वर्तमान स्थिति',
      'farm.live': 'लाइव',
      'farm.loading': 'लोड हो रहा है...',
      'farm.cropStage': 'फसल चरण',
      'farm.riskLevel': 'जोखिम स्तर',
      'farm.temperature': 'तापमान',
      'farm.soilMoisture': 'मिट्टी की नमी',
      // Actions Section
      'actions.title': 'आज क्या करें',
      'actions.subtitle': 'आपके खेत के लिए सुझाई गई कार्रवाइयाँ',
      'actions.loading': 'सुझाव लोड हो रहे हैं...',
      // Market Section
      'market.title': 'बाज़ार की कीमतें',
      'market.subtitle': 'आज की कीमतें और कल का अनुमान',
      'market.mandiPrices': 'मंडी भाव',
      'market.today': 'आज',
      'market.tomorrow': 'कल',
      'market.perQuintal': 'प्रति क्विंटल (100 किग्रा)',
      'market.predictionInfo': 'कल का अनुमान: भारित चलती औसत + गति का उपयोग करके 7-दिवसीय मूल्य प्रवृत्ति विश्लेषण पर आधारित। विश्वास स्तर:',
      'market.high': 'उच्च',
      'market.medium': 'मध्यम',
      'market.low': 'निम्न',
      'market.consistentTrend': '(सुसंगत प्रवृत्ति)',
      'market.moderateData': '(मध्यम डेटा)',
      'market.limitedData': '(सीमित डेटा)',
      // Quick Nav
      'quicknav.disease': 'रोग पहचान',
      'quicknav.diseaseDesc': 'रोग निदान के लिए पत्तियाँ स्कैन करें',
      'quicknav.lifecycle': 'जीवनचक्र निगरानी',
      'quicknav.lifecycleDesc': 'अपनी फसल की वृद्धि के चरणों को ट्रैक करें',
      'quicknav.postharvest': 'कटाई उपरांत',
      'quicknav.postharvestDesc': 'बाज़ार की कीमतें और बेचने का समय',
      // Crop Stage Timeline
      'timeline.title': 'फसल चरण समयरेखा गाइड',
      'timeline.subtitle': 'आपका फसल चरण रोपण के बाद के दिनों के आधार पर निर्धारित होता है',
      'timeline.progress': 'वर्तमान प्रगति',
      'timeline.harvestIn': 'अनुमानित कटाई',
      'timeline.days': 'दिन',
      'timeline.planted': 'रोपित',
      'timeline.harvest': 'कटाई (~120 दिन)',
      'timeline.germination': 'अंकुरण',
      'timeline.vegetative': 'वनस्पति',
      'timeline.tillering': 'कल्ले निकालना',
      'timeline.flowering': 'फूल आना',
      'timeline.grainFill': 'दाना भरना',
      'timeline.maturity': 'परिपक्वता',
      'timeline.germinationDesc': 'बीज अंकुरण',
      'timeline.vegetativeDesc': 'पत्ती विकास',
      'timeline.tilleringDesc': 'तना शाखा',
      'timeline.floweringDesc': 'फूल काल',
      'timeline.grainFillDesc': 'दाना पकना',
      'timeline.maturityDesc': 'कटाई के लिए तैयार',
      'timeline.day': 'दिन',
      'timeline.howItWorks': 'यह कैसे काम करता है:',
      'timeline.howItWorksDesc': 'आपका फसल चरण स्वचालित रूप से रोपण तिथि दर्ज करने के बाद के दिनों के आधार पर निर्धारित होता है। चावल की फसल का विशिष्ट चक्र रोपण से कटाई तक ~120 दिन है।',
      // Commodities
      'commodity.rice': 'चावल',
      'commodity.onion': 'प्याज',
      'commodity.tomato': 'टमाटर',
      'commodity.potato': 'आलू',
      'commodity.cabbage': 'पत्ता गोभी',
      // Dashboard/Lifecycle
      'dashboard.title': 'जीवनचक्र निगरानी',
      'dashboard.subtitle': 'रियल-टाइम फील्ड नोड टेलीमेट्री + जोखिम खुफिया।',
      'dashboard.lastUpdated': 'अंतिम अपडेट:',
      'dashboard.commodity': 'वस्तु',
      'dashboard.temperature': 'तापमान',
      'dashboard.humidity': 'आर्द्रता',
      'dashboard.soilMoisture': 'मिट्टी की नमी',
      'dashboard.nodeStatus': 'नोड स्थिति',
      'dashboard.tempTrend': 'तापमान प्रवृत्ति',
      'dashboard.last24h': 'पिछले 24 घंटे',
      'dashboard.opSummary': 'संचालन सारांश',
      'dashboard.opSummaryDesc': 'जीवनचक्र चरण + जोखिम स्थिति',
      'dashboard.stage': 'चरण',
      'dashboard.risk': 'जोखिम',
      'dashboard.topActions': 'शीर्ष कार्य',
      'dashboard.aiInsights': 'AI फील्ड विश्लेषण',
      'dashboard.aiInsightsDesc': 'सेंसर डेटा से स्मार्ट व्याख्या',
      'dashboard.poweredByAI': 'KisanVision AI द्वारा संचालित',
      'dashboard.live': 'लाइव',
      'dashboard.rainMonitoring': 'वर्षा निगरानी',
      'dashboard.rainMonitoringDesc': 'मौसमी वर्षा ट्रैकिंग',
      'dashboard.rainStatus': 'वर्षा स्थिति',
      'dashboard.totalRainfall': 'कुल वर्षा',
      'dashboard.thisSeason': 'इस मौसम',
      'dashboard.rainEvents': 'वर्षा घटनाएं',
      'dashboard.daysWithRain': 'वर्षा वाले दिन',
      'dashboard.lastRain': 'आखिरी बारिश',
      'dashboard.whenToAct': 'कब कार्रवाई करें',
      'dashboard.whenToActDesc': 'आपके खेत के लिए सरल नियम',
      'dashboard.soilDry': 'मिट्टी सूखी',
      'dashboard.irrigateToday': '→ आज सिंचाई करें',
      'dashboard.highHumidity': 'उच्च आर्द्रता',
      'dashboard.checkDisease': '→ रोग की जाँच करें',
      'dashboard.heatStress': 'गर्मी तनाव',
      'dashboard.irrigateAM': '→ सुबह जल्दी सिंचाई',
      'dashboard.rainDetected': 'बारिश मिली',
      'dashboard.pauseIrrigation': '→ सिंचाई रोकें',
      'dashboard.nextCheck': 'अगली जाँच अनुशंसित',
      'dashboard.basedOnRisk': 'वर्तमान जोखिम स्तर के आधार पर',
      'dashboard.optimalConditions': 'इष्टतम उगाने की स्थिति',
      'dashboard.optimalConditionsDesc': 'खराबी कम करने के लिए AI अनुशंसित',
      'dashboard.optimalTemp': 'इष्टतम तापमान',
      'dashboard.optimalHumidity': 'इष्टतम आर्द्रता',
      'dashboard.bestIrrigation': 'सर्वोत्तम सिंचाई',
      'dashboard.waterNeeds': 'पानी की जरूरत',
      'dashboard.stageTips': 'खराबी कम करने के टिप्स',
      'dashboard.normalRange': 'सामान्य सीमा',
      'dashboard.needsIrrigation': 'सिंचाई की जरूरत',
      'dashboard.online': 'ऑनलाइन',
      'dashboard.offline': 'ऑफलाइन',
      'dashboard.lastSeen': 'अंतिम बार देखा',
      // Disease Page
      'disease.title': 'रोग पहचान',
      'disease.subtitle': 'पत्ती की छवियां स्कैन करें और किसान-अनुकूल कार्य चरण प्राप्त करें।',
      'disease.uploadCapture': 'अपलोड या कैप्चर',
      'disease.camera': 'कैमरा',
      'disease.chooseImage': 'छवि चुनें',
      'disease.analyze': 'विश्लेषण',
      'disease.noFile': 'कोई फ़ाइल नहीं चुनी गई',
      'disease.capturePhoto': 'फोटो कैप्चर करें',
      'disease.predictionResults': 'भविष्यवाणी परिणाम',
      'disease.whatDetect': 'यह क्या पता लगा सकता है',
      'disease.riceDiseases': 'चावल के रोग',
      'disease.tomatoDiseases': 'टमाटर के रोग',
      'disease.bacterialLeafBlight': 'जीवाणु पत्ती जलन',
      'disease.brownSpot': 'भूरा धब्बा',
      'disease.healthy': 'पौधे की छवि नहीं या कोई रोग नहीं मिला',
      'disease.hispa': 'हिस्पा',
      'disease.leafBlast': 'पत्ती विस्फोट',
      'disease.bacterialSpot': 'जीवाणु धब्बा',
      'disease.earlyBlight': 'प्रारंभिक जलन',
      'disease.lateBlight': 'देर से जलन',
      'disease.leafMold': 'पत्ती फफूंद',
      'disease.mosaicVirus': 'मोज़ेक वायरस',
      'disease.septoria': 'सेप्टोरिया',
      'disease.yellowLeafCurl': 'पीला पत्ता कर्ल',
      'disease.howItWorks': 'यह कैसे काम करता है',
      'disease.step1Title': 'फोटो लें या अपलोड करें',
      'disease.step1Desc': 'प्रभावित पत्ती की स्पष्ट छवि लें',
      'disease.step2Title': 'AI विश्लेषण',
      'disease.step2Desc': 'हमारा मॉडल रोग पैटर्न की पहचान करता है',
      'disease.step3Title': 'कार्य चरण प्राप्त करें',
      'disease.step3Desc': 'उपचार की सिफारिशें प्राप्त करें',
      // Footer
      'footer.copyright': '© 2026 किसानविज़न 360',
      'footer.tagline': 'सुरक्षित निगरानी • एज + क्लाउड तैयार'
    },
    te: {
      // Header
      'nav.home': 'హోమ్',
      'nav.disease': 'వ్యాధి',
      'nav.lifecycle': 'జీవితచక్రం',
      'nav.postharvest': 'పంట తర్వాత',
      'backend.checking': 'తనిఖీ చేస్తోంది',
      'backend.online': 'బ్యాకెండ్ ఆన్‌లైన్',
      'backend.offline': 'బ్యాకెండ్ ఆఫ్‌లైన్',
      'backend.local': 'స్థానిక మోడ్',
      // Home Page
      'home.welcome': 'కిసాన్‌విజన్ 360కి స్వాగతం',
      'home.subtitle': 'నేటి పొలం స్థితి, ఏమి చేయాలి మరియు మార్కెట్ ధరలు ఒకే స్క్రీన్‌లో.',
      'home.lastUpdated': 'చివరి నవీకరణ:',
      // Farm Section
      'farm.title': 'నేడు మీ పొలంలో',
      'farm.subtitle': 'పొలం ఆరోగ్యం మరియు ప్రస్తుత పరిస్థితులు',
      'farm.live': 'లైవ్',
      'farm.loading': 'లోడ్ అవుతోంది...',
      'farm.cropStage': 'పంట దశ',
      'farm.riskLevel': 'రిస్క్ స్థాయి',
      'farm.temperature': 'ఉష్ణోగ్రత',
      'farm.soilMoisture': 'నేల తేమ',
      // Actions Section
      'actions.title': 'ఈరోజు ఏమి చేయాలి',
      'actions.subtitle': 'మీ పొలానికి సిఫార్సు చర్యలు',
      'actions.loading': 'సిఫార్సులు లోడ్ అవుతున్నాయి...',
      // Market Section
      'market.title': 'మార్కెట్ ధరలు',
      'market.subtitle': 'నేటి ధరలు & రేపటి అంచనా',
      'market.mandiPrices': 'మండి ధరలు',
      'market.today': 'నేడు',
      'market.tomorrow': 'రేపు',
      'market.perQuintal': 'క్వింటాల్‌కు (100 కిలో)',
      'market.predictionInfo': 'రేపటి అంచనా: వెయిటెడ్ మూవింగ్ ఆవరేజ్ + మొమెంటమ్ ఉపయోగించి 7-రోజుల ధర ట్రెండ్ విశ్లేషణ ఆధారంగా. విశ్వాస స్థాయిలు:',
      'market.high': 'అధిక',
      'market.medium': 'మధ్యస్థం',
      'market.low': 'తక్కువ',
      'market.consistentTrend': '(స్థిరమైన ట్రెండ్)',
      'market.moderateData': '(మధ్యస్థ డేటా)',
      'market.limitedData': '(పరిమిత డేటా)',
      // Quick Nav
      'quicknav.disease': 'వ్యాధి గుర్తింపు',
      'quicknav.diseaseDesc': 'వ్యాధి నిర్ధారణ కోసం ఆకులను స్కాన్ చేయండి',
      'quicknav.lifecycle': 'జీవితచక్ర పర్యవేక్షణ',
      'quicknav.lifecycleDesc': 'మీ పంట పెరుగుదల దశలను ట్రాక్ చేయండి',
      'quicknav.postharvest': 'పంట తర్వాత',
      'quicknav.postharvestDesc': 'మార్కెట్ ధరలు మరియు అమ్మకం సమయం',
      // Crop Stage Timeline
      'timeline.title': 'పంట దశ టైమ్‌లైన్ గైడ్',
      'timeline.subtitle': 'నాటిన రోజుల ఆధారంగా మీ పంట దశ గుర్తించబడుతుంది',
      'timeline.progress': 'ప్రస్తుత పురోగతి',
      'timeline.harvestIn': 'అంచనా పంట',
      'timeline.days': 'రోజులు',
      'timeline.planted': 'నాటారు',
      'timeline.harvest': 'పంట (~120 రోజులు)',
      'timeline.germination': 'మొలకెత్తడం',
      'timeline.vegetative': 'వృక్షసంబంధ',
      'timeline.tillering': 'టిల్లరింగ్',
      'timeline.flowering': 'పుష్పించడం',
      'timeline.grainFill': 'గింజ నింపడం',
      'timeline.maturity': 'పరిపక్వత',
      'timeline.germinationDesc': 'విత్తనం మొలకెత్తడం',
      'timeline.vegetativeDesc': 'ఆకు అభివృద్ధి',
      'timeline.tilleringDesc': 'కాండం శాఖలు',
      'timeline.floweringDesc': 'పుష్ప కాలం',
      'timeline.grainFillDesc': 'గింజ పండటం',
      'timeline.maturityDesc': 'పంటకు సిద్ధం',
      'timeline.day': 'రోజు',
      'timeline.howItWorks': 'ఇది ఎలా పనిచేస్తుంది:',
      'timeline.howItWorksDesc': 'మీరు నాటిన తేదీని నమోదు చేసిన తర్వాత రోజుల సంఖ్య ఆధారంగా మీ పంట దశ స్వయంచాలకంగా నిర్ణయించబడుతుంది. వరి పంట యొక్క సాధారణ చక్రం నాటడం నుండి పంట వరకు ~120 రోజులు.',
      // Commodities
      'commodity.rice': 'బియ్యం',
      'commodity.onion': 'ఉల్లిపాయ',
      'commodity.tomato': 'టమాటా',
      'commodity.potato': 'బంగాళదుంప',
      'commodity.cabbage': 'క్యాబేజీ',
      // Dashboard/Lifecycle
      'dashboard.title': 'జీవితచక్ర పర్యవేక్షణ',
      'dashboard.subtitle': 'రియల్-టైమ్ ఫీల్డ్ నోడ్ టెలిమెట్రీ + రిస్క్ ఇంటెలిజెన్స్.',
      'dashboard.lastUpdated': 'చివరి నవీకరణ:',
      'dashboard.commodity': 'సరుకు',
      'dashboard.temperature': 'ఉష్ణోగ్రత',
      'dashboard.humidity': 'తేమ',
      'dashboard.soilMoisture': 'నేల తేమ',
      'dashboard.nodeStatus': 'నోడ్ స్థితి',
      'dashboard.tempTrend': 'ఉష్ణోగ్రత ట్రెండ్',
      'dashboard.last24h': 'గత 24 గంటలు',
      'dashboard.opSummary': 'కార్యాచరణ సారాంశం',
      'dashboard.opSummaryDesc': 'జీవితచక్ర దశ + రిస్క్ స్థితి',
      'dashboard.stage': 'దశ',
      'dashboard.risk': 'రిస్క్',
      'dashboard.topActions': 'టాప్ చర్యలు',
      'dashboard.aiInsights': 'AI ఫీల్డ్ విశ్లేషణ',
      'dashboard.aiInsightsDesc': 'సెన్సార్ డేటా నుండి స్మార్ట్ వివరణలు',
      'dashboard.poweredByAI': 'KisanVision AI ద్వారా శక్తిని పొందింది',
      'dashboard.live': 'లైవ్',
      'dashboard.rainMonitoring': 'వర్షం పర్యవేక్షణ',
      'dashboard.rainMonitoringDesc': 'సీజన్ వర్షపాతం ట్రాకింగ్',
      'dashboard.rainStatus': 'వర్షం స్థితి',
      'dashboard.totalRainfall': 'మొత్తం వర్షపాతం',
      'dashboard.thisSeason': 'ఈ సీజన్',
      'dashboard.rainEvents': 'వర్షం సంఘటనలు',
      'dashboard.daysWithRain': 'వర్షపు రోజులు',
      'dashboard.lastRain': 'చివరి వర్షం',
      'dashboard.whenToAct': 'చర్య తీసుకోవాల్సినప్పుడు',
      'dashboard.whenToActDesc': 'మీ పొలానికి సులభ నియమాలు',
      'dashboard.soilDry': 'నేల ఎండిపోయింది',
      'dashboard.irrigateToday': '→ ఈరోజే నీరు పెట్టండి',
      'dashboard.highHumidity': 'అధిక తేమ',
      'dashboard.checkDisease': '→ వ్యాధి చెక్ చేయండి',
      'dashboard.heatStress': 'వేడి ఒత్తిడి',
      'dashboard.irrigateAM': '→ ఉదయం త్వరగా నీరు పెట్టండి',
      'dashboard.rainDetected': 'వర్షం గుర్తించబడింది',
      'dashboard.pauseIrrigation': '→ నీటిపారుదల ఆపండి',
      'dashboard.nextCheck': 'తదుపరి చెక్ సిఫార్సు',
      'dashboard.basedOnRisk': 'ప్రస్తుత రిస్క్ స్థాయి ఆధారంగా',
      'dashboard.optimalConditions': 'అనుకూలమైన పెరుగుదల పరిస్థితులు',
      'dashboard.optimalConditionsDesc': 'నష్టం తగ్గించడానికి AI సిఫార్సు',
      'dashboard.optimalTemp': 'అనుకూల ఉష్ణోగ్రత',
      'dashboard.optimalHumidity': 'అనుకూల తేమ',
      'dashboard.bestIrrigation': 'ఉత్తమ నీటిపారుదల',
      'dashboard.waterNeeds': 'నీటి అవసరాలు',
      'dashboard.stageTips': 'నష్టం తగ్గించే చిట్కాలు',
      'dashboard.normalRange': 'సాధారణ పరిధి',
      'dashboard.needsIrrigation': 'నీటిపారుదల అవసరం',
      'dashboard.online': 'ఆన్‌లైన్',
      'dashboard.offline': 'ఆఫ్‌లైన్',
      'dashboard.lastSeen': 'చివరిగా చూసారు',
      // Disease Page
      'disease.title': 'వ్యాధి గుర్తింపు',
      'disease.subtitle': 'ఆకు చిత్రాలను స్కాన్ చేసి రైతు-స్నేహపూర్వక చర్య దశలు పొందండి.',
      'disease.uploadCapture': 'అప్‌లోడ్ లేదా క్యాప్చర్',
      'disease.camera': 'కెమెరా',
      'disease.chooseImage': 'చిత్రాన్ని ఎంచుకోండి',
      'disease.analyze': 'విశ్లేషించు',
      'disease.noFile': 'ఫైల్ ఎంపిక కాలేదు',
      'disease.capturePhoto': 'ఫోటో తీయండి',
      'disease.predictionResults': 'అంచనా ఫలితాలు',
      'disease.whatDetect': 'ఇది ఏమి గుర్తించగలదు',
      'disease.riceDiseases': 'వరి వ్యాధులు',
      'disease.tomatoDiseases': 'టమాటా వ్యాధులు',
      'disease.bacterialLeafBlight': 'బ్యాక్టీరియల్ ఆకు బ్లైట్',
      'disease.brownSpot': 'బ్రౌన్ స్పాట్',
      'disease.healthy': 'పంట మొక్క చిత్రం కాదు లేదా వ్యాధి కనుగొనబడలేదు',
      'disease.hispa': 'హిస్పా',
      'disease.leafBlast': 'ఆకు బ్లాస్ట్',
      'disease.bacterialSpot': 'బ్యాక్టీరియల్ స్పాట్',
      'disease.earlyBlight': 'ఎర్లీ బ్లైట్',
      'disease.lateBlight': 'లేట్ బ్లైట్',
      'disease.leafMold': 'ఆకు మోల్డ్',
      'disease.mosaicVirus': 'మొజాయిక్ వైరస్',
      'disease.septoria': 'సెప్టోరియా',
      'disease.yellowLeafCurl': 'పసుపు ఆకు కర్ల్',
      'disease.howItWorks': 'ఇది ఎలా పని చేస్తుంది',
      'disease.step1Title': 'ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి',
      'disease.step1Desc': 'ప్రభావిత ఆకు యొక్క స్పష్టమైన చిత్రాన్ని తీయండి',
      'disease.step2Title': 'AI విశ్లేషణ',
      'disease.step2Desc': 'మా మోడల్ వ్యాధి నమూనాలను గుర్తిస్తుంది',
      'disease.step3Title': 'చర్య దశలు పొందండి',
      'disease.step3Desc': 'చికిత్స సిఫార్సులు పొందండి',
      // Footer
      'footer.copyright': '© 2026 కిసాన్‌విజన్ 360',
      'footer.tagline': 'సురక్షిత పర్యవేక్షణ • ఎడ్జ్ + క్లౌడ్ రెడీ'
    }
  };

  // Get translation for a key
  const t = (key, fallback) => {
    const lang = getPreferredLanguage();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || fallback || key;
  };

  // Translate all elements with data-i18n attribute
  const translatePage = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation) {
        el.textContent = translation;
      }
    });
  };

  // Expose translation function globally
  window.i18n = { t, translatePage, TRANSLATIONS };

  // ========== Language Handling ==========
  const getPreferredLanguage = () => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'te') return saved;
    return 'en';
  };

  const setLanguage = (lang) => {
    const normalized = ['en', 'hi', 'te'].includes(lang) ? lang : 'en';
    localStorage.setItem(LANG_KEY, normalized);
    document.documentElement.lang = normalized;
    
    // Translate static UI labels
    translatePage();
    
    // Dispatch custom event for page-specific handlers
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: normalized } }));
    return normalized;
  };

  const initLanguageSelector = () => {
    const select = document.getElementById('language-select');
    if (!select) return;
    
    // Set initial value from localStorage
    select.value = getPreferredLanguage();
    
    // Translate page on initial load
    translatePage();
    
    select.addEventListener('change', () => {
      setLanguage(select.value);
    });
  };

  // Expose language getter globally for page scripts
  window.getSelectedLanguage = getPreferredLanguage;

  // ========== Theme Handling ==========
  const getPreferredTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', normalized === 'dark');
    document.documentElement.setAttribute('data-theme', normalized);
    localStorage.setItem(THEME_KEY, normalized);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = normalized === 'dark' ? 'Light' : 'Dark';
      toggle.setAttribute('aria-label', normalized === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('title', normalized === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  const initThemeToggle = () => {
    applyTheme(getPreferredTheme());
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  };

  const setBackendStatus = (mode, ok) => {
    const el = document.getElementById('backend-status');
    if (!el) return;

    const dot = el.querySelector('span');
    const text = el.querySelectorAll('span')[1];

    const setDot = (cls) => {
      if (!dot) return;
      dot.className = `inline-block h-2 w-2 rounded-full ${cls}`;
    };

    if (!ok) {
      setDot('bg-red-500');
      if (text) text.textContent = 'Backend offline';
      return;
    }

    if (mode === 'ONLINE_ENHANCED') {
      setDot('bg-emerald-500');
      if (text) text.textContent = 'Backend online';
      return;
    }

    setDot('bg-amber-500');
    if (text) text.textContent = 'Local mode';
  };

  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/health', { cache: 'no-store', signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) {
        setBackendStatus('', false);
        return;
      }
      const payload = await res.json();
      setBackendStatus(payload.mode || 'LOCAL_ONLY', true);
    } catch {
      setBackendStatus('', false);
    }
  };

  // ========== Login Check ==========
  const requireLogin = () => {
    // Skip login check on login page and admin/farmer page
    const path = window.location.pathname;
    if (path === '/login' || path === '/farmer' || path === '/far') {
      return;
    }

    const loggedIn = localStorage.getItem('farmer_logged_in') === '1';
    const farmerId = localStorage.getItem('last_farmer_id');

    if (!loggedIn || !farmerId) {
      // Not logged in, redirect to login
      window.location.href = '/login';
    }
  };

  const showLoggedInUser = () => {
    const userInfo = document.getElementById('user-info');
    const farmerNameEl = document.getElementById('logged-farmer-name');
    
    const loggedIn = localStorage.getItem('farmer_logged_in') === '1';
    const farmerName = localStorage.getItem('last_farmer_name');
    
    if (loggedIn && farmerName && userInfo && farmerNameEl) {
      farmerNameEl.textContent = `👨‍🌾 ${farmerName}`;
      userInfo.classList.remove('hidden');
      userInfo.classList.add('flex');
    }
  };

  // Logout function (exposed globally)
  window.farmerLogout = () => {
    localStorage.removeItem('farmer_logged_in');
    localStorage.removeItem('last_farmer_id');
    localStorage.removeItem('last_farmer_name');
    window.location.href = '/login';
  };

  // ========== Farmer Context (for other pages to use) ==========
  // Expose farmer ID getter for other pages
  window.getActiveFarmerId = () => {
    return Number(localStorage.getItem('last_farmer_id') || 0);
  };

  window.getActiveFarmerName = () => {
    return localStorage.getItem('last_farmer_name') || 'Farmer';
  };

  window.isLoggedIn = () => {
    return localStorage.getItem('farmer_logged_in') === '1' && localStorage.getItem('last_farmer_id');
  };

  document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    showLoggedInUser();
    initThemeToggle();
    initLanguageSelector();
    checkBackend();
    setInterval(checkBackend, 10000);
  });
})();
