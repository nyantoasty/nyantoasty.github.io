#!/usr/bin/env python3
"""
Test script for Cloud Run OCR service
Tests with files from testFiles directory
"""

import base64
import json
import requests
import sys
import os

CLOUD_RUN_URL = "https://stitch-witch-ocr-285468127259.us-central1.run.app"

def encode_file_to_base64(file_path):
    """Encode file to base64"""
    with open(file_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def get_file_type(file_path):
    """Get MIME type from file extension"""
    if file_path.lower().endswith('.pdf'):
        return 'application/pdf'
    elif file_path.lower().endswith(('.jpg', '.jpeg')):
        return 'image/jpeg'
    elif file_path.lower().endswith('.png'):
        return 'image/png'
    else:
        return 'application/octet-stream'

def test_ocr_service(file_path):
    """Test the OCR service with a file"""
    print(f"\nTesting OCR service with: {file_path}")
    
    if not os.path.exists(file_path):
        print(f" File not found: {file_path}")
        return False
    
    # Get file info
    file_size = os.path.getsize(file_path)
    file_type = get_file_type(file_path)
    print(f"File size: {file_size:,} bytes")
    print(f"File type: {file_type}")
    
    # Encode file
    print("Encoding file to base64...")
    try:
        base64_data = encode_file_to_base64(file_path)
        print(f"Encoded to {len(base64_data):,} characters")
    except Exception as e:
        print(f"Failed to encode file: {e}")
        return False
    
    # Prepare request
    payload = {
        "imageData": base64_data,
        "patternName": f"Test Pattern - {os.path.basename(file_path)}",
        "authorName": "Test Author",
        "userId": "test-user-123",
        "fileType": file_type
    }
    
    print("Calling Cloud Run service...")
    try:
        response = requests.post(
            f"{CLOUD_RUN_URL}/process-ocr",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120  # 2 minute timeout for processing
        )
        
        print(f" Response status: {response.status_code}")
        
        if response.ok:
            result = response.json()
            if result.get('success'):
                extracted_text = result.get('extractedText', '')
                pattern_id = result.get('patternId', 'N/A')
                print(f"SUCCESS!")
                print(f"Extracted text length: {len(extracted_text)} characters")
                print(f"Pattern ID: {pattern_id}")
                print(f"First 200 characters:")
                print(f"   {extracted_text[:200]}...")
                return True
            else:
                error = result.get('error', 'Unknown error')
                print(f"Service returned error: {error}")
                return False
        else:
            try:
                error_data = response.json()
                print(f"HTTP {response.status_code}: {error_data}")
            except:
                print(f" HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("Request timed out (>2 minutes)")
        return False
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def main():
    """Main test function"""
    print("Cloud Run OCR Service Test")
    print(f"Service URL: {CLOUD_RUN_URL}")
    
    # Test health endpoint first
    print("\n Testing health endpoint...")
    try:
        health_response = requests.get(f"{CLOUD_RUN_URL}/health", timeout=10)
        if health_response.ok:
            health_data = health_response.json()
            print(f" Service healthy: {health_data}")
        else:
            print(f" Health check failed: {health_response.status_code}")
            return
    except Exception as e:
        print(f" Health check error: {e}")
        return
    
    # Get testFiles directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_files_dir = os.path.join(script_dir, "..", "testFiles")
    
    if len(sys.argv) > 1:
        # Test specific file
        file_name = sys.argv[1]
        file_path = os.path.join(test_files_dir, file_name)
        test_ocr_service(file_path)
    else:
        # Test all files
        print(f"\n Looking for test files in: {test_files_dir}")
        
        if not os.path.exists(test_files_dir):
            print(f" testFiles directory not found: {test_files_dir}")
            return
        
        test_files = [f for f in os.listdir(test_files_dir) 
                     if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))]
        
        if not test_files:
            print(" No test files found")
            return
        
        print(f" Found {len(test_files)} test files")
        
        success_count = 0
        for file_name in test_files:
            file_path = os.path.join(test_files_dir, file_name)
            if test_ocr_service(file_path):
                success_count += 1
            print("-" * 50)
        
        print(f"\n Test Results: {success_count}/{len(test_files)} successful")

if __name__ == "__main__":
    main()