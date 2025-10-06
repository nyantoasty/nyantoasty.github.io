# Firestore Schema v2.0 - Pattern Storage with Sharing

## Overview

This schema supports:
- Pattern storage and management
- User-to-user pattern sharing
- Permission-based access control
- Analytics and usage tracking
- Export capabilities
- **Three-tier semantic token system** for interactive highlighting (see LogicGuide-Enhanced.md)

## Collection Structure

```
firestore
├── users/                           # User profiles and preferences
├── patterns/                        # All patterns (shared storage)
├── pattern_access/                  # Permission management
├── pattern_shares/                  # Sharing requests and history
├── user_pattern_progress/           # User progress on patterns (projects)
├── stitch_finder_queries/          # Analytics (existing)
├── navigation_events/              # Analytics (existing)
└── generator_events/               # Analytics (existing)
```

## Detailed Schema

### 1. users/{userId}
```javascript
{
  email: "user@example.com",
  displayName: "Jane Crafter",
  createdAt: timestamp,
  lastLoginAt: timestamp,
  preferences: {
    defaultCraft: "knitting",        // knitting, crochet, etc.
    displayMode: "detailed",         // detailed, compact
    colorTheme: "default"
  },
  stats: {
    patternsCreated: 5,
    patternsShared: 2,
    patternsReceived: 8
  }
}
```

