# Logic Guide for Interpreting and Enumerating Knitting Patterns

## Objective

To translate a condensed, human-readable knitting pattern into a fully enumerated, step-by-step Firestore document. This creates a rich, interactive experience for the crafter, with features like color-coded stitches, clickable definitions, and precise row-by-row navigation.

The core philosophy is to **transform ambiguity into certainty**. We will eliminate all loops, repeats, and variables, producing a complete, explicit list of actions from cast on to bind off.

## The Target Firestore Schema

Our goal is to populate a Firestore document with this comprehensive structure:

```json
{
  "metadata": {
    "name": "Fairy Kiss Shawl",
    "author": "Alina Appasova",
    "publisher": "Designer's Website",
    "craft": "knitting", 
    "category": "shawl",
    "difficultyLevel": "intermediate",
    "maxSteps": 280,
    "description": "A delicate triangular shawl featuring elegant increases and intricate lace patterns.",
    "tags": ["shawl", "lace", "triangular", "fingering-weight"],
    "dateCreated": "2024-10-01",
    "version": "1.0",
    "language": "en",
    "copyright": "© 2024 Alina Appasova. All rights reserved.",
    "patternSource": "https://designer-website.com/fairy-kiss-shawl",
    "pdfUrl": "https://example.com/pattern.pdf"
  },
  "materials": {
    "yarn": {
      "primary": {
        "brand": "Malabrigo",
        "name": "Sock Yarn",
        "weight": "fingering",
        "weightCode": "1",
        "fiber": "100% Superwash Merino Wool",
        "yardage": 440,
        "grams": 100,
        "colorway": "Pearl Ten",
        "colorNumber": "063",
        "dyelot": "A123456",
        "yardageNeeded": 350,
        "ballsNeeded": 1,
        "substitutionNotes": "Any fingering weight yarn with good drape"
      },
      "contrast": null
    },
    "needles": {
      "primary": {
        "type": "circular",
        "size": "US 6",
        "sizeMetric": "4.0mm",
        "length": "32 inches",
        "brand": "ChiaoGoo",
        "material": "bamboo"
      },
      "alternative": {
        "type": "straight",
        "size": "US 6",
        "sizeMetric": "4.0mm",
        "length": "14 inches"
      }
    },
    "notions": [
      {
        "item": "stitch markers",
        "quantity": 8,
        "description": "removable markers for section divisions",
        "essential": true
      },
      {
        "item": "tapestry needle",
        "quantity": 1,
        "description": "for weaving in ends",
        "essential": true
      },
      {
        "item": "blocking pins",
        "quantity": "30-40",
        "description": "T-pins or blocking pins for shaping",
        "essential": false
      },
      {
        "item": "cable needle",
        "quantity": 1,
        "description": "for cable sections if needed",
        "essential": false
      }
    ]
  },
  "gauge": {
    "stitchesPerInch": 5.5,
    "rowsPerInch": 7.5,
    "measurementUnit": "4 inches",
    "stitchesIn4Inches": 22,
    "rowsIn4Inches": 30,
    "needleSize": "US 6 (4.0mm)",
    "stitch": "stockinette stitch",
    "afterBlocking": true,
    "notes": "Gauge is measured after blocking. Lace patterns will open up significantly."
  },
  "sizing": {
    "type": "multiple-sizes",
    "sizes": ["XS", "S", "M", "L", "XL"],
    "dimensions": {
      "chest": ["32", "36", "40", "44", "48"],
      "length": ["24", "25", "26", "27", "28"],
      "sleeve": ["17", "18", "19", "20", "21"]
    },
    "adjustable": true,
    "notes": "Sizes shown as XS (S, M, L, XL). Choose size based on desired ease.",
    "customization": {
      "variables": [
        {
          "id": "bodyLength",
          "name": "Body Length Adjustment",
          "type": "measurement",
          "unit": "inches",
          "default": [24, 25, 26, 27, 28],
          "notes": "Add or subtract rows in body section before armhole shaping"
        },
        {
          "id": "sleeveLengthAdj", 
          "name": "Sleeve Length Adjustment",
          "type": "measurement",
          "unit": "inches",
          "adjustableSection": "sleeve-body"
        }
      ],
      "sizeVariables": {
        "castOnStitches": [88, 96, 104, 112, 120],
        "armholeDepth": [8, 8.5, 9, 9.5, 10],
        "necklineWidth": [7, 7.5, 8, 8.5, 9]
      }
    }
  },
  "colorwork": {
    "type": "stranded",
    "numberOfColors": 2,
    "palettes": [
      {
        "id": "p1",
        "name": "Main Color Only",
        "yarns": [
          {"colorId": "MC", "strands": 1, "dominant": true}
        ]
      },
      {
        "id": "p2", 
        "name": "Two-Color Stranded",
        "yarns": [
          {"colorId": "MC", "strands": 1, "dominant": false},
          {"colorId": "CC", "strands": 1, "dominant": true}
        ]
      },
      {
        "id": "p3",
        "name": "Blended Gradient",
        "yarns": [
          {"colorId": "MC", "strands": 1},
          {"colorId": "CC", "strands": 1}
        ],
        "technique": "held-together",
        "notes": "Hold both strands together for gradient effect"
      }
    ],
    "colorMap": {
      "MC": {
        "name": "Main Color",
        "colorCode": null, 
        "yarnDetails": {
          "brand": "Malabrigo",
          "colorway": "Azul Profundo",
          "colorNumber": "150"
        }
      },
      "CC": {
        "name": "Contrast Color", 
        "colorCode": null, 
        "yarnDetails": {
          "brand": "Malabrigo",
          "colorway": "Ravelry Red", 
          "colorNumber": "611"
        }
      }
    }
  },
  "techniques": [
    "knit/purl",
    "yarn over increases", 
    "decreases (k2tog, ssk)",
    "knitting in the round",
    "lace knitting",
    "blocking"
  ],
  "specialInstructions": {
    "castOn": "Long-tail cast on recommended for stretch",
    "bindOff": "Use stretchy bind off to maintain lace elasticity", 
    "blocking": "Wet block aggressively to open lace pattern. Pin out all points.",
    "modifications": "To make larger, work additional repeats of Chart B before beginning Chart C",
    "troubleshooting": "If running short on yarn, omit final border repeat"
  },
  "images": [
    {
      "type": "finished",
      "caption": "Fairy Kiss Shawl worn draped over shoulders",
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
      "url": "https://example.com/images/fairy-kiss-worn.jpg",
      "alt": "Woman wearing a delicate lace shawl in pearl color"
    },
    {
      "type": "flat",
      "caption": "Shawl laid flat showing full wingspan and lace detail",
      "base64": null,
      "url": "https://example.com/images/fairy-kiss-flat.jpg",
      "alt": "Triangular lace shawl pinned out flat during blocking"
    },
    {
      "type": "detail",
      "caption": "Close-up of the central spine lace pattern", 
      "base64": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "url": null,
      "alt": "Detailed view of intricate lace stitches forming a decorative spine"
    }
  ],
  "charts": [
    {
      "name": "Chart A - Setup",
      "description": "Initial increase section establishing shawl shape",
      "rowRange": [1, 20],
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "legend": {
        "k": "knit",
        "yo": "yarn over", 
        "k2tog": "knit 2 together"
      }
    }
  ],
  "resources": {
    "video": "https://youtube.com/watch?v=tutorial-link",
    "knitalong": "https://ravelry.com/groups/fairy-kiss-kal", 
    "errata": "https://designer-website.com/fairy-kiss-errata",
    "support": "mailto:support@designer-website.com"
  },
  "notes": {
    "general": "This pattern includes both written instructions and charts. Charts are recommended for the lace sections.",
    "designNotes": "Inspired by traditional Shetland lace patterns with a modern asymmetrical twist.",
    "yarnNotes": "Pattern was designed with Malabrigo Sock but works beautifully with any fingering weight yarn with good drape.",
    "modifications": "Advanced knitters can easily modify by changing repeat counts or adding beads to the yarn overs."
  },
  "glossary": {
    "k": { 
      "name": "Knit", 
      "description": "Insert right needle through front of stitch, wrap yarn, pull through.", 
      "stitchesUsed": 1, 
      "stitchesCreated": 1, 
      "category": "basic",
      "videoUrl": "https://example.com/videos/knit" 
    },
    "kfb": { 
      "name": "Knit Front and Back", 
      "description": "Knit into front then back of same stitch.", 
      "stitchesUsed": 1, 
      "stitchesCreated": 2, 
      "category": "increase",
      "videoUrl": "https://example.com/videos/kfb" 
    },
    "k2tog": { 
      "name": "Knit 2 Together", 
      "description": "Insert needle through 2 stitches, knit them together.", 
      "stitchesUsed": 2, 
      "stitchesCreated": 1, 
      "category": "decrease",
      "videoUrl": "https://example.com/videos/k2tog" 
    },
    "yo": { 
      "name": "Yarn Over", 
      "description": "Wrap yarn over right needle to create an increase and hole.", 
      "stitchesUsed": 0, 
      "stitchesCreated": 1, 
      "category": "increase",
      "videoUrl": "https://example.com/videos/yo" 
    },
    "MB5": {
      "name": "Make Bobble 5",
      "description": "Make a 5-stitch bobble using [k1, yo, k1, yo, k1] in one stitch, turn and work back.",
      "stitchesUsed": 1,
      "stitchesCreated": 1,
      "category": "special",
      "videoUrl": "https://example.com/videos/bobble"
    }
  },
  "steps": [
    {
      "step": 1,
      "startingStitchCount": [88, 96, 104, 112, 120],
      "endingStitchCount": [88, 96, 104, 112, 120],
      "instruction": "Cast on {castOnStitches} stitches",
      "resolvedInstructions": {
        "XS": "Cast on 88 stitches",
        "S": "Cast on 96 stitches", 
        "M": "Cast on 104 stitches",
        "L": "Cast on 112 stitches",
        "XL": "Cast on 120 stitches"
      },
      "section": "setup",
      "type": "specialInstruction",
      "sizeVariables": {
        "castOnStitches": [88, 96, 104, 112, 120]
      }
    },
    {
      "step": 2,
      "startingStitchCount": [88, 96, 104, 112, 120],
      "endingStitchCount": [88, 96, 104, 112, 120],
      "instruction": "k{edge}, pm, k{body}, pm, k{edge}",
      "resolvedInstructions": {
        "XS": "k5, pm, k78, pm, k5",
        "S": "k6, pm, k84, pm, k6",
        "M": "k7, pm, k90, pm, k7",
        "L": "k8, pm, k96, pm, k8", 
        "XL": "k9, pm, k102, pm, k9"
      },
      "section": "body",
      "side": "RS",
      "type": "regular",
      "paletteId": "p1",
      "sizeVariables": {
        "edge": [5, 6, 7, 8, 9],
        "body": [78, 84, 90, 96, 102]
      },
      "chartReference": "Chart A, Row 1",
      "notes": "Place markers to separate edge and body sections"
    },
    {
      "step": 3,
      "startingStitchCount": [88, 96, 104, 112, 120],
      "endingStitchCount": [90, 98, 106, 114, 122],
      "instruction": "k{edge}, yo, k to marker, yo, k{edge}",
      "resolvedInstructions": {
        "XS": "k5, yo, k78, yo, k5",
        "S": "k6, yo, k84, yo, k6",
        "M": "k7, yo, k90, yo, k7",
        "L": "k8, yo, k96, yo, k8",
        "XL": "k9, yo, k102, yo, k9"
      },
      "section": "body",
      "side": "WS", 
      "type": "regular",
      "paletteId": "p2",
      "colorChanges": {
        "beforeStitch": 1,
        "description": "Switch to two-color stranded pattern"
      },
      "sizeVariables": {
        "edge": [5, 6, 7, 8, 9]
      }
    }
  ]
}
```

