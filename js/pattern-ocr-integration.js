// pattern-ocr-integration.js - OCR integration for Generator workflow
// Integrates Cloud Run OCR service with existing pattern-upload.html

const CLOUD_RUN_OCR_URL = 'https://stitch-witch-ocr-285468127259.us-central1.run.app';

/**
 * Extract text from uploaded file using Cloud Run OCR service
 * @param {File} file - The image/PDF file to process
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromFile(file) {
    try {
        console.log('🔍 Starting OCR text extraction...', { 
            file: file.name, 
            size: file.size, 
            type: file.type 
        });

        // Convert file to base64
        const base64Data = await fileToBase64(file);
        console.log('📝 File converted to base64');

        // Prepare request payload for full pattern processing
        const payload = {
            imageData: base64Data,
            patternName: "Extracted Pattern",
            authorName: "OCR Generated", 
            userId: "temp-user-id",
            fileType: file.type
        };

        // Call Cloud Run service for full pattern processing
        console.log('🚀 Calling Cloud Run OCR service...');
        const response = await fetch(`${CLOUD_RUN_OCR_URL}/process-ocr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OCR failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Text extraction failed');
        }

        console.log('✅ Text extraction completed successfully');
        return result.extractedText || result.message || "Text extraction completed";

    } catch (error) {
        console.error('❌ OCR text extraction failed:', error);
        throw error;
    }
}

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string without data URL prefix
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Initialize OCR functionality for pattern-upload.html
 */
export function initializeOCRIntegration() {
    console.log('🎨 Initializing OCR integration for Generator...');
    
    const fileInput = document.getElementById('pattern-file-input');
    const previewArea = document.getElementById('file-preview-area');
    const previewList = document.getElementById('file-preview-list');
    const ocrStatus = document.getElementById('ocr-status');
    const patternTextArea = document.getElementById('pattern-text');
    
    if (!fileInput) {
        console.warn('⚠️ Pattern file input not found - OCR integration skipped');
        return;
    }
    
    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        // Show preview area
        previewArea.classList.remove('hidden');
        previewList.innerHTML = '';
        
        for (const file of files) {
            await processFile(file, previewList, ocrStatus, patternTextArea);
        }
    });
    
    console.log('✅ OCR integration initialized');
}

/**
 * Process a single uploaded file
 */
async function processFile(file, previewList, ocrStatus, patternTextArea) {
    // Create file preview item
    const fileItem = createFilePreviewItem(file);
    previewList.appendChild(fileItem);
    
    const statusDiv = fileItem.querySelector('.file-status');
    const extractButton = fileItem.querySelector('.extract-text-btn');
    
    // Check if file is suitable for OCR
    const isOcrSupported = file.type.includes('image/') || file.type === 'application/pdf';
    
    if (!isOcrSupported) {
        statusDiv.innerHTML = '<span class="text-yellow-400">📄 Text file - no OCR needed</span>';
        if (file.type === 'text/plain') {
            // For text files, just read the content
            const text = await file.text();
            appendToPatternText(text, patternTextArea);
        }
        return;
    }
    
    // Enable extract button for supported files
    extractButton.disabled = false;
    extractButton.onclick = async () => {
        await extractFromFile(file, statusDiv, patternTextArea, extractButton);
    };
    
    statusDiv.innerHTML = '<span class="text-blue-400">📷 Ready for OCR</span>';
}

/**
 * Create a preview item for an uploaded file
 */