### 2. patterns/{patternId}
**Core pattern storage - enhanced to support rich LogicGuide features**
```javascript
{
  // Basic metadata (enhanced)
  id: "pattern_uuid",
  name: "Neon Sky Shawl",
  author: "Iris Schreier",
  craft: "knitting",
  category: "shawl",                    // NEW: shawl, sweater, hat, etc.
  difficulty: "intermediate",           // beginner, intermediate, advanced
  
  // Ownership and sharing (unchanged)
  createdBy: "userId_who_created",
  createdAt: timestamp,
  updatedAt: timestamp,
  visibility: "private",              // private, shared, public
  
  // Enhanced pattern structure (NEW - from LogicGuide)
  metadata: {
    maxSteps: 117,
    estimatedTime: "20 hours",
    description: "A delicate triangular shawl...",
    tags: ["shawl", "lace", "triangular"],
    language: "en",
    version: "1.0",
    copyright: "© 2024 Designer. All rights reserved.",
    patternSource: "https://example.com/pattern",
    pdfUrl: "https://example.com/pattern.pdf"
  },
  
  // Materials specification (NEW)
  materials: {
    yarn: {
      primary: {
        brand: "Malabrigo",
        name: "Sock Yarn", 
        weight: "fingering",
        weightCode: "1",
        fiber: "100% Superwash Merino Wool",
        yardageNeeded: 350,
        substitutionNotes: "Any fingering weight yarn with good drape"
      },
      contrast: null
    },
    tools: {
      primary: {
        size: "US 6",
        sizeMetric: "4.0mm",
        type: "circularNeedles",
        length: "32 inches"
      }
    },
    notions: [
      {
        item: "stitch markers",
        quantity: 8,
        essential: true
      }
    ]
  },
  
  // Gauge specification (NEW)
  gauge: {
    stitchesPerInch: 5.5,
    rowsPerInch: 7.5,
    stitchesIn4Inches: 22,
    rowsIn4Inches: 30,
    toolSize: "US 6 (4.0mm)",
    stitch: "stockinette stitch",
    afterBlocking: true,
    notes: "Gauge is measured after blocking"
  },
  
  // Multi-size support (NEW)
  sizing: {
    type: "multiple-sizes",            // single-size, multiple-sizes
    sizes: ["XS", "S", "M", "L", "XL"],
    sizeVariables: {
      castOnStitches: [88, 96, 104, 112, 120],
      edgeStitches: [5, 6, 7, 8, 9]
    },
    dimensions: {
      chest: ["32", "36", "40", "44", "48"],
      length: ["24", "25", "26", "27", "28"]
    }
  },
  
  // Colorwork specification (NEW)
  colorwork: {
    type: "single-color",              // single-color, stranded, held-together
    numberOfColors: 1,
    palettes: [
      {
        id: "p1",
        name: "Main Color Only",
        yarns: [
          {"colorId": "MC", "strands": 1, "dominant": true}
        ]
      }
    ],
    colorMap: {
      "MC": {
        "name": "Main Color",
        "colorCode": null,
        "yarnDetails": {
          "brand": "Malabrigo",
          "colorway": "Pearl Ten"
        }
      }
    }
  },
  
  // Visual resources (NEW)
  images: [
    {
      type: "finished",
      caption: "Completed shawl worn",
      url: "https://example.com/image.jpg",
      base64: null                      // Embedded for small images
    }
  ],
  
  charts: [
    {
      name: "Chart A - Setup",
      description: "Initial increase section", 
      rowRange: [1, 20],
      image: "data:image/png;base64,...",
      legend: {
        "k": "knit",
        "yo": "yarn over"
      }
    }
  ],
  
  // Enhanced glossary (expanded)
  glossary: {
    "k": {
      "name": "Knit",
      "description": "Insert right needle through front of stitch...",
      "stitchesUsed": 1,
      "stitchesCreated": 1,
      "videoUrl": "https://example.com/videos/knit"
    },
    "kfb": {
      "name": "Knit Front and Back",
      "description": "Knit into front then back of same stitch",
      "stitchesUsed": 1,
      "stitchesCreated": 2,
      "videoUrl": "https://example.com/videos/kfb"
    }
  },
  
  // Enhanced steps (with multi-size and colorwork support)
  steps: [
    {
      step: 1,
      instruction: "Cast on {castOnStitches} stitches",
      startingStitchCount: [88, 96, 104, 112, 120],  // Multi-size arrays
      endingStitchCount: [88, 96, 104, 112, 120],
      section: "setup",
      type: "specialInstruction",
      
      // Multi-size support
      sizeVariables: {
        "castOnStitches": [88, 96, 104, 112, 120]
      },
      resolvedInstructions: {
        "XS": "Cast on 88 stitches",
        "S": "Cast on 96 stitches",
        "M": "Cast on 104 stitches",
        "L": "Cast on 112 stitches",
        "XL": "Cast on 120 stitches"
      },
      
      // Enhanced properties
      construction: "workedFlat",           // workedFlat, inTheRound, modular, seamedPieces
      unit: "row",                         // row, round, motif, section
      side: "RS",                          // RS, WS, or null
      paletteId: "p1",                    // Reference to colorwork palette
      chartReference: "Chart A, Row 1",    // Reference to chart
      notes: "Place markers carefully",
      
      // Semantic token highlighting (NEW - supports three-tier token system)
      highlightTokens: [
        {
          "text": "Cast on",
          "token": "token.special.01",
          "position": [0, 7]
        }
      ],
      
      // Colorwork tracking
      colorChanges: {
        beforeStitch: 1,
        description: "Switch to contrast color"
      }
    },
    {
      step: 2,
      instruction: "k2, yo, k2tog, MB3, k1, yo, ssk, k to end",
      startingStitchCount: [88, 96, 104, 112, 120],
      endingStitchCount: [89, 97, 105, 113, 121],
      section: "increase",
      type: "pattern",
      construction: "workedFlat",
      unit: "row",
      side: "RS",
      
      // Comprehensive highlighting example showing all token types
      highlightTokens: [
        {
          "text": "yo",
          "token": "token.stitch.01",
          "position": [4, 6]
        },
        {
          "text": "k2tog", 
          "token": "token.stitch.02",
          "position": [8, 13]
        },
        {
          "text": "MB3",
          "token": "token.special.01", 
          "position": [15, 18]
        },
        {
          "text": "yo",
          "token": "token.stitch.01",
          "position": [23, 25]
        },
        {
          "text": "ssk",
          "token": "token.stitch.02",
          "position": [27, 30]
        }
      ]
    }
  ],
  
  // Additional resources (NEW)
  resources: {
    video: "https://youtube.com/watch?v=tutorial",
    errata: "https://example.com/errata",
    support: "mailto:support@designer.com"
  },
  
  // Designer notes (NEW)
  notes: {
    general: "This pattern includes charts",
    designNotes: "Inspired by traditional lace",
    modifications: "Can add beads to yarn overs"
  },
  
  // Sharing and analytics (unchanged)
  shareCount: 0,
  viewCount: 0,
  forkCount: 0,
  
  // Export tracking (unchanged)
  lastExportedAt: timestamp,
  exportCount: 3
}
```