## Core Concepts for Translation

### 1. The Goal: A Comprehensive Project Document

Our primary objective is to create a complete and reliable digital companion for the crafter. This goes beyond simple stitch-counting. We capture all available project information—including materials, gauge, sizing, colorwork, and visuals—to minimize ambiguity and support a successful outcome.

**The Sliding Scale of Detail:** Patterns exist on a spectrum, from minimalist notes to professionally published documents. Our schema is designed to capture this reality. A sparse pattern will result in a sparsely populated document with many `null` fields; this is an accurate translation, not a failure. The goal is to faithfully represent all information the designer provides, whatever the level of detail.

### 2. The Engine: The Glossary

The glossary is the foundation of all automation. By defining the `stitchesUsed` and `stitchesCreated` for every term in a pattern's lexicon, we give the system the mathematical certainty needed to validate stitch counts, resolve variables, and expand repeats. An accurate and complete glossary is the most critical component of a successful translation.

### 3. The Method: Full Enumeration

Human-written patterns use shorthand like "repeat rows 3-4" or "(k2, p2) to end." Our system translates this into an explicit, fully enumerated list of actions where every single row is a unique step. This involves three key transformations:

* **Unrolling Row Repeats:** Loops are fully expanded into a linear sequence of steps.
* **Resolving In-Row Variables:** Phrases like "knit to marker" are calculated and replaced with a precise stitch count (e.g., `k18`).
* **Expanding In-Row Repeats:** Sequences like `(k1, p1) 4 times` are written out in full (`k1, p1, k1, p1, k1, p1, k1, p1`).

