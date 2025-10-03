"""
Stitch Witch OCR Service
Python-based Cloud Run service for pattern OCR processing
Avoids Node.js entirely for security and maintainability
"""

import os
import json
import base64
import io
from typing import Dict, Any
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
CORS(app, origins=["*"])  # Allow all origins temporarily for testing

# Initialize Firestore
db = firestore.Client()

# Get API keys from environment (Cloud Run secrets)
VISION_API_KEY = os.environ.get('VISION_API_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not VISION_API_KEY or not GEMINI_API_KEY:
    logger.error("Missing required API keys in environment variables")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Cloud Run"""
    return jsonify({
        'status': 'healthy',
        'service': 'stitch-witch-ocr',
        'version': '1.0.0'
    })

@app.route('/extract-text', methods=['POST'])
def extract_text_only():
    """
    Extract text from image/PDF without generating full pattern
    For integration with Generator.html workflow
    
    Expected payload:
    {
        "imageData": "base64-encoded-image"
    }
    """
    try:
        logger.info("🔍 Starting text extraction request")
        
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        if 'imageData' not in data:
            return jsonify({'error': 'Missing required field: imageData'}), 400
        
        image_data = data['imageData']
        
        # Extract text from image using Vision API
        extracted_text = extract_text_from_image(image_data)
        logger.info(f"📝 Text extraction complete: {len(extracted_text)} characters")
        
        return jsonify({
            'success': True,
            'extractedText': extracted_text,
            'message': f'Successfully extracted {len(extracted_text)} characters of text'
        })
        
    except Exception as e:
        logger.error(f"❌ Text extraction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Text extraction failed: {str(e)}'
        }), 500

@app.route('/process-ocr', methods=['POST'])
def process_ocr():
    """
    Main OCR processing endpoint
    Expected payload:
    {
        "imageData": "base64-encoded-image",
        "patternName": "Pattern Name",
        "authorName": "Author Name",
        "userId": "firebase-user-id"
    }
    """
    try:
        logger.info("🔍 Starting OCR processing request")
        logger.info("🚀 VERSION CHECK: This is the latest code with comprehensive debugging - v2.1")
        
        # Validate request
        logger.info("🔍 Step 1: Validating request format...")
        if not request.is_json:
            logger.error("❌ Request is not JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
        
        logger.info("🔍 Getting JSON data...")
        data = request.get_json()
        logger.info(f"🔍 Received data keys: {list(data.keys()) if data else 'None'}")
        
        required_fields = ['imageData', 'patternName', 'authorName', 'userId']
        logger.info(f"🔍 Checking required fields: {required_fields}")
        
        for field in required_fields:
            if field not in data:
                logger.error(f"❌ Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        logger.info("🔍 Extracting fields from data...")
        image_data = data['imageData']
        pattern_name = data['patternName']
        author_name = data['authorName']
        user_id = data['userId']
        file_type = data.get('fileType', None)  # Optional field
        
        logger.info(f"🔍 Successfully extracted fields:")
        logger.info(f"  - pattern_name: {pattern_name}")
        logger.info(f"  - author_name: {author_name}")
        logger.info(f"  - user_id: {user_id}")
        logger.info(f"  - file_type: {repr(file_type)}")
        logger.info(f"  - image_data length: {len(image_data) if image_data else 'None'}")
        
        logger.info(f"Processing pattern: {pattern_name} by {author_name}, file type: {file_type}")
        
        # Step 1: Extract text from file (PDF or image)
        try:
            logger.info(f"🔍 About to call extract_text_from_file with file_type: {repr(file_type)}")
            extracted_text = extract_text_from_file(image_data, file_type)
            logger.info(f"📝 Text extraction complete: {len(extracted_text)} characters")
        except Exception as e:
            logger.error(f"❌ extract_text_from_file failed: {str(e)}")
            raise e
        
        # Step 2: Process text with Gemini to create structured pattern
        pattern_data = process_text_to_pattern(extracted_text, pattern_name, author_name)
        logger.info("🧠 Pattern structure generation complete")
        
        # Step 3: Save pattern to Firestore
        pattern_id = save_pattern_to_firestore(pattern_data, user_id)
        logger.info(f"💾 Pattern saved to Firestore: {pattern_id}")
        
        return jsonify({
            'success': True,
            'patternId': pattern_id,
            'extractedText': extracted_text[:500] + '...' if len(extracted_text) > 500 else extracted_text,
            'message': f'Pattern "{pattern_name}" processed successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ OCR processing failed: {str(e)}")
        return jsonify({
            'error': 'Processing failed',
            'details': str(e)
        }), 500

def extract_text_from_file(image_data: str, file_type: str = None) -> str:
    """Extract text from file - handle both PDFs and images"""
    try:
        logger.info(f"🔍 ENTERING extract_text_from_file")
        logger.info(f"🔍 file_type parameter: {repr(file_type)}")
        logger.info(f"🔍 image_data length: {len(image_data) if image_data else 'None'}")
        
        # Decode base64 data
        file_bytes = base64.b64decode(image_data)
        logger.info(f"📄 Decoded file size: {len(file_bytes)} bytes")
        logger.info(f"🔍 First 10 bytes: {file_bytes[:10]}")
        
        # Check if it's a PDF (either by file_type or by checking magic bytes)
        is_pdf_by_type = file_type == 'application/pdf'
        is_pdf_by_magic = file_bytes.startswith(b'%PDF')
        
        logger.info(f"🔍 PDF detection results:")
        logger.info(f"  - file_type == 'application/pdf': {is_pdf_by_type}")
        logger.info(f"  - file_bytes.startswith(b'%PDF'): {is_pdf_by_magic}")
        logger.info(f"  - Combined result: {is_pdf_by_type or is_pdf_by_magic}")
        
        if is_pdf_by_type or is_pdf_by_magic:
            logger.info("📄 ROUTING TO PDF PROCESSING")
            return extract_text_from_pdf(file_bytes)
        else:
            logger.info("🖼️ ROUTING TO IMAGE PROCESSING")
            return extract_text_from_image(image_data)
            
    except Exception as e:
        logger.error(f"❌ extract_text_from_file error: {str(e)}")
        raise Exception(f"File processing error: {str(e)}")

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using PyPDF2"""
    try:
        logger.info("📖 Extracting text from PDF...")
        
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        extracted_text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text.strip():  # Only add non-empty pages
                extracted_text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
        
        if not extracted_text.strip():
            raise Exception("No text found in PDF")
            
        logger.info(f"✅ Extracted {len(extracted_text)} characters from {len(pdf_reader.pages)} pages")
        return extracted_text.strip()
        
    except Exception as e:
        logger.error(f"❌ PDF extraction failed: {str(e)}")
        raise Exception(f"PDF extraction failed: {str(e)}")

def extract_text_from_image(base64_image: str) -> str:
    """Extract text from image using Google Vision API"""
    logger.info("🔍 Calling Vision API...")
    
    # Prepare Vision API request
    vision_request = {
        "requests": [{
            "image": {"content": base64_image},
            "features": [{
                "type": "TEXT_DETECTION",
                "maxResults": 10
            }],
            "imageContext": {
                "languageHints": ["en"]
            }
        }]
    }
    
    # Call Vision API with proper referrer header
    url = f"https://vision.googleapis.com/v1/images:annotate?key={VISION_API_KEY}"
    headers = {
        'Content-Type': 'application/json',
        'Referer': 'https://nyantoasty.github.io'
    }
    response = requests.post(url, json=vision_request, headers=headers)
    
    if not response.ok:
        raise Exception(f"Vision API error: {response.status_code} - {response.text}")
    
    result = response.json()
    
    # Check for API errors
    if 'responses' not in result or not result['responses']:
        raise Exception("No response from Vision API")
    
    response_data = result['responses'][0]
    if 'error' in response_data:
        raise Exception(f"Vision API error: {response_data['error']['message']}")
    
    # Extract text
    text_annotations = response_data.get('textAnnotations', [])
    if not text_annotations:
        raise Exception("No text found in image")
    
    # First annotation contains the full text
    extracted_text = text_annotations[0]['description']
    logger.info(f"✅ Vision API extracted {len(extracted_text)} characters")
    
    return extracted_text

def process_text_to_pattern(text: str, pattern_name: str, author_name: str) -> Dict[str, Any]:
    """Process extracted text through Gemini to create structured pattern"""
    logger.info("🧠 Calling Gemini API...")
    
    # Load LogicGuide prompt (you'll need to include this file or inline it)
    logic_guide = get_logic_guide_prompt()
    
    # Construct the full prompt
    prompt = f"""{logic_guide}

PATTERN TO PROCESS:
Name: {pattern_name}
Author: {author_name}

Raw Text from OCR:
{text}

Please convert this knitting pattern into the exact Firestore JSON schema described in the Logic Guide. Return ONLY the JSON object, no other text.
"""
    
    # Prepare Gemini request
    gemini_request = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192,
        }
    }
    
    # Call Gemini API with proper referrer header
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    headers = {
        'Content-Type': 'application/json',
        'Referer': 'https://nyantoasty.github.io'
    }
    response = requests.post(url, json=gemini_request, headers=headers)
    
    if not response.ok:
        raise Exception(f"Gemini API error: {response.status_code} - {response.text}")
    
    result = response.json()
    
    # Extract response
    if not result.get('candidates') or not result['candidates'][0].get('content'):
        raise Exception("No response from Gemini API")
    
    response_text = result['candidates'][0]['content']['parts'][0]['text']
    
    # Parse JSON response
    try:
        # Clean up response (remove markdown code blocks if present)
        clean_json = response_text.replace('```json\n', '').replace('```\n', '').replace('```', '').strip()
        pattern_data = json.loads(clean_json)
        logger.info("✅ Gemini API generated structured pattern")
        return pattern_data
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {response_text[:200]}...")
        raise Exception(f"Invalid JSON response from Gemini: {str(e)}")

