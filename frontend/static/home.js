document.addEventListener('DOMContentLoaded', () => {
    const riskEl = document.getElementById('home-risk');
    const stageEl = document.getElementById('home-stage');
    const stageTipEl = document.getElementById('home-stage-tip');
    const fieldTempEl = document.getElementById('home-field-temp');
    const fieldSoilEl = document.getElementById('home-field-soil');
    const fieldRainEl = document.getElementById('home-field-rain');
    const actionsEl = document.getElementById('home-actions');
    const priceListEl = document.getElementById('home-price-list');

    const formatValue = (value, suffix = '') => {
        if (value === null || value === undefined || value === '') {
            return '--';
        }
        return `${value}${suffix}`;
    };

    const toSimpleRisk = (risk) => {
        const normalized = String(risk || '').toLowerCase();
        if (normalized === 'high') return '🔴 High';
        if (normalized === 'medium') return '🟡 Medium';
        if (normalized === 'low') return '🟢 Low';
        return '--';
    };

    const extractActions = (recommendation, stageTip) => {
        const text = String(recommendation || '').trim();
        const numbered = text.match(/\d\)\s*[^\n]+/g) || [];
        const cleaned = numbered
            .map(item => item.replace(/^\d\)\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 3);

        if (cleaned.length) {
            return cleaned;
        }

        if (stageTip) {
            return [String(stageTip)];
        }

        return ['Keep monitoring your field daily.'];
    };

    const renderActions = (actions = []) => {
        if (!actionsEl) return;
        actionsEl.innerHTML = actions.map(item => `<li>${item}</li>`).join('');
    };

    const renderPrices = (dailyPrices = []) => {
        if (!priceListEl) {
            return;
        }
        if (!dailyPrices.length) {
            priceListEl.innerHTML = '<p class="selected-file">No market price data available.</p>';
            return;
        }

        const html = dailyPrices
            .map(item => {
                const today = new Date().toISOString().slice(0, 10);
                const price = item.price === null || item.price === undefined
                    ? '--'
                    : `₹${Number(item.price).toFixed(0)}`;
                const trend = String(item.trend || '--').toLowerCase();
                const trendIcon = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';
                return `
                    <div class="dashboard-card price-item">
                        <h3>${item.commodity}</h3>
                        <p>Today: ${today}</p>
                        <p>Price: ${price} / quintal</p>
                        <p>Trend: ${trendIcon} ${item.trend || '--'}</p>
                    </div>
                `;
            })
            .join('');

        priceListEl.innerHTML = html;
    };

    const refreshHome = async () => {
        try {
            const language = encodeURIComponent((window.AppI18n && window.AppI18n.getLanguage) ? window.AppI18n.getLanguage() : 'en');
            const response = await fetch(`/home-data?language=${language}`);
            if (!response.ok) {
                throw new Error('Failed to fetch home data');
            }
            const payload = await response.json();
            const lifecycle = payload.lifecycle || {};
            const field = lifecycle.field || {};
            const actions = extractActions(lifecycle.recommendation, lifecycle.crop_stage_tip);

            riskEl.textContent = `Field Risk: ${toSimpleRisk(lifecycle.risk_level)}`;
            stageEl.textContent = `Crop Stage: ${formatValue(lifecycle.crop_stage)}`;
            stageTipEl.textContent = `Stage Help: ${formatValue(lifecycle.crop_stage_tip)}`;

            fieldTempEl.textContent = `Temperature: ${formatValue(field.temperature, ' \u00b0C')}`;
            fieldSoilEl.textContent = `Soil Moisture: ${formatValue(field.soil_moisture, ' %')}`;
            fieldRainEl.textContent = `Rain: ${Number(field.rain_detected || 0) === 1 ? 'Detected' : 'No rain'}`;
            renderActions(actions);
        } catch (error) {
            console.error('Error refreshing home data:', error);
        }
    };

    refreshHome();
    setInterval(refreshHome, 10000);
    document.addEventListener('app-language-changed', refreshHome);
});
