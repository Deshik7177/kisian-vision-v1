// saas_dashboard.js – Simplified Lifecycle Dashboard (v13)
// Only shows: Stage, Risk, Next Check, Node Status, Recommended Actions

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ENDPOINT = '/dashboard-data';
  const POLL_INTERVAL = 15000;
  const STALE_MS = 2 * 60 * 1000; // 2 min offline threshold

  let lastTs = null;
  let commodity = 'Rice';

  // Helper to get translation
  function t(key) {
    if (window.i18n && window.i18n.t) {
      return window.i18n.t(key);
    }
    // Fallback: return key without prefix
    return key.split('.').pop();
  }

  // ─────────────────────────────────────────────
  // Optimal Conditions Database (AI-driven recommendations)
  // Uses i18n keys for translations
  // ─────────────────────────────────────────────
  const OPTIMAL_CONDITIONS = {
    Rice: {
      Germination: {
        temp: { min: 25, max: 30 },
        humidity: { min: 80, max: 90 },
        irrigationKey: 'optimal.rice.germination.irrigation',
        irrigationReasonKey: 'optimal.rice.germination.irrigationReason',
        waterNeedsKey: 'optimal.rice.germination.waterNeeds',
        waterTipKey: 'optimal.rice.germination.waterTip',
        tipsKeys: [
          'optimal.rice.germination.tip1',
          'optimal.rice.germination.tip2',
          'optimal.rice.germination.tip3'
        ]
      },
      Seedling: {
        temp: { min: 25, max: 32 },
        humidity: { min: 70, max: 85 },
        irrigationKey: 'optimal.rice.seedling.irrigation',
        irrigationReasonKey: 'optimal.rice.seedling.irrigationReason',
        waterNeedsKey: 'optimal.rice.seedling.waterNeeds',
        waterTipKey: 'optimal.rice.seedling.waterTip',
        tipsKeys: [
          'optimal.rice.seedling.tip1',
          'optimal.rice.seedling.tip2',
          'optimal.rice.seedling.tip3'
        ]
      },
      Vegetative: {
        temp: { min: 28, max: 34 },
        humidity: { min: 60, max: 80 },
        irrigationKey: 'optimal.rice.vegetative.irrigation',
        irrigationReasonKey: 'optimal.rice.vegetative.irrigationReason',
        waterNeedsKey: 'optimal.rice.vegetative.waterNeeds',
        waterTipKey: 'optimal.rice.vegetative.waterTip',
        tipsKeys: [
          'optimal.rice.vegetative.tip1',
          'optimal.rice.vegetative.tip2',
          'optimal.rice.vegetative.tip3'
        ]
      },
      Reproductive: {
        temp: { min: 25, max: 30 },
        humidity: { min: 70, max: 80 },
        irrigationKey: 'optimal.rice.reproductive.irrigation',
        irrigationReasonKey: 'optimal.rice.reproductive.irrigationReason',
        waterNeedsKey: 'optimal.rice.reproductive.waterNeeds',
        waterTipKey: 'optimal.rice.reproductive.waterTip',
        tipsKeys: [
          'optimal.rice.reproductive.tip1',
          'optimal.rice.reproductive.tip2',
          'optimal.rice.reproductive.tip3'
        ]
      },
      Maturity: {
        temp: { min: 20, max: 28 },
        humidity: { min: 50, max: 70 },
        irrigationKey: 'optimal.rice.maturity.irrigation',
        irrigationReasonKey: 'optimal.rice.maturity.irrigationReason',
        waterNeedsKey: 'optimal.rice.maturity.waterNeeds',
        waterTipKey: 'optimal.rice.maturity.waterTip',
        tipsKeys: [
          'optimal.rice.maturity.tip1',
          'optimal.rice.maturity.tip2',
          'optimal.rice.maturity.tip3'
        ]
      }
    },
    // Default conditions for other crops
    default: {
      Germination: {
        temp: { min: 20, max: 28 },
        humidity: { min: 60, max: 75 },
        irrigationKey: 'optimal.default.germination.irrigation',
        irrigationReasonKey: 'optimal.default.germination.irrigationReason',
        waterNeedsKey: 'optimal.default.germination.waterNeeds',
        waterTipKey: 'optimal.default.germination.waterTip',
        tipsKeys: [
          'optimal.default.germination.tip1',
          'optimal.default.germination.tip2',
          'optimal.default.germination.tip3'
        ]
      },
      Seedling: {
        temp: { min: 22, max: 30 },
        humidity: { min: 55, max: 70 },
        irrigationKey: 'optimal.default.seedling.irrigation',
        irrigationReasonKey: 'optimal.default.seedling.irrigationReason',
        waterNeedsKey: 'optimal.default.seedling.waterNeeds',
        waterTipKey: 'optimal.default.seedling.waterTip',
        tipsKeys: [
          'optimal.default.seedling.tip1',
          'optimal.default.seedling.tip2',
          'optimal.default.seedling.tip3'
        ]
      },
      Vegetative: {
        temp: { min: 24, max: 32 },
        humidity: { min: 50, max: 65 },
        irrigationKey: 'optimal.default.vegetative.irrigation',
        irrigationReasonKey: 'optimal.default.vegetative.irrigationReason',
        waterNeedsKey: 'optimal.default.vegetative.waterNeeds',
        waterTipKey: 'optimal.default.vegetative.waterTip',
        tipsKeys: [
          'optimal.default.vegetative.tip1',
          'optimal.default.vegetative.tip2',
          'optimal.default.vegetative.tip3'
        ]
      },
      Reproductive: {
        temp: { min: 22, max: 30 },
        humidity: { min: 55, max: 70 },
        irrigationKey: 'optimal.default.reproductive.irrigation',
        irrigationReasonKey: 'optimal.default.reproductive.irrigationReason',
        waterNeedsKey: 'optimal.default.reproductive.waterNeeds',
        waterTipKey: 'optimal.default.reproductive.waterTip',
        tipsKeys: [
          'optimal.default.reproductive.tip1',
          'optimal.default.reproductive.tip2',
          'optimal.default.reproductive.tip3'
        ]
      },
      Maturity: {
        temp: { min: 20, max: 28 },
        humidity: { min: 45, max: 60 },
        irrigationKey: 'optimal.default.maturity.irrigation',
        irrigationReasonKey: 'optimal.default.maturity.irrigationReason',
        waterNeedsKey: 'optimal.default.maturity.waterNeeds',
        waterTipKey: 'optimal.default.maturity.waterTip',
        tipsKeys: [
          'optimal.default.maturity.tip1',
          'optimal.default.maturity.tip2',
          'optimal.default.maturity.tip3'
        ]
      }
    }
  };

  function getOptimalConditions(crop, stage) {
    // Normalize stage name
    let normalizedStage = 'Vegetative'; // default
    const stageLower = (stage || '').toLowerCase();
    
    if (stageLower.includes('germina') || stageLower.includes('sowing')) {
      normalizedStage = 'Germination';
    } else if (stageLower.includes('seedling') || stageLower.includes('emergence')) {
      normalizedStage = 'Seedling';
    } else if (stageLower.includes('vegetat') || stageLower.includes('tiller') || stageLower.includes('growth')) {
      normalizedStage = 'Vegetative';
    } else if (stageLower.includes('reprod') || stageLower.includes('flower') || stageLower.includes('heading') || stageLower.includes('boot')) {
      normalizedStage = 'Reproductive';
    } else if (stageLower.includes('matur') || stageLower.includes('ripen') || stageLower.includes('harvest')) {
      normalizedStage = 'Maturity';
    }

    // Get crop-specific or default conditions
    const cropConditions = OPTIMAL_CONDITIONS[crop] || OPTIMAL_CONDITIONS.default;
    return cropConditions[normalizedStage] || cropConditions.Vegetative;
  }

  function renderOptimalConditions(crop, stage, currentTemp, currentHumidity) {
    const conditions = getOptimalConditions(crop, stage);
    
    // Update stage badge
    const stageBadge = $('optimal-stage-badge');
    if (stageBadge) stageBadge.textContent = stage || t('optimal.unknown');

    // Temperature
    const tempEl = $('optimal-temp');
    const tempStatus = $('optimal-temp-status');
    if (tempEl) {
      tempEl.textContent = `${conditions.temp.min}-${conditions.temp.max}°C`;
    }
    if (tempStatus && currentTemp != null) {
      if (currentTemp < conditions.temp.min) {
        tempStatus.textContent = '❄️ ' + t('optimal.tooCold');
        tempStatus.className = 'mt-1 text-xs font-medium text-blue-600';
      } else if (currentTemp > conditions.temp.max) {
        tempStatus.textContent = '🔥 ' + t('optimal.tooHot');
        tempStatus.className = 'mt-1 text-xs font-medium text-red-600';
      } else {
        tempStatus.textContent = '✓ ' + t('optimal.inRange');
        tempStatus.className = 'mt-1 text-xs font-medium text-emerald-600';
      }
    } else if (tempStatus) {
      tempStatus.textContent = t('optimal.currentNA');
      tempStatus.className = 'mt-1 text-xs font-medium text-gray-500';
    }

    // Humidity
    const humEl = $('optimal-humidity');
    const humStatus = $('optimal-humidity-status');
    if (humEl) {
      humEl.textContent = `${conditions.humidity.min}-${conditions.humidity.max}%`;
    }
    if (humStatus && currentHumidity != null) {
      if (currentHumidity < conditions.humidity.min) {
        humStatus.textContent = '🏜️ ' + t('optimal.tooDry');
        humStatus.className = 'mt-1 text-xs font-medium text-amber-600';
      } else if (currentHumidity > conditions.humidity.max) {
        humStatus.textContent = '💧 ' + t('optimal.tooHumid');
        humStatus.className = 'mt-1 text-xs font-medium text-blue-600';
      } else {
        humStatus.textContent = '✓ ' + t('optimal.inRange');
        humStatus.className = 'mt-1 text-xs font-medium text-emerald-600';
      }
    } else if (humStatus) {
      humStatus.textContent = t('optimal.currentNA');
      humStatus.className = 'mt-1 text-xs font-medium text-gray-500';
    }

    // Irrigation time
    const irrigEl = $('optimal-irrigation');
    const irrigReason = $('optimal-irrigation-reason');
    if (irrigEl) irrigEl.textContent = t(conditions.irrigationKey);
    if (irrigReason) irrigReason.textContent = t(conditions.irrigationReasonKey);

    // Water needs
    const waterEl = $('optimal-water');
    const waterTip = $('optimal-water-tip');
    if (waterEl) waterEl.textContent = t(conditions.waterNeedsKey);
    if (waterTip) waterTip.textContent = t(conditions.waterTipKey);

    // Tips
    const tipsEl = $('optimal-tips');
    if (tipsEl && conditions.tipsKeys) {
      tipsEl.innerHTML = conditions.tipsKeys.map((tipKey, i) => {
        const colors = ['bg-teal-500', 'bg-emerald-500', 'bg-cyan-500'];
        return `<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${colors[i % colors.length]} text-[10px] text-white">${i + 1}</span>
          <span>${t(tipKey)}</span>
        </li>`;
      }).join('');
    }
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  function setNodeStatus(status, message) {
    const dot = $('node-dot');
    const statusEl = $('node-status');
    const metaEl = $('node-meta');
    const warn = $('offline-warning');
    if (!dot || !statusEl) return;

    // Reset classes
    dot.classList.remove('bg-gray-400', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500', 'kv-pulse');
    statusEl.classList.remove('text-red-600', 'text-emerald-600', 'text-amber-600', 'text-gray-500');

    if (status === 'online') {
      dot.classList.add('bg-emerald-500', 'kv-pulse');
      statusEl.textContent = 'Online';
      statusEl.classList.add('text-emerald-600');
      if (warn) warn.classList.add('hidden');
    } else if (status === 'offline') {
      dot.classList.add('bg-red-500');
      statusEl.textContent = 'Offline';
      statusEl.classList.add('text-red-600');
      if (warn) warn.classList.remove('hidden');
    } else if (status === 'not-linked') {
      dot.classList.add('bg-amber-500');
      statusEl.textContent = 'No Device';
      statusEl.classList.add('text-amber-600');
      if (warn) warn.classList.add('hidden');
    } else {
      dot.classList.add('bg-gray-400');
      statusEl.textContent = '--';
      statusEl.classList.add('text-gray-500');
    }

    if (metaEl && message) {
      metaEl.textContent = message;
    }
  }

  function setOnline(isOnline) {
    setNodeStatus(isOnline ? 'online' : 'offline', null);
  }

  // ─────────────────────────────────────────────
  // Temperature Trend Chart
  // ─────────────────────────────────────────────
  let tempChart = null;

  function renderTempChart(series) {
    const canvas = $('tempChart');
    const chartNote = $('chart-note');
    
    if (!canvas) {
      console.warn('[Chart] Canvas element not found');
      return;
    }
    
    if (typeof Chart === 'undefined') {
      console.warn('[Chart] Chart.js not loaded');
      if (chartNote) chartNote.textContent = 'Chart library not loaded';
      return;
    }

    // Prepare data - limit to last 48 points for readability
    const data = (series || []).slice(-48);
    if (!data.length) {
      if (chartNote) chartNote.textContent = 'No data';
      return;
    }

    // Update chart note
    if (chartNote) {
      const minVal = Math.min(...data.map(p => p.v)).toFixed(1);
      const maxVal = Math.max(...data.map(p => p.v)).toFixed(1);
      chartNote.textContent = `${minVal}°C - ${maxVal}°C`;
    }

    const labels = data.map(p => {
      const d = new Date(p.t);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    });
    const values = data.map(p => p.v);

    // Destroy existing chart if any
    if (tempChart) {
      tempChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    tempChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: values,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: isDark ? '#1f2937' : '#fff',
            titleColor: isDark ? '#f3f4f6' : '#111827',
            bodyColor: isDark ? '#d1d5db' : '#4b5563',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: {
              color: isDark ? '#9ca3af' : '#6b7280',
              maxTicksLimit: 6,
              font: { size: 10 }
            }
          },
          y: {
            display: true,
            grid: { color: isDark ? '#374151' : '#f3f4f6' },
            ticks: {
              color: isDark ? '#9ca3af' : '#6b7280',
              font: { size: 10 },
              callback: v => v + '°C'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  function buildTopActions(recommendations) {
    if (!recommendations || !recommendations.length) {
      return ['No actions needed right now.'];
    }
    // Take top 5 actions
    return recommendations.slice(0, 5);
  }

  function renderActionList(actions) {
    const ul = $('top-action');
    const meta = $('top-action-meta');
    if (!ul) return;

    if (!actions || !actions.length) {
      ul.innerHTML = `
        <li class="flex items-start gap-2 rounded-lg bg-gray-100/50 p-2.5 dark:bg-gray-800/30">
          <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-400 text-[10px] text-white">—</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">No recommendations available.</span>
        </li>`;
      if (meta) meta.textContent = '';
      return;
    }

    ul.innerHTML = actions.map((txt, i) => {
      const bgColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
      const wrapBgs = ['bg-emerald-100/50 dark:bg-emerald-900/20', 'bg-blue-100/50 dark:bg-blue-900/20', 'bg-amber-100/50 dark:bg-amber-900/20', 'bg-purple-100/50 dark:bg-purple-900/20', 'bg-rose-100/50 dark:bg-rose-900/20'];
      const color = bgColors[i % bgColors.length];
      const wrapBg = wrapBgs[i % wrapBgs.length];
      return `
        <li class="flex items-start gap-2 rounded-lg ${wrapBg} p-2.5">
          <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${color} text-[10px] text-white">✓</span>
          <span class="text-sm text-gray-700 dark:text-gray-200">${txt}</span>
        </li>`;
    }).join('');

    if (meta) meta.textContent = `${actions.length} action${actions.length > 1 ? 's' : ''}`;
  }

  // ─────────────────────────────────────────────
  // Main refresh
  // ─────────────────────────────────────────────
  async function refresh() {
    try {
      const lang = window.getSelectedLanguage ? window.getSelectedLanguage() : 'en';
      const res = await fetch(`${ENDPOINT}?commodity=${encodeURIComponent(commodity)}&language=${lang}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();

      // Get data from correct paths
      const fieldData = d.field_data || {};
      const lifecycle = d.lifecycle || {};
      const riskScores = d.risk_scores || {};
      const nodeStatus = d.node_status || {};

      // Check if device is linked to this commodity
      const deviceLinked = nodeStatus.device_linked === true;
      const linkedCrop = nodeStatus.linked_crop;

      // If no device is linked to this commodity, show appropriate message
      if (!deviceLinked) {
        setNodeStatus('not-linked', `No device linked to ${commodity}`);
        
        // Reset all sensor values to --
        const tempEl = $('kpi-temp-value');
        if (tempEl) tempEl.textContent = '--';
        const tempTrendEl = $('kpi-temp-trend');
        if (tempTrendEl) tempTrendEl.textContent = 'No device linked';
        
        const humEl = $('kpi-hum-value');
        if (humEl) humEl.textContent = '--';
        const humTrendEl = $('kpi-hum-trend');
        if (humTrendEl) humTrendEl.textContent = 'No device linked';
        
        const soilEl = $('kpi-soil-value');
        if (soilEl) soilEl.textContent = '--';
        const soilTrendEl = $('kpi-soil-trend');
        if (soilTrendEl) soilTrendEl.textContent = 'No device linked';

        // Reset other UI elements
        const stageEl = $('stage');
        if (stageEl) stageEl.textContent = '--';
        
        const riskEl = $('risk');
        if (riskEl) {
          riskEl.textContent = '--';
          riskEl.classList.remove('text-emerald-600', 'text-amber-600', 'text-red-600');
        }

        const chartNote = $('chart-note');
        if (chartNote) chartNote.textContent = 'No data';

        // Show message in sensor status
        const sensorStatusEl = $('sensor-status');
        if (sensorStatusEl) {
          sensorStatusEl.innerHTML = `
            <div class="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-50 p-3 shadow-sm dark:bg-gray-800/50">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-lg shadow-sm">⚠️</div>
              <span class="text-sm font-medium text-amber-600">No field device linked to ${commodity}</span>
            </div>
            <div class="text-sm text-indigo-500/80 mt-2 ml-11">Register a device for this crop in the Farmer page to enable AI analysis.</div>
          `;
        }

        // Show message in rain monitoring
        const rainStatusEl = $('rain-status');
        if (rainStatusEl) {
          rainStatusEl.innerHTML = '<div class="text-sm text-gray-500">No device linked</div>';
        }

        // Clear actions
        renderActionList([]);

        // Clear chart
        if (tempChart) {
          tempChart.destroy();
          tempChart = null;
        }

        return;
      }

      // ─── Sensor Values ───
      // Temperature
      const tempEl = $('kpi-temp-value');
      if (tempEl) {
        const temp = fieldData.temperature;
        tempEl.textContent = temp != null ? `${temp.toFixed(1)}°C` : '--';
      }
      const tempTrendEl = $('kpi-temp-trend');
      if (tempTrendEl) {
        const temp = fieldData.temperature;
        if (temp != null) {
          tempTrendEl.textContent = temp >= 35 ? 'Heat stress risk' : temp <= 15 ? 'Cold stress risk' : 'Normal range';
        } else {
          tempTrendEl.textContent = '--';
        }
      }

      // Humidity
      const humEl = $('kpi-hum-value');
      if (humEl) {
        const hum = fieldData.humidity;
        humEl.textContent = hum != null ? `${hum.toFixed(1)}%` : '--';
      }
      const humTrendEl = $('kpi-hum-trend');
      if (humTrendEl) {
        const hum = fieldData.humidity;
        if (hum != null) {
          humTrendEl.textContent = hum >= 85 ? 'Disease risk high' : hum <= 40 ? 'Low humidity' : 'Normal range';
        } else {
          humTrendEl.textContent = '--';
        }
      }

      // Soil Moisture
      const soilEl = $('kpi-soil-value');
      if (soilEl) {
        const soil = fieldData.soil_moisture;
        soilEl.textContent = soil != null ? `${soil.toFixed(1)}%` : '--';
      }
      const soilTrendEl = $('kpi-soil-trend');
      if (soilTrendEl) {
        const soil = fieldData.soil_moisture;
        if (soil != null) {
          soilTrendEl.textContent = soil < 25 ? 'Needs irrigation' : soil > 80 ? 'Waterlogged risk' : 'Optimal';
        } else {
          soilTrendEl.textContent = '--';
        }
      }

      // Timestamp & online check (use field_data.created_at or node_status.field_live)
      const ts = fieldData.created_at ? new Date(fieldData.created_at) : null;
      lastTs = ts;
      const isOnline = nodeStatus.field_live === true || (ts && (Date.now() - ts.getTime() < STALE_MS));
      setNodeStatus(isOnline ? 'online' : 'offline', ts ? `Last seen ${ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : null);

      // Last updated
      const updEl = $('last-updated');
      if (updEl && ts) {
        updEl.textContent = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }

      // Stage (from lifecycle.crop_stage)
      const stageEl = $('stage');
      if (stageEl) {
        stageEl.textContent = lifecycle.crop_stage || '--';
      }

      // Risk (from risk_scores.risk_level)
      const riskEl = $('risk');
      const riskLevel = riskScores.risk_level || '--';
      if (riskEl) {
        riskEl.textContent = riskLevel;
        riskEl.classList.remove('text-emerald-600', 'text-amber-600', 'text-red-600');
        if (riskLevel.toLowerCase().includes('low')) {
          riskEl.classList.add('text-emerald-600');
        } else if (riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('severe')) {
          riskEl.classList.add('text-red-600');
        } else {
          riskEl.classList.add('text-amber-600');
        }
      }

      // Next check
      const nextEl = $('ai-next');
      if (nextEl) {
        if (riskLevel.toLowerCase().includes('high')) {
          nextEl.textContent = 'In 30 min';
        } else if (riskLevel.toLowerCase().includes('moderate') || riskLevel.toLowerCase().includes('medium')) {
          nextEl.textContent = 'In 2 hours';
        } else {
          nextEl.textContent = 'Tomorrow';
        }
      }

      // ─── Optimal Growing Conditions ───
      const currentStage = lifecycle.crop_stage || 'Vegetative';
      renderOptimalConditions(commodity, currentStage, fieldData.temperature, fieldData.humidity);

      // Recommended Actions (from lifecycle.crop_stage_actions or parse recommendation)
      let actions = lifecycle.crop_stage_actions || [];
      if (!actions.length && d.recommendation) {
        // Parse recommendation string for numbered items
        const matches = String(d.recommendation).match(/\d\)\s*[^\n]+/g) || [];
        actions = matches.map(m => m.replace(/^\d\)\s*/, '').trim()).filter(Boolean);
      }
      renderActionList(actions);

      // ─── AI Sensor Analysis ───
      const sensorStatusEl = $('sensor-status');
      if (sensorStatusEl) {
        const temp = fieldData.temperature;
        const hum = fieldData.humidity;
        const soil = fieldData.soil_moisture;
        const alerts = [];

        if (temp != null) {
          if (temp >= 35) alerts.push({ icon: '🌡️', text: 'Temperature high - heat stress risk', color: 'text-red-600', bg: 'from-red-100 to-orange-50', border: 'border-red-200' });
          else if (temp <= 15) alerts.push({ icon: '❄️', text: 'Temperature low - cold stress risk', color: 'text-blue-600', bg: 'from-blue-100 to-cyan-50', border: 'border-blue-200' });
          else alerts.push({ icon: '✓', text: `Temperature normal (${temp.toFixed(1)}°C)`, color: 'text-emerald-600', bg: 'from-emerald-100 to-green-50', border: 'border-emerald-200' });
        }

        if (hum != null) {
          if (hum >= 85) alerts.push({ icon: '💧', text: 'Humidity very high - disease risk', color: 'text-amber-600', bg: 'from-amber-100 to-yellow-50', border: 'border-amber-200' });
          else if (hum <= 40) alerts.push({ icon: '🏜️', text: 'Humidity low - consider misting', color: 'text-amber-600', bg: 'from-amber-100 to-yellow-50', border: 'border-amber-200' });
          else alerts.push({ icon: '✓', text: `Humidity normal (${hum.toFixed(1)}%)`, color: 'text-emerald-600', bg: 'from-emerald-100 to-green-50', border: 'border-emerald-200' });
        }

        if (soil != null) {
          if (soil < 25) alerts.push({ icon: '🚿', text: 'Soil dry - irrigate today', color: 'text-red-600', bg: 'from-red-100 to-orange-50', border: 'border-red-200' });
          else if (soil > 80) alerts.push({ icon: '🌊', text: 'Soil waterlogged - check drainage', color: 'text-amber-600', bg: 'from-amber-100 to-yellow-50', border: 'border-amber-200' });
          else alerts.push({ icon: '✓', text: `Soil moisture optimal (${soil.toFixed(1)}%)`, color: 'text-emerald-600', bg: 'from-emerald-100 to-green-50', border: 'border-emerald-200' });
        }

        sensorStatusEl.innerHTML = alerts.map(a => `
          <div class="flex items-center gap-3 rounded-xl border ${a.border} bg-gradient-to-r ${a.bg} p-3 shadow-sm transition-all hover:shadow-md dark:bg-gray-800/50 dark:border-opacity-50">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-lg shadow-sm dark:bg-gray-700">${a.icon}</div>
            <span class="text-sm font-medium ${a.color} dark:opacity-90">${a.text}</span>
          </div>
        `).join('') || '<div class="text-sm text-indigo-500">No sensor data available for AI analysis</div>';
      }

      // ─── Rain Status (Top Card) ───
      const rainDetected = fieldData.rain_detected;
      const rainRaw = fieldData.rain_raw;
      const daysPlanted = fieldData.days_since_planting;
      const rainHistory = d.rain_history || fieldData.rain_history || [];
      const totalRainfall = d.total_rainfall_mm || fieldData.total_rainfall_mm || 0;
      const rainEvents = d.rain_events || fieldData.rain_events || rainHistory.length || 0;
      const lastRainDate = d.last_rain_date || fieldData.last_rain_date || null;

      // Update rain KPI card at top
      const rainValueEl = $('kpi-rain-value');
      const rainTrendEl = $('kpi-rain-trend');
      const rainIconEl = $('rain-icon');
      
      if (rainValueEl) {
        if (rainDetected === 1 || rainDetected === true) {
          rainValueEl.textContent = 'Raining';
          rainValueEl.className = 'mt-2 text-2xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400';
          if (rainIconEl) rainIconEl.textContent = '🌧️';
        } else {
          rainValueEl.textContent = 'Clear';
          rainValueEl.className = 'mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50';
          if (rainIconEl) rainIconEl.textContent = '☀️';
        }
      }
      if (rainTrendEl) {
        if (rainRaw != null) {
          const rainPct = Math.max(0, Math.min(100, ((4095 - rainRaw) / 4095) * 100));
          rainTrendEl.textContent = `Sensor: ${rainPct.toFixed(0)}% moisture`;
        } else {
          rainTrendEl.textContent = `${rainEvents} rain events this season`;
        }
      }

      // ─── Rain Monitoring Section ───
      const rainStatusEl = $('rain-status');
      const rainTotalEl = $('rain-total');
      const rainEventsEl = $('rain-events');
      const lastRainEl = $('last-rain-date');
      const rainBadgeEl = $('rain-badge');

      // Update rain stats
      if (rainTotalEl) rainTotalEl.textContent = `${totalRainfall.toFixed(1)} mm`;
      if (rainEventsEl) rainEventsEl.textContent = String(rainEvents);
      if (lastRainEl) {
        if (lastRainDate) {
          const date = new Date(lastRainDate);
          const now = new Date();
          const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) {
            lastRainEl.textContent = 'Today';
          } else if (diffDays === 1) {
            lastRainEl.textContent = 'Yesterday';
          } else {
            lastRainEl.textContent = `${diffDays} days ago`;
          }
        } else {
          lastRainEl.textContent = 'No recent rain';
        }
      }

      // Show/hide raining badge
      if (rainBadgeEl) {
        if (rainDetected === 1 || rainDetected === true) {
          rainBadgeEl.classList.remove('hidden');
          rainBadgeEl.classList.add('flex');
        } else {
          rainBadgeEl.classList.add('hidden');
          rainBadgeEl.classList.remove('flex');
        }
      }

      if (rainStatusEl) {
        let rainHtml = '';

        // Rain status with enhanced styling
        if (rainDetected === 1 || rainDetected === true) {
          rainHtml += `<div class="flex items-center gap-3 rounded-lg bg-cyan-100/70 p-3 dark:bg-cyan-900/30">
            <span class="text-xl">🌧️</span>
            <div>
              <div class="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Rain detected!</div>
              <div class="text-xs text-cyan-600 dark:text-cyan-400">Consider pausing irrigation</div>
            </div>
          </div>`;
        } else {
          rainHtml += `<div class="flex items-center gap-3 rounded-lg bg-white/60 p-3 dark:bg-gray-800/30">
            <span class="text-xl">☀️</span>
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">No rain currently</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Normal irrigation schedule</div>
            </div>
          </div>`;
        }

        // Rain sensor value
        if (rainRaw != null) {
          const rainPct = Math.max(0, Math.min(100, ((4095 - rainRaw) / 4095) * 100));
          const sensorColor = rainPct > 50 ? 'text-cyan-600' : 'text-gray-600';
          rainHtml += `<div class="flex items-center gap-3 rounded-lg bg-white/60 p-3 dark:bg-gray-800/30">
            <span class="text-xl">📊</span>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Rain sensor</span>
                <span class="text-sm font-bold ${sensorColor}">${rainPct.toFixed(0)}%</span>
              </div>
              <div class="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500" style="width: ${rainPct}%"></div>
              </div>
            </div>
          </div>`;
        }

        // Days since planting
        if (daysPlanted != null) {
          const stage = daysPlanted <= 15 ? 'Seedling' : daysPlanted <= 45 ? 'Vegetative' : daysPlanted <= 75 ? 'Reproductive' : 'Maturity';
          rainHtml += `<div class="flex items-center gap-3 rounded-lg bg-white/60 p-3 dark:bg-gray-800/30">
            <span class="text-xl">🌱</span>
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Day ${daysPlanted} since planting</div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400">${stage} stage</div>
            </div>
          </div>`;
        }

        rainStatusEl.innerHTML = rainHtml || '<div class="text-sm text-gray-500 p-3">No rain data available</div>';
      }

      // ─── Temperature Trend Chart ───
      const tempSeries = d.temperature_series_24h || [];
      renderTempChart(tempSeries);

    } catch (err) {
      console.warn('[Dashboard] refresh error:', err);
      setOnline(false);
    }
  }

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  function init() {
    // Translate static UI elements
    if (window.i18n && window.i18n.translatePage) {
      window.i18n.translatePage();
    }

    // Commodity selector
    const sel = $('commodity-select');
    if (sel) {
      sel.addEventListener('change', () => {
        commodity = sel.value;
        refresh();
      });
    }

    // Listen for language changes from global selector
    window.addEventListener('languageChanged', () => {
      if (window.i18n && window.i18n.translatePage) {
        window.i18n.translatePage();
      }
      refresh();
    });

    // Initial load + polling
    refresh();
    setInterval(refresh, POLL_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