function createFilePreviewItem(file) {
    const div = document.createElement('div');
    div.className = 'bg-gray-700 p-3 rounded-lg flex items-center justify-between';
    
    const fileIcon = getFileIcon(file.type);
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    div.innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="text-2xl">${fileIcon}</span>
            <div>
                <div class="font-medium text-white">${file.name}</div>
                <div class="text-sm text-gray-400">${fileSize}</div>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <div class="file-status text-sm">
                <span class="text-gray-400">Processing...</span>
            </div>
            <button class="extract-text-btn bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled>
                Extract Text
            </button>
        </div>
    `;
    
    return div;
}

/**
 * Get appropriate icon for file type
 */
function getFileIcon(mimeType) {
    if (mimeType.includes('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('text/')) return '📝';
    return '📁';
}

/**
 * Extract text from file and update UI
 */
async function extractFromFile(file, statusDiv, patternTextArea, extractButton) {
    try {
        // Update UI to show processing
        statusDiv.innerHTML = '<span class="text-yellow-400">⏳ Extracting text...</span>';
        extractButton.disabled = true;
        extractButton.textContent = 'Processing...';
        
        // Extract text
        const extractedText = await extractTextFromFile(file);
        
        // Update UI with success
        statusDiv.innerHTML = `<span class="text-green-400">✅ Extracted ${extractedText.length} chars</span>`;
        extractButton.textContent = 'Text Extracted';
        
        // Append text to the pattern text area
        appendToPatternText(extractedText, patternTextArea);
        
        // Show success message
        showOCRSuccess(`Successfully extracted ${extractedText.length} characters from ${file.name}`);
        
    } catch (error) {
        console.error('OCR extraction failed:', error);
        
        // Update UI with error
        statusDiv.innerHTML = '<span class="text-red-400">❌ Extraction failed</span>';
        extractButton.disabled = false;
        extractButton.textContent = 'Retry';
        
        // Show error message
        showOCRError(`Failed to extract text from ${file.name}: ${error.message}`);
    }
}

/**
 * Append extracted text to the pattern text area
 */
function appendToPatternText(text, patternTextArea) {
    if (!patternTextArea) return;
    
    const currentText = patternTextArea.value.trim();
    const separator = currentText ? '\n\n--- Next File ---\n\n' : '';
    patternTextArea.value = currentText + separator + text.trim();
    
    // Focus the text area and scroll to bottom
    patternTextArea.focus();
    patternTextArea.scrollTop = patternTextArea.scrollHeight;
}

/**
 * Initialize JSON file upload functionality for authenticated admin users
 */
export function initializeJSONFileUpload(currentUser) {
    if (!currentUser) return;
    
    // Show the JSON file upload section for authenticated users
    const jsonFileUploadSection = document.getElementById('json-file-upload-section');
    if (jsonFileUploadSection) {
        jsonFileUploadSection.classList.remove('hidden');
    }
    
    // Set up file input handler
    const jsonFileInput = document.getElementById('json-file-input');
    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', handleJSONFileUpload);
    }
    
    // Set up Google Drive handler
    const loadGDriveBtn = document.getElementById('load-gdrive-json');
    if (loadGDriveBtn) {
        loadGDriveBtn.addEventListener('click', handleGoogleDriveLoad);
    }
}

/**
 * Handle JSON file upload from local device
 */
async function handleJSONFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showJSONFileStatus('loading', `Reading ${file.name}...`);
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.txt')) {
            throw new Error('Please select a JSON or text file');
        }
        
        // Read file content
        const text = await readFileAsText(file);
        
        // Try to parse as JSON to validate
        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (parseError) {
            throw new Error('File does not contain valid JSON');
        }
        
        // Insert into textarea
        const patternJsonTextarea = document.getElementById('pattern-json');
        if (patternJsonTextarea) {
            patternJsonTextarea.value = JSON.stringify(jsonData, null, 2);
            // Trigger any validation
            patternJsonTextarea.dispatchEvent(new Event('input'));
        }
        
        showJSONFileStatus('success', `✅ Loaded ${file.name} successfully`);
        
    } catch (error) {
        console.error('JSON file upload error:', error);
        showJSONFileStatus('error', `❌ Error: ${error.message}`);
    }
}

/**
 * Handle Google Drive file loading
 */
async function handleGoogleDriveLoad() {
    const urlInput = document.getElementById('gdrive-url-input');
    if (!urlInput || !urlInput.value.trim()) {
        showJSONFileStatus('error', '❌ Please enter a Google Drive URL');
        return;
    }
    
    try {
        showJSONFileStatus('loading', 'Loading from Google Drive...');
        
        const driveUrl = urlInput.value.trim();
        
        // Convert Google Drive share URL to direct download URL
        const downloadUrl = convertGoogleDriveUrl(driveUrl);
        
        // Fetch the file content
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Try to parse as JSON to validate
        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (parseError) {
            throw new Error('Google Drive file does not contain valid JSON');
        }
        
        // Insert into textarea
        const patternJsonTextarea = document.getElementById('pattern-json');
        if (patternJsonTextarea) {
            patternJsonTextarea.value = JSON.stringify(jsonData, null, 2);
            // Trigger any validation
            patternJsonTextarea.dispatchEvent(new Event('input'));
        }
        
        showJSONFileStatus('success', '✅ Loaded from Google Drive successfully');
        
        // Clear the URL input
        urlInput.value = '';
        
    } catch (error) {
        console.error('Google Drive load error:', error);
        showJSONFileStatus('error', `❌ Error: ${error.message}`);
    }
}

/**
 * Convert Google Drive share URL to direct download URL
 */
function convertGoogleDriveUrl(url) {
    // Handle different Google Drive URL formats
    let fileId = null;
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    let match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        fileId = match[1];
    }
    
    // Format 2: https://drive.google.com/open?id=FILE_ID
    if (!fileId) {
        match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (match) {
            fileId = match[1];
        }
    }
    
    if (!fileId) {
        throw new Error('Invalid Google Drive URL format');
    }
    
    // Return direct download URL
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Read file as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Show JSON file upload status
 */
function showJSONFileStatus(type, message) {
    const statusDiv = document.getElementById('json-file-status');
    if (!statusDiv) return;
    
    statusDiv.classList.remove('hidden');
    
    let bgColor, borderColor, textColor, icon;
    
    switch (type) {
        case 'loading':
            bgColor = 'bg-blue-900';
            borderColor = 'border-blue-500';
            textColor = 'text-blue-200';
            icon = '🔄';
            break;
        case 'success':
            bgColor = 'bg-green-900';
            borderColor = 'border-green-500';
            textColor = 'text-green-200';
            icon = '✅';
            break;
        case 'error':
            bgColor = 'bg-red-900';
            borderColor = 'border-red-500';
            textColor = 'text-red-200';
            icon = '❌';
            break;
        default:
            bgColor = 'bg-gray-900';
            borderColor = 'border-gray-500';
            textColor = 'text-gray-200';
            icon = 'ℹ️';
    }
    
    statusDiv.innerHTML = `
        <div class="${bgColor} ${borderColor} rounded-lg p-3 border">
            <div class="flex items-center">
                <span class="text-lg mr-2">${icon}</span>
                <span class="${textColor}">${message}</span>
            </div>
        </div>
    `;
    
    // Auto-hide success/error messages after 5 seconds
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show OCR success message
 */
function showOCRSuccess(message) {
    const ocrStatus = document.getElementById('ocr-status');
    if (ocrStatus) {
        ocrStatus.classList.remove('hidden');
        ocrStatus.innerHTML = `
            <div class="bg-green-900 border border-green-500 rounded-lg p-3">
                <div class="flex items-center">
                    <span class="text-green-400 text-lg mr-2">✅</span>
                    <span class="text-green-200">${message}</span>
                </div>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            ocrStatus.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show OCR error message
 */
function showOCRError(message) {
    const ocrStatus = document.getElementById('ocr-status');
    if (ocrStatus) {
        ocrStatus.classList.remove('hidden');
        ocrStatus.innerHTML = `
            <div class="bg-red-900 border border-red-500 rounded-lg p-3">
                <div class="flex items-center">
                    <span class="text-red-400 text-lg mr-2">❌</span>
                    <span class="text-red-200">${message}</span>
                </div>
            </div>
        `;
    }
}

// Auto-initialize when the script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeOCRIntegration);
}