#!/usr/bin/env python3
"""
Simple test to verify deployment path
"""
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'test-deployment-verification',
        'version': 'DEFINITELY-NEW-CODE-999',
        'timestamp': '2025-10-03-TEST'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)