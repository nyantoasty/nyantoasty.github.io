// cloud-run-ocr-client.js - Frontend client for Python Cloud Run OCR service
// Replaces Firebase Functions approach with direct Cloud Run calls

import { auth } from './firebase-config.js';

// Cloud Run service URL
const CLOUD_RUN_OCR_URL = 'https://stitch-witch-ocr-285468127259.us-central1.run.app';

/**
 * Process a pattern file through Cloud Run OCR service
 * @param {File} file - The image/PDF file to process
 * @param {string} patternName - Name for the pattern
 * @param {string} authorName - Author name
 * @returns {Promise<Object>} Result with patternId and success status
 */
export async function processPatternOCR(file, patternName, authorName) {
    try {
        console.log('🔍 Starting Cloud Run OCR processing...', { 
            file: file.name, 
            size: file.size, 
            type: file.type 
        });

        // Ensure user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be signed in to upload patterns');
        }

        // Convert file to base64
        const base64Data = await fileToBase64(file);
        console.log('📝 File converted to base64');

        // Prepare request payload
        const payload = {
            imageData: base64Data,
            patternName: patternName.trim(),
            authorName: authorName.trim(),
            userId: user.uid
        };

        // Call Cloud Run service
        console.log('🚀 Calling Cloud Run OCR service...');
        const response = await fetch(`${CLOUD_RUN_OCR_URL}/process-ocr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud Run OCR failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'OCR processing failed');
        }

        console.log('✅ Cloud Run OCR completed successfully:', result.patternId);
        
        return {
            success: true,
            patternId: result.patternId,
            extractedText: result.extractedText,
            message: result.message
        };

    } catch (error) {
        console.error('❌ Cloud Run OCR failed:', error);
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
 * Show the pattern upload modal
 */
export function showPatternUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">📤 Upload Pattern via OCR</h3>
            <p class="text-gray-300 mb-4 text-sm">Upload an image or PDF of a knitting pattern. Our AI will extract the text and create a structured pattern for you.</p>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Pattern Name *</label>
                <input type="text" id="upload-pattern-name" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Enter pattern name" required>
            </div>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Author Name *</label>
                <input type="text" id="upload-pattern-author" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Enter author name" required>
            </div>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Pattern File *</label>
                <input type="file" id="upload-pattern-file" accept="image/*,.pdf" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" required>
                <p class="text-xs text-gray-400 mt-1">Supported: JPG, PNG, PDF (max 10MB)</p>
            </div>
            
            <div class="flex justify-end space-x-2">
                <button onclick="closeUploadModal()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onclick="handlePatternUploadSubmit()" class="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors">Process Pattern</button>
            </div>
            
            <div id="upload-progress" class="mt-4 hidden">
                <div class="text-gray-300 text-sm mb-2">
                    <span id="upload-status">Processing pattern...</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-violet-600 h-2 rounded-full animate-pulse" style="width: 50%"></div>
                </div>
                <p class="text-xs text-gray-400 mt-2">This may take 30-60 seconds depending on image complexity.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on pattern name input
    setTimeout(() => {
        document.getElementById('upload-pattern-name')?.focus();
    }, 100);
}

/**
 * Close upload modal
 */
window.closeUploadModal = function() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
};

/**
 * Handle pattern upload form submission
 */
window.handlePatternUploadSubmit = async function() {
    const patternName = document.getElementById('upload-pattern-name').value.trim();
    const patternAuthor = document.getElementById('upload-pattern-author').value.trim();
    const fileInput = document.getElementById('upload-pattern-file');
    const progressDiv = document.getElementById('upload-progress');
    const statusSpan = document.getElementById('upload-status');
    const submitButton = document.querySelector('button[onclick="handlePatternUploadSubmit()"]');
    
    // Validation
    if (!patternName) {
        alert('Please enter a pattern name');
        document.getElementById('upload-pattern-name').focus();
        return;
    }
    
    if (!patternAuthor) {
        alert('Please enter an author name');
        document.getElementById('upload-pattern-author').focus();
        return;
    }
    
    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        fileInput.focus();
        return;
    }
    
    const file = fileInput.files[0];
    
    // File size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    try {
        // Show progress
        progressDiv.classList.remove('hidden');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        statusSpan.textContent = 'Uploading and processing pattern...';
        
        // Process the pattern
        const result = await processPatternOCR(file, patternName, patternAuthor);
        
        // Success
        statusSpan.textContent = 'Pattern processed successfully!';
        setTimeout(() => {
            closeUploadModal();
            
            // Show success message
            alert(`Pattern "${patternName}" has been successfully processed and saved!\n\nPattern ID: ${result.patternId}`);
            
            // Refresh patterns list if available
            if (window.discoverPatterns && typeof window.discoverPatterns === 'function') {
                window.discoverPatterns();
            }
            
            // Refresh the page to show new pattern
            if (window.populateProjectSelector && typeof window.populateProjectSelector === 'function') {
                window.populateProjectSelector();
            }
        }, 1500);
        
    } catch (error) {
        console.error('Upload failed:', error);
        
        // Show error
        statusSpan.textContent = 'Processing failed. Please try again.';
        alert(`Upload failed: ${error.message}`);
        
        // Reset UI
        progressDiv.classList.add('hidden');
        submitButton.disabled = false;
        submitButton.textContent = 'Process Pattern';
    }
};

/**
 * Initialize the OCR upload functionality
 */
export function initializeOCRUpload() {
    console.log('🎨 Initializing Cloud Run OCR upload functionality...');
    
    // Add upload button to the UI
    addUploadButtonToUI();
}

/**
 * Add upload button to the existing UI
 */
function addUploadButtonToUI() {
    // Look for a good place to add the upload button
    const patternsSection = document.querySelector('#patterns-section') || 
                           document.querySelector('.patterns-container') ||
                           document.querySelector('#pattern-selector')?.parentElement;
    
    if (patternsSection) {
        // Create upload button
        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = '📤 Upload Pattern (OCR)';
        uploadButton.className = 'bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors mb-4 mr-2';
        uploadButton.onclick = showPatternUploadModal;
        
        // Add before the patterns section
        patternsSection.insertBefore(uploadButton, patternsSection.firstChild);
        
        console.log('✅ Upload button added to UI');
    } else {
        // Fallback: add to body temporarily for testing
        console.warn('⚠️ Could not find patterns section, adding upload button to body');
        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = '📤 Upload Pattern (OCR)';
        uploadButton.className = 'fixed top-4 right-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors z-50';
        uploadButton.onclick = showPatternUploadModal;
        document.body.appendChild(uploadButton);
    }
}

// Auto-initialize when the script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeOCRUpload);
}