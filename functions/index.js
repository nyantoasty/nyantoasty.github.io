const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const vision = require('@google-cloud/vision');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(functions.config().gemini.key); // Set with: firebase functions:config:set gemini.key="your-api-key"

// Initialize Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient();

// Your LogicGuide.md content as system prompt
const LOGIC_GUIDE_PROMPT = `You are an expert knitting pattern parser. Your task is to convert human-readable knitting patterns into structured JSON format following this exact schema and logic:

## Target Schema
{
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer Name", 
    "craft": "knitting",
    "maxSteps": 280
  },
  "glossary": {
    "k": { "name": "Knit", "description": "Knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1 },
    "kfb": { "name": "Knit Front and Back", "description": "Increase.", "stitchesUsed": 1, "stitchesCreated": 2 },
    "k2tog": { "name": "Knit 2 Together", "description": "Decrease.", "stitchesUsed": 2, "stitchesCreated": 1 }
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

## Critical Rules:
1. FULLY ENUMERATE all repeats - no "repeat" instructions in output
2. Calculate exact startingStitchCount and endingStitchCount for every step
3. Resolve all variables like "k to end" into specific numbers
4. Create comprehensive glossary with stitchesUsed/stitchesCreated
5. Assign proper sections (setup, main, finishing) and sides (RS/WS)
6. Use type "specialInstruction" for cast-on, bind-off, etc.
7. Use type "regular" for stitch-by-stitch instructions

Return only valid JSON, no explanations.`;

exports.generatePattern = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to use AI generation');
    }

    const { patternText, patternName, patternAuthor } = data;

    if (!patternText || patternText.trim().length < 50) {
      throw new functions.https.HttpsError('invalid-argument', 'Pattern text must be at least 50 characters');
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Construct the full prompt (Gemini works better with a single comprehensive prompt)
    const fullPrompt = `${LOGIC_GUIDE_PROMPT}

---

Convert this knitting pattern to JSON:

Pattern Name: ${patternName || 'Untitled Pattern'}
Designer: ${patternAuthor || 'Unknown Designer'}

Pattern Text:
${patternText}

Return ONLY the complete JSON structure following the schema exactly. Do not include any explanations or markdown formatting.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedContent = response.text();
    
    // Clean up the response (remove any markdown formatting)
    let cleanedContent = generatedContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to parse the JSON to validate it
    let parsedPattern;
    try {
      parsedPattern = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated content:', cleanedContent);
      throw new functions.https.HttpsError('internal', 'AI generated invalid JSON');
    }

    // Basic validation
    if (!parsedPattern.metadata || !parsedPattern.glossary || !parsedPattern.steps) {
      throw new functions.https.HttpsError('internal', 'AI generated incomplete pattern structure');
    }

    // Log usage for monitoring
    console.log(`Pattern generated for user ${context.auth.uid}: ${parsedPattern.metadata.name}`);

    return {
      success: true,
      pattern: parsedPattern,
      generatedJson: cleanedContent
    };

  } catch (error) {
    console.error('Pattern generation error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to generate pattern');
  }
});

// Rate limiting function
exports.checkAiUsage = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const db = admin.firestore();
  
  const today = new Date().toISOString().split('T')[0];
  const usageRef = db.collection('ai_usage').doc(`${context.auth.uid}_${today}`);
  
  const usageDoc = await usageRef.get();
  const currentCount = usageDoc.exists ? usageDoc.data().count : 0;
  
  const dailyLimit = 5; // Adjust as needed
  
  if (currentCount >= dailyLimit) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily AI generation limit reached');
  }
  
  // Increment usage
  await usageRef.set({
    count: currentCount + 1,
    lastUsed: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
    return { 
      remaining: dailyLimit - (currentCount + 1),
      limit: dailyLimit 
    };
  } catch (error) {
    console.error('AI usage check error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check AI usage');
  }
});

// OCR Processing Function
exports.processOCR = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to use OCR');
    }

    const { fileData, fileName, mimeType } = data;

    if (!fileData) {
      throw new functions.https.HttpsError('invalid-argument', 'File data is required');
    }

    let extractedText = '';
    
    if (mimeType && mimeType.includes('image')) {
      // Process images with Cloud Vision OCR
      const imageBuffer = Buffer.from(fileData, 'base64');
      
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer }
      });
      
      const detections = result.textAnnotations;
      if (detections && detections.length > 0) {
        extractedText = detections[0].description;
      }
      
    } else if (mimeType && mimeType.includes('pdf')) {
      // Process PDFs with Cloud Vision Document AI
      const pdfBuffer = Buffer.from(fileData, 'base64');
      
      const [result] = await visionClient.documentTextDetection({
        image: { content: pdfBuffer }
      });
      
      const fullTextAnnotation = result.fullTextAnnotation;
      if (fullTextAnnotation) {
        extractedText = fullTextAnnotation.text;
      }
      
    } else if (mimeType && (mimeType.includes('text') || mimeType.includes('plain'))) {
      // Process plain text files
      extractedText = Buffer.from(fileData, 'base64').toString('utf-8');
      
    } else {
      // For other file types, try generic OCR
      const fileBuffer = Buffer.from(fileData, 'base64');
      
      const [result] = await visionClient.textDetection({
        image: { content: fileBuffer }
      });
      
      const detections = result.textAnnotations;
      if (detections && detections.length > 0) {
        extractedText = detections[0].description;
      }
    }

    // Clean up the extracted text
    extractedText = extractedText.trim();
    
    if (!extractedText) {
      throw new functions.https.HttpsError('internal', 'No text could be extracted from the file');
    }

    // Log usage for monitoring
    console.log(`OCR processed for user ${context.auth.uid}: ${fileName} (${extractedText.length} chars)`);

    return {
      success: true,
      text: extractedText,
      fileName: fileName,
      charCount: extractedText.length
    };

  } catch (error) {
    console.error('OCR processing error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', `Failed to process ${fileName}: ${error.message}`);
  }
});