### 3. pattern_access/{accessId}
**Manages who can access which patterns**
```javascript
{
  patternId: "pattern_uuid",
  userId: "user_who_has_access",
  grantedBy: "user_who_granted_access",
  permission: "view",                 // view, edit, admin
  grantedAt: timestamp,
  expiresAt: null,                    // null = no expiration
  status: "active",                   // active, revoked, expired
  
  // Sharing context
  shareReason: "shared_by_creator",   // shared_by_creator, public_pattern, forked
  shareMessage: "Check out this beautiful shawl pattern!"
}
```

### 4. pattern_shares/{shareId}
**Tracks sharing activity and requests**
```javascript
{
  patternId: "pattern_uuid",
  sharedBy: "userId_sharing",
  sharedWith: "userId_receiving",     // null for public shares
  shareMethod: "direct",              // direct, public_link, export
  sharedAt: timestamp,
  
  // Share details
  message: "I thought you'd love this pattern!",
  permission: "view",
  accepted: true,
  acceptedAt: timestamp,
  
  // Analytics
  viewedAt: timestamp,
  downloadedAt: timestamp
}
```

## Access Control Logic

### Pattern Visibility Levels:
1. **private** - Only creator can access
2. **shared** - Creator + users in pattern_access collection
3. **public** - Anyone can view (read-only)

### Permission Types:
1. **view** - Can view and export pattern
2. **edit** - Can modify pattern (creates new version)
3. **admin** - Can share pattern and manage permissions

## API Functions for Sharing

### Core Pattern Operations
```javascript
// Create pattern (Firestore integration)
async function createPattern(patternData, userId)

// Get user's patterns
async function getUserPatterns(userId)

// Get pattern with permissions check
async function getPattern(patternId, userId)

// Update pattern (with permission check)
async function updatePattern(patternId, updates, userId)
```

### Enhanced Progress Management
```javascript
// Initialize new project with size selection for multi-size patterns
async function initializeProject(userId, patternId, projectName, selectedSize = null) {
  const pattern = await getPattern(patternId, userId);
  const projectId = generateProjectId();
  
  // Handle multi-size patterns
  let sizeSelection = null;
  if (pattern.sizing?.type === "multiple-sizes") {
    if (!selectedSize) {
      throw new Error("Size selection required for multi-size pattern");
    }
    const sizeIndex = pattern.sizing.sizes.indexOf(selectedSize);
    if (sizeIndex === -1) {
      throw new Error(`Invalid size: ${selectedSize}`);
    }
    
    sizeSelection = {
      selectedSize,
      sizeIndex,
      sizeLockedAt: serverTimestamp(),
      allowSizeChange: true,
      sizeNotes: `Selected ${selectedSize} size`
    };
  }
  
  const initialProgress = {
    userId,
    patternId,
    projectId,
    currentStep: 1,
    totalSteps: pattern.metadata?.maxSteps || pattern.steps.length,
    completedSteps: [],
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    
    sizeSelection,
    
    projectDetails: {
      projectName,
      purpose: "personal",
      yarns: [], // User will add their actual yarns
      tools: {
        toolSize: pattern.materials?.tools?.primary?.size || null,
        originalToolSize: pattern.materials?.tools?.primary?.size || null
      }
    },
    
    status: "not_started"
  };
  
  await db.collection('user_pattern_progress')
    .doc(`${userId}_${patternId}_${projectId}`)
    .set(initialProgress);
  
  return { projectId, initialProgress };
}

// Save progress with enhanced validation
async function saveUserProgress(userId, patternId, projectId, progressData) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const [pattern, currentProgress] = await Promise.all([
    getPattern(patternId, userId),
    loadUserProgress(userId, patternId, projectId)
  ]);
  
  // Enhanced step validation for multi-size patterns
  if (progressData.currentStep && pattern.sizing?.type === "multiple-sizes" && currentProgress.sizeSelection) {
    const sizeIndex = currentProgress.sizeSelection.sizeIndex;
    const targetStep = pattern.steps[progressData.currentStep - 1];
    
    // Update current step details with resolved instruction
    if (targetStep) {
      progressData.currentStepDetails = {
        stepNumber: progressData.currentStep,
        instruction: targetStep.instruction,
        resolvedInstruction: targetStep.resolvedInstructions?.[currentProgress.sizeSelection.selectedSize] || targetStep.instruction,
        section: targetStep.section,
        side: targetStep.side,
        type: targetStep.type,
        expectedStitchCount: {
          starting: targetStep.startingStitchCount?.[sizeIndex] || 0,
          ending: targetStep.endingStitchCount?.[sizeIndex] || 0
        }
      };
    }
  }
  
  await db.collection('user_pattern_progress').doc(progressId).set({
    ...progressData,
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

// Load user progress for specific project
async function loadUserProgress(userId, patternId, projectId) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const doc = await db.collection('user_pattern_progress').doc(progressId).get();
  return doc.exists ? doc.data() : null;
}

// Get all user projects (across all patterns)
async function getUserProjects(userId) {
  const snapshot = await db.collection('user_pattern_progress')
    .where('userId', '==', userId)
    .orderBy('lastUpdated', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Add actual materials used by user
async function addProjectYarn(userId, patternId, projectId, yarnData) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const currentProgress = await loadUserProgress(userId, patternId, projectId);
  
  const updatedYarns = [...(currentProgress.projectDetails.yarns || []), {
    ...yarnData,
    addedAt: serverTimestamp()
  }];
  
  await saveUserProgress(userId, patternId, projectId, {
    'projectDetails.yarns': updatedYarns
  });
}

// Record gauge measurement
async function recordActualGauge(userId, patternId, projectId, gaugeData) {
  await saveUserProgress(userId, patternId, projectId, {
    'projectDetails.actualGauge': {
      ...gaugeData,
      measuredOn: serverTimestamp()
    }
  });
}
```

