document.addEventListener('DOMContentLoaded', () => {
    const i18n = window.AppI18n;
    const t = (key, fallback) => (i18n ? i18n.t(key, fallback) : fallback);
    const cameraBtn = document.getElementById('camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const cameraContainer = document.getElementById('camera-container');
    const cameraStream = document.getElementById('camera-stream');
    const canvas = document.getElementById('canvas');
    const fileInput = document.getElementById('file-input');
    const cropSelect = document.getElementById('crop-select');
    const uploadBtn = document.getElementById('upload-btn');
    const imageContainer = document.getElementById('image-container');
    const predictionsContainer = document.getElementById('predictions');
    const selectedFile = document.getElementById('selected-file');
    const statusText = document.getElementById('status-text');

    let stream;

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraStream.srcObject = null;
        cameraContainer.style.display = 'none';
        cameraBtn.textContent = t('disease.btn.openCam', 'Open Camera');
    };

    const startCamera = async () => {
        const constraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStream.srcObject = stream;
        await cameraStream.play();
    };

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        selectedFile.textContent = file ? `${t('disease.label.selected', 'Selected')}: ${file.name}` : t('disease.status.noFile', 'No file selected');
    });

    cameraBtn.addEventListener('click', async () => {
        if (stream) {
            stopCamera();
            statusText.textContent = t('disease.status.camClosed', 'Camera closed.');
            return;
        }

        try {
            await startCamera();
            cameraContainer.style.display = 'block';
            cameraBtn.textContent = t('disease.btn.closeCam', 'Close Camera');
            statusText.textContent = t('disease.status.camActive', 'Camera is active. Capture a photo.');
        } catch (error) {
            statusText.textContent = t('disease.status.camDenied', 'Could not access camera. Please allow permission.');
        }
    });

    captureBtn.addEventListener('click', () => {
        if (!cameraStream.srcObject) {
            statusText.textContent = t('disease.status.camInactive', 'Camera is not active.');
            return;
        }

        const context = canvas.getContext('2d');
        context.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            const file = new File([blob], 'capture.png', { type: 'image/png' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            selectedFile.textContent = `${t('disease.label.selected', 'Selected')}: capture.png`;
            stopCamera();
            statusText.textContent = t('disease.status.photoCaptured', 'Photo captured. Click Upload and Predict.');
        });
    });

    const suggestionLabel = () => {
        return t('disease.label.suggestion', 'Suggestion');
    };

    // Remove healthy plant logic

    const showRelevantImagePrompt = () => {
        predictionsContainer.innerHTML = '';
        const promptCard = document.createElement('div');
        promptCard.className = 'prediction-item';

        const title = document.createElement('h3');
        title.textContent = 'Image Not Clear For Detection';
        promptCard.appendChild(title);

        const message = document.createElement('p');
        message.textContent = 'Please upload or capture a relevant crop leaf image (close, bright, and focused) to detect disease.';
        promptCard.appendChild(message);

        predictionsContainer.appendChild(promptCard);
        statusText.textContent = 'Please upload or capture a relevant image.';
    };

    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert(t('disease.alert.pickFile', 'Please select a file or capture a photo.'));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', (window.AppI18n && window.AppI18n.getLanguage) ? window.AppI18n.getLanguage() : 'en');
        formData.append('crop', cropSelect ? cropSelect.value : 'rice');

        try {
            uploadBtn.disabled = true;
            uploadBtn.textContent = t('disease.btn.predicting', 'Predicting...');
            statusText.textContent = t('disease.status.analyzing', 'Analyzing image...');

            const response = await fetch('/predict', { method: 'POST', body: formData });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();
            imageContainer.innerHTML = '';
            predictionsContainer.innerHTML = '';

            if (result.image_url) {
                const img = document.createElement('img');
                img.src = result.image_url;
                imageContainer.appendChild(img);
            }

            const suggestions = result.suggestions || {};
            const boxes = result.boxes || [];

            if (!boxes.length || isHealthyOnlyResult(boxes)) {
                predictionsContainer.innerHTML = '';
                const promptCard = document.createElement('div');
                promptCard.className = 'prediction-item';

                const title = document.createElement('h3');
                title.textContent = 'Not a plant image or No disease detected';
                promptCard.appendChild(title);

                const message = document.createElement('p');
                message.textContent = 'Unable to analyze for plant diseases or no diseases detected in the image. Please upload a clear photo of a plant leaf for disease detection, or continue regular monitoring if no disease is detected.';
                promptCard.appendChild(message);

                predictionsContainer.appendChild(promptCard);
                statusText.textContent = 'Please upload or capture a relevant image.';
                return;
            }

            Object.entries(suggestions).forEach(([disease, suggestion]) => {
                const predictionItem = document.createElement('div');
                predictionItem.className = 'prediction-item';

                const title = document.createElement('h3');
                title.textContent = disease;
                predictionItem.appendChild(title);

                const confidenceWrap = document.createElement('div');
                confidenceWrap.className = 'confidence-list';

                boxes.filter(item => item.class_name === disease).forEach(item => {
                    const confidence = document.createElement('span');
                    confidence.className = 'confidence-pill';
                    confidence.textContent = `${t('disease.label.confidence', 'Confidence')}: ${(item.confidence * 100).toFixed(2)}%`;
                    confidenceWrap.appendChild(confidence);
                });

                predictionItem.appendChild(confidenceWrap);

                const suggestionPara = document.createElement('p');
                suggestionPara.className = 'suggestion-text';
                suggestionPara.textContent = `${suggestionLabel()}: ${suggestion}`;
                suggestionPara.style.whiteSpace = 'pre-wrap';
                predictionItem.appendChild(suggestionPara);

                predictionsContainer.appendChild(predictionItem);
            });

            statusText.textContent = t('disease.status.complete', 'Prediction complete.');
        } catch (error) {
            statusText.textContent = t('disease.status.failed', 'Prediction failed. Please try again.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = t('disease.btn.uploadPredict', 'Upload and Predict');
        }
    });

    document.addEventListener('app-language-changed', () => {
        if (!stream) {
            cameraBtn.textContent = t('disease.btn.openCam', 'Open Camera');
        }
        if (!fileInput.files[0]) {
            selectedFile.textContent = t('disease.status.noFile', 'No file selected');
        }
    });
});
