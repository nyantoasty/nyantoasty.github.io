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
