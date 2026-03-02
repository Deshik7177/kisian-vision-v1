document.addEventListener('DOMContentLoaded', () => {
    const i18n = window.AppI18n;
    const t = (key, fallback) => (i18n ? i18n.t(key, fallback) : fallback);
    const commoditySelect = document.getElementById('commodity-select');
    const statusText = document.getElementById('status-text');
    const riskAlert = document.getElementById('risk-alert');
    const lifecycleLastUpdated = document.getElementById('lifecycle-last-updated');
    const nodeHealth = document.getElementById('node-health');
    const nodeSignal = document.getElementById('node-signal');

    const fieldTemp = document.getElementById('field-temp');
    const fieldHumidity = document.getElementById('field-humidity');
    const fieldSoil = document.getElementById('field-soil');
    const fieldRain = document.getElementById('field-rain');
    const fieldRainDays = document.getElementById('field-rain-days');
    const fieldConn = document.getElementById('field-conn');

    const storageTemp = document.getElementById('storage-temp');
    const storageHumidity = document.getElementById('storage-humidity');
    const storageDays = document.getElementById('storage-days');
    const storageConn = document.getElementById('storage-conn');

    const riskLevel = document.getElementById('risk-level');
    const riskEnv = document.getElementById('risk-env');
    const riskHarvest = document.getElementById('risk-harvest');
    const riskSpoilage = document.getElementById('risk-spoilage');
    const riskSource = document.getElementById('risk-source');

    const cropStage = document.getElementById('crop-stage');
    const cropStageTip = document.getElementById('crop-stage-tip');
    const cropStageAction1 = document.getElementById('crop-stage-action-1');

    const dashboardRecommendation = document.getElementById('dashboard-recommendation');
    let lastNotifiedRisk = '';

    const renderLifecycleFocus = (whatToDo, action) => {
        if (!dashboardRecommendation) {
            return;
        }

        dashboardRecommendation.innerHTML = '';

        const line1 = document.createElement('div');
        line1.className = 'lifecycle-focus-item';
        line1.textContent = `Do: ${whatToDo || '--'}`;

        const line2 = document.createElement('div');
        line2.className = 'lifecycle-focus-item';
        line2.textContent = `Now: ${action || '--'}`;

        dashboardRecommendation.appendChild(line1);
        dashboardRecommendation.appendChild(line2);
    };

    const formatValue = (value, suffix = '') => {
        if (value === undefined || value === null || value === '') {
            return '--';
        }
        return `${value}${suffix}`;
    };

    const setConnectionState = (element, state) => {
        if (!element) {
            return;
        }
        element.classList.remove('conn-connected', 'conn-disconnected', 'conn-demo');

        const normalized = state || 'disconnected';
        if (normalized === 'connected') {
            element.classList.add('conn-connected');
        } else if (normalized === 'demo') {
            element.classList.add('conn-demo');
        } else {
            element.classList.add('conn-disconnected');
        }

        const label = element.querySelector('.conn-label');
        if (label) {
            if (normalized === 'connected') {
                label.textContent = t('conn.connected', 'Connected');
            } else if (normalized === 'demo') {
                label.textContent = t('conn.demo', 'Demo');
            } else {
                label.textContent = t('conn.disconnected', 'Disconnected');
            }
        }
    };

    const l = {
        temperature: () => t('dash.lbl.temperature', 'Temp'),
        humidity: () => t('dash.lbl.humidity', 'Humidity'),
        soilMoisture: () => t('dash.lbl.soilMoisture', 'Soil'),
        rainDetected: () => t('dash.lbl.rainDetected', 'Rain'),
        rainyDays: () => t('dash.lbl.rainyDays', 'Rain Days'),
        daysStorage: () => t('dash.lbl.daysStorage', 'Days'),
        riskLevel: () => t('dash.lbl.riskLevel', 'Risk'),
        envScore: () => t('dash.lbl.envScore', 'Env Score'),
        harvestReadiness: () => t('dash.lbl.harvestReadiness', 'Harvest'),
        spoilageRisk: () => t('dash.lbl.spoilageRisk', 'Spoilage Risk'),
        riskSource: () => t('dash.lbl.riskSource', 'Source'),
        stage: () => t('dash.lbl.stage', 'Stage'),
        guidance: () => t('dash.lbl.guidance', 'Guide'),
        action: () => t('dash.lbl.action', 'Act'),
        yes: () => t('dash.val.yes', 'Yes'),
        no: () => t('dash.val.no', 'No'),
    };

    const isRecent = (timestamp, maxAgeSeconds = 90) => {
        if (!timestamp) {
            return false;
        }
        const ts = new Date(timestamp).getTime();
        if (Number.isNaN(ts)) {
            return false;
        }
        const ageSeconds = (Date.now() - ts) / 1000;
        return ageSeconds <= maxAgeSeconds;
    };

    const getAgeSeconds = (timestamp) => {
        if (!timestamp) {
            return null;
        }
        const ts = new Date(timestamp).getTime();
        if (Number.isNaN(ts)) {
            return null;
        }
        return Math.max(0, (Date.now() - ts) / 1000);
    };

    const setMetric = (element, label, value) => {
        if (!element) {
            return;
        }
        const keyEl = element.querySelector('.metric-k');
        const valueEl = element.querySelector('.metric-v');
        if (keyEl) {
            keyEl.textContent = label;
        }
        if (valueEl) {
            valueEl.textContent = value;
        } else {
            element.textContent = `${label}: ${value}`;
        }
    };

    const setNodeHealth = (state) => {
        if (!nodeHealth) {
            return;
        }
        nodeHealth.classList.remove('node-health-online', 'node-health-weak', 'node-health-offline');
        if (state === 'online') {
            nodeHealth.classList.add('node-health-online');
            nodeHealth.textContent = 'Online';
        } else if (state === 'weak') {
            nodeHealth.classList.add('node-health-weak');
            nodeHealth.textContent = 'Weak';
        } else {
            nodeHealth.classList.add('node-health-offline');
            nodeHealth.textContent = 'Offline';
        }
    };

    const setSignalLevel = (level) => {
        if (!nodeSignal) {
            return;
        }
        nodeSignal.classList.remove('signal-0', 'signal-1', 'signal-2', 'signal-3', 'signal-4');
        const safe = Math.max(0, Math.min(4, Number(level) || 0));
        nodeSignal.classList.add(`signal-${safe}`);
    };

    const maybePushBrowserRiskNotification = (risk, message) => {
        if (!('Notification' in window)) {
            return;
        }
        if (!risk || (risk !== 'Medium' && risk !== 'High')) {
            return;
        }
        if (lastNotifiedRisk === risk) {
            return;
        }

        const notify = () => {
            try {
                new Notification(`${t('dash.alert.title', 'Crop Risk')}: ${risk}`, {
                    body: message,
                    tag: `crop-risk-${risk.toLowerCase()}`,
                });
                lastNotifiedRisk = risk;
            } catch (error) {
            }
        };

        if (Notification.permission === 'granted') {
            notify();
            return;
        }

        if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    notify();
                }
            });
        }
    };

    const updateRiskAlert = (risk, recommendation, hasLiveField) => {
        if (!riskAlert) {
            return;
        }

        riskAlert.classList.remove('risk-alert-medium', 'risk-alert-high');

        if (!hasLiveField) {
            riskAlert.classList.add('risk-alert-hidden');
            riskAlert.textContent = '';
            lastNotifiedRisk = '';
            return;
        }

        if (risk === 'High') {
            const message = t('dash.alert.high', 'High risk. Act today.');
            riskAlert.classList.remove('risk-alert-hidden');
            riskAlert.classList.add('risk-alert-high');
            riskAlert.textContent = `⚠️ ${message}`;
            maybePushBrowserRiskNotification('High', recommendation || message);
            return;
        }

        if (risk === 'Medium') {
            const message = t('dash.alert.medium', 'Medium risk. Act within 72h.');
            riskAlert.classList.remove('risk-alert-hidden');
            riskAlert.classList.add('risk-alert-medium');
            riskAlert.textContent = `⚠️ ${message}`;
            maybePushBrowserRiskNotification('Medium', recommendation || message);
            return;
        }

        riskAlert.classList.add('risk-alert-hidden');
        riskAlert.textContent = '';
        lastNotifiedRisk = '';
    };

    const refreshDashboard = async () => {
        try {
            const selectedLang = (window.AppI18n && window.AppI18n.getLanguage) ? window.AppI18n.getLanguage() : 'en';
            const language = encodeURIComponent(selectedLang);
            const commodity = encodeURIComponent(commoditySelect.value);
            const response = await fetch(`/dashboard-data?language=${language}&commodity=${commodity}`);
            if (!response.ok) {
                throw new Error('Failed dashboard request');
            }

            const payload = await response.json();
            const field = payload.field_data || {};
            const storage = payload.storage_data || {};
            const risk = payload.risk_scores || {};
            const lifecycle = payload.lifecycle || {};
            const nodeStatus = payload.node_status || {};
            const rainMonitoring = payload.rain_monitoring || {};

            const hasLiveField = typeof nodeStatus.field_live === 'boolean'
                ? nodeStatus.field_live
                : (Boolean(field.device_id) && isRecent(field.created_at));

            const hasLiveStorage = typeof nodeStatus.storage_live === 'boolean'
                ? nodeStatus.storage_live
                : (Boolean(storage.device_id) && isRecent(storage.created_at));

            setConnectionState(fieldConn, hasLiveField ? 'connected' : 'disconnected');
            setConnectionState(storageConn, hasLiveStorage ? 'connected' : 'demo');

            const fieldAgeSeconds = getAgeSeconds(field.created_at);
            const healthState = hasLiveField && fieldAgeSeconds !== null
                ? (fieldAgeSeconds <= 15 ? 'online' : (fieldAgeSeconds <= 90 ? 'weak' : 'offline'))
                : (hasLiveField ? 'online' : 'offline');
            setNodeHealth(healthState);

            const signalLevel = healthState === 'online' ? 4 : (healthState === 'weak' ? 2 : 0);
            setSignalLevel(signalLevel);

            if (hasLiveField) {
                setMetric(fieldTemp, `🌡️ ${l.temperature()}`, formatValue(field.temperature, ' °C'));
                setMetric(fieldHumidity, `💧 ${l.humidity()}`, formatValue(field.humidity, ' %'));
                setMetric(fieldSoil, `🌱 ${l.soilMoisture()}`, formatValue(field.soil_moisture, ' %'));
                setMetric(fieldRain, `🌧️ ${l.rainDetected()}`, field.rain_detected ? l.yes() : l.no());
                setMetric(fieldRainDays, `📅 ${l.rainyDays()}`, formatValue(rainMonitoring.rainy_days));
            } else {
                setMetric(fieldTemp, `🌡️ ${l.temperature()}`, '--');
                setMetric(fieldHumidity, `💧 ${l.humidity()}`, '--');
                setMetric(fieldSoil, `🌱 ${l.soilMoisture()}`, '--');
                setMetric(fieldRain, `🌧️ ${l.rainDetected()}`, '--');
                setMetric(fieldRainDays, `📅 ${l.rainyDays()}`, '--');
            }

            if (hasLiveStorage) {
                setMetric(storageTemp, `🌡️ ${l.temperature()}`, formatValue(storage.temperature, ' °C'));
                setMetric(storageHumidity, `💧 ${l.humidity()}`, formatValue(storage.humidity, ' %'));
                setMetric(storageDays, `🗃️ ${l.daysStorage()}`, formatValue(storage.days_in_storage));
            } else {
                setMetric(storageTemp, `🌡️ ${l.temperature()}`, `${t('conn.demo', 'Demo')} (${t('dash.msg.noLiveStorage', 'No live node')})`);
                setMetric(storageHumidity, `💧 ${l.humidity()}`, t('conn.demo', 'Demo'));
                setMetric(storageDays, `🗃️ ${l.daysStorage()}`, t('conn.demo', 'Demo'));
            }

            setMetric(riskLevel, `⚠️ ${l.riskLevel()}`, formatValue(risk.risk_level));
            setMetric(riskEnv, `🧪 ${l.envScore()}`, formatValue(risk.environmental_risk_score));
            setMetric(riskHarvest, `🌾 ${l.harvestReadiness()}`, formatValue(risk.harvest_readiness, ' %'));
            setMetric(riskSpoilage, `📉 ${l.spoilageRisk()}`, formatValue(risk.spoilage_risk));
            updateRiskAlert(risk.risk_level, payload.recommendation, hasLiveField);

            const stageActions = Array.isArray(lifecycle.crop_stage_actions) ? lifecycle.crop_stage_actions : [];
            setMetric(cropStage, `🌿 ${l.stage()}`, formatValue(lifecycle.crop_stage));
            setMetric(cropStageTip, `🧭 ${l.guidance()}`, formatValue(lifecycle.crop_stage_tip));
            setMetric(cropStageAction1, `✅ ${l.action()}`, formatValue(stageActions[0]));

            if (hasLiveField && field.created_at) {
                const lastUpdate = new Date(field.created_at);
                const readable = Number.isNaN(lastUpdate.getTime()) ? field.created_at : lastUpdate.toLocaleTimeString();
                setMetric(
                    riskSource,
                    `📡 ${l.riskSource()}`,
                    `${t('dash.msg.liveFieldNode', 'Live')} (${field.device_id || 'field'}) ${t('dash.msg.at', '@')} ${readable}`
                );
            } else {
                setMetric(riskSource, `📡 ${l.riskSource()}`, t('dash.msg.lastKnown', 'Default (waiting for live node)'));
            }

            const whatToDo = lifecycle.crop_stage_tip || t('dash.msg.waitRecommendation', 'Waiting...');
            const immediateAction = stageActions[0] || lifecycle.crop_stage_tip || t('dash.msg.waitRecommendation', 'Waiting...');
            renderLifecycleFocus(whatToDo, immediateAction);
            if (hasLiveField && !hasLiveStorage) {
                statusText.textContent = `${t('dash.storageDemoFor', 'Field live. Storage demo for')} ${payload.commodity || commoditySelect.value}.`;
                statusText.classList.remove('is-waiting');
            } else if (!hasLiveField) {
                statusText.textContent = t('dash.waitingField', 'Waiting for live field data...');
                statusText.classList.add('is-waiting');
            } else {
                statusText.textContent = `${t('dash.updatedFor', 'Updated for')} ${payload.commodity || commoditySelect.value}.`;
                statusText.classList.remove('is-waiting');
            }

            if (lifecycleLastUpdated) {
                if (fieldAgeSeconds !== null && hasLiveField) {
                    const rounded = Math.max(0, Math.round(fieldAgeSeconds));
                    lifecycleLastUpdated.textContent = `Last updated: ${rounded}s ago`;
                } else {
                    lifecycleLastUpdated.textContent = 'Last updated: --';
                }
            }
        } catch (error) {
            setConnectionState(fieldConn, 'disconnected');
            setConnectionState(storageConn, 'demo');
            setNodeHealth('offline');
            setSignalLevel(0);
            if (riskAlert) {
                riskAlert.classList.add('risk-alert-hidden');
                riskAlert.textContent = '';
            }
            setMetric(fieldRainDays, `📅 ${l.rainyDays()}`, '--');
            setMetric(riskSource, `📡 ${l.riskSource()}`, t('dash.msg.unableSignal', 'Unable to fetch latest field signal'));
            setMetric(cropStage, `🌿 ${l.stage()}`, '--');
            setMetric(cropStageTip, `🧭 ${l.guidance()}`, '--');
            setMetric(cropStageAction1, `✅ ${l.action()}`, '--');
            renderLifecycleFocus('--', '--');
            statusText.textContent = t('dash.refreshing', 'Could not refresh data. Retrying...');
            statusText.classList.add('is-waiting');
            if (lifecycleLastUpdated) {
                lifecycleLastUpdated.textContent = 'Last updated: --';
            }
        }
    };

    commoditySelect.addEventListener('change', refreshDashboard);
    document.addEventListener('app-language-changed', refreshDashboard);

    refreshDashboard();
    setInterval(refreshDashboard, 5000);
});
