// pattern-ocr.js - Client-side OCR and NLP pattern processing
// Version: v2025-10-03-client-side

import { db, auth } from './firebase-config.js';
import { collection, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuration - Get from Firebase config or environment
const GOOGLE_VISION_API_KEY = 'AIzaSyAEiDASYq5WHALAYaQ1bs8ztZ--avzU0a4'; // Your existing Gemini key - we'll need a Vision API key too
const GEMINI_API_KEY = 'AIzaSyAEiDASYq5WHALAYaQ1bs8ztZ--avzU0a4'; // Your existing key

/**
 * Process an uploaded file through OCR and NLP to create a Firestore pattern
 * @param {File} file - The uploaded image/PDF file
 * @param {string} patternName - Name for the new pattern
 * @param {string} authorName - Author of the pattern
 * @returns {Promise<string>} Pattern ID of the created pattern
 */
export async function processPatternFile(file, patternName, authorName) {
    try {
        console.log('🔍 Starting pattern processing...', { file: file.name, patternName, authorName });
        
        // Step 1: Extract text using Google Vision API
        const extractedText = await extractTextFromFile(file);
        console.log('📝 Text extraction complete:', extractedText.substring(0, 100) + '...');
        
        // Step 2: Process text through Gemini with your LogicGuide
        const patternJson = await processTextToPattern(extractedText, patternName, authorName);
        console.log('🧠 Pattern analysis complete');
        
        // Step 3: Save to Firestore patterns collection
        const patternId = await savePatternToFirestore(patternJson, patternName, authorName);
        console.log('💾 Pattern saved to Firestore:', patternId);
        
        return patternId;
        
    } catch (error) {
        console.error('❌ Pattern processing failed:', error);
        throw error;
    }
}

/**
 * Extract text from image or PDF using Google Vision API
 * @param {File} file - The file to process
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(file) {
    console.log('🔍 Processing file with Vision API...', file.type);
    
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Prepare Vision API request
    const visionRequest = {
        requests: [{
            image: {
                content: base64
            },
            features: [{
                type: 'TEXT_DETECTION',
                maxResults: 10
            }],
            imageContext: {
                languageHints: ['en']
            }
        }]
    };
    
    // Call Vision API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.responses?.[0]?.error) {
        throw new Error(`Vision API error: ${result.responses[0].error.message}`);
    }
    
    // Extract text from response
    const textAnnotations = result.responses?.[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
        throw new Error('No text found in the image');
    }
    
    // The first annotation contains the full text
    return textAnnotations[0].description;
}

/**
 * Process extracted text through Gemini to create structured pattern
 * @param {string} text - Raw text from OCR
 * @param {string} patternName - Pattern name
 * @param {string} authorName - Author name
 * @returns {Promise<Object>} Structured pattern object
 */
async function processTextToPattern(text, patternName, authorName) {
    console.log('🧠 Processing text with Gemini AI...');
    
    // Load the LogicGuide prompt
    const logicGuidePrompt = await loadLogicGuide();
    
    // Construct the full prompt
    const prompt = `${logicGuidePrompt}

PATTERN TO PROCESS:
Name: ${patternName}
Author: ${authorName}

Raw Text from OCR:
${text}

Please convert this knitting pattern into the exact Firestore JSON schema described in the Logic Guide. Return ONLY the JSON object, no other text.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response from Gemini API');
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
        // Clean up the response (remove any markdown code blocks)
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', responseText);
        throw new Error(`Failed to parse pattern JSON: ${parseError.message}`);
    }
}

/**
 * Save the processed pattern to Firestore
 * @param {Object} patternData - The structured pattern object
 * @param {string} patternName - Pattern name
 * @param {string} authorName - Author name
 * @returns {Promise<string>} Pattern ID
 */
async function savePatternToFirestore(patternData, patternName, authorName) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be signed in to save patterns');
    }
    
    // Generate pattern ID
    const patternId = `ocr-pattern-${Date.now()}`;
    
    // Enhance pattern data with metadata
    const enhancedPattern = {
        ...patternData,
        id: patternId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        source: 'ocr_upload',
        uploadMethod: 'client_side_ocr',
        metadata: {
            ...patternData.metadata,
            name: patternName,
            author: authorName,
            description: patternData.metadata?.description || `Uploaded pattern: ${patternName}`,
            craft: 'knitting',
            source: 'ocr_upload'
        },
        // Analytics
        shareCount: 0,
        viewCount: 0,
        forkCount: 0,
        exportCount: 0,
        tags: patternData.metadata?.tags || ['uploaded', 'ocr']
    };
    
    // Save to Firestore patterns collection
    await setDoc(doc(db, 'patterns', patternId), enhancedPattern);
    
    // Create access record for the creator
    await setDoc(doc(db, 'pattern_access', `${patternId}_${user.uid}`), {
        patternId,
        userId: user.uid,
        grantedBy: user.uid,
        permission: 'admin',
        grantedAt: serverTimestamp(),
        expiresAt: null,
        status: 'active',
        shareReason: 'pattern_creator'
    });
    
    console.log('✅ Pattern saved to Firestore:', patternId);
    return patternId;
}

/**
 * Load the LogicGuide content for prompting
 * @returns {Promise<string>} LogicGuide content
 */
async function loadLogicGuide() {
    try {
        const response = await fetch('./LogicGuide.md');
        if (!response.ok) {
            throw new Error(`Failed to load LogicGuide: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading LogicGuide:', error);
        // Fallback to a basic prompt if LogicGuide can't be loaded
        return `Convert this knitting pattern to a JSON object with the following structure:
{
  "metadata": {"name": "Pattern Name", "author": "Author", "craft": "knitting", "maxSteps": 0},
  "glossary": {"k": {"name": "Knit", "description": "Standard knit stitch", "stitchesUsed": 1, "stitchesCreated": 1}},
  "steps": [{"step": 1, "startingStitchCount": 0, "endingStitchCount": 0, "instruction": "", "section": "setup", "side": "RS", "type": "regular"}]
}`;
    }
}

