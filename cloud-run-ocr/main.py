"""
Stitch Witch OCR Service - Production Version
"""

import os
import json
import base64
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from google.cloud import firestore
import logging
import PyPDF2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["*"])

# Initialize Firestore
db = firestore.Client()

# Get API keys from environment
VISION_API_KEY = os.environ.get('VISION_API_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'stitch-witch-ocr',
        'version': '3.0.0-production'
    })

def extract_text_from_pdf(base64_data: str) -> str:
    """Extract text from PDF using PyPDF2"""
    logger.info("Processing PDF file")
    try:
        pdf_bytes = base64.b64decode(base64_data)
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        extracted_text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            extracted_text += f"Page {page_num + 1}:\n{page_text}\n\n"
        
        logger.info(f"PDF processing complete: {len(extracted_text)} characters")
        return extracted_text.strip()
        
    except Exception as e:
        logger.error(f"PDF processing failed: {str(e)}")
        raise Exception(f"PDF processing error: {str(e)}")

def extract_text_from_image(base64_data: str) -> str:
    """Extract text from image using Vision API"""
    logger.info("Processing image with Vision API")
    try:
        url = f"https://vision.googleapis.com/v1/images:annotate?key={VISION_API_KEY}"
        
        payload = {
            "requests": [{
                "image": {"content": base64_data},
                "features": [{"type": "TEXT_DETECTION"}]
            }]
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Vision API error: {response.text}")
        
        result = response.json()
        
        if ('responses' in result and len(result['responses']) > 0 and
            'textAnnotations' in result['responses'][0] and
            len(result['responses'][0]['textAnnotations']) > 0):
            
            extracted_text = result['responses'][0]['textAnnotations'][0]['description']
            logger.info(f"Vision API processing complete: {len(extracted_text)} characters")
            return extracted_text
        else:
            return ""
            
    except Exception as e:
        logger.error(f"Vision API processing failed: {str(e)}")
        raise Exception(f"Vision API error: {str(e)}")

@app.route('/process-ocr', methods=['POST'])
def process_ocr():
    """Process OCR request"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['imageData', 'patternName', 'authorName', 'userId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        image_data = data['imageData']
        pattern_name = data['patternName']
        author_name = data['authorName']
        user_id = data['userId']
        file_type = data.get('fileType', 'image/jpeg')
        
        logger.info(f"Processing {file_type} for pattern '{pattern_name}'")
        
        # Extract text based on file type
        if file_type == 'application/pdf':
            extracted_text = extract_text_from_pdf(image_data)
        else:
            extracted_text = extract_text_from_image(image_data)
        
        # Save basic pattern to Firestore
        pattern_data = {
            'title': pattern_name,
            'author': author_name,
            'extractedText': extracted_text,
            'source': 'ocr',
            'userId': user_id,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'type': 'raw_ocr'
        }
        
        doc_ref = db.collection('patterns').add(pattern_data)
        pattern_id = doc_ref[1].id
        
        logger.info(f"Pattern saved with ID: {pattern_id}")
        
        return jsonify({
            'success': True,
            'patternId': pattern_id,
            'extractedText': extracted_text,
            'message': f'Pattern "{pattern_name}" processed successfully'
        })
        
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/generate-pattern', methods=['POST'])
def generate_pattern():
    """Generate pattern JSON from text using Gemini AI with LogicGuide prompt"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        required_fields = ['patternText', 'patternName', 'authorName']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        pattern_text = data['patternText']
        pattern_name = data['patternName']
        author_name = data['authorName']
        
        # Generate pattern using Gemini AI
        pattern_json = generate_pattern_from_text(pattern_text, pattern_name, author_name)
        
        return jsonify({
            'success': True,
            'patternData': pattern_json,
            'message': f'Pattern "{pattern_name}" generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Pattern generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_pattern_from_text(pattern_text: str, pattern_name: str, author_name: str) -> dict:
    """Generate pattern JSON using Gemini AI with comprehensive LogicGuide prompt"""
    
    # Validate input length to prevent API timeouts
    if len(pattern_text) > 10000:
        logger.warning(f"Pattern text is very long ({len(pattern_text)} chars), truncating to prevent API timeout")
        pattern_text = pattern_text[:10000] + "... [truncated for processing]"
    
    if len(pattern_text) < 50:
        raise Exception("Pattern text is too short. Please provide more detailed pattern instructions.")
    
    prompt = f"""You are an expert knitting pattern translator. Your task is to convert a condensed, human-readable knitting pattern into a fully enumerated, step-by-step JSON document following our precise Firestore schema.

CORE PHILOSOPHY: Transform ambiguity into certainty. Eliminate all loops, repeats, and variables, producing a complete, explicit list of actions from cast on to bind off.

TARGET SCHEMA:
{{
  "metadata": {{
    "name": "{pattern_name}",
    "author": "{author_name}", 
    "craft": "knitting",
    "maxSteps": 280
  }},
  "glossary": {{
    "k": {{ "name": "Knit", "description": "A standard knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1 }},
    "kfb": {{ "name": "Knit Front and Back", "description": "A one-stitch increase.", "stitchesUsed": 1, "stitchesCreated": 2 }},
    "k2tog": {{ "name": "Knit 2 Together", "description": "A one-stitch decrease.", "stitchesUsed": 2, "stitchesCreated": 1 }}
  }},
  "steps": [
    {{
      "step": 1,
      "startingStitchCount": 3,
      "endingStitchCount": 4,
      "instruction": "k1, kfb, k1",
      "section": "setup",
      "side": "RS", 
      "type": "regular"
    }}
  ]
}}

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
Name: {pattern_name}
Author: {author_name}

Pattern Text:
{pattern_text}

INSTRUCTIONS:
1. First, identify the cast on instruction to establish initial stitch count
2. Scan the entire pattern to build the complete glossary
3. Process each row sequentially, expanding all repeats
4. Calculate accurate stitch counts for every step
5. Resolve all variable instructions to specific numbers
6. Return ONLY the JSON object, no extra text or formatting

Return the complete JSON structure now:"""

    # Call Gemini API
    headers = {
        'Content-Type': 'application/json',
    }
    
    payload = {
        'contents': [{
            'parts': [{ 'text': prompt }]
        }],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 8192,
            'candidateCount': 1
        }
    }
    
    try:
        logger.info(f"Calling Gemini API for pattern: {pattern_name}")
        logger.info(f"Pattern text length: {len(pattern_text)} characters")
        
        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}',
            headers=headers,
            json=payload,
            timeout=120  # Increased timeout for complex patterns
        )
        
        logger.info(f"Gemini API response status: {response.status_code}")
        
        if not response.ok:
            error_detail = response.text
            logger.error(f'Gemini API error {response.status_code}: {error_detail}')
            raise Exception(f'Gemini API error: {response.status_code} - {error_detail}')
        
        result = response.json()
        response_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        if not response_text:
            logger.error('Empty response from Gemini API')
            raise Exception('No response from Gemini API')
        
        logger.info(f"Received response from Gemini, length: {len(response_text)} characters")
        
        # Clean and parse JSON response
        clean_json = response_text.replace('```json', '').replace('```', '').strip()
        
        # Remove any leading/trailing non-JSON text
        start_brace = clean_json.find('{')
        end_brace = clean_json.rfind('}')
        
        if start_brace == -1 or end_brace == -1:
            logger.error(f'No JSON braces found in response: {clean_json[:200]}...')
            raise Exception('Invalid JSON response format')
        
        clean_json = clean_json[start_brace:end_brace+1]
        
        try:
            pattern_json = json.loads(clean_json)
            
            # Validate structure
            required_keys = ['metadata', 'glossary', 'steps']
            missing_keys = [key for key in required_keys if key not in pattern_json]
            if missing_keys:
                raise Exception(f'Invalid pattern structure: missing {missing_keys}')
            
            # Validate metadata has required fields
            required_metadata = ['name', 'author', 'craft']
            missing_metadata = [key for key in required_metadata if key not in pattern_json['metadata']]
            if missing_metadata:
                raise Exception(f'Invalid metadata: missing {missing_metadata}')
            
            # Set maxSteps in metadata
            steps_count = len(pattern_json['steps']) if isinstance(pattern_json['steps'], list) else 0
            pattern_json['metadata']['maxSteps'] = steps_count
            
            logger.info(f"Successfully generated pattern with {steps_count} steps")
            return pattern_json
            
        except json.JSONDecodeError as e:
            logger.error(f'JSON Parse Error: {e}')
            logger.error(f'Clean JSON attempt: {clean_json[:500]}...')
            logger.error(f'Raw Response: {response_text[:500]}...')
            raise Exception(f'Failed to parse generated pattern: {e}')
            
    except requests.exceptions.Timeout:
        logger.error('Gemini API request timed out')
        raise Exception('Pattern generation timed out - pattern may be too complex')
    except requests.exceptions.RequestException as e:
        logger.error(f'Request to Gemini API failed: {e}')
        raise Exception(f'Failed to connect to Gemini API: {e}')
    except Exception as e:
        logger.error(f'Unexpected error in pattern generation: {e}')
        raise

@app.route('/extract-text', methods=['POST'])
def extract_text_only():
    """Extract text without saving pattern"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        if 'imageData' not in data:
            return jsonify({'error': 'Missing required field: imageData'}), 400
        
        image_data = data['imageData']
        file_type = data.get('fileType', 'image/jpeg')
        
        # Extract text based on file type
        if file_type == 'application/pdf':
            extracted_text = extract_text_from_pdf(image_data)
        else:
            extracted_text = extract_text_from_image(image_data)
        
        return jsonify({
            'success': True,
            'extractedText': extracted_text,
            'message': f'Successfully extracted {len(extracted_text)} characters'
        })
        
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