def save_pattern_to_firestore(pattern_data: Dict[str, Any], user_id: str) -> str:
    """Save the processed pattern to Firestore"""
    logger.info("💾 Saving pattern to Firestore...")
    
    # Generate pattern ID
    pattern_id = f"ocr-pattern-{int(os.urandom(4).hex(), 16)}"
    
    # Enhance pattern data with metadata
    enhanced_pattern = {
        **pattern_data,
        'id': pattern_id,
        'createdBy': user_id,
        'createdAt': firestore.SERVER_TIMESTAMP,
        'lastUpdated': firestore.SERVER_TIMESTAMP,
        'source': 'ocr_upload',
        'uploadMethod': 'python_cloud_run',
        'metadata': {
            **pattern_data.get('metadata', {}),
            'source': 'ocr_upload'
        },
        # Analytics
        'shareCount': 0,
        'viewCount': 0,
        'forkCount': 0,
        'exportCount': 0,
        'tags': pattern_data.get('metadata', {}).get('tags', []) + ['uploaded', 'ocr']
    }
    
    # Save to Firestore patterns collection
    db.collection('patterns').document(pattern_id).set(enhanced_pattern)
    
    # Create access record for the creator
    access_record = {
        'patternId': pattern_id,
        'userId': user_id,
        'grantedBy': user_id,
        'permission': 'admin',
        'grantedAt': firestore.SERVER_TIMESTAMP,
        'expiresAt': None,
        'status': 'active',
        'shareReason': 'pattern_creator'
    }
    
    db.collection('pattern_access').document(f"{pattern_id}_{user_id}").set(access_record)
    
    logger.info(f"✅ Pattern saved: {pattern_id}")
    return pattern_id