/**
 * Convert file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string (without data URL prefix)
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Initialize the pattern upload UI
 */
export function initializePatternUpload() {
    console.log('🎨 Initializing pattern upload UI...');
    
    // Add upload button to existing UI (you can customize where this goes)
    const uploadButton = document.createElement('button');
    uploadButton.innerHTML = '📤 Upload Pattern (OCR)';
    uploadButton.className = 'bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors';
    uploadButton.onclick = showUploadModal;
    
    // Add to patterns section (you might want to adjust this selector)
    const patternsSection = document.querySelector('#patterns-section') || document.querySelector('.patterns-container');
    if (patternsSection) {
        patternsSection.appendChild(uploadButton);
    }
}

/**
 * Show the upload modal
 */
function showUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 class="text-xl font-bold text-white mb-4">Upload Pattern</h3>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Pattern Name</label>
                <input type="text" id="pattern-name" class="w-full p-2 rounded bg-gray-700 text-white" placeholder="Enter pattern name">
            </div>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Author Name</label>
                <input type="text" id="pattern-author" class="w-full p-2 rounded bg-gray-700 text-white" placeholder="Enter author name">
            </div>
            
            <div class="mb-4">
                <label class="block text-gray-300 mb-2">Pattern File (Image/PDF)</label>
                <input type="file" id="pattern-file" accept="image/*,.pdf" class="w-full p-2 rounded bg-gray-700 text-white">
            </div>
            
            <div class="flex justify-end space-x-2">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
                <button onclick="handlePatternUpload(this)" class="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Process Pattern</button>
            </div>
            
            <div id="upload-progress" class="mt-4 hidden">
                <div class="text-gray-300 text-sm mb-2">Processing...</div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-violet-600 h-2 rounded-full animate-pulse" style="width: 50%"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Handle the pattern upload process
 */
window.handlePatternUpload = async function(button) {
    const modal = button.closest('.fixed');
    const patternName = document.getElementById('pattern-name').value.trim();
    const patternAuthor = document.getElementById('pattern-author').value.trim();
    const fileInput = document.getElementById('pattern-file');
    const progressDiv = document.getElementById('upload-progress');
    
    if (!patternName || !patternAuthor) {
        alert('Please enter both pattern name and author name');
        return;
    }
    
    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
    }
    
    try {
        // Show progress
        progressDiv.classList.remove('hidden');
        button.disabled = true;
        button.textContent = 'Processing...';
        
        // Process the pattern
        const patternId = await processPatternFile(fileInput.files[0], patternName, patternAuthor);
        
        // Success
        alert(`Pattern "${patternName}" has been successfully processed and saved!`);
        modal.remove();
        
        // Refresh patterns list if there's a function for it
        if (window.discoverPatterns) {
            await window.discoverPatterns();
        }
        
    } catch (error) {
        console.error('Upload failed:', error);
        alert(`Upload failed: ${error.message}`);
        
        // Reset UI
        progressDiv.classList.add('hidden');
        button.disabled = false;
        button.textContent = 'Process Pattern';
    }
};

// Auto-initialize when the script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializePatternUpload);
}