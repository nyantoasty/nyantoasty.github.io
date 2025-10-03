const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const cors = require('cors')({ origin: true });

// Define secrets for API keys
const visionApiKey = defineSecret("VISION_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// OCR and Pattern Processing Function
exports.processOCR = onRequest(
  {
    secrets: [visionApiKey, geminiApiKey],
    cors: true
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        console.log('🔍 Processing OCR request...');
        
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const { imageData, patternName, authorName } = req.body;
        
        if (!imageData || !patternName || !authorName) {
          return res.status(400).json({ 
            error: 'Missing required fields: imageData, patternName, authorName' 
          });
        }
        
        // Step 1: Extract text using Vision API
        const extractedText = await extractTextFromImage(imageData, visionApiKey.value());
        console.log('📝 Text extraction complete');
        
        // Step 2: Process with Gemini
        const patternJson = await processTextToPattern(
          extractedText, 
          patternName, 
          authorName, 
          geminiApiKey.value()
        );
        console.log('🧠 Pattern processing complete');
        
        res.json({
          success: true,
          extractedText,
          patternData: patternJson
        });
        
      } catch (error) {
        console.error('❌ OCR processing failed:', error);
        res.status(500).json({ 
          error: 'Processing failed', 
          details: error.message 
        });
      }
    });
  }
);

// Vision API text extraction
async function extractTextFromImage(base64Image, apiKey) {
  const visionRequest = {
    requests: [{
      image: { content: base64Image },
      features: [{ type: 'TEXT_DETECTION', maxResults: 10 }],
      imageContext: { languageHints: ['en'] }
    }]
  };
  
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visionRequest)
  });
  
  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }
  
  const result = await response.json();
  const textAnnotations = result.responses?.[0]?.textAnnotations;
  
  if (!textAnnotations || textAnnotations.length === 0) {
    throw new Error('No text found in image');
  }
  
  return textAnnotations[0].description;
}

// Gemini pattern processing
async function processTextToPattern(text, patternName, authorName, apiKey) {
  const prompt = `Convert this knitting pattern to JSON using the Firestore schema:
  
Name: ${patternName}
Author: ${authorName}

Raw Text:
${text}

Return structured JSON with metadata, glossary, and steps arrays.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!responseText) {
    throw new Error('No response from Gemini');
  }
  
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanJson);
}