def get_logic_guide_prompt() -> str:
    """Get the comprehensive LogicGuide prompt for pattern processing"""
    return """
    # Logic Guide for Interpreting and Enumerating Knitting Patterns

    ## Objective
    To translate a condensed, human-readable knitting pattern into a fully enumerated, step-by-step Firestore document. This creates a rich, interactive experience for the crafter, with features like color-coded stitches, clickable definitions, and precise row-by-row navigation.

    The core philosophy is to **transform ambiguity into certainty**. We will eliminate all loops, repeats, and variables, producing a complete, explicit list of actions from cast on to bind off.

    ## The Target Firestore Schema
    ```json
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
    ```

    ## Core Rules for Translation

    ### 1. The Glossary: Foundation of Automation
    For every stitch abbreviation used in the pattern:
    - **stitchesUsed**: Stitches taken off the left needle
    - **stitchesCreated**: Stitches placed on the right needle
    - Net change = stitchesCreated - stitchesUsed

    ### 2. Full Step Enumeration (NO Repeats)
    - Convert "Rows 3-10: k all" into 8 separate step objects (3,4,5,6,7,8,9,10)
    - Convert "(yo, k2tog) 5 times" into "yo, k2tog, yo, k2tog, yo, k2tog, yo, k2tog, yo, k2tog"
    - Calculate "k to end" based on current stitch count

    ### 3. Precise Stitch Count Tracking
    - Every step MUST have startingStitchCount and endingStitchCount
    - endingStitchCount of step N = startingStitchCount of step N+1
    - Calculate by parsing every stitch using glossary values

    ### 4. Step Object Schema
    ```json
    {
      "step": 63,
      "startingStitchCount": 137,
      "endingStitchCount": 139,
      "instruction": "k3, kfb, yo, ssk, k7, k2tog, yo, k1",
      "section": "body",
      "side": "RS",
      "type": "regular"
    }
    ```

    Convert the provided pattern text into this exact JSON structure with complete enumeration.
    """

@app.route('/analytics/stats', methods=['GET'])
def get_basic_stats():
    """Basic analytics endpoint - foundation for future statistical analysis"""
    try:
        # Count patterns by source
        patterns_ref = db.collection('patterns')
        total_patterns = len(list(patterns_ref.stream()))
        
        ocr_patterns = len(list(patterns_ref.where('source', '==', 'ocr_upload').stream()))
        
        return jsonify({
            'totalPatterns': total_patterns,
            'ocrPatterns': ocr_patterns,
            'traditionalPatterns': total_patterns - ocr_patterns,
            'service': 'stitch-witch-analytics'
        })
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return jsonify({'error': 'Analytics unavailable'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)