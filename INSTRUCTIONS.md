# Interactive Pattern Hub - Development Instructions

## Project Overview

This is a comprehensive knitting/crochet pattern management system with AI-powered pattern generation, interactive pattern viewing, and enhanced progress tracking. The system transforms traditional patterns into fully enumerated, step-by-step instructions with rich metadata, semantic token highlighting, and sharing capabilities.

## Core Philosophy

**"Transform Ambiguity into Certainty"** - The system eliminates all loops, repeats, and variables from patterns, creating complete, explicit instruction sequences from cast-on to bind-off.

## Architecture Overview

### Frontend Components
- **Pattern Viewer** (`index.html`) - Main interactive pattern viewing interface
- **Pattern Upload** (`pattern-upload.html`) - AI-assisted pattern conversion and upload
- **Pattern Manager** (`pattern-manager.html`) - Pattern management interface
- **Stitch Glossary** (`Stitch_Glossary.html`) - Stitch definition reference

### Backend Services
- **Firebase Functions** (`functions/index.js`) - AI pattern generation using Gemini
- **Firestore Database** - Pattern storage, user management, progress tracking
- **Firebase Storage** - Progress photo uploads (planned)

### Core Modules
- **Pattern Functions** (`js/pattern-functions.js`) - Pattern rendering with semantic token support
- **Progress Tracking** (`js/progress-tracking.js`) - Enhanced progress tracking with projectId support
- **Viewer Logic** (`js/viewer-logic.js`) - Pattern navigation and interaction
- **Stitch Witch Analytics** (`js/stitch-witch.js`) - User behavior analytics
- **Utilities** (`js/utils.js`) - Semantic token categorization and shared utilities

### CSS Architecture
- **Three-Tier Token System** (`css/`) - Semantic tokens → thematic mapping → palette variables
- **Modular Structure** - Base, themes, components organized in separate directories
- **Theme Support** - Dark/light themes with consistent semantic token mapping

## Key Features

### 1. Semantic Token System (Three-Tier Architecture)

The application uses a sophisticated three-tier token system for pattern highlighting:

**Tier 1: Semantic Tokens** - Pattern-agnostic identifiers stored in pattern data
- `token-stitch-01` through `token-stitch-05` - Structural stitches
- `token-special-01` through `token-special-05` - Pattern-specific techniques  
- `token-generic-01` through `token-generic-05` - Overflow and utility tokens

**Tier 2: Thematic Mapping** - CSS variables that map semantic tokens to theme roles
- `--theme-color-stitch-primary` - Maps to semantic tokens for basic stitches
- `--theme-color-special-accent` - Maps to semantic tokens for special techniques

**Tier 3: Palette Variables** - Actual color values that can change by theme
- `--palette-accent-500`, `--palette-neutral-300` - Concrete color definitions

This separation allows:
- **Pattern-agnostic highlighting** - AI assigns tokens based on pattern analysis, not hardcoded rules
- **Theme flexibility** - Dark/light themes without pattern data changes
- **Consistent semantics** - Same token types across different patterns

