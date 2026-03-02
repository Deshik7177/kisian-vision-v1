document.addEventListener('DOMContentLoaded', () => {
    const i18n = window.AppI18n;
    const t = (key, fallback) => (i18n ? i18n.t(key, fallback) : fallback);
    const farmerName = document.getElementById('farmer-name');
    const selectedFarmerText = document.getElementById('selected-farmer-text');
    const farmerList = document.getElementById('farmer-list');
    const farmerSearch = document.getElementById('farmer-search');
    const farmerPhone = document.getElementById('farmer-phone');
    const farmerVillage = document.getElementById('farmer-village');
    const fieldArea = document.getElementById('field-area');

    const deviceId = document.getElementById('device-id');
    const deviceType = document.getElementById('device-type');
    const cropName = document.getElementById('crop-name');

    const setupBtn = document.getElementById('setup-btn');
    const setupStatus = document.getElementById('setup-status');
    const unlockBtn = document.getElementById('unlock-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const adminPin = document.getElementById('admin-pin');
    const lockLabel = document.getElementById('setup-lock-label');
    const startMonitoringBtn = document.getElementById('start-monitoring-btn');
    let selectedFarmerId = 0;
    let allFarmers = [];

    const setupFields = [
        farmerName,
        farmerPhone,
        farmerVillage,
        fieldArea,
        deviceId,
        deviceType,
        cropName,
    ];

    const verifyAdminPin = async () => {
        const pin = (adminPin.value || '').trim();
        if (!pin) {
            setStatus(`⚠️ ${t('farmer.msg.enterPin', 'Enter Admin PIN first.')}`, 'error');
            return false;
        }

        const response = await fetch('/verify-setup-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_pin: pin }),
        });

        if (!response.ok) {
            setStatus(`🔴 ${t('farmer.msg.pinBackendFail', 'PIN verification failed. Check backend.')}`, 'error');
            return false;
        }

        const payload = await response.json();
        if (!payload.valid) {
            setStatus(`🔴 ${t('farmer.msg.wrongPin', 'Wrong Admin PIN.')}`, 'error');
            return false;
        }

        return true;
    };

    const getSavedProfile = () => {
        const raw = localStorage.getItem('farmer_setup_profile');
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    };

    const saveProfile = (profile) => {
        localStorage.setItem('farmer_setup_profile', JSON.stringify(profile));
    };

    const setSelectedFarmer = (farmer) => {
        if (!farmer || !farmer.id) {
            selectedFarmerId = 0;
            selectedFarmerText.textContent = `${t('farmer.lbl.selectedFarmer', 'Selected Farmer')}: ${t('farmer.lbl.newFarmer', 'New Farmer')}`;
            return;
        }
        selectedFarmerId = Number(farmer.id);
        selectedFarmerText.textContent = `${t('farmer.lbl.selectedFarmer', 'Selected Farmer')}: ${farmer.farmer_name} (#${farmer.id})`;
        localStorage.setItem('last_farmer_id', String(farmer.id));
    };

    const applySelectedFarmer = (farmer) => {
        if (!farmer || !farmer.id) {
            return;
        }
        farmerName.value = farmer.farmer_name || '';
        farmerPhone.value = farmer.phone || '';
        farmerVillage.value = farmer.village || '';
        fieldArea.value = farmer.field_area_m2 || 0;
        setSelectedFarmer(farmer);
    };

    const renderFarmers = (farmers) => {
        if (!farmerList) {
            return;
        }

        farmerList.innerHTML = '';
        if (!farmers.length) {
            farmerList.innerHTML = `<p class="selected-file">${t('farmer.msg.noFarmers', 'No farmers yet. Register a new farmer above.')}</p>`;
            return;
        }

        farmers.forEach((farmer) => {
            const card = document.createElement('div');
            card.className = 'farmer-item';

            const title = document.createElement('div');
            title.className = 'farmer-item-title';
            title.textContent = `${farmer.farmer_name} (#${farmer.id})`;

            const meta = document.createElement('div');
            meta.className = 'farmer-item-meta';
            const linkedDevices = farmer.linked_devices || 'None';
            const village = farmer.village || 'N/A';
            meta.textContent = `${t('farmer.lbl.village', 'Village')}: ${village} | ${t('farmer.lbl.nodes', 'Nodes')}: ${linkedDevices}`;

            const selectBtn = document.createElement('button');
            selectBtn.type = 'button';
            selectBtn.className = 'secondary-btn';
            selectBtn.textContent = t('farmer.btn.selectEdit', 'Select & Edit');
            selectBtn.disabled = localStorage.getItem('farmer_setup_locked') === '1';
            selectBtn.addEventListener('click', () => applySelectedFarmer(farmer));

            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(selectBtn);
            farmerList.appendChild(card);
        });
    };

    const loadFarmers = async () => {
        try {
            const response = await fetch('/farmers');
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            const farmers = payload.farmers || [];
            allFarmers = farmers;

            applyFarmerFilter();

            const remembered = Number(localStorage.getItem('last_farmer_id') || 0);
            if (!selectedFarmerId && remembered) {
                const match = farmers.find(f => Number(f.id) === remembered);
                if (match) {
                    applySelectedFarmer(match);
                }
            } else if (selectedFarmerId) {
                const match = farmers.find(f => Number(f.id) === selectedFarmerId);
                if (match) {
                    setSelectedFarmer(match);
                } else {
                    setSelectedFarmer(null);
                }
            }
        } catch (error) {
        }
    };

    const applyFarmerFilter = () => {
        const q = String((farmerSearch?.value || '')).trim().toLowerCase();
        if (!q) {
            renderFarmers(allFarmers);
            return;
        }

        const filtered = allFarmers.filter((farmer) => {
            const text = [
                farmer.farmer_name,
                farmer.phone,
                farmer.village,
                farmer.linked_devices,
                farmer.id,
            ]
                .map(v => String(v || '').toLowerCase())
                .join(' ');
            return text.includes(q);
        });

        renderFarmers(filtered);
    };

    const clearProfile = () => {
        localStorage.removeItem('farmer_setup_profile');
        localStorage.removeItem('last_farmer_id');
        localStorage.removeItem('last_device_id');
        localStorage.removeItem('farmer_setup_locked');
    };

    const setLockMode = (locked) => {
        setupFields.forEach((field) => {
            field.disabled = locked;
        });
        setupBtn.style.display = locked ? 'none' : 'inline-block';
        unlockBtn.style.display = locked ? 'inline-block' : 'none';
        startMonitoringBtn.style.display = locked ? 'inline-block' : 'none';

        if (locked) {
            lockLabel.textContent = `🔒 ${t('farmer.lock.done', 'Setup Done')}`;
            lockLabel.classList.add('locked');
            localStorage.setItem('farmer_setup_locked', '1');
        } else {
            lockLabel.textContent = `🔓 ${t('farmer.lock.open', 'Setup Open')}`;
            lockLabel.classList.remove('locked');
            localStorage.removeItem('farmer_setup_locked');
        }

        if (farmerList) {
            farmerList.querySelectorAll('button').forEach((btn) => {
                btn.disabled = locked;
            });
        }
    };

    const loadProfileIntoForm = () => {
        const profile = getSavedProfile();
        if (!profile) {
            return;
        }
        farmerName.value = profile.name || farmerName.value;
        farmerPhone.value = profile.phone || farmerPhone.value;
        farmerVillage.value = profile.village || farmerVillage.value;
        fieldArea.value = profile.area || fieldArea.value;
        deviceId.value = profile.nodeId || deviceId.value;
        deviceType.value = profile.nodeType || deviceType.value;
        cropName.value = profile.crop || cropName.value;
        if (profile.farmerId) {
            selectedFarmerId = Number(profile.farmerId);
            selectedFarmerText.textContent = `${t('farmer.lbl.selectedFarmer', 'Selected Farmer')}: #${profile.farmerId}`;
        }
    };

    const setStatus = (message, mode = 'ok') => {
        if (!setupStatus) {
            return;
        }

        setupStatus.classList.remove('risk-alert-hidden', 'risk-alert-high', 'risk-alert-medium');
        setupStatus.classList.add(mode === 'error' ? 'risk-alert-high' : 'risk-alert-medium');
        setupStatus.textContent = message;
    };

    const registerFlow = async () => {
        const name = (farmerName.value || '').trim();
        const phone = (farmerPhone.value || '').trim();
        const village = (farmerVillage.value || '').trim();
        const area = Number(fieldArea.value || 0);

        const nodeId = (deviceId.value || '').trim();
        const nodeType = (deviceType.value || '').trim();
        const crop = (cropName.value || '').trim();
        const editingFarmerId = Number(selectedFarmerId || 0);

        if (!name || !nodeId || !nodeType || !crop || !area) {
            setStatus(`⚠️ ${t('farmer.msg.fillRequired', 'Please fill Name, Field Area, Device ID, Device Type and Crop.')}`, 'error');
            return;
        }

        try {
            setupBtn.disabled = true;
            setupBtn.textContent = t('farmer.btn.settingUp', 'Setting up...');
            setStatus(`🟡 ${t('farmer.msg.registering', 'Registering farmer...')}`, 'ok');

            const farmerPayload = {
                farmer_name: name,
                phone,
                village,
                field_area_m2: area,
            };

            const farmerRes = await fetch(editingFarmerId ? `/farmers/${editingFarmerId}` : '/register-farmer', {
                method: editingFarmerId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(farmerPayload),
            });
            if (!farmerRes.ok) {
                throw new Error('Farmer registration failed');
            }
            const farmer = await farmerRes.json();
            const farmerId = farmer.farmer_id || editingFarmerId;

            setStatus(`🟡 ${t('farmer.msg.linkingNode', 'Linking node to farmer...')}`, 'ok');

            const devicePayload = {
                device_id: nodeId,
                device_type: nodeType,
                farmer_id: farmerId,
                crop_name: crop,
            };

            const deviceRes = await fetch('/register-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(devicePayload),
            });
            if (!deviceRes.ok) {
                throw new Error('Device link failed');
            }

            await loadFarmers();
            selectedFarmerId = Number(farmerId);
            setStatus(`🟢 ${t('farmer.msg.done', 'Done! Farmer and device are linked. Now open Lifecycle page.')}`, 'ok');
            localStorage.setItem('last_farmer_id', String(farmerId));
            localStorage.setItem('last_device_id', nodeId);
            saveProfile({ name, phone, village, area, nodeId, nodeType, crop, farmerId });
            setLockMode(true);
        } catch (error) {
            setStatus(`🔴 ${t('farmer.msg.setupFailed', 'Setup failed. Please check backend connection and try again.')}`, 'error');
        } finally {
            setupBtn.disabled = false;
            setupBtn.textContent = t('farmer.btn.registerLink', 'Register & Link Device');
        }
    };

    unlockBtn.addEventListener('click', async () => {
        const pinOk = await verifyAdminPin();
        if (!pinOk) {
            return;
        }

        const confirmed = window.confirm(t('farmer.msg.confirmUnlock', 'Unlock setup for editing?'));
        if (!confirmed) {
            return;
        }
        setLockMode(false);
        setStatus(`🟡 ${t('farmer.msg.unlocked', 'Setup unlocked. You can edit and register again.')}`, 'ok');
    });

    deleteBtn.addEventListener('click', async () => {
        const pinOk = await verifyAdminPin();
        if (!pinOk) {
            return;
        }

        const profile = getSavedProfile() || {};
        const nodeId = (deviceId.value || profile.nodeId || '').trim();
        const farmerId = Number(localStorage.getItem('last_farmer_id') || profile.farmerId || 0);

        if (!nodeId) {
            setStatus(`⚠️ ${t('farmer.msg.noDeviceDelete', 'Device ID not found. Nothing to delete.')}`, 'error');
            return;
        }

        const confirmed = window.confirm(t('farmer.msg.confirmDelete', 'Delete linked setup for this node?'));
        if (!confirmed) {
            return;
        }

        try {
            deleteBtn.disabled = true;
            deleteBtn.textContent = t('farmer.btn.deleting', 'Deleting...');

            const response = await fetch('/delete-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: nodeId,
                    farmer_id: farmerId || null,
                    delete_farmer: Boolean(farmerId),
                    admin_pin: (adminPin.value || '').trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            clearProfile();
            selectedFarmerId = 0;
            selectedFarmerText.textContent = `${t('farmer.lbl.selectedFarmer', 'Selected Farmer')}: ${t('farmer.lbl.newFarmer', 'New Farmer')}`;
            setLockMode(false);
            await loadFarmers();
            setStatus(`🟢 ${t('farmer.msg.deleted', 'Setup deleted. You can register again from scratch.')}`, 'ok');
        } catch (error) {
            setStatus(`🔴 ${t('farmer.msg.deleteFailed', 'Delete failed. Please try again.')}`, 'error');
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = t('farmer.btn.deleteSetup', 'Delete Setup');
        }
    });

    setupBtn.addEventListener('click', registerFlow);
    farmerSearch?.addEventListener('input', applyFarmerFilter);

    loadProfileIntoForm();
    loadFarmers();
    setLockMode(localStorage.getItem('farmer_setup_locked') === '1');

    document.addEventListener('app-language-changed', () => {
        setupBtn.textContent = t('farmer.btn.registerLink', 'Register & Link Device');
        unlockBtn.textContent = t('farmer.btn.unlock', 'Unlock Setup');
        deleteBtn.textContent = t('farmer.btn.deleteSetup', 'Delete Setup');
        setLockMode(localStorage.getItem('farmer_setup_locked') === '1');
        applyFarmerFilter();
    });
});
