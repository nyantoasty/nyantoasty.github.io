# Pattern OCR Setup Instructions

## Overview
The new client-side OCR functionality allows users to upload pattern images/PDFs and automatically convert them to structured Firestore patterns using:

1. **Google Vision API** - Extracts text from images/PDFs
2. **Google Gemini API** - Converts raw text to structured pattern JSON using LogicGuide.md
3. **Firestore Integration** - Saves patterns to your existing `patterns/` collection

## API Key Setup

### Current Status
- ✅ Gemini API key already configured: `AIzaSyAEiDASYq5WHALAYaQ1bs8ztZ--avzU0a4`
- ✅ Cloud Vision API already enabled for project `arachne-edda2`
- ⚠️ Need to verify Vision API key access

### Steps to Complete Setup

1. **Go to Google Cloud Console**
   - Navigate to APIs & Services → Credentials
   - Project: `arachne-edda2`

2. **Check/Create API Key**
   - Either use existing key or create new one
   - Make sure it has access to:
     - ✅ Generative Language API (for Gemini)
     - ⚠️ Cloud Vision API (add this if missing)

3. **Restrict API Key** (Recommended)
   - Application restrictions: HTTP referrers
   - Add: `https://nyantoasty.github.io/*` and `http://localhost:*`
   - API restrictions: Only select needed APIs

4. **Test the Functionality**
   - Load your GitHub Pages site
   - Sign in with Google
   - Look for "📤 Upload Pattern (OCR)" button
   - Try uploading a pattern image

## Integration with Existing System

This new functionality:
- ✅ **Preserves all existing features** - No changes to current patterns/progress tracking
- ✅ **Uses same Firestore collections** - Patterns saved to existing `patterns/` collection
- ✅ **Follows same access model** - Creates `pattern_access/` records for uploaded patterns
- ✅ **Compatible with existing UI** - New patterns appear alongside existing ones

## File Structure Added
- `js/pattern-ocr.js` - New OCR processing functionality
- Updated `js/app-main.js` - Added import for OCR functions

## How It Works
1. User clicks "Upload Pattern" button
2. Uploads image/PDF + enters pattern name/author
3. Vision API extracts text from image
4. Gemini processes text using LogicGuide.md prompt
5. Result saved to Firestore as new pattern
6. Pattern appears in user's pattern list automatically

## Troubleshooting
- Check browser console for API errors
- Verify API key has both Vision and Gemini access
- Ensure API key domain restrictions include your site
- Test with clear, high-contrast pattern images first