### 2. Pattern Schema (LogicGuide-Enhanced.md Compliant)

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
      "stitchesCreated": 1,
      "token": "token-stitch-03"
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
      "type": "regular",
      "highlightTokens": [
        {"text": "k1", "token": "token-stitch-03"},
        {"text": "kfb", "token": "token-stitch-01"},
        {"text": "k1", "token": "token-stitch-03"}
      ]
    }
  ]
}
```

### 3. Enhanced Progress Tracking
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
├── pattern-upload.html           # Pattern upload and conversion
├── pattern-manager.html          # Pattern management interface  
├── Stitch_Glossary.html          # Stitch definition reference
├── LogicGuide-Enhanced.md        # Pattern parsing methodology (current)
├── ENHANCED_PROGRESS_SCHEMA.md   # Progress tracking schema documentation
├── FIRESTORE_SCHEMA.md          # Database schema documentation
├── INSTRUCTIONS.md              # This file - development instructions
├── firebase.json                 # Firebase project configuration
├── firestore.rules               # Database security rules
├── storage.rules                 # Storage security rules
├── css/                          # Three-tier token CSS system
│   ├── main.css                  # Main import coordinator
│   ├── base/                     # Base styles and tokens
│   │   ├── tokens.css            # Semantic token definitions
│   │   └── thematic-mapping.css  # Token-to-theme mapping
│   ├── themes/                   # Theme-specific palettes
│   │   ├── dark.css              # Dark theme palette
│   │   └── light.css             # Light theme palette
│   └── components/               # Component-specific styles
│       ├── pattern-viewer.css    # Pattern display components
│       ├── navigation.css        # Navigation and controls
│       └── progress.css          # Progress tracking UI
├── js/
│   ├── pattern-functions.js      # Core pattern rendering with semantic tokens
│   ├── progress-tracking.js      # Enhanced progress tracking
│   ├── viewer-logic.js           # Pattern navigation
│   ├── stitch-witch.js           # Analytics and AI queries
│   ├── utils.js                  # Semantic token categorization
│   ├── cloud-run-ocr-client.js   # OCR service client
│   ├── firebase-config.js        # Firebase configuration
│   └── firestore-init.js         # Database initialization
├── functions/
│   ├── index.js                  # Firebase Cloud Functions
│   └── package.json              # Function dependencies
├── cloud-run-ocr/               # OCR service deployment
│   ├── main.py                   # Python OCR service
│   ├── Dockerfile                # Container configuration
│   └── requirements.txt          # Python dependencies
├── assets/
│   └── icons/                    # Application icons
├── patterns/                     # Sample pattern files
└── archive/                      # Archived files
    ├── README.md                 # Archive documentation
    ├── pwa-components/           # PWA manifest and service worker
    ├── sample-data/              # Test patterns and OCR images
    ├── development-docs/         # Development analysis docs
    ├── legacy-docs/              # Old documentation
    ├── migration-tools/          # Migration utilities
    └── experimental/             # Experimental features
```

## Development Guidelines

### 1. Semantic Token System
- **Pattern-driven assignment** - Let AI analyze each pattern and assign tokens based on what it finds
- **No hardcoded mappings** - Avoid predetermined stitch-to-token mappings in JavaScript
- **Glossary storage** - Token assignments should be stored in pattern's glossary during AI processing
- **Three-tier separation** - Keep semantic tokens, thematic mapping, and palette variables separate

### 2. Pattern Schema Compliance
- **Use LogicGuide-Enhanced.md schema** for all new patterns
- **Include highlightTokens** in step objects for semantic token support
- **No backwards compatibility** needed - clean slate implementation
- **Full enumeration required** - no loops or repeats in output
- **Precise stitch counting** for every step

### 3. Progress Tracking
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
- **Semantic Token System** - Three-tier token architecture for pattern highlighting
- **Modular CSS Architecture** - Organized base/themes/components structure
- **Enhanced progress tracking** with projectId support
- **AI pattern generation** with LogicGuide-Enhanced.md compliance
- **Pattern viewing and navigation** with semantic token support
- **Stitch finder and glossary integration**
- **User authentication and authorization**
- **Firestore security rules**
- **Basic analytics tracking**
- **Project cleanup** - Unnecessary files archived, core structure streamlined
- **OCR integration** - Cloud Run OCR service for pattern image processing

### 🔄 In Progress
- **Progress notes UI enhancement**
- **Advanced analytics integration**

### 📋 Planned
- **Pattern sharing and collaboration**
- **PWA features** - Progressive Web App capabilities (manifest and service worker in archive)
- **Image upload functionality** - Firebase Storage integration for progress photos
- **Mobile app development**
- **Pattern marketplace integration**

## Troubleshooting

### Common Issues
1. **Semantic tokens not displaying correctly**: Check that pattern has `highlightTokens` in step objects and glossary contains token assignments
2. **CSS not loading**: Ensure `css/main.css` is linked and imports are correctly structured
3. **Schema mismatches**: Ensure all patterns use LogicGuide-Enhanced.md format with semantic token support
4. **Authentication errors**: Check Firebase config and user permissions
5. **Progress tracking issues**: Verify projectId is included in all progress operations

### Debug Tools
- **Browser console** for client-side debugging
- **Firebase console** for database inspection
- **Network tab** for API call analysis
- **Application tab** for local storage inspection
- **CSS inspection** for semantic token and theme debugging

## Contact and Support

For development questions or issues:
1. Check existing documentation in current directory
2. Review schema documentation in `.md` files (LogicGuide-Enhanced.md, FIRESTORE_SCHEMA.md)
3. Examine existing patterns for reference implementation
4. Test changes with sample data before production deployment
5. Check `archive/` directory for historical context on removed features

## License and Usage

This project is part of the Interactive Pattern Hub system. Ensure all dependencies are properly licensed and attribution is maintained for external libraries and APIs.