### Sharing Operations
```javascript
// Share pattern with specific user
async function sharePattern(patternId, targetUserId, permission, message, sharingUserId)

// Make pattern public
async function makePatternPublic(patternId, userId)

// Get patterns shared with user
async function getSharedPatterns(userId)

// Accept/decline pattern share
async function respondToShare(shareId, accepted, userId)

// Revoke access to pattern
async function revokeAccess(patternId, targetUserId, userId)
```

### Export Operations
```javascript
// Export pattern as JSON with comments
async function exportPattern(patternId, userId, includeComments = true)

// Fork pattern (create copy)
async function forkPattern(patternId, newName, userId)
```

## Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pattern access control
    match /patterns/{patternId} {
      allow read: if hasPatternAccess(patternId, request.auth.uid);
      allow write: if hasPatternPermission(patternId, request.auth.uid, 'edit');
      allow create: if request.auth != null;
    }
    
    // Pattern access records
    match /pattern_access/{accessId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.grantedBy == request.auth.uid);
      allow write: if request.auth != null && 
        hasPatternPermission(resource.data.patternId, request.auth.uid, 'admin');
    }
    
    // Helper functions
    function hasPatternAccess(patternId, userId) {
      return exists(/databases/$(database)/documents/pattern_access/$(patternId + '_' + userId)) ||
             get(/databases/$(database)/documents/patterns/$(patternId)).data.visibility == 'public' ||
             get(/databases/$(database)/documents/patterns/$(patternId)).data.createdBy == userId;
    }
  }
}
```

## Implementation Strategy

### Phase 1: Basic Pattern Storage
1. Update Generator to create Firestore write operations
2. Update pattern viewer to load from Firestore
3. Add pattern management UI (list, create, delete)

### Phase 2: Sharing Features
1. Implement sharing UI and permissions
2. Add pattern discovery (public patterns)
3. Create sharing notifications

### Phase 3: Advanced Features
1. Pattern forking and versions
2. Collaborative editing
3. Pattern collections/folders

## Benefits for Future Sharing

✅ **Clean separation** - Patterns and permissions are separate
✅ **Granular control** - Different permission levels
✅ **Audit trail** - Complete sharing history
✅ **Scalable** - Supports millions of patterns and users
✅ **Flexible** - Easy to add new sharing methods
✅ **Analytics ready** - Built-in usage tracking

This schema will handle everything from private patterns to large-scale pattern sharing communities!

## Global Stitch Glossary Collection

### stitchWitch_Glossary/{stitchId}
**Global stitch definition database with enhanced multimedia and theming support**

**Migration Note**: This collection replaces the previous `/artifacts/${appId}/public/data/stitchGlossary` structure. All interfaces now use this standardized collection for consistency.

```javascript
{
  // Document ID format: "{craft}_{stitchName}_{timestamp}"
  // Examples: "K_Knit_20251006123045", "C_SingleCrochet_20251006124230"
  // This allows multiple definitions of the same stitch with version tracking
  
  // Basic stitch information
  name: "Knit",                          // Display name
  abbreviation: "k",                     // Common abbreviation
  craft: "knitting",                     // knitting, crochet, tunisian_crochet
  craftPrefix: "K",                      // K_, C_, T_ for document ID
  
  // Stitch mechanics
  description: "Insert right needle through front of stitch, wrap yarn counterclockwise, pull through",
  stitchesUsed: 1,                       // How many stitches this consumes
  stitchesCreated: 1,                    // How many stitches this creates
  difficulty: "beginner",                // beginner, intermediate, advanced, expert
  
  // Multimedia resources
  videoLink: "https://youtube.com/watch?v=example",      // Optional tutorial video
  pictureLink: "https://example.com/images/knit.jpg",    // Optional diagram/photo
  alternateVideos: [                     // Additional video resources
    {
      url: "https://vimeo.com/example",
      title: "Slow motion tutorial",
      source: "craftsy"
    }
  ],
  
  // CSS theming integration
  cssToken: "token-stitch-03",           // Maps to semantic token in tokens.css
  tokenCategory: "stitch",               // stitch, special, header, designerNote, generic
  tokenLevel: "03",                      // 01-05 for each category
  semanticRole: "neutral",               // increase, decrease, neutral, edge, marker, special
  
  // Metadata
  createdAt: timestamp,
  createdBy: "userId",                   // Who added this definition
  lastModified: timestamp,
  modifiedBy: "userId",
  version: 1,                            // For tracking edits to same stitch
  
  // Usage and validation
  isVerified: true,                      // Reviewed and approved
  usageCount: 127,                       // How often used in patterns
  tags: ["basic", "knit_stitch", "foundation"],
  
  // Alternative names and variations
  aliases: ["knit stitch", "plain knit"], // Other names for same stitch
  relatedStitches: [                     // Similar or related stitches
    "K_PurlStitch_20251006123100",
    "K_KnitThroughBackLoop_20251006123200"
  ],
  
  // Pattern context (optional)
  commonUses: [                          // Where this stitch typically appears
    "stockinette fabric",
    "garter stitch borders",
    "ribbing patterns"
  ]
}
```

### CSS Token Integration

The `cssToken` field maps directly to the semantic token system in `css/themes/tokens.css`:

- **Token Categories**: `stitch`, `special`, `header`, `designerNote`, `generic`
- **Token Levels**: `01` through `05` for each category
- **Full Token Format**: `token-{category}-{level}` (e.g., `token-stitch-03`)

**Semantic Role Mapping**:
```javascript
{
  "increase": "token-stitch-01",    // Always for stitches that increase count
  "decrease": "token-stitch-02",    // Always for stitches that decrease count  
  "neutral": "token-stitch-03",     // Basic fabric-forming stitches
  "edge": "token-stitch-04",        // Border and edge stitches
  "marker": "token-stitch-05",      // Placement markers and guides
  "special": "token-special-01"     // Feature stitches (cables, bobbles, etc.)
}
```

### Document ID Structure

**Format**: `{craftPrefix}_{stitchName}_{timestamp}`

**Craft Prefixes**:
- `K_` - Knitting
- `C_` - Crochet  
- `T_` - Tunisian Crochet

**Timestamp Format**: `YYYYMMDDHHMMSS` (e.g., `20251006123045`)

**Examples**:
- `K_Knit_20251006123045`
- `C_SingleCrochet_20251006124230`
- `T_TunisianSimpleStitch_20251006125115`
- `K_Knit_20251007083022` (newer version of knit stitch)

This structure allows:
- Multiple definitions of the same stitch
- Version tracking with timestamps
- Clear craft categorization
- Unique identification across the entire system