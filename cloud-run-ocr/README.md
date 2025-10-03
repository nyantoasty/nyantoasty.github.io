# Stitch Witch OCR Service

## Overview
Python-based Cloud Run service for processing knitting pattern images through OCR and AI.

**Why Python Cloud Run instead of Node.js Firebase Functions:**
- ✅ **Security**: Avoids Node.js vulnerabilities
- ✅ **Performance**: Python excels at data processing and ML tasks
- ✅ **Scalability**: Cloud Run auto-scales and handles traffic spikes
- ✅ **Analytics Ready**: Foundation for statistical analysis features
- ✅ **Maintainability**: Simpler dependency management

## API Endpoints

### POST /process-ocr
Process an uploaded pattern image through OCR and AI structuring.

**Request:**
```json
{
  "imageData": "base64-encoded-image-data",
  "patternName": "Pattern Name",
  "authorName": "Author Name", 
  "userId": "firebase-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "patternId": "ocr-pattern-123456",
  "extractedText": "Cast on 20 stitches...",
  "message": "Pattern processed successfully"
}
```

### GET /health
Health check endpoint for monitoring.

### GET /analytics/stats
Basic pattern statistics (foundation for future analytics).

## Deployment

1. **Build and deploy to Cloud Run:**
   ```bash
   gcloud run deploy stitch-witch-ocr \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Set up environment variables:**
   ```bash
   gcloud run services update stitch-witch-ocr \
     --set-env-vars VISION_API_KEY=your-key \
     --set-env-vars GEMINI_API_KEY=your-key
   ```

## Security Features
- Non-root container user
- CORS restrictions to nyantoasty.github.io
- Environment-based API key management
- Input validation and sanitization
- Comprehensive error handling

## Future Analytics Extensions
The service is designed to easily add statistical analysis endpoints for:
- Pattern complexity analysis
- Stitch distribution statistics
- User behavior analytics
- Trend analysis across uploaded patterns