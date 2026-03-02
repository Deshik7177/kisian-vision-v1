// market_saas.js – Post-Harvest Market SaaS (v6 - Full Features)

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ENDPOINT = '/market-prices';
  let chart = null;

  // Market data for multiple commodities
  const COMMODITY_DATA = {
    Rice: { basePrice: 3750, icon: '🌾', unit: 'q' },
    Wheat: { basePrice: 2400, icon: '🌾', unit: 'q' },
    Maize: { basePrice: 1800, icon: '🌽', unit: 'q' },
    Onion: { basePrice: 2500, icon: '🧅', unit: 'q' },
    Potato: { basePrice: 1200, icon: '🥔', unit: 'q' },
    Tomato: { basePrice: 3500, icon: '🍅', unit: 'q' },
    Banana: { basePrice: 2800, icon: '🍌', unit: 'q' },
    Cabbage: { basePrice: 1500, icon: '🥬', unit: 'q' },
    Carrot: { basePrice: 2000, icon: '🥕', unit: 'q' },
  };

  function formatCurrency(value) {
    if (value == null) return '--';
    return `₹${Number(value).toFixed(0)}`;
  }

  function formatValue(value, suffix = '') {
    if (value == null || value === '') return '--';
    return `${value}${suffix}`;
  }

  function getTrendBadge(trend) {
    const t = String(trend || '').toLowerCase();
    if (t === 'rising') return { text: '↑ rising', class: 'text-emerald-600 dark:text-emerald-400' };
    if (t === 'falling') return { text: '↓ falling', class: 'text-red-600 dark:text-red-400' };
    return { text: '→ stable', class: 'text-amber-600 dark:text-amber-400' };
  }

  function getDecision(decision) {
    const d = String(decision || '').toLowerCase();
    if (d.includes('sell now')) return { text: 'Sell Now', icon: '💰', class: 'text-red-600 dark:text-red-400' };
    if (d.includes('hold')) return { text: 'Hold', icon: '⏳', class: 'text-emerald-700 dark:text-emerald-400' };
    return { text: decision || '--', icon: '📊', class: 'text-gray-900 dark:text-gray-50' };
  }

  // Generate simulated market data for all commodities
  function generateMarketData() {
    const data = {};
    const trends = ['rising', 'falling', 'stable'];
    
    for (const [name, info] of Object.entries(COMMODITY_DATA)) {
      const variance = (Math.random() - 0.5) * 0.2; // ±10%
      const price = Math.round(info.basePrice * (1 + variance));
      const trend = trends[Math.floor(Math.random() * 3)];
      const change = trend === 'rising' ? Math.round(Math.random() * 5 + 1) : 
                     trend === 'falling' ? -Math.round(Math.random() * 5 + 1) : 0;
      
      data[name] = {
        price,
        trend,
        change,
        icon: info.icon
      };
    }
    return data;
  }

  // Populate market prices overview grid
  function populateMarketPrices(selectedCommodity, currentPrice) {
    const grid = $('market-prices-grid');
    if (!grid) return;

    const marketData = generateMarketData();
    // Override selected commodity with actual data
    if (currentPrice && marketData[selectedCommodity]) {
      marketData[selectedCommodity].price = currentPrice;
    }

    grid.innerHTML = Object.entries(marketData).map(([name, data]) => {
      const isSelected = name === selectedCommodity;
      const trendClass = data.trend === 'rising' ? 'text-emerald-600' : 
                         data.trend === 'falling' ? 'text-red-600' : 'text-gray-500';
      const trendIcon = data.trend === 'rising' ? '↑' : data.trend === 'falling' ? '↓' : '→';
      
      return `
        <div class="rounded-lg p-3 ${isSelected ? 'bg-emerald-50 border-2 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800/50'}">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-sm">${data.icon}</span>
            <span class="text-xs font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}">${name}</span>
          </div>
          <div class="text-sm font-semibold text-gray-900 dark:text-gray-50">₹${data.price}</div>
          <div class="text-xs ${trendClass}">${trendIcon} ${Math.abs(data.change)}%</div>
        </div>
      `;
    }).join('');

    return marketData;
  }

  // Populate AI insights
  function populateAIInsights(sp, commodity, marketData) {
    const container = $('ai-insights');
    if (!container) return;

    const insights = [];
    const trend = String(sp.trend || '').toLowerCase();
    const risk = String(sp.spoilage_risk || '').toLowerCase();
    const price = sp.current_price || 0;

    // Price insight
    if (trend === 'rising') {
      insights.push({ icon: '📈', text: `${commodity} prices ↑ 3% this week. Consider holding for 2-3 days.`, type: 'success' });
    } else if (trend === 'falling') {
      insights.push({ icon: '📉', text: `${commodity} prices ↓. Sell soon to minimize losses.`, type: 'warning' });
    } else {
      insights.push({ icon: '📊', text: `${commodity} prices stable. Good time for planned selling.`, type: 'info' });
    }

    // Spoilage insight
    if (risk === 'high') {
      insights.push({ icon: '⚠️', text: `High spoilage risk! Sell within 2 days to avoid losses.`, type: 'error' });
    } else if (risk === 'medium') {
      insights.push({ icon: '⏰', text: `Monitor storage conditions. Quality may degrade in 7 days.`, type: 'warning' });
    }

    // Market comparison insight
    if (marketData) {
      const risingCommodities = Object.entries(marketData)
        .filter(([_, d]) => d.trend === 'rising')
        .map(([n, _]) => n)
        .slice(0, 2);
      if (risingCommodities.length > 0) {
        insights.push({ icon: '💡', text: `Also trending up: ${risingCommodities.join(', ')}`, type: 'info' });
      }
    }

    // Seasonal insight
    const month = new Date().getMonth();
    if ([9, 10, 11].includes(month) && ['Rice', 'Wheat'].includes(commodity)) {
      insights.push({ icon: '🗓️', text: `Post-harvest season: prices typically stabilize in coming weeks.`, type: 'info' });
    }

    // Best action summary
    const action = trend === 'rising' && risk === 'low' ? 'Hold for better prices' :
                   risk === 'high' ? 'Sell immediately' :
                   trend === 'falling' ? 'Sell soon' : 'Sell at convenience';
    insights.push({ icon: '✅', text: `Best action: ${action}`, type: 'success' });

    const typeColors = {
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    };

    container.innerHTML = insights.map(i => `
      <div class="flex items-start gap-2 p-2 rounded-lg ${typeColors[i.type]}">
        <span class="text-sm flex-shrink-0">${i.icon}</span>
        <span class="text-xs">${i.text}</span>
      </div>
    `).join('');
  }

  // Populate trends comparison
  function populateTrendsComparison(marketData, selectedCommodity) {
    const container = $('trends-comparison');
    if (!container || !marketData) return;

    container.innerHTML = Object.entries(marketData).slice(0, 8).map(([name, data]) => {
      const isSelected = name === selectedCommodity;
      const trendBg = data.trend === 'rising' ? 'bg-emerald-500' : 
                      data.trend === 'falling' ? 'bg-red-500' : 'bg-gray-400';
      const changeWidth = Math.min(Math.abs(data.change) * 10, 100);

      return `
        <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 ${isSelected ? 'ring-2 ring-emerald-400' : ''}">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${data.icon} ${name}</span>
            <span class="text-xs ${data.trend === 'rising' ? 'text-emerald-600' : data.trend === 'falling' ? 'text-red-600' : 'text-gray-500'}">
              ${data.trend === 'rising' ? '+' : data.trend === 'falling' ? '-' : ''}${Math.abs(data.change)}%
            </span>
          </div>
          <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full ${trendBg} rounded-full transition-all" style="width: ${changeWidth}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Commodity-specific optimal storage conditions
  const STORAGE_CONDITIONS = {
    Rice: { tempMin: 10, tempMax: 15, humMin: 60, humMax: 70, maxDays: 180 },
    Wheat: { tempMin: 10, tempMax: 15, humMin: 60, humMax: 65, maxDays: 365 },
    Maize: { tempMin: 10, tempMax: 15, humMin: 55, humMax: 60, maxDays: 180 },
    Onion: { tempMin: 0, tempMax: 5, humMin: 65, humMax: 70, maxDays: 120 },
    Potato: { tempMin: 4, tempMax: 10, humMin: 85, humMax: 95, maxDays: 180 },
    Tomato: { tempMin: 10, tempMax: 15, humMin: 85, humMax: 95, maxDays: 14 },
    Banana: { tempMin: 13, tempMax: 15, humMin: 85, humMax: 95, maxDays: 21 },
    default: { tempMin: 10, tempMax: 20, humMin: 60, humMax: 80, maxDays: 90 }
  };

  function populateStorageStatus(storage, commodity) {
    const conditions = STORAGE_CONDITIONS[commodity] || STORAGE_CONDITIONS.default;
    const temp = storage.temperature;
    const humidity = storage.humidity;
    const days = storage.days_stored || 0;

    const tempEl = $('temp-status');
    if (tempEl && temp != null) {
      if (temp < conditions.tempMin) {
        tempEl.textContent = '❄️ cold';
        tempEl.className = 'text-xs text-blue-600';
      } else if (temp > conditions.tempMax) {
        tempEl.textContent = '🔥 warm';
        tempEl.className = 'text-xs text-red-600';
      } else {
        tempEl.textContent = '✓ ok';
        tempEl.className = 'text-xs text-emerald-600';
      }
    }

    const humEl = $('humidity-status');
    if (humEl && humidity != null) {
      if (humidity < conditions.humMin) {
        humEl.textContent = '💨 dry';
        humEl.className = 'text-xs text-amber-600';
      } else if (humidity > conditions.humMax) {
        humEl.textContent = '💧 humid';
        humEl.className = 'text-xs text-red-600';
      } else {
        humEl.textContent = '✓ ok';
        humEl.className = 'text-xs text-emerald-600';
      }
    }

    const daysEl = $('days-status');
    if (daysEl) {
      const remaining = conditions.maxDays - days;
      if (remaining <= 7) {
        daysEl.textContent = `⚠️ ${remaining}d left`;
        daysEl.className = 'text-xs text-red-600';
      } else if (remaining <= 30) {
        daysEl.textContent = `${remaining}d left`;
        daysEl.className = 'text-xs text-amber-600';
      } else {
        daysEl.textContent = '✓ safe';
        daysEl.className = 'text-xs text-emerald-600';
      }
    }

    const riskEl = $('risk-status');
    const risk = String(storage.spoilage_risk || '').toLowerCase();
    if (riskEl) {
      if (risk === 'high') {
        riskEl.textContent = '⚠️ act now';
        riskEl.className = 'text-xs text-red-600';
      } else if (risk === 'medium') {
        riskEl.textContent = 'monitor';
        riskEl.className = 'text-xs text-amber-600';
      } else {
        riskEl.textContent = '✓ good';
        riskEl.className = 'text-xs text-emerald-600';
      }
    }
  }

  function drawChart(records) {
    const canvas = $('trend-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (!records || records.length < 2) {
      if (chart) { chart.destroy(); chart = null; }
      return;
    }

    const labels = records.map((_, i) => `D${i + 1}`);
    const data = records.map(r => r.price);

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
      return;
    }

    chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Price',
          data,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  async function refresh() {
    const commodity = $('commodity-select')?.value || 'Rice';
    const quantity = Number($('quantity-input')?.value || 10);

    try {
      const lang = window.getSelectedLanguage ? window.getSelectedLanguage() : 'en';
      const res = await fetch(`${ENDPOINT}?commodity=${encodeURIComponent(commodity)}&quantity=${quantity}&language=${lang}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();

      const sp = d.sell_prediction || {};
      const coldStorage = sp.cold_storage_suitability || {};
      const monitoring = d.monitoring || {};
      const storage = monitoring.storage_snapshot || {};

      // Source
      const srcEl = $('market-source');
      if (srcEl) srcEl.textContent = d.source || sp.source || 'Demo';

      // Decision
      const dec = getDecision(sp.decision);
      const decEl = $('decision');
      if (decEl) {
        decEl.textContent = dec.text;
        decEl.className = `text-2xl font-bold ${dec.class}`;
      }
      const decIconEl = $('decision-icon');
      if (decIconEl) decIconEl.textContent = dec.icon;

      // Reason
      const reasonEl = $('reason');
      if (reasonEl) reasonEl.textContent = sp.reason || '--';

      // Price
      const priceEl = $('current-price');
      if (priceEl) priceEl.textContent = formatCurrency(sp.current_price) + '/q';

      // Trend
      const trend = getTrendBadge(sp.trend);
      const trendEl = $('trend');
      if (trendEl) {
        trendEl.textContent = trend.text;
        trendEl.className = `text-xs font-medium ${trend.class}`;
      }

      // Spoilage risk
      const spoilEl = $('spoilage-risk');
      if (spoilEl) {
        const risk = String(sp.spoilage_risk || '').toLowerCase();
        spoilEl.textContent = sp.spoilage_risk || '--';
        spoilEl.className = `text-lg font-semibold ${
          risk === 'high' ? 'text-red-600' : risk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
        }`;
      }

      // Spoilage days
      const spoilageDaysEl = $('spoilage-days');
      if (spoilageDaysEl) {
        const risk = String(sp.spoilage_risk || '').toLowerCase();
        const days = risk === 'high' ? '2 days' : risk === 'medium' ? '7 days' : '14+ days';
        spoilageDaysEl.textContent = days;
      }

      // Profit calculations
      const price = sp.current_price || 0;
      const trendVal = String(sp.trend || '').toLowerCase();
      const trendPct = trendVal === 'rising' ? 0.03 : trendVal === 'falling' ? -0.02 : 0;
      const spoilageVal = String(sp.spoilage_risk || '').toLowerCase();
      const spoilagePct = spoilageVal === 'high' ? 0.05 : spoilageVal === 'medium' ? 0.02 : 0;

      const sellNowVal = price * quantity;
      const holdVal = price * quantity * (1 + trendPct - spoilagePct);
      const diff = holdVal - sellNowVal;

      const sellNowEl = $('sell-now');
      if (sellNowEl) sellNowEl.textContent = `₹${sellNowVal.toFixed(0)}`;

      const diffEl = $('profit-diff');
      if (diffEl) {
        diffEl.textContent = `${diff >= 0 ? '+' : ''}₹${diff.toFixed(0)}`;
        diffEl.className = `text-lg font-semibold ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`;
      }

      // Market Prices Overview
      const marketData = populateMarketPrices(commodity, sp.current_price);

      // AI Insights
      populateAIInsights(sp, commodity, marketData);

      // Trends Comparison
      populateTrendsComparison(marketData, commodity);

      // Storage
      const storageSrcEl = $('storage-source');
      if (storageSrcEl) storageSrcEl.textContent = storage.source || 'demo';

      const storageTempEl = $('storage-temp');
      if (storageTempEl) storageTempEl.textContent = formatValue(storage.temperature, '°C');

      const storageHumEl = $('storage-humidity');
      if (storageHumEl) storageHumEl.textContent = formatValue(storage.humidity, '%');

      const storageDaysEl = $('storage-days');
      if (storageDaysEl) storageDaysEl.textContent = formatValue(storage.days_stored);

      const storageRiskEl = $('storage-risk');
      if (storageRiskEl) storageRiskEl.textContent = storage.spoilage_risk || '--';

      // Cold guidance
      const coldEl = $('cold-guidance');
      if (coldEl) coldEl.textContent = coldStorage.guidance || 'Storage settings are suitable for this commodity.';

      // Storage status colors
      populateStorageStatus(storage, commodity);

      // Chart
      drawChart(sp.records || []);

    } catch (err) {
      console.warn('[Market] refresh error:', err);
    }
  }

  function init() {
    refresh();

    $('refresh-btn')?.addEventListener('click', refresh);
    $('commodity-select')?.addEventListener('change', refresh);
    $('quantity-input')?.addEventListener('change', refresh);

    window.addEventListener('languageChanged', refresh);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