### 4. The Structure: Handling Complexity

Complex patterns are rarely a single, uniform block of stitches. We must recognize and preserve their underlying structure. This includes:

* **Multi-Size Patterns:** Instructions with multiple sizes are captured using arrays and variables, allowing for the generation of resolved instructions for each specific size.
* **Advanced Colorwork:** Color changes, stranded work, and held-together techniques are managed through a system of `palettes` and `colorMaps` to accurately represent the designer's intent.
* **Visual Integration:** Charts, schematics, and other visual aids are treated as essential components of the pattern, not optional extras. They are embedded or referenced within the data structure.

### 5. The Flexibility: Processing All Pattern Types

Patterns come in many forms, and our system must handle this diversity gracefully:

* **Visual Resources:** When available, charts and images are embedded for offline access. When missing, patterns are still processed successfully with helpful notes about what would enhance them.
* **Color Specification:** Some patterns specify exact colors, others leave color choice to the maker. We capture this accurately, using color codes when specified and `null` when flexible, including special handling for ombre, variegated, and self-striping yarns.
* **Materials Detail:** From minimal "any worsted yarn" patterns to comprehensive specifications with exact brands and colorways, we extract and preserve the level of detail the designer provides.

## Guiding Principles for Implementation

The following principles guide the AI's approach to processing patterns. They prioritize efficiency, resilience, and pragmatism over rigid perfectionism, ensuring that the system can handle the wide variety of patterns found in the real world.

### 1. **Be Pragmatic (The 80/20 Rule)**

Focus processing efforts on the 80% of patterns that follow common structures. Handle standard, single-size, single-color patterns flawlessly first. Treat advanced features like multi-size, complex colorwork, and unique constructions as enhancements to be layered on top. When an obscure edge case is encountered, it is better to note the ambiguity and move on than to halt processing.

**Practical Application:**

* Master basic patterns before attempting complex colorwork
* Use pattern recognition shortcuts for common formats
* Document edge cases but don't let them block main processing
* Set confidence thresholds: "If 80% certain, proceed with assumption"

### 2. **Process in Stages (Manage Cognitive Load)**

Do not attempt to parse and resolve the entire pattern in a single pass. A staged approach is more efficient and reliable:

**Pass 1: Structure & Triage** - Perform a quick scan to identify the major sections (metadata, materials, instructions, charts) and assess complexity (e.g., simple vs. multi-size). This is the "read-through before you start" step.

**Pass 2: Extract & Populate** - Process each section independently to populate the schema, starting with the easiest wins (metadata, materials) before tackling the complex step enumeration.

**Pass 3: Consolidate & Validate** - Once all data is extracted, perform final validation checks, such as ensuring all `paletteId` references are valid.

**Memory Management:**

* Clear intermediate data between passes
* Process large step sequences in chunks
* Cache frequently referenced calculations

### 3. **Parse Once, Use Many**

Avoid re-reading the raw pattern text to find different pieces of information. The initial structural pass should create an intermediate, lightly structured representation of the pattern. Subsequent processes should then query this structure, not the original text, for specific details.

**Implementation Strategy:**

* First pass: Clean text and identify major sections
* Create structured intermediate format
* All subsequent extraction works from this structure
* Build lookup tables for repeated calculations

### 4. **Degrade Gracefully**

A perfect document is not always possible, but a useful one is. The system must not fail entirely because one part of a pattern is missing or ambiguous.

**Missing Information:** If a field like gauge is not explicitly stated, the field should be `null`. Do not guess.

**Ambiguous Instructions:** If a specific instruction within the steps cannot be resolved, create the step with the original text, flag it with a note indicating the ambiguity, and continue processing the subsequent steps.

**Processing Timeouts:** If a particularly complex calculation (like resolving a variable repeat over hundreds of stitches) takes too long, use a simplified fallback, note the limitation, and proceed.

**Resource Limits:**

* Respect Firestore's 1MB document limit
* Handle large images by using URL references
* Truncate extremely long patterns with clear documentation

### 5. **Prioritize the Minimal Viable Pattern**

The ultimate goal is a usable, step-by-step guide for the crafter. This requires a complete glossary and accurate stitch counts above all else.

**Required First:** Process the glossary and steps sections with the highest priority. An enumerated pattern with no gauge or yarn details is still highly useful.

**Enhancements Second:** Populate metadata, materials, colorwork, and visual resources as enhancements. These are critical for a complete document but are secondary to the core stitch-by-stitch instructions.

**Processing Order:**

1. **Essential:** `glossary`, `steps`, `metadata.name`
2. **Important:** `materials.yarn.weight`, `materials.needles.size`
3. **Helpful:** `colorwork`, `images`, `charts`
4. **Optional:** `resources`, `specialInstructions`

### 6. **Validate Facts, Not Opinions**

Focus validation efforts on mathematical accuracy and logical consistency rather than subjective quality assessments.

**Mathematical Validation:**
- Verify stitch count progression through all steps
- Ensure glossary entries have valid `stitchesUsed`/`stitchesCreated` values
- Confirm size arrays have consistent lengths

**Logical Consistency:**
- Check that referenced charts actually exist
- Verify `paletteId` references point to defined palettes
- Ensure step sequences make structural sense

**Avoid Subjective Judgments:**
- Don't score "pattern quality" or "difficulty level" 
- Don't judge whether yarn choices are "appropriate"
- Focus on capturing what's stated, not evaluating its merit

### 7. **Optimize for Common Operations**

Design processing to be efficient for the most frequent use cases while maintaining flexibility for edge cases.

**Performance Patterns:**

* Cache stitch count calculations for repeated sequences
* Pre-compile regular expressions for pattern recognition
* Use efficient data structures for lookup operations
* Batch similar operations together

**Scalability Considerations:**

* Process steps in chunks to avoid memory overflow
* Set reasonable timeouts for complex calculations
* Provide progress indicators for long-running operations
* Design for patterns ranging from 10 to 1000+ steps

## AI Implementation: A Step-by-Step Guide

### Step 1: Initial Pattern Analysis & Visual Assessment

**🔍 Pattern Completeness Evaluation:**

1. **Visual Resource Inventory**:
   * Scan for chart references: "see Chart A", "work from chart", etc.
   * Identify missing critical visuals and flag their potential impact.
   * Check for construction diagrams, schematics, and color photos.
   * Assess image quality and embed as base64 when possible.

2. **Pattern Complexity Assessment**:
   * **Simple patterns**: Basic stitches, single color, minimal shaping.
   * **Standard patterns**: Multiple sections, some increases/decreases.
   * **Complex patterns**: Charts, colorwork, multi-size, advanced techniques.

3. **Metadata Extraction Strategy**:
   * **Extract explicitly stated information only** - don't invent details.
   * Use `null` for unknown fields rather than assumptions.
   * Provide helpful defaults only for universal elements (e.g., "Any worsted weight yarn" for substitutionNotes).

### Step 2: Comprehensive Schema Population

1. **Build Enhanced Metadata**:

   ```javascript
   // Priority order for field extraction:
   // 1. REQUIRED: name, author, craft, category
   // 2. RECOMMENDED: description, difficulty, materials.yarn.weight
   // 3. OPTIONAL: publisher, specific yarn brands, techniques beyond basics
   
   const metadata = {
     name: extractPatternName(text),           // Always required
     author: extractAuthor(text),              // Always required
     craft: detectCraft(text),                 // Always required
     category: detectCategory(text),           // Always required
     description: extractDescription(text) || null,     // Only when present
     difficultyLevel: detectDifficulty(text) || null,   // Only when stated
     publisher: extractPublisher(text) || null,         // Only when mentioned
     // ... other optional fields
   };
   ```

2. **Materials Processing**:

   ```javascript
   // Handle flexible yarn requirements
   const materials = {
     yarn: {
       primary: {
         weight: extractYarnWeight(text),          // Usually stated
         yardageNeeded: extractYardage(text),      // When available
         brand: extractBrand(text) || null,       // Only when specific
         substitutionNotes: generateSubNote(text) // Always provide fallback
       }
     },
     needles: {
       primary: {
         size: extractNeedleSize(text),           // Usually stated
         type: extractNeedleType(text) || null   // Optional
       }
     },
     notions: extractNotions(text) || []         // Empty array if none
   };
   
   // Note: For ombre/variegated yarns, see special color handling guidelines
   ```

3. **Colorwork Analysis**:
   ```javascript
   // Detect colorwork complexity
   if (hasMultipleColors(text)) {
     const colorwork = {
       type: detectColorworkType(text),           // "stranded", "held-together", etc.
       numberOfColors: countColors(text),
       palettes: generatePalettes(text),          // Create reusable combinations
       colorMap: mapColors(text)                  // Color definitions
     };
   } else {
     // Simple single-color pattern
     const colorwork = {
       type: "single-color",
       numberOfColors: 1,
       palettes: [defaultSingleColorPalette],
       colorMap: { "MC": { "name": "Main Color", "colorCode": null }}
     };
   }
   ```

**Color Code Strategy:**

* **Use Actual Color Codes When:**
  * Pattern includes color photos showing specific colors
  * Designer specifies exact color combinations (e.g., "navy blue and cream")
  * Pattern references specific color relationships (e.g., "use darker shade for contrast")
  * Chart or diagram shows colors that matter for pattern success

* **Use `null` When:**
  * Pattern says generic terms like "main color" or "contrast color"
  * Designer doesn't specify colors, leaving choice to maker
  * Pattern works with any color combination
  * No visual color reference is provided

**Special Yarn Types: Ombre, Variegated & Multi-Color:**

* **Ombre/Gradient Yarns:** Use dominant/base color when one color makes up >60% of the yarn; use `null` when gradient is evenly distributed
* **Variegated/Multi-Color Yarns:** Use `null` for highly variegated yarns with no dominant color
* **Self-Striping Yarns:** Use the most prominent stripe color or `null` if stripes are equal
* **When in doubt, use `null`** - better to let user choose than guess wrong

### Step 3: Multi-Size Variable Processing

1. **Size Detection & Parsing**:
   ```javascript
   // Look for size notation patterns
   const sizePatterns = [
     /(\d+)\s*\(([^)]+)\)/g,           // "88 (96, 104, 112, 120)"
     /\d+\s*,\s*\d+/g,                 // Simple comma lists
     /\bXS\s*\([^)]+\)/gi              // Named size references
   ];
   
   const sizeVariables = extractSizeVariables(text);
   const isMultiSize = sizeVariables.length > 0;
   ```

2. **Variable Resolution System**:
   ```javascript
   // Create template instructions with variable placeholders
   function resolveInstruction(template, sizeVariables, sizes) {
     const resolved = {};
     sizes.forEach((size, index) => {
       let instruction = template;
       Object.keys(sizeVariables).forEach(varName => {
         const value = sizeVariables[varName][index];
         instruction = instruction.replace(`{${varName}}`, value);
       });
       resolved[size] = instruction;
     });
     return resolved;
   }
   ```

#### Example: Multi-Size Pattern Processing

**Original Pattern Text:** "Cast on 88 (96, 104, 112, 120) sts. k5 (6, 7, 8, 9), pm, k to marker, pm, k5 (6, 7, 8, 9)."

**Step 1: Parse Size Variables**

**AI Processing:**
1. Identify size notation: `88 (96, 104, 112, 120)` → `[88, 96, 104, 112, 120]`
2. Create variable mapping: `castOnStitches: [88, 96, 104, 112, 120]`
3. Create variable mapping: `edgeStitches: [5, 6, 7, 8, 9]`

**Step 2: Generate Size-Specific Steps**

**Cast On Step:**
```json
{
  "step": 1,
  "instruction": "Cast on {castOnStitches} stitches",
  "sizeVariables": {"castOnStitches": [88, 96, 104, 112, 120]},
  "resolvedInstructions": {
    "XS": "Cast on 88 stitches",
    "S": "Cast on 96 stitches",
    "M": "Cast on 104 stitches",
    "L": "Cast on 112 stitches", 
    "XL": "Cast on 120 stitches"
  },
  "startingStitchCount": [0, 0, 0, 0, 0],
  "endingStitchCount": [88, 96, 104, 112, 120]
}
```

**Setup Row Step:**
```json
{
  "step": 2,
  "instruction": "k{edgeStitches}, pm, k{bodyStitches}, pm, k{edgeStitches}",
  "sizeVariables": {
    "edgeStitches": [5, 6, 7, 8, 9],
    "bodyStitches": [78, 84, 90, 96, 102]
  },
  "resolvedInstructions": {
    "XS": "k5, pm, k78, pm, k5",
    "S": "k6, pm, k84, pm, k6",
    "M": "k7, pm, k90, pm, k7",
    "L": "k8, pm, k96, pm, k8",
    "XL": "k9, pm, k102, pm, k9"
  },
  "startingStitchCount": [88, 96, 104, 112, 120],
  "endingStitchCount": [88, 96, 104, 112, 120]
}
```

**Step 3: Variable Calculation Logic**

**Body Stitches Calculation:**
* XS: 88 total - (5 edge × 2) = 78 body stitches
* S: 96 total - (6 edge × 2) = 84 body stitches
* M: 104 total - (7 edge × 2) = 90 body stitches
* L: 112 total - (8 edge × 2) = 96 body stitches
* XL: 120 total - (9 edge × 2) = 102 body stitches

This systematic approach ensures every size is calculated correctly and eliminates the ambiguity that makes patterns difficult to follow.

### Step 4: Visual Resource Processing

1. **Image Embedding Protocol**:
   ```javascript
   // Process visual resources with flexible approach
   const imageProcessing = {
     charts: {
       priority: "HIGH",
       action: "Embed as base64 when available, note when missing",
       validation: "Add helpful notes about missing charts"
     },
     finished: {
       priority: "HELPFUL", 
       action: "Embed when provided, skip when unavailable",
       validation: "Note absence but don't block processing"
     },
     construction: {
       priority: "USEFUL",
       action: "Include when present, suggest when missing",
       validation: "Process pattern regardless of availability"
     }
   };
   ```

2. **Chart Integration Strategy**:
   ```javascript
   // Handle chart references gracefully
   function processChartReferences(steps, charts) {
     steps.forEach(step => {
       const chartRef = extractChartReference(step.instruction);
       if (chartRef) {
         const chart = charts.find(c => c.name.includes(chartRef));
         if (chart) {
           step.chartReference = chartRef;
         } else {
           // Don't fail - add helpful note instead
           step.notes = step.notes || [];
           step.notes.push(`Chart ${chartRef} would be helpful here`);
         }
       }
     });
   }
   ```

3. **Practical Visual Guidelines** (Based on System Constraints):

   * Process patterns without requiring visuals (ensures robustness for text-only patterns)
   * Note missing helpful resources in step notes (provides user feedback without blocking)
   * Embed available images when within Firestore's 1MB document limit; use URL references for larger files
   * Never block processing due to missing visual content (graceful degradation principle)

### Step 5: Enhanced Step Generation

1. **Step Enhancement Process**:
   ```javascript
   // Generate comprehensive step objects
   function generateStep(instruction, state, options = {}) {
     const step = {
       step: state.currentStepNumber,
       startingStitchCount: state.currentStitchCount,
       instruction: resolveVariables(instruction, state),
       section: state.currentSection,
       side: state.currentSide,
       type: detectStepType(instruction),
       
       // Enhanced properties
       paletteId: detectPaletteChange(instruction, state),
       notes: extractInlineNotes(instruction),
       chartReference: extractChartRef(instruction),
       
       // Multi-size support
       ...(options.isMultiSize && {
         sizeVariables: extractStepVariables(instruction),
         resolvedInstructions: generateSizeSpecific(instruction, options.sizes)
       }),
       
       // Colorwork tracking
       ...(hasColorChange(instruction, state) && {
         colorChanges: {
           beforeStitch: detectChangePosition(instruction),
           description: generateChangeDescription(instruction, state)
         }
       }),

       // Glossary-based highlighting - reference stitches by their glossary keys
       highlightTokens: extractGlossaryReferences(instruction, state.glossary)
     };
     
     // Calculate ending stitch count
     step.endingStitchCount = calculateStitchCount(step, state.glossary);
     
     return step;
   }

   // Extract stitch references for highlighting
   function extractGlossaryReferences(instruction, glossary) {
     const tokens = [];
     const stitchPattern = new RegExp(Object.keys(glossary).join('|'), 'gi');
     let match;
     
     while ((match = stitchPattern.exec(instruction)) !== null) {
       tokens.push({
         text: match[0],
         glossaryKey: match[0].toLowerCase(),
         position: [match.index, match.index + match[0].length]
       });
     }
     
     return tokens;
   }
   ```

#### Example: Variable Resolution and Repeat Expansion

**Original Pattern Text:** "Cast on 3. Then, on RS: k1, kfb, k1. On WS: k2, kfb, k to end. Repeat rows S1 and S2 four more times." (Assuming "S1" and "S2" refer to the two rows just described.)

**AI Processing:**

**Cast on 3** → `currentStitchCount = 3`, `currentStepNumber = 1`

**Step S1: k1, kfb, k1**
* Calculation: k1 (1 used → 1 created = 0 net), kfb (1 used → 2 created = +1 net), k1 (1 used → 1 created = 0 net)
* Net change: 0 + 1 + 0 = +1
* `startingStitchCount = 3`, `endingStitchCount = 3 + 1 = 4`

**Step S2: k2, kfb, k to end**
* "k to end" needs calculation: k2 (uses 2) + kfb (uses 1) = 3 stitches used, so "k to end" = k(4-3) = k1
* Full instruction becomes: "k2, kfb, k1"
* Net change: 0 + 1 + 0 = +1
* `startingStitchCount = 4`, `endingStitchCount = 4 + 1 = 5`

**"Repeat rows S1 and S2 four more times"** → The AI generates 8 more explicit steps, recalculating "k to end" based on each step's current stitch count.

By following this meticulous process, you can successfully translate the artful shorthand of a knitting pattern into a flawless, machine-readable format that integrates seamlessly with our enhanced progress tracking system.
