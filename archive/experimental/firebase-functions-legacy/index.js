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

// Generate Pattern Function - for converting pattern text to JSON
exports.generatePattern = onRequest(
  {
    secrets: [geminiApiKey],
    cors: true
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        console.log('🧠 Processing pattern generation request...');
        
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const { patternText, patternName, authorName } = req.body;
        
        if (!patternText || !patternName || !authorName) {
          return res.status(400).json({ 
            error: 'Missing required fields: patternText, patternName, authorName' 
          });
        }
        
        const patternJson = await generatePatternFromText(
          patternText, 
          patternName, 
          authorName, 
          geminiApiKey.value()
        );
        
        console.log('✅ Pattern generation complete');
        
        res.json({
          success: true,
          patternData: patternJson
        });
        
      } catch (error) {
        console.error('❌ Pattern generation failed:', error);
        res.status(500).json({ 
          error: 'Pattern generation failed', 
          details: error.message 
        });
      }
    });
  }
);

// Advanced Gemini pattern generation based on LogicGuide.md
async function generatePatternFromText(patternText, patternName, authorName, apiKey) {
  const prompt = `You are an expert knitting pattern translator. Your task is to convert a condensed, human-readable knitting pattern into a fully enumerated, step-by-step JSON document following our precise Firestore schema.

CORE PHILOSOPHY: Transform ambiguity into certainty. Eliminate all loops, repeats, and variables, producing a complete, explicit list of actions from cast on to bind off.

TARGET SCHEMA:
{
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer Name", 
    "craft": "knitting",
    "maxSteps": 280
  },
  "glossary": {
    "k": { "name": "Knit", "description": "A standard knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1 },
    "kfb": { "name": "Knit Front and Back", "description": "A one-stitch increase.", "stitchesUsed": 1, "stitchesCreated": 2 },
    "k2tog": { "name": "Knit 2 Together", "description": "A one-stitch decrease.", "stitchesUsed": 2, "stitchesCreated": 1 }
  },
  "steps": [
    {
      "step": 1,
      "startingStitchCount": 3,
      "endingStitchCount": 4,
      "instruction": "k1, kfb, k1",
      "section": "setup",
      "side": "RS", 
      "type": "regular"
    }
  ]
}

CRITICAL REQUIREMENTS:

1. GLOSSARY CREATION: Build a complete glossary for EVERY stitch abbreviation used in the pattern. Each entry must have:
   - name: Full name of the stitch
   - description: Clear explanation of the technique
   - stitchesUsed: How many stitches are consumed from left needle
   - stitchesCreated: How many stitches are placed on right needle
   
   Net change = stitchesCreated - stitchesUsed

2. STITCH COUNT CALCULATION: Every step MUST have accurate startingStitchCount and endingStitchCount. The endingStitchCount of one step becomes the startingStitchCount of the next.

3. EXPAND ALL REPEATS: 
   - "Repeat Rows 3 and 4 five more times" → Generate 10 individual steps with consecutive numbering
   - "(yo, ssk) 6 times" → "yo, ssk, yo, ssk, yo, ssk, yo, ssk, yo, ssk, yo, ssk"
   - Recalculate variables like "k to end" for each expanded row

4. RESOLVE VARIABLES:
   - "k to end" depends on current stitch count and preceding stitches in the row
   - Example: Row with 10 stitches starting "k2, yo," then "k to end" = "k7" (10 - 2 knit - 1 yo stitch created)
   - Always provide the fully resolved instruction

5. SEQUENTIAL PROCESSING:
   - Initialize: currentStepNumber = 1, currentStitchCount from cast on
   - For each row: calculate starting count, resolve variables, expand repeats, calculate ending count
   - Update state: currentStitchCount = endingStitchCount, increment step number
   - Alternate side: RS → WS → RS

PATTERN TO CONVERT:
Name: ${patternName}
Author: ${authorName}

Pattern Text:
${patternText}

INSTRUCTIONS:
1. First, identify the cast on instruction to establish initial stitch count
2. Scan the entire pattern to build the complete glossary
3. Process each row sequentially, expanding all repeats
4. Calculate accurate stitch counts for every step
5. Resolve all variable instructions to specific numbers
6. Return ONLY the JSON object, no extra text or formatting

Return the complete JSON structure now:`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 8192,
        candidateCount: 1
      }
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
  
  // Clean and parse the JSON response
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsedJson = JSON.parse(cleanJson);
    
    // Validate the structure
    if (!parsedJson.metadata || !parsedJson.glossary || !parsedJson.steps) {
      throw new Error('Invalid pattern structure: missing required sections');
    }
    
    // Set maxSteps in metadata
    parsedJson.metadata.maxSteps = parsedJson.steps.length;
    
    return parsedJson;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Raw Response:', responseText);
    throw new Error(`Failed to parse generated pattern: ${parseError.message}`);
  }
}