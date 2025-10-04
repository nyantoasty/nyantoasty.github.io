# Integration Analysis: LogicGuide Enhanced Features + Firestore Schemas

## Overview

This document analyzes the integration requirements between our enhanced LogicGuide pattern format and existing Firestore schemas, identifying necessary modifications and new features.

## 🔄 **Key Integration Requirements**

### **1. Multi-Size Pattern Support**

**Current State:** 
- ❌ FIRESTORE_SCHEMA: No multi-size pattern support
- ❌ ENHANCED_PROGRESS_SCHEMA: No size selection or size-specific progress

**Required Integration:**
```javascript
// Add to patterns/ collection (already added)
sizing: {
  type: "multiple-sizes",
  sizes: ["XS", "S", "M", "L", "XL"],
  sizeVariables: {
    castOnStitches: [88, 96, 104, 112, 120],
    edgeStitches: [5, 6, 7, 8, 9]
  }
}

// Add to user_pattern_progress/ collection
sizeSelection: {
  selectedSize: "M",                    // User's chosen size
  sizeIndex: 2,                         // Index in arrays [0, 1, 2, 3, 4]
  sizeLockedAt: timestamp,              // When size was selected (prevent accidental changes)
  sizeNotes: "Chose medium for 2\" positive ease"
}
```

### **2. Enhanced Step Structure**

**Current State:**
- ❌ LogicGuide steps have resolvedInstructions, sizeVariables, paletteId, chartReference
- ❌ Current progress tracking assumes simple linear steps

**Required Integration:**
```javascript
// Enhanced step tracking in progress
stepDetails: {
  currentStepId: 45,
  resolvedInstruction: "k7, pm, k90, pm, k7",  // Size-specific instruction
  expectedStitchCount: 104,                    // For selected size
  actualStitchCount: 104,                      // User-reported count
  currentSection: "body",                      // Pattern section
  currentChart: "Chart B",                     // If using chart
  currentPalette: "p2"                         // For colorwork
}
```

### **3. Colorwork State Tracking**

**Current State:**
- ❌ No colorwork state management in either schema

**Required Integration:**
```javascript
// Add to user_pattern_progress
colorworkProgress: {
  currentPalette: "p1",                        // Current palette ID
  colorHistory: [                              // Track palette changes
    { step: 1, palette: "p1", timestamp: timestamp },
    { step: 23, palette: "p2", timestamp: timestamp }
  ],
  yarnManagement: {
    currentYarns: ["MC", "CC"],               // Active yarns
    yarnNotes: {
      "MC": "Ball 1 of 2, about 60% remaining",
      "CC": "New ball started at step 45"
    }
  }
}
```

### **4. Chart and Visual Resource Progress**

**Current State:**
- ❌ No chart progress tracking
- ✅ Basic image progress in ENHANCED_PROGRESS_SCHEMA

**Required Integration:**
```javascript
// Add to user_pattern_progress
visualResourceProgress: {
  charts: {
    "Chart A - Setup": {
      completed: true,
      currentRow: null,
      totalRows: 20,
      firstUsedAt: timestamp,
      completedAt: timestamp
    },
    "Chart B - Body": {
      completed: false,
      currentRow: 15,
      totalRows: 32,
      firstUsedAt: timestamp,
      notes: "This chart is tricky - going slow"
    }
  },
  imageViewing: {
    "finished": { viewed: true, viewedAt: timestamp },
    "detail": { viewed: true, viewedAt: timestamp },
    "construction": { viewed: false }
  },
  resourceUsage: {
    videoWatched: false,
    errataChecked: true,
    supportContacted: false
  }
}
```

## 📊 **Schema Enhancement Priorities**

### **Priority 1: Essential Multi-Size Support**
```javascript
// Add to ENHANCED_PROGRESS_SCHEMA after line ~47
// Multi-size pattern support (NEW)
sizeSelection: {
  selectedSize: "M",                    // User's chosen size
  sizeIndex: 2,                         // Index in size arrays
  sizeLockedAt: timestamp,              // When size was selected
  allowSizeChange: false,               // Prevent accidental changes after progress
  sizeNotes: "Chose medium for desired fit"
},

// Enhanced step details (NEW)
currentStepDetails: {
  stepNumber: 45,
  instruction: "k{edgeStitches}, pm, k{bodyStitches}, pm, k{edgeStitches}",
  resolvedInstruction: "k7, pm, k90, pm, k7",  // For selected size
  section: "body",                      // setup, body, finishing
  side: "RS",                          // RS, WS, or null
  type: "regular",                     // regular, specialInstruction
  
  // Stitch count validation
  expectedStitchCount: {
    starting: 104,
    ending: 104
  },
  actualStitchCount: {
    starting: 104,
    ending: 104,
    verified: true,
    verifiedAt: timestamp
  }
},
```

### **Priority 2: Colorwork State Management**
```javascript
// Add to ENHANCED_PROGRESS_SCHEMA
colorworkState: {
  isColorworkPattern: true,
  currentPalette: "p1",                 // Current palette ID
  colorTransitions: [                   // Track all color changes
    {
      step: 1,
      fromPalette: null,
      toPalette: "p1",
      timestamp: timestamp
    },
    {
      step: 23, 
      fromPalette: "p1",
      toPalette: "p2",
      timestamp: timestamp,
      notes: "Started stranded section"
    }
  ],
  yarnManagement: {
    activeYarns: ["MC", "CC"],          // Currently in use
    yarnSupply: {
      "MC": {
        ballsUsed: 1,
        currentBallProgress: "60%",
        notes: "Good yardage remaining"
      },
      "CC": {
        ballsUsed: 0,
        currentBallProgress: "95%", 
        notes: "New ball needed soon"
      }
    }
  }
},
```

### **Priority 3: Chart and Section Progress**
```javascript
// Add to ENHANCED_PROGRESS_SCHEMA  
sectionProgress: {
  setup: {
    completed: true,
    startedAt: timestamp,
    completedAt: timestamp,
    stepRange: [1, 12],
    notes: "Cast on went smoothly"
  },
  body: {
    completed: false,
    startedAt: timestamp,
    stepRange: [13, 89],
    currentStep: 45,
    estimatedCompletion: timestamp,
    notes: "Main pattern section"
  },
  finishing: {
    completed: false,
    stepRange: [90, 120],
    notes: "Looking forward to bind off!"
  }
},

chartProgress: {
  "Chart A - Setup": {
    completed: true,
    rowRange: [1, 20],
    startedAt: timestamp,
    completedAt: timestamp,
    difficulty: "easy",
    notes: "Clear chart, no issues"
  },
  "Chart B - Body": {
    completed: false,
    rowRange: [1, 32], 
    currentRow: 15,
    startedAt: timestamp,
    difficulty: "challenging",
    notes: "Complex lace - taking time"
  }
},
```

## 🔧 **Required API Function Updates**

### **Size Selection Workflow**
```javascript
// New function: Handle size selection for multi-size patterns
async function selectPatternSize(userId, patternId, projectId, selectedSize) {
  const pattern = await getPattern(patternId);
  
  if (pattern.sizing?.type !== "multiple-sizes") {
    throw new Error("Pattern does not support multiple sizes");
  }
  
  const sizeIndex = pattern.sizing.sizes.indexOf(selectedSize);
  if (sizeIndex === -1) {
    throw new Error(`Invalid size: ${selectedSize}. Available: ${pattern.sizing.sizes.join(", ")}`);
  }
  
  // Update progress with size selection
  await saveUserProgressEnhanced(userId, patternId, projectId, {
    sizeSelection: {
      selectedSize,
      sizeIndex,
      sizeLockedAt: serverTimestamp(),
      allowSizeChange: true, // Can change early in pattern
      sizeNotes: `Selected ${selectedSize} size`
    },
    currentStepDetails: {
      expectedStitchCount: {
        starting: 0,
        ending: pattern.sizing.sizeVariables?.castOnStitches?.[sizeIndex] || 0
      }
    }
  });
  
  return { selectedSize, sizeIndex };
}

// Enhanced step advancement with size validation
async function advanceToNextStep(userId, patternId, projectId, currentStitchCount = null) {
  const [pattern, progress] = await Promise.all([
    getPattern(patternId),
    loadUserProgress(userId, patternId, projectId)
  ]);
  
  const nextStepNumber = progress.currentStep + 1;
  const nextStep = pattern.steps[nextStepNumber - 1];
  
  if (!nextStep) {
    // Pattern completed!
    return await completePattern(userId, patternId, projectId);
  }
  
  // Resolve size-specific instruction
  let resolvedInstruction = nextStep.instruction;
  let expectedStitchCount = { starting: 0, ending: 0 };
  
  if (pattern.sizing?.type === "multiple-sizes" && progress.sizeSelection) {
    const sizeIndex = progress.sizeSelection.sizeIndex;
    resolvedInstruction = nextStep.resolvedInstructions?.[progress.sizeSelection.selectedSize] || nextStep.instruction;
    expectedStitchCount = {
      starting: nextStep.startingStitchCount?.[sizeIndex] || 0,
      ending: nextStep.endingStitchCount?.[sizeIndex] || 0
    };
  }
  
  // Update progress
  await saveUserProgressEnhanced(userId, patternId, projectId, {
    currentStep: nextStepNumber,
    currentStepDetails: {
      stepNumber: nextStepNumber,
      instruction: nextStep.instruction,
      resolvedInstruction,
      section: nextStep.section,
      side: nextStep.side,
      type: nextStep.type,
      expectedStitchCount,
      actualStitchCount: currentStitchCount ? {
        starting: currentStitchCount,
        ending: null,
        verified: false
      } : null
    }
  });
  
  return { nextStep: nextStepNumber, resolvedInstruction };
}
```

## ✅ **Migration Strategy**

### **Phase 1: Extend Existing Schemas (Backward Compatible)**
1. Add new fields to `patterns/` collection for LogicGuide features
2. Add new fields to `user_pattern_progress/` for multi-size and colorwork
3. Maintain compatibility with existing simple patterns

### **Phase 2: Enhanced Pattern Processing**
1. Update Generator to create patterns with LogicGuide schema
2. Add size selection UI for multi-size patterns
3. Implement colorwork state tracking

### **Phase 3: Advanced Features**
1. Chart progress visualization
2. Section-based progress views
3. Enhanced analytics with multi-size and colorwork data

This integration preserves existing functionality while adding the rich pattern interpretation capabilities from LogicGuide!