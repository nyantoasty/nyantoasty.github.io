# Interactive Pattern Hub - Development Instructions

## Project Overview

This is a comprehensive knitting/crochet pattern management system with AI-powered pattern generation, interactive pattern viewing, and enhanced progress tracking. The system transforms traditional patterns into fully enumerated, step-by-step instructions with rich metadata and sharing capabilities.

## Core Philosophy

**"Transform Ambiguity into Certainty"** - The system eliminates all loops, repeats, and variables from patterns, creating complete, explicit instruction sequences from cast-on to bind-off.

## Architecture Overview

### Frontend Components
- **Pattern Viewer** (`index.html`) - Main interactive pattern viewing interface
- **Pattern Generator** (`Generator.html`) - AI prompt generator for pattern creation
- **Pattern Upload** (`pattern-upload.html`) - AI-assisted pattern conversion and upload

### Backend Services
- **Firebase Functions** (`functions/index.js`) - AI pattern generation using Gemini
- **Firestore Database** - Pattern storage, user management, progress tracking
- **Firebase Storage** - Progress photo uploads (planned)

### Core Modules
- **Pattern Functions** (`js/pattern-functions.js`) - Pattern rendering and display logic
- **Progress Tracking** (`js/progress-tracking.js`) - Enhanced progress tracking with projectId support
- **Viewer Logic** (`js/viewer-logic.js`) - Pattern navigation and interaction
- **Stitch Witch Analytics** (`js/stitch-witch.js`) - User behavior analytics
- **Utilities** (`js/utils.js`) - Shared utility functions

## Key Features

### 1. Pattern Schema (LogicGuide.md Compliant)
```json
{
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer",
    "craft": "knitting",
    "maxSteps": 280
  },
  "glossary": {
    "k": { 
      "name": "Knit", 
      "description": "Standard knit stitch",
      "stitchesUsed": 1, 
      "stitchesCreated": 1 
    }
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

### 2. Enhanced Progress Tracking
- **Multi-Project Support**: Users can work on multiple instances of the same pattern
- **Rich Metadata**: Yarn details, tools, modifications, notes, timestamps
- **Progress Photos**: Firebase Storage integration (planned)
- **Analytics Integration**: Detailed usage tracking and insights

### 3. AI Pattern Generation
- **Gemini-Powered**: Uses Google's Gemini 1.5 Pro for pattern conversion
- **Full Enumeration**: Expands all repeats and resolves variables
- **Precise Stitch Counting**: Calculates exact stitch counts for every step
- **OCR Support**: Can process pattern images via Cloud Vision API

## Development Workflow

### Version Management
**CRITICAL**: Whenever making updates, you MUST update both:

1. **HTML Comment** at the top of `index.html`:
```html
<!-- Version: v2025-10-02-description-of-changes -->
```

2. **Version Display** in the app container:
```html
<p class="text-xs text-gray-500">v2025-10-02 - Description of changes</p>
```

### File Structure
```
├── index.html                    # Main pattern viewer application
├── Generator.html                # AI pattern generator interface
├── pattern-upload.html           # Pattern upload and conversion
├── pattern-manager.html          # Pattern management interface
├── Stitch_Glossary.html          # Stitch definition reference
├── manifest.json                 # PWA configuration
├── sw.js                         # Service worker for offline support
├── LogicGuide.md                 # Pattern parsing methodology
├── ENHANCED_PROGRESS_SCHEMA.md   # Progress tracking schema documentation
├── FIRESTORE_SCHEMA.md          # Database schema documentation
├── firestore.rules               # Database security rules
├── storage.rules                 # Storage security rules
├── js/
│   ├── pattern-functions.js      # Core pattern rendering
│   ├── progress-tracking.js      # Enhanced progress tracking
│   ├── viewer-logic.js           # Pattern navigation
│   ├── stitch-witch.js           # Analytics and AI queries
│   ├── utils.js                  # Shared utilities
│   ├── firebase-config.js        # Firebase configuration
│   └── firestore-init.js         # Database initialization
├── functions/
│   ├── index.js                  # Firebase Cloud Functions
│   └── package.json              # Function dependencies
├── scripts/
│   ├── firestore-setup.js        # Database setup (deprecated)
│   ├── progress-setup.js         # Progress system setup
│   └── create-sea-witch-pattern.js # Sample pattern (deprecated)
├── assets/
│   └── icons/                    # Application icons
└── patterns/                     # Sample pattern files
```

## Development Guidelines

### 1. Pattern Schema Compliance
- **Use LogicGuide.md schema** for all new patterns
- **No backwards compatibility** needed - clean slate implementation
- **Full enumeration required** - no loops or repeats in output
- **Precise stitch counting** for every step

### 2. Progress Tracking
- **Always use projectId** for new progress entries
- **Include rich metadata** (yarn, tools, modifications)
- **Timestamp all changes** with serverTimestamp()
- **Support multiple projects** per pattern per user

### 3. Error Handling
- **Graceful degradation** for missing data
- **User-friendly error messages** 
- **Console logging** for debugging
- **Validation** before database writes

### 4. Security
- **Firestore rules** enforce user ownership
- **Input validation** on client and server
- **Rate limiting** for AI generation
- **Secure file uploads** for progress photos

## Deployment Instructions

### Firebase Setup
1. **Initialize Firebase project**
2. **Configure authentication** (Google OAuth)
3. **Deploy Firestore rules**: `firebase deploy --only firestore:rules`
4. **Deploy storage rules**: `firebase deploy --only storage:rules`
5. **Deploy Cloud Functions**: `firebase deploy --only functions`

### Environment Configuration
1. **Set API keys** in Firebase Functions config:
   ```bash
   firebase functions:config:set gemini.key="your-gemini-api-key"
   ```

2. **Update Firebase config** in `js/firebase-config.js`

### Testing Workflow
1. **Load test pattern** via pattern selector
2. **Create sample progress** using header button
3. **Test AI generation** via pattern-upload.html
4. **Verify analytics** in Firestore console

## Feature Implementation Status

### ✅ Completed
- Enhanced progress tracking with projectId support
- AI pattern generation with LogicGuide.md compliance
- Pattern viewing and navigation
- Stitch finder and glossary integration
- User authentication and authorization
- Firestore security rules
- Basic analytics tracking

### 🔄 In Progress
- Progress notes UI enhancement
- Image upload functionality
- Advanced analytics integration

### 📋 Planned
- Pattern sharing and collaboration
- Offline support and PWA features
- Mobile app development
- Pattern marketplace integration

## Troubleshooting

### Common Issues
1. **setupStitchFinder not defined**: Function was missing, now fixed in current version
2. **Schema mismatches**: Ensure all patterns use LogicGuide.md format
3. **Authentication errors**: Check Firebase config and user permissions
4. **Progress tracking issues**: Verify projectId is included in all progress operations

### Debug Tools
- **Browser console** for client-side debugging
- **Firebase console** for database inspection
- **Network tab** for API call analysis
- **Application tab** for local storage inspection

## Contact and Support

For development questions or issues:
1. Check existing documentation in `/docs` directory
2. Review schema documentation in `.md` files
3. Examine existing patterns for reference implementation
4. Test changes with sample data before production deployment

## License and Usage

This project is part of the Interactive Pattern Hub system. Ensure all dependencies are properly licensed and attribution is maintained for external libraries and APIs.