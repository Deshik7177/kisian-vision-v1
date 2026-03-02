document.addEventListener('DOMContentLoaded', () => {
    const i18n = window.AppI18n;
    const t = (key, fallback) => (i18n ? i18n.t(key, fallback) : fallback);
    const commoditySelect = document.getElementById('commodity-select');
    const quantityInput = document.getElementById('quantity-input');
    const refreshButton = document.getElementById('refresh-market-btn');
    const marketSource = document.getElementById('market-source');

    const currentPrice = document.getElementById('current-price');
    const trend = document.getElementById('trend');
    const spoilageRisk = document.getElementById('spoilage-risk');
    const coldScore = document.getElementById('cold-score');
    const coldIdeal = document.getElementById('cold-ideal');
    const decision = document.getElementById('decision');
    const reason = document.getElementById('reason');
    const coldGuidance = document.getElementById('cold-guidance');
    const sellHighlight = document.getElementById('sell-highlight');
    const history = document.getElementById('price-history');
    const trendCanvas = document.getElementById('trend-canvas');

    const sellNow = document.getElementById('sell-now');
    const holdValue = document.getElementById('hold-value');
    const profitDiff = document.getElementById('profit-diff');
    const profitNote = document.getElementById('profit-note');

    const monitorStorageTemp = document.getElementById('monitor-storage-temp');
    const monitorStorageHumidity = document.getElementById('monitor-storage-humidity');
    const monitorStorageDays = document.getElementById('monitor-storage-days');
    const monitorSpoilageRisk = document.getElementById('monitor-spoilage-risk');
    const monitorStorageSource = document.getElementById('monitor-storage-source');

    const formatValue = (value, suffix = '') => {
        if (value === null || value === undefined || value === '') {
            return '--';
        }
        return `${value}${suffix}`;
    };

    const setSourceBadge = (element, source) => {
        if (!element) {
            return;
        }
        const normalized = String(source || 'demo').toLowerCase() === 'live' ? 'live' : 'demo';
        element.classList.remove('conn-connected', 'conn-demo', 'conn-disconnected');
        element.classList.add(normalized === 'live' ? 'conn-connected' : 'conn-demo');
        const label = element.querySelector('.conn-label');
        if (label) {
            label.textContent = normalized.toUpperCase();
        } else {
            element.textContent = normalized.toUpperCase();
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) {
            return '--';
        }
        return `₹${Number(value).toFixed(2)} / quintal`;
    };

    const l = {
        source: () => t('market.lbl.source', 'Src'),
        currentPrice: () => t('market.lbl.currentPrice', 'Price'),
        trend: () => t('market.lbl.trend', 'Trend'),
        spoilage: () => t('market.lbl.spoilage', 'Spoilage'),
        coldScore: () => t('market.lbl.coldScore', 'Cold Score'),
        idealRange: () => t('market.lbl.idealRange', 'Ideal'),
        decision: () => t('market.lbl.decision', 'Decision'),
        reason: () => t('market.lbl.reason', 'Reason'),
        guidance: () => t('market.lbl.guidance', 'Guidance'),
        sellNow: () => t('market.lbl.sellNow', 'Sell Now'),
        hold2d: () => t('market.lbl.hold2d', 'Hold 2d'),
        diff: () => t('market.lbl.diff', 'Diff'),
        storageTemp: () => t('market.lbl.storageTemp', 'Storage Temp'),
        storageHumidity: () => t('market.lbl.storageHumidity', 'Storage RH'),
        storageDays: () => t('market.lbl.storageDays', 'Storage Days'),
    };

    const buildSellHighlight = (decisionText) => {
        const raw = String(decisionText || '').trim();
        const normalized = raw.toLowerCase();
        if (!raw || raw === '--') {
            return 'Action: --';
        }

        if (normalized.includes('sell')) {
            if (normalized.includes('hold')) {
                const match = raw.match(/(\d+)\s*day/i);
                const days = match ? Number(match[1]) : 2;
                return `🟡 Hold ${days}d, then sell.`;
            }
            return '🔴 Sell now.';
        }

        if (normalized.includes('hold')) {
            const match = raw.match(/(\d+)\s*day/i);
            const days = match ? Number(match[1]) : 2;
            return `🟡 Hold ${days}d, then sell.`;
        }

        return `Action: ${raw}`;
    };

    const drawTrendChart = (records) => {
        if (!trendCanvas) {
            return;
        }
        const ctx = trendCanvas.getContext('2d');
        const width = trendCanvas.width;
        const height = trendCanvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f8fff5';
        ctx.fillRect(0, 0, width, height);

        if (!records || records.length < 2) {
            ctx.fillStyle = '#4b5563';
            ctx.font = '16px Segoe UI';
            ctx.fillText(t('market.msg.notEnoughTrend', 'Not enough price points to draw trend.'), 18, 40);
            return;
        }

        const prices = records.map(r => Number(r.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const pad = 30;
        const plotW = width - pad * 2;
        const plotH = height - pad * 2;
        const range = maxPrice - minPrice || 1;

        ctx.strokeStyle = '#d9e4d2';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad + (plotH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(width - pad, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#2f9e44';
        ctx.lineWidth = 3;
        ctx.beginPath();

        prices.forEach((price, index) => {
            const x = pad + (plotW / (prices.length - 1)) * index;
            const y = pad + plotH - ((price - minPrice) / range) * plotH;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Segoe UI';
        ctx.fillText(`Low: ₹${minPrice.toFixed(0)}`, pad, height - 8);
        ctx.fillText(`High: ₹${maxPrice.toFixed(0)}`, width - 120, height - 8);
    };

    const estimateHoldPrice = (records, spoilage) => {
        if (!records || records.length < 2) {
            return null;
        }

        const prices = records.map(r => Number(r.price));
        const now = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        const dailyDelta = now - previous;
        let expected = now + (dailyDelta * 2);

        const spoilagePenalty = {
            'Low': 0,
            'Medium': 0.01,
            'High': 0.03,
        }[spoilage] ?? 0;

        expected = expected * (1 - spoilagePenalty);
        return Math.max(0, expected);
    };

    const updateProfitImpact = (records, sell) => {
        const qty = Math.max(1, Number(quantityInput.value || 1));
        const nowPrice = Number(sell.current_price || 0);
        const holdPrice = estimateHoldPrice(records, sell.spoilage_risk || 'Low');

        if (!nowPrice || holdPrice === null) {
            sellNow.textContent = `${l.sellNow()}: --`;
            holdValue.textContent = `${l.hold2d()}: --`;
            profitDiff.textContent = `${l.diff()}: --`;
            return;
        }

        const sellNowValue = nowPrice * qty;
        const holdEstimateValue = holdPrice * qty;
        const delta = holdEstimateValue - sellNowValue;

        sellNow.textContent = `${l.sellNow()}: ₹${sellNowValue.toFixed(2)} (${qty} q)`;
        holdValue.textContent = `${l.hold2d()}: ₹${holdEstimateValue.toFixed(2)} (${qty} q)`;
        profitDiff.textContent = `${l.diff()}: ₹${delta.toFixed(2)} ${delta >= 0 ? t('market.msg.gain', '(gain)') : t('market.msg.loss', '(loss)')}`;

        if ((sell.spoilage_risk || '').toLowerCase() === 'high') {
            profitNote.textContent = t('market.msg.highSpoilage', 'High spoilage: quick sale is safer.');
        } else {
            profitNote.textContent = t('market.msg.estimate', 'Estimate from trend + spoilage.');
        }
    };

    const refreshMarket = async () => {
        const commodity = encodeURIComponent(commoditySelect.value);
        const language = encodeURIComponent((window.AppI18n && window.AppI18n.getLanguage) ? window.AppI18n.getLanguage() : 'en');
        try {
            refreshButton.disabled = true;
            refreshButton.textContent = t('market.btn.refreshing', 'Refreshing...');

            const response = await fetch(`/market-prices?commodity=${commodity}&language=${language}`);
            if (!response.ok) {
                throw new Error('Market fetch failed');
            }

            const payload = await response.json();
            const sell = payload.sell_prediction || {};
            const records = payload.records || [];
            const monitoring = payload.monitoring || {};
            const storage = monitoring.storage_snapshot || {};
            const suitability = sell.cold_storage_suitability || {};

            marketSource.textContent = `${l.source()}: ${payload.source || 'demo'}`;
            currentPrice.textContent = `${l.currentPrice()}: ${formatCurrency(sell.current_price)}`;
            trend.textContent = `${l.trend()}: ${sell.trend || '--'}`;
            spoilageRisk.textContent = `${l.spoilage()}: ${sell.spoilage_risk || '--'}`;
            coldScore.textContent = `${l.coldScore()}: ${suitability.score ?? '--'} / 100 (${suitability.level || '--'})`;
            coldIdeal.textContent = `${l.idealRange()}: T ${suitability.ideal_temp || '--'} | RH ${suitability.ideal_humidity || '--'}`;
            decision.textContent = `${l.decision()}: ${sell.decision || '--'}`;
            reason.textContent = `${l.reason()}: ${sell.reason || '--'}`;
            coldGuidance.textContent = `${l.guidance()}: ${suitability.guidance || '--'}`;
            if (sellHighlight) {
                sellHighlight.textContent = buildSellHighlight(sell.decision || '--');
            }

            if ((suitability.level || '').toLowerCase() === 'poor') {
                coldScore.style.color = '#b91c1c';
            } else if ((suitability.level || '').toLowerCase() === 'moderate') {
                coldScore.style.color = '#a16207';
            } else {
                coldScore.style.color = '#166534';
            }


            if (records.length) {
                const text = records.map(r => `${r.date}: ₹${Number(r.price).toFixed(0)}`).join('  |  ');
                history.textContent = text;
            } else {
                history.textContent = t('market.msg.noHistory', 'No price history available.');
            }

            drawTrendChart(records);
            updateProfitImpact(records, sell);

            monitorStorageTemp.textContent = `${l.storageTemp()}: ${formatValue(storage.temperature, ' °C')}`;
            monitorStorageHumidity.textContent = `${l.storageHumidity()}: ${formatValue(storage.humidity, ' %')}`;
            monitorStorageDays.textContent = `${l.storageDays()}: ${formatValue(storage.days_in_storage)}`;
            monitorSpoilageRisk.textContent = `${l.spoilage()}: ${sell.spoilage_risk || '--'}`;
            setSourceBadge(monitorStorageSource, storage.source || 'demo');
        } catch (error) {
            marketSource.textContent = t('market.source.unavailable', 'Source: unavailable');
            reason.textContent = t('market.reason.failed', 'Reason: Could not fetch market data right now.');
            coldScore.textContent = `${l.coldScore()}: --`;
            coldIdeal.textContent = `${l.idealRange()}: --`;
            coldGuidance.textContent = `${l.guidance()}: --`;
            if (sellHighlight) {
                sellHighlight.textContent = 'Action: --';
            }
            sellNow.textContent = `${l.sellNow()}: --`;
            holdValue.textContent = `${l.hold2d()}: --`;
            profitDiff.textContent = `${l.diff()}: --`;
            monitorStorageTemp.textContent = `${l.storageTemp()}: --`;
            monitorStorageHumidity.textContent = `${l.storageHumidity()}: --`;
            monitorStorageDays.textContent = `${l.storageDays()}: --`;
            monitorSpoilageRisk.textContent = `${l.spoilage()}: --`;
            setSourceBadge(monitorStorageSource, 'demo');
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent = t('market.btn.refresh', 'Refresh Market');
        }
    };

    refreshButton.addEventListener('click', refreshMarket);
    commoditySelect.addEventListener('change', refreshMarket);
    quantityInput.addEventListener('input', refreshMarket);
    document.addEventListener('app-language-changed', refreshMarket);

    refreshMarket();
    setInterval(refreshMarket, 10000);
});
