// disease_saas.js – Disease Detection SaaS theme (v2)

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  let stream = null;

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    const video = $('camera-stream');
    const container = $('camera-container');
    const btn = $('camera-btn');
    
    if (video) video.srcObject = null;
    if (container) container.classList.add('hidden');
    if (btn) btn.innerHTML = `
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      Camera`;
  }

  async function startCamera() {
    const constraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = $('camera-stream');
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
  }

  function setStatus(text) {
    const el = $('status-text');
    if (el) el.textContent = text;
  }

  function showResults(result) {
    const section = $('result-section');
    const imgContainer = $('image-container');
    const predictions = $('predictions');
    
    if (!section || !imgContainer || !predictions) return;
    
    section.classList.remove('hidden');
    imgContainer.innerHTML = '';
    predictions.innerHTML = '';

    // Show image
    if (result.image_url) {
      const img = document.createElement('img');
      img.src = result.image_url;
      img.className = 'w-full rounded-lg';
      imgContainer.appendChild(img);
    }

    const suggestions = result.suggestions || {};
    const boxes = result.boxes || [];
    // Check if image is not a plant (human photo, random object, etc.)
    const isNotPlant = boxes.length === 0 && result.is_plant_image === false;
    const notPlantInBoxes = boxes.some(b => 
      String(b.class_name || '').toLowerCase().includes('not a plant')
    );

    if (isNotPlant || notPlantInBoxes) {
      predictions.innerHTML = `
        <div class="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-yellow-950/30">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <svg class="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <div class="text-lg font-bold text-amber-800 dark:text-amber-200">📷 Not a Plant Image</div>
              <div class="text-sm text-amber-700 dark:text-amber-300">Unable to analyze for plant diseases</div>
            </div>
          </div>
          <div class="mt-4 rounded-lg bg-white/60 p-3 dark:bg-gray-800/50">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              The uploaded image doesn't appear to contain plant or leaf content. Please upload a clear photo of a plant leaf for disease detection.
            </p>
            <div class="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <span>💡</span>
              <span>For best results, take a close-up photo of the plant leaf in good lighting conditions.</span>
            </div>
          </div>
        </div>`;
      return;
    }
    // Check if healthy or no detection
    // Remove healthy plant logic, only show if no boxes
    if (boxes.length === 0) {
      predictions.innerHTML = `
        <div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-green-950/30">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <svg class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div class="text-lg font-bold text-emerald-800 dark:text-emerald-200">No disease detected</div>
              <div class="text-sm text-emerald-700 dark:text-emerald-300">No diseases detected or not a valid plant image</div>
            </div>
          </div>
          <div class="mt-4 rounded-lg bg-white/60 p-3 dark:bg-gray-800/50">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Please upload a clear photo of a plant leaf for disease detection, or continue regular monitoring if no disease is detected.
            </p>
          </div>
        </div>`;
      return;
    }

    // Show disease predictions with enhanced UI
    Object.entries(suggestions).forEach(([disease, suggestion]) => {
      const div = document.createElement('div');
      div.className = 'rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:border-red-900/40 dark:from-red-950/30 dark:to-orange-950/30 shadow-sm';
      
      // Parse suggestion into numbered steps if available
      let formattedSuggestion = suggestion || 'No specific recommendation.';
      
      // Check if there are numbered steps in the suggestion
      const hasNumberedSteps = /\d\)/.test(formattedSuggestion);
      
      if (hasNumberedSteps) {
        // Split by number patterns and create list
        const steps = formattedSuggestion.split(/\s*\d\)\s*/).filter(s => s.trim());
        formattedSuggestion = `
          <ul class="space-y-2">
            ${steps.map((step, i) => `
              <li class="flex items-start gap-2">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">${i + 1}</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">${step.trim()}</span>
              </li>
            `).join('')}
          </ul>
        `;
      } else {
        formattedSuggestion = `<p class="text-sm text-gray-700 dark:text-gray-300">${formattedSuggestion}</p>`;
      }

      div.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <div class="text-lg font-bold text-red-700 dark:text-red-400">⚠️ ${disease}</div>
            <div class="text-xs font-medium text-red-500 dark:text-red-500">Disease Detected</div>
          </div>
        </div>
        
        <div class="rounded-lg bg-white/70 p-4 dark:bg-gray-800/50">
          <div class="flex items-center gap-2 mb-3">
            <svg class="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm font-semibold text-amber-700 dark:text-amber-300">What to do next:</span>
          </div>
          ${formattedSuggestion}
        </div>
      `;
      predictions.appendChild(div);
    });
  }

  function init() {
    // Translate static UI elements
    if (window.i18n && window.i18n.translatePage) {
      window.i18n.translatePage();
    }

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      if (window.i18n && window.i18n.translatePage) {
        window.i18n.translatePage();
      }
    });

    const cameraBtn = $('camera-btn');
    const captureBtn = $('capture-btn');
    const fileInput = $('file-input');
    const uploadBtn = $('upload-btn');
    const cropSelect = $('crop-select');
    const selectedFile = $('selected-file');

    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (selectedFile) {
          selectedFile.textContent = file ? `Selected: ${file.name}` : 'No file selected';
        }
      });
    }

    // Camera toggle
    if (cameraBtn) {
      cameraBtn.addEventListener('click', async () => {
        if (stream) {
          stopCamera();
          setStatus('Camera closed.');
          return;
        }

        try {
          await startCamera();
          const container = $('camera-container');
          if (container) container.classList.remove('hidden');
          cameraBtn.innerHTML = `
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            Close`;
          setStatus('Camera is active. Capture a photo.');
        } catch (err) {
          setStatus('Could not access camera. Please allow permission.');
        }
      });
    }

    // Capture photo
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        const video = $('camera-stream');
        const canvas = $('canvas');
        if (!video || !video.srcObject || !canvas) {
          setStatus('Camera is not active.');
          return;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
          const file = new File([blob], 'capture.png', { type: 'image/png' });
          const dt = new DataTransfer();
          dt.items.add(file);
          if (fileInput) fileInput.files = dt.files;
          if (selectedFile) selectedFile.textContent = 'Selected: capture.png';
          stopCamera();
          setStatus('Photo captured. Click Analyze to predict.');
        }, 'image/png');
      });
    }

    // Upload and predict
    if (uploadBtn) {
      uploadBtn.addEventListener('click', async () => {
        if (!fileInput || !fileInput.files[0]) {
          alert('Please select a file or capture a photo.');
          return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('language', window.getSelectedLanguage ? window.getSelectedLanguage() : 'en');
        formData.append('crop', cropSelect ? cropSelect.value : 'rice');

        try {
          uploadBtn.disabled = true;
          uploadBtn.innerHTML = `
            <svg class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Analyzing...`;
          setStatus('Analyzing image...');

          const res = await fetch('/predict', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result = await res.json();
          showResults(result);
          setStatus('Analysis complete.');

        } catch (err) {
          console.error('[Disease] predict error:', err);
          setStatus('Error analyzing image. Please try again.');
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = `
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Analyze`;
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
