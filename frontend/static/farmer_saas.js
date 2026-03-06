// farmer_saas.js – Admin Setup (v7) - PIN protected, URL access only with Edit/Delete/Search

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ADMIN_PIN = '1234'; // Default admin PIN
  let selectedFarmerId = 0;
  let editingFarmerId = 0; // Track which farmer is being edited
  let allFarmers = [];
  let searchQuery = ''; // Current search filter

  // ================ PIN GATE LOGIC ================

  function isUnlocked() {
    return sessionStorage.getItem('admin_unlocked') === '1';
  }

  function setUnlocked(unlocked) {
    if (unlocked) {
      sessionStorage.setItem('admin_unlocked', '1');
    } else {
      sessionStorage.removeItem('admin_unlocked');
    }
    updatePageView();
  }

  function updatePageView() {
    const pinGate = $('pin-gate');
    const adminContent = $('admin-content');
    
    if (isUnlocked()) {
      if (pinGate) pinGate.classList.add('hidden');
      if (adminContent) adminContent.classList.remove('hidden');
    } else {
      if (pinGate) pinGate.classList.remove('hidden');
      if (adminContent) adminContent.classList.add('hidden');
    }
  }

  function getEnteredPIN() {
    const p1 = $('pin-1')?.value || '';
    const p2 = $('pin-2')?.value || '';
    const p3 = $('pin-3')?.value || '';
    const p4 = $('pin-4')?.value || '';
    return p1 + p2 + p3 + p4;
  }

  function clearPINInputs() {
    for (let i = 1; i <= 4; i++) {
      const input = $(`pin-${i}`);
      if (input) input.value = '';
    }
    $('pin-1')?.focus();
  }

  async function verifyPIN() {
    const enteredPIN = getEnteredPIN();
    
    if (enteredPIN.length !== 4) {
      showPinError('Enter all 4 digits');
      return;
    }

    // Try server verification first, fallback to local
    try {
      const res = await fetch('/verify-setup-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_pin: enteredPIN }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.valid === true) {
          setUnlocked(true);
          loadFarmers();
          return;
        }
      }
    } catch {
      // Fallback to local PIN check
      console.log('[Farmer] Server PIN check failed, using local');
    }

    // Local fallback
    if (enteredPIN === ADMIN_PIN) {
      setUnlocked(true);
      loadFarmers();
    } else {
      showPinError('Invalid PIN. Try again.');
      clearPINInputs();
    }
  }

  function showPinError(msg) {
    const errorEl = $('pin-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
      setTimeout(() => errorEl.classList.add('hidden'), 3000);
    }
  }

  function setupPINInputs() {
    const inputs = [1, 2, 3, 4].map(i => $(`pin-${i}`));
    
    inputs.forEach((input, idx) => {
      if (!input) return;
      
      // Auto-focus next input on entry
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val && idx < 3) {
          inputs[idx + 1]?.focus();
        }
        // Auto-submit when all 4 entered
        if (idx === 3 && val) {
          verifyPIN();
        }
      });
      
      // Handle backspace to go to previous
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1]?.focus();
        }
        if (e.key === 'Enter') {
          verifyPIN();
        }
      });
    });
  }

  function lockPage() {
    setUnlocked(false);
    clearPINInputs();
  }

  // ================ FARMER LOGIC ================

  function setSelectedFarmer(farmer) {
    const textEl = $('selected-farmer-text');
    if (!farmer || !farmer.id) {
      selectedFarmerId = 0;
      if (textEl) textEl.textContent = 'Selected: New Farmer';
      localStorage.removeItem('last_farmer_id');
      localStorage.removeItem('last_farmer_name');
      return;
    }
    selectedFarmerId = Number(farmer.id);
    const displayName = farmer.farmer_name.length > 12 
      ? farmer.farmer_name.substring(0, 10) + '...' 
      : farmer.farmer_name;
    if (textEl) textEl.textContent = `Selected: ${farmer.farmer_name} (#${farmer.id})`;
    localStorage.setItem('last_farmer_id', String(farmer.id));
    localStorage.setItem('last_farmer_name', displayName);
  }

  function applyFarmer(farmer) {
    if (!farmer) return;
    
    const nameEl = $('farmer-name');
    const phoneEl = $('farmer-phone');
    const villageEl = $('farmer-village');
    const areaEl = $('field-area');
    const pinEl = $('farmer-pin');
    
    if (nameEl) nameEl.value = farmer.farmer_name || '';
    if (phoneEl) phoneEl.value = farmer.phone || '';
    if (villageEl) villageEl.value = farmer.village || '';
    if (areaEl) areaEl.value = farmer.field_area_m2 || 2500;
    if (pinEl) pinEl.value = farmer.pin || '';
    
    setSelectedFarmer(farmer);
  }

  function clearForm() {
    ['farmer-name', 'farmer-phone', 'farmer-village', 'farmer-pin', 'device-id'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    const areaEl = $('field-area');
    if (areaEl) areaEl.value = 2500;
    const daysEl = $('days-planted');
    if (daysEl) daysEl.value = 0;
    editingFarmerId = 0;
    updateFormMode();
  }

  function updateFormMode() {
    const btn = $('register-farmer-btn');
    const formTitle = $('farmer-form-title');
    const cancelBtn = $('cancel-edit-btn');
    
    if (editingFarmerId) {
      if (btn) btn.textContent = '💾 Update Farmer';
      if (formTitle) formTitle.textContent = 'Edit Farmer';
      if (cancelBtn) cancelBtn.classList.remove('hidden');
    } else {
      if (btn) btn.textContent = '➕ Register Farmer';
      if (formTitle) formTitle.textContent = 'Register Farmer';
      if (cancelBtn) cancelBtn.classList.add('hidden');
    }
  }

  async function editFarmer(farmerId) {
    const farmer = allFarmers.find(f => f.id === farmerId);
    if (!farmer) return;
    
    editingFarmerId = farmerId;
    applyFarmer(farmer);
    updateFormMode();
    
    // Load device details for this farmer
    try {
      const res = await fetch(`/farmers/${farmerId}/devices`);
      if (res.ok) {
        const data = await res.json();
        if (data.devices && data.devices.length > 0) {
          const device = data.devices[0]; // Take first device
          const deviceIdEl = $('device-id');
          const deviceTypeEl = $('device-type');
          const cropNameEl = $('crop-name');
          const daysEl = $('days-planted');
          
          if (deviceIdEl) deviceIdEl.value = device.device_id || '';
          if (deviceTypeEl) deviceTypeEl.value = device.device_type || 'field';
          if (cropNameEl) cropNameEl.value = device.crop_name || 'Rice';
          if (daysEl) {
            daysEl.value = device.days_since_planting !== undefined ? device.days_since_planting : 0;
            daysEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    } catch (err) {
      console.warn('[Farmer] Could not load device details:', err);
    }
    
    // Scroll to form
    const form = $('farmer-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteFarmer(farmerId) {
    const farmer = allFarmers.find(f => f.id === farmerId);
    if (!farmer) return;
    
    if (!confirm(`Delete farmer "${farmer.farmer_name}"?\n\nThis will unlink all devices and data associated with this farmer.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/farmers/${farmerId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      alert(`Farmer "${farmer.farmer_name}" deleted successfully.`);
      
      // Clear form if we were editing this farmer
      if (editingFarmerId === farmerId) {
        clearForm();
      }
      
      // Clear selection if this was the selected farmer
      if (selectedFarmerId === farmerId) {
        setSelectedFarmer(null);
      }
      
      loadFarmers();
    } catch (err) {
      console.error('[Farmer] delete error:', err);
      alert('Failed to delete farmer. Check console.');
    }
  }

  function getFilteredFarmers() {
    if (!searchQuery.trim()) return allFarmers;
    const query = searchQuery.toLowerCase().trim();
    return allFarmers.filter(f => 
      (f.farmer_name || '').toLowerCase().includes(query) ||
      (f.village || '').toLowerCase().includes(query)
    );
  }

  function renderFarmers(farmers) {
    const container = $('farmer-list');
    if (!container) return;

    // Apply search filter
    const filteredFarmers = farmers ? farmers.filter(f => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (f.farmer_name || '').toLowerCase().includes(query) ||
             (f.village || '').toLowerCase().includes(query);
    }) : [];

    if (!farmers || !farmers.length) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-8 text-center">
          <div class="text-6xl mb-3">👨‍🌾</div>
          <div class="text-lg font-medium text-gray-700 dark:text-gray-300">No farmers yet</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Register below to get started</div>
        </div>`;
      return;
    }

    if (!filteredFarmers.length && searchQuery.trim()) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-8 text-center">
          <div class="text-4xl mb-3">🔍</div>
          <div class="text-lg font-medium text-gray-700 dark:text-gray-300">No results for "${searchQuery}"</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Try a different search term</div>
        </div>`;
      return;
    }

    const selectedId = Number(localStorage.getItem('last_farmer_id') || 0);

    container.innerHTML = filteredFarmers.map(f => {
      const isSelected = f.id === selectedId;
      const isEditing = f.id === editingFarmerId;
      const initial = (f.farmer_name || 'F').charAt(0).toUpperCase();
      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];
      const color = colors[f.id % colors.length];
      const pinDisplay = f.pin ? `PIN: ${f.pin}` : 'No PIN';
      
      return `
      <div data-farmer-id="${f.id}" class="farmer-tile rounded-xl border-2 ${isEditing ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800' : isSelected ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800' : 'border-gray-200 dark:border-gray-700'} bg-white p-4 shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 ${color} rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
            ${initial}
          </div>
          <div class="text-base font-semibold text-gray-900 dark:text-gray-50 truncate w-full">${f.farmer_name}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${f.village || 'Village N/A'}</div>
          <div class="mt-1 text-xs font-mono text-blue-600 dark:text-blue-400">🔑 ${pinDisplay}</div>
          ${isSelected ? '<div class="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Active</div>' : ''}
          ${isEditing ? '<div class="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">✏️ Editing</div>' : ''}
          
          <!-- Action buttons -->
          <div class="flex gap-2 mt-3 w-full">
            <button data-action="select" class="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800 transition-colors">
              ✓ Select
            </button>
            <button data-action="edit" class="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors">
              ✏️ Edit
            </button>
            <button data-action="delete" class="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors">
              🗑️
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    // Attach click handlers to action buttons
    container.querySelectorAll('.farmer-tile').forEach(tile => {
      const id = Number(tile.dataset.farmerId);
      const farmer = allFarmers.find(f => f.id === id);
      
      tile.querySelector('[data-action="select"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (farmer) {
          applyFarmer(farmer);
          renderFarmers(allFarmers);
        }
      });
      
      tile.querySelector('[data-action="edit"]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await editFarmer(id);
        renderFarmers(allFarmers);
      });
      
      tile.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFarmer(id);
      });
    });
  }

  async function loadFarmers() {
    try {
      const res = await fetch('/farmers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allFarmers = data.farmers || [];
      renderFarmers(allFarmers);

      // Restore last selected farmer
      const lastId = Number(localStorage.getItem('last_farmer_id') || 0);
      if (lastId) {
        const farmer = allFarmers.find(f => f.id === lastId);
        if (farmer) applyFarmer(farmer);
      }
    } catch (err) {
      console.warn('[Farmer] loadFarmers error:', err);
    }
  }

  async function registerFarmer() {
    const name = $('farmer-name')?.value?.trim();
    const phone = $('farmer-phone')?.value?.trim();
    const village = $('farmer-village')?.value?.trim();
    const area = Number($('field-area')?.value || 2500);
    const pin = $('farmer-pin')?.value?.trim();

    if (!name) {
      alert('Farmer name is required.');
      return;
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('Please enter a 4-digit PIN for the farmer.');
      return;
    }

    try {
      // Check if we're editing or creating
      if (editingFarmerId) {
        // UPDATE existing farmer
        const res = await fetch(`/farmers/${editingFarmerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_name: name,
            phone: phone || '',
            village: village || '',
            field_area_m2: area,
            pin: pin,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Also update device if device ID is provided
        const deviceIdVal = $('device-id')?.value?.trim();
        if (deviceIdVal) {
          const deviceTypeVal = $('device-type')?.value || 'field';
          const cropNameVal = $('crop-name')?.value || 'Rice';
          const daysPlanted = Number($('days-planted')?.value || 0);
          
          try {
            const deviceRes = await fetch('/register-device', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                farmer_id: editingFarmerId,
                device_id: deviceIdVal,
                device_type: deviceTypeVal,
                crop_name: cropNameVal,
                days_since_planting: daysPlanted,
              }),
            });
            if (deviceRes.ok) {
              alert(`Farmer "${name}" updated successfully.\nDevice linked: ${deviceIdVal}`);
            } else {
              alert(`Farmer "${name}" updated successfully.\n(Device linking failed)`);
            }
          } catch {
            alert(`Farmer "${name}" updated successfully.\n(Device linking failed)`);
          }
        } else {
          alert(`Farmer "${name}" updated successfully.`);
        }
        
        clearForm();
        loadFarmers();
      } else {
        // CREATE new farmer
        const res = await fetch('/register-farmer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_name: name,
            phone: phone || '',
            village: village || '',
            field_area_m2: area,
            pin: pin,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        setSelectedFarmer({ id: data.farmer_id, farmer_name: data.farmer_name });
        
        // Auto-link device if device ID is provided
        const deviceIdVal = $('device-id')?.value?.trim();
        if (deviceIdVal) {
          const deviceTypeVal = $('device-type')?.value || 'field';
          const cropNameVal = $('crop-name')?.value || 'Rice';
          const daysPlanted = Number($('days-planted')?.value || 0);
          
          try {
            const deviceRes = await fetch('/register-device', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                farmer_id: data.farmer_id,
                device_id: deviceIdVal,
                device_type: deviceTypeVal,
                crop_name: cropNameVal,
                days_since_planting: daysPlanted,
              }),
            });
            if (deviceRes.ok) {
              alert(`Farmer registered: ${data.farmer_name} (#${data.farmer_id})\nPIN: ${pin}\nDevice linked: ${deviceIdVal}`);
            } else {
              alert(`Farmer registered: ${data.farmer_name} (#${data.farmer_id})\nPIN: ${pin}\n(Device linking failed)`);
            }
          } catch {
            alert(`Farmer registered: ${data.farmer_name} (#${data.farmer_id})\nPIN: ${pin}\n(Device linking failed)`);
          }
        } else {
          alert(`Farmer registered: ${data.farmer_name} (#${data.farmer_id})\nPIN: ${pin}`);
        }
        
        // Clear form
        clearForm();
        
        loadFarmers();
      }
    } catch (err) {
      console.error('[Farmer] register/update error:', err);
      alert('Failed to save farmer. Check console.');
    }
  }

  async function registerDevice() {
    if (!selectedFarmerId) {
      alert('Select or register a farmer first.');
      return;
    }

    const deviceIdVal = $('device-id')?.value?.trim();
    const deviceTypeVal = $('device-type')?.value || 'field';
    const cropNameVal = $('crop-name')?.value || 'Rice';
    const daysPlanted = Number($('days-planted')?.value || 0);

    if (!deviceIdVal) {
      alert('Device ID is required.');
      return;
    }

    try {
      const res = await fetch('/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: selectedFarmerId,
          device_id: deviceIdVal,
          device_type: deviceTypeVal,
          crop_name: cropNameVal,
          days_since_planting: daysPlanted,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      alert(`Device linked: ${data.device_id}`);
      loadFarmers();
    } catch (err) {
      console.error('[Farmer] device link error:', err);
      alert('Failed to link device. Check console.');
    }
  }

  async function deleteSetup() {
    if (!confirm('Delete all farmer and device data? This cannot be undone.')) return;

    try {
      const res = await fetch('/delete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_pin: ADMIN_PIN }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      alert('Setup deleted successfully.');
      selectedFarmerId = 0;
      editingFarmerId = 0;
      allFarmers = [];
      renderFarmers([]);
      setSelectedFarmer(null);
      clearForm();
    } catch (err) {
      console.error('[Farmer] delete error:', err);
      alert('Failed to delete setup. Check console.');
    }
  }

  function init() {
    // Setup PIN inputs
    setupPINInputs();
    
    // Check if already unlocked this session
    updatePageView();
    updateFormMode();
    
    // Focus first PIN input if locked
    if (!isUnlocked()) {
      $('pin-1')?.focus();
    } else {
      loadFarmers();
    }

    // Verify PIN button
    const verifyBtn = $('verify-pin-btn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', verifyPIN);
    }

    // Lock page button
    const lockBtn = $('lock-page-btn');
    if (lockBtn) {
      lockBtn.addEventListener('click', lockPage);
    }

    // Delete button
    const deleteBtn = $('delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteSetup);
    }

    // Register farmer button
    const regFarmerBtn = $('register-farmer-btn');
    if (regFarmerBtn) {
      regFarmerBtn.addEventListener('click', registerFarmer);
    }

    // Cancel edit button
    const cancelEditBtn = $('cancel-edit-btn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        clearForm();
        renderFarmers(allFarmers);
      });
    }

    // Search input
    const searchInput = $('farmer-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderFarmers(allFarmers);
      });
    }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
