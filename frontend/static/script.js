document.addEventListener('DOMContentLoaded', () => {
    const cameraBtn = document.getElementById('camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const cameraContainer = document.getElementById('camera-container');
    const cameraStream = document.getElementById('camera-stream');
    const canvas = document.getElementById('canvas');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const languageSelect = document.getElementById('language-select');
    const imageContainer = document.getElementById('image-container');
    const predictionsContainer = document.getElementById('predictions');
    const selectedFile = document.getElementById('selected-file');
    const statusText = document.getElementById('status-text');

    const fieldTemp = document.getElementById('field-temp');
    const fieldHumidity = document.getElementById('field-humidity');
    const fieldSoil = document.getElementById('field-soil');
    const fieldRain = document.getElementById('field-rain');

    const storageTemp = document.getElementById('storage-temp');
    const storageHumidity = document.getElementById('storage-humidity');
    const storageDays = document.getElementById('storage-days');

    const diseaseName = document.getElementById('disease-name');
    const diseaseConfidence = document.getElementById('disease-confidence');

    const riskLevel = document.getElementById('risk-level');
    const riskEnv = document.getElementById('risk-env');
    const riskHarvest = document.getElementById('risk-harvest');
    const riskSpoilage = document.getElementById('risk-spoilage');

    const dashboardRecommendation = document.getElementById('dashboard-recommendation');

    let stream;

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraStream.srcObject = null;
        cameraContainer.style.display = 'none';
        cameraBtn.textContent = 'Open Camera';
    };

    const getCameraErrorMessage = (error) => {
        const errorName = error && error.name ? error.name : '';

        if (!window.isSecureContext) {
            return 'Camera requires a secure context. Open this app using localhost/127.0.0.1 (or HTTPS).';
        }
        if (errorName === 'NotAllowedError') {
            return 'Camera permission was blocked. Please allow camera access in your browser settings and try again.';
        }
        if (errorName === 'NotFoundError') {
            return 'No camera device was found on this system.';
        }
        if (errorName === 'NotReadableError') {
            return 'Camera is already in use by another app. Close other camera apps and try again.';
        }
        if (errorName === 'OverconstrainedError') {
            return 'Requested camera settings are not supported on this device.';
        }
        return 'Could not start camera. Check browser permission and reload the page.';
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('UNSUPPORTED_BROWSER');
        }

        const constraintsList = [
            { video: { facingMode: { ideal: 'environment' } }, audio: false },
            { video: true, audio: false }
        ];

        let lastError;
        for (const constraints of constraintsList) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                cameraStream.srcObject = mediaStream;
                await cameraStream.play();
                return mediaStream;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('CAMERA_INIT_FAILED');
    };

    const formatValue = (value, suffix = '') => {
        if (value === undefined || value === null || value === '') {
            return '--';
        }
        return `${value}${suffix}`;
    };

    const refreshDashboard = async () => {
        try {
            const response = await fetch(`/dashboard-data?language=${encodeURIComponent(languageSelect.value)}`);
            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            const field = payload.field_data || {};
            const storage = payload.storage_data || {};
            const disease = payload.disease_result || {};
            const risk = payload.risk_scores || {};

            fieldTemp.textContent = `Temperature: ${formatValue(field.temperature, ' °C')}`;
            fieldHumidity.textContent = `Humidity: ${formatValue(field.humidity, ' %')}`;
            fieldSoil.textContent = `Soil Moisture: ${formatValue(field.soil_moisture, ' %')}`;
            fieldRain.textContent = `Rain Detected: ${field.rain_detected ? 'Yes' : 'No'}`;

            storageTemp.textContent = `Temperature: ${formatValue(storage.temperature, ' °C')}`;
            storageHumidity.textContent = `Humidity: ${formatValue(storage.humidity, ' %')}`;
            storageDays.textContent = `Days In Storage: ${formatValue(storage.days_in_storage)}`;

            diseaseName.textContent = `Disease: ${formatValue(disease.disease)}`;
            const confidence = disease.confidence !== undefined ? `${(Number(disease.confidence) * 100).toFixed(2)}%` : '--';
            diseaseConfidence.textContent = `Confidence: ${confidence}`;

            riskLevel.textContent = `Risk Level: ${formatValue(risk.risk_level)}`;
            riskEnv.textContent = `Environmental Score: ${formatValue(risk.environmental_risk_score)}`;
            riskHarvest.textContent = `Harvest Readiness: ${formatValue(risk.harvest_readiness, ' %')}`;
            riskSpoilage.textContent = `Spoilage Risk: ${formatValue(risk.spoilage_risk)}`;

            dashboardRecommendation.textContent = payload.recommendation || 'Waiting for recommendation...';
        } catch (error) {
            console.error('Dashboard refresh failed:', error);
        }
    };

    const suggestionLabel = () => {
        if (languageSelect.value === 'hi') {
            return 'सलाह';
        }
        if (languageSelect.value === 'te') {
            return 'సలహా';
        }
        return 'Suggestion';
    };

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        selectedFile.textContent = file ? `Selected: ${file.name}` : 'No file selected';
    });

    languageSelect.addEventListener('change', () => {
        refreshDashboard();
    });

    cameraBtn.addEventListener('click', async () => {
        if (stream) {
            stopCamera();
            statusText.textContent = 'Camera closed.';
        } else {
            try {
                stream = await startCamera();
                cameraContainer.style.display = 'block';
                cameraBtn.textContent = 'Close Camera';
                captureBtn.style.display = 'inline-block';
                statusText.textContent = 'Camera is active. Capture a photo to run prediction.';
            } catch (err) {
                console.error("Error accessing camera: ", err);
                if (err.message === 'UNSUPPORTED_BROWSER') {
                    statusText.textContent = 'This browser does not support camera access.';
                    alert('This browser does not support camera access (getUserMedia).');
                } else {
                    const message = getCameraErrorMessage(err);
                    statusText.textContent = message;
                    alert(message);
                }
            }
        }
    });

    captureBtn.addEventListener('click', () => {
        if (!cameraStream.srcObject) {
            statusText.textContent = 'Camera is not active. Open camera first.';
            return;
        }

        const context = canvas.getContext('2d');
        context.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            const file = new File([blob], "capture.png", { type: "image/png" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            selectedFile.textContent = 'Selected: capture.png';
            stopCamera();
            statusText.textContent = 'Photo captured. Click Upload and Predict.';
        });
    });

    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a file or capture a photo.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', languageSelect.value);

        try {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Predicting...';
            statusText.textContent = 'Analyzing image and generating disease advice...';

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                return;
            }

            // Clear previous results
            imageContainer.innerHTML = '';
            predictionsContainer.innerHTML = '';

            if (result.image_url) {
                const img = document.createElement('img');
                img.src = result.image_url;
                imageContainer.appendChild(img);
            }

            if (result.suggestions) {
                for (const [disease, suggestion] of Object.entries(result.suggestions)) {
                    const predictionItem = document.createElement('div');
                    predictionItem.className = 'prediction-item';
                    
                    const title = document.createElement('h3');
                    title.textContent = disease;
                    
                    const suggestionPara = document.createElement('p');
                    suggestionPara.textContent = `${suggestionLabel()}: ${suggestion}`;
                    suggestionPara.style.whiteSpace = 'pre-wrap';

                    // Display confidence for each box of this disease
                    if (result.boxes) {
                        const diseaseBoxes = result.boxes.filter(b => b.class_name === disease);
                        diseaseBoxes.forEach(box => {
                            const confidence = document.createElement('p');
                            confidence.textContent = `Confidence: ${(box.confidence * 100).toFixed(2)}%`;
                            predictionItem.appendChild(confidence);
                        });
                    }

                    predictionItem.insertBefore(title, predictionItem.firstChild);
                    predictionItem.appendChild(suggestionPara);
                    predictionsContainer.appendChild(predictionItem);
                }
                statusText.textContent = 'Prediction complete.';
            } else {
                predictionsContainer.textContent = 'No predictions could be made.';
                statusText.textContent = 'No disease detections found in this image.';
            }

        } catch (error) {
            console.error('Error during prediction:', error);
            alert('An error occurred while trying to predict. Please check the console for more details.');
            statusText.textContent = 'Prediction failed. Please try again.';
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload and Predict';
        }
    });

    refreshDashboard();
    setInterval(refreshDashboard, 5000);
});
