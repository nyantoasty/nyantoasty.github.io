"""
Stitch Witch OCR Service
Python-based Cloud Run service for pattern OCR processing
Avoids Node.js entirely for security and maintainability
"""

import os
import json
import base64
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from google.cloud import firestore
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["https://nyantoasty.github.io", "http://localhost:*"])

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
        
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        required_fields = ['imageData', 'patternName', 'authorName', 'userId']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        image_data = data['imageData']
        pattern_name = data['patternName']
        author_name = data['authorName']
        user_id = data['userId']
        
        logger.info(f"Processing pattern: {pattern_name} by {author_name}")
        
        # Step 1: Extract text from image using Vision API
        extracted_text = extract_text_from_image(image_data)
        logger.info(f"📝 Text extraction complete: {len(extracted_text)} characters")
        
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
    
    # Call Vision API
    url = f"https://vision.googleapis.com/v1/images:annotate?key={VISION_API_KEY}"
    response = requests.post(url, json=vision_request)
    
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
    
    # Call Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    response = requests.post(url, json=gemini_request)
    
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
    """Get the LogicGuide prompt for pattern processing"""
    # For now, return a basic prompt - you can enhance this
    return """
    Convert this knitting pattern to a JSON object with the following structure:
    {
      "metadata": {"name": "Pattern Name", "author": "Author", "craft": "knitting", "maxSteps": 0},
      "glossary": {"k": {"name": "Knit", "description": "Standard knit stitch", "stitchesUsed": 1, "stitchesCreated": 1}},
      "steps": [{"step": 1, "startingStitchCount": 0, "endingStitchCount": 0, "instruction": "", "section": "setup", "side": "RS", "type": "regular"}]
    }
    
    Follow these rules:
    1. Create a complete glossary for all stitches used
    2. Enumerate all steps without repeats or loops
    3. Calculate accurate stitch counts for each step
    4. Resolve all variables like "knit to end"
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