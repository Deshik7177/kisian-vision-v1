// home_saas.js – Home page SaaS theme (v7)

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ENDPOINT = '/home-data';
  const POLL_INTERVAL = 30000;
  
  // Selected location (stored in localStorage)
  let selectedLocation = localStorage.getItem('marketLocation') || 'vizianagaram';

  // Crop stage definitions with day ranges
  const STAGES = [
    { key: 'germination', name: 'Germination', minDay: 0, maxDay: 14 },
    { key: 'vegetative', name: 'Vegetative', minDay: 15, maxDay: 35 },
    { key: 'tillering', name: 'Tillering', minDay: 36, maxDay: 60 },
    { key: 'flowering', name: 'Flowering', minDay: 61, maxDay: 85 },
    { key: 'grain_filling', name: 'Grain Filling', minDay: 86, maxDay: 110 },
    { key: 'maturity', name: 'Maturity', minDay: 111, maxDay: 120 }
  ];
  const TOTAL_DAYS = 120; // Full crop cycle for rice

  function formatValue(value, suffix = '') {
    if (value === null || value === undefined || value === '') return '--';
    return `${value}${suffix}`;
  }

  function getRiskColor(risk) {
    const r = String(risk || '').toLowerCase();
    if (r.includes('high')) return 'text-red-600';
    if (r.includes('medium') || r.includes('moderate')) return 'text-amber-600';
    if (r.includes('low')) return 'text-emerald-600';
    return 'text-gray-900 dark:text-gray-50';
  }

  function getCurrentStageFromDays(days) {
    const d = Math.max(0, parseInt(days) || 0);
    for (const stage of STAGES) {
      if (d >= stage.minDay && d <= stage.maxDay) return stage;
    }
    return STAGES[STAGES.length - 1]; // Return maturity if beyond
  }

  function updateStageTimeline(daysSincePlanting, currentStageName) {
    const days = Math.max(0, parseInt(daysSincePlanting) || 0);
    const currentStage = getCurrentStageFromDays(days);
    
    // Update current progress section
    const stageNameEl = $('current-stage-name');
    const dayCountEl = $('current-day-count');
    const daysToHarvestEl = $('days-to-harvest');
    const progressBar = $('stage-progress-bar');

    if (stageNameEl) {
      stageNameEl.textContent = currentStageName || currentStage.name;
    }
    if (dayCountEl) {
      dayCountEl.textContent = `Day ${days}`;
    }
    if (daysToHarvestEl) {
      const remaining = Math.max(0, TOTAL_DAYS - days);
      daysToHarvestEl.textContent = remaining > 0 ? `${remaining} days` : 'Ready!';
    }
    if (progressBar) {
      const progress = Math.min(100, (days / TOTAL_DAYS) * 100);
      progressBar.style.width = `${progress}%`;
    }

    // Highlight current stage card and mark completed stages
    STAGES.forEach((stage, index) => {
      const el = $(`stage-${stage.key}`);
      if (!el) return;

      // Remove old classes
      el.classList.remove(
        'border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30',
        'border-gray-300', 'bg-gray-100', 'dark:bg-gray-700/50',
        'ring-2', 'ring-emerald-500', 'ring-offset-2'
      );

      if (stage.key === currentStage.key) {
        // Current stage - highlight
        el.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30', 'ring-2', 'ring-emerald-500', 'ring-offset-2');
      } else if (days > stage.maxDay) {
        // Completed stage
        el.classList.add('border-gray-300', 'bg-gray-100', 'dark:bg-gray-700/50');
        el.style.opacity = '0.6';
      } else {
        // Future stage
        el.style.opacity = '1';
      }
    });
  }

  function setStatus(isOnline) {
    const dot = $('status-dot');
    const text = $('status-text');
    if (!dot || !text) return;

    if (isOnline) {
      dot.classList.remove('bg-gray-400', 'bg-red-500');
      dot.classList.add('bg-emerald-500');
      text.textContent = 'Live';
    } else {
      dot.classList.remove('bg-emerald-500', 'bg-gray-400');
      dot.classList.add('bg-red-500');
      text.textContent = 'Offline';
    }
  }

  function extractActions(recommendation, stageTip) {
    const text = String(recommendation || '').trim();
    const numbered = text.match(/\d\)\s*[^\n]+/g) || [];
    const cleaned = numbered
      .map(item => item.replace(/^\d\)\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);

    if (cleaned.length) return cleaned;
    if (stageTip) return [String(stageTip)];
    return ['Keep monitoring your field daily.'];
  }

  function renderActions(actions) {
    const ul = $('home-actions');
    const countEl = $('action-count');
    if (!ul) return;

    if (!actions || !actions.length) {
      ul.innerHTML = `
        <li class="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-400"></span>
          <span class="text-sm text-gray-500 dark:text-gray-400">No recommendations available.</span>
        </li>`;
      if (countEl) countEl.textContent = '';
      return;
    }

    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
    ul.innerHTML = actions.map((txt, i) => `
      <li class="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[i % colors.length]}"></span>
        <span class="text-sm text-gray-700 dark:text-gray-200">${txt}</span>
      </li>`).join('');

    if (countEl) countEl.textContent = `${actions.length} action${actions.length > 1 ? 's' : ''}`;
  }

  function populateLocationDropdown(locations, selected) {
    const selectEl = $('location-select');
    if (!selectEl || !locations || !locations.length) return;
    
    selectEl.innerHTML = locations.map(loc => 
      `<option value="${loc.key}" ${loc.key === selected ? 'selected' : ''}>${loc.label}</option>`
    ).join('');
  }

  function renderMarketLocation(location) {
    const el = $('market-location');
    if (!el) return;
    
    // Just show "Mandi Prices" badge since location is in dropdown
    el.innerHTML = `<span class="text-[10px] text-gray-500 dark:text-gray-400">Mandi Prices</span>`;
  }

  function getConfidenceStyle(confidence) {
    switch (confidence) {
      case 'high': return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
      case 'medium': return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
      default: return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/50' };
    }
  }

  function renderPrices(dailyPrices) {
    const container = $('home-prices');
    if (!container) return;

    if (!dailyPrices || !dailyPrices.length) {
      container.innerHTML = `
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <div class="text-sm text-gray-500 dark:text-gray-400">No price data available</div>
        </div>`;
      return;
    }

    container.innerHTML = dailyPrices.slice(0, 5).map(item => {
      const todayPrice = item.price != null ? `₹${Number(item.price).toFixed(0)}` : '--';
      const trend = String(item.trend || 'stable').toLowerCase();
      const trendIcon = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';
      const trendColor = trend === 'rising' ? 'text-emerald-600' : trend === 'falling' ? 'text-red-600' : 'text-gray-500';
      
      // Unit info
      const unitDisplay = item.unit_display || 'per Quintal';
      
      // Tomorrow prediction
      const tomorrow = item.tomorrow || {};
      const tomorrowPrice = tomorrow.predicted_price != null ? `₹${Number(tomorrow.predicted_price).toFixed(0)}` : '--';
      const changePct = tomorrow.change_pct || 0;
      const changeIcon = changePct > 0 ? '↑' : changePct < 0 ? '↓' : '→';
      const changeColor = changePct > 0 ? 'text-emerald-600' : changePct < 0 ? 'text-red-600' : 'text-gray-500';
      const confidence = tomorrow.confidence || 'low';
      const confStyle = getConfidenceStyle(confidence);

      return `
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-semibold text-gray-900 dark:text-gray-50">${item.commodity}</div>
            <div class="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">${unitDisplay}</div>
          </div>
          
          <!-- Today's Price -->
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div class="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Today</div>
              <div class="text-lg font-bold text-gray-900 dark:text-gray-50">${todayPrice}</div>
            </div>
            <div class="text-xs font-medium ${trendColor}">${trendIcon} ${item.trend || 'Stable'}</div>
          </div>
          
          <!-- Tomorrow's Prediction -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Tomorrow</div>
              <div class="text-base font-semibold text-blue-600 dark:text-blue-400">${tomorrowPrice}</div>
            </div>
            <div class="text-right">
              <div class="text-xs font-medium ${changeColor}">${changeIcon} ${Math.abs(changePct).toFixed(1)}%</div>
              <div class="text-[10px] px-1.5 py-0.5 rounded ${confStyle.bg} ${confStyle.color} capitalize">${confidence}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function refresh() {
    try {
      const lang = window.getSelectedLanguage ? window.getSelectedLanguage() : 'en';
      const res = await fetch(`${ENDPOINT}?location=${selectedLocation}&language=${lang}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setStatus(true);

      // Update timestamp
      const updEl = $('last-updated');
      if (updEl) {
        updEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }

      const lifecycle = data.lifecycle || {};
      const field = lifecycle.field || {};
      
      // Populate location dropdown (only first time or if locations change)
      const market = data.market || {};
      populateLocationDropdown(market.available_locations, market.selected_location || selectedLocation);

      // Stage
      const stageEl = $('home-stage');
      if (stageEl) stageEl.textContent = formatValue(lifecycle.crop_stage);

      // Risk
      const riskEl = $('home-risk');
      if (riskEl) {
        const risk = lifecycle.risk_level || '--';
        riskEl.textContent = risk;
        riskEl.className = `mt-2 text-xl font-semibold ${getRiskColor(risk)}`;
      }

      // Temperature
      const tempEl = $('home-temp');
      if (tempEl) tempEl.textContent = formatValue(field.temperature, '°C');

      // Soil moisture
      const soilEl = $('home-soil');
      if (soilEl) soilEl.textContent = formatValue(field.soil_moisture, '%');

      // Update crop stage timeline
      const daysSincePlanting = lifecycle.days_since_planting || 0;
      const cropStage = lifecycle.crop_stage || '';
      updateStageTimeline(daysSincePlanting, cropStage);

      // Actions
      const actions = extractActions(lifecycle.recommendation, lifecycle.crop_stage_tip);
      renderActions(actions);

      // Market Prices + Location (market already declared above)
      renderMarketLocation(market.location);
      console.log('[Home] market.daily_prices:', market.daily_prices);
      renderPrices(market.daily_prices || []);

    } catch (err) {
      console.warn('[Home] refresh error:', err);
      setStatus(false);
    }
  }

  function handleLocationChange(event) {
    selectedLocation = event.target.value;
    localStorage.setItem('marketLocation', selectedLocation);
    refresh(); // Refresh data with new location
  }

  function init() {
    // Add location change listener
    const locationSelect = $('location-select');
    if (locationSelect) {
      locationSelect.addEventListener('change', handleLocationChange);
    }
    
    // Listen for language changes from global selector
    window.addEventListener('languageChanged', () => {
      refresh();
    });
    
    refresh();
    setInterval(refresh, POLL_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
