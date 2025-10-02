# Logic Guide for Interpreting and Enumerating Knitting Patterns

**Objective:** To translate a condensed, human-readable knitting pattern into a fully enumerated, step-by-step Firestore document suitable for interactive a**\"Repeat rows S3 and S4 four more times\"** → The AI generates 8 more explicit steps (steps 4-11), recalculating "k to end" based on each step's current stitch count.plications with color-coded stitches, clickable definitions, and pattern navigation.

This process involves parsing loops, interpreting knitting shorthand, calculating stitch counts, organizing sections, and creating rich metadata for every single step.

## Target Schema: Firestore Pattern Document

```json
{
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer Name", 
    "craft": "knitting",
    "maxSteps": 280
  },
  "glossary": {
    "k": { "name": "Knit", "description": "Knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1 },
    "kfb": { "name": "Knit Front and Back", "description": "Increase.", "stitchesUsed": 1, "stitchesCreated": 2 },
    "k2tog": { "name": "Knit 2 Together", "description": "Decrease.", "stitchesUsed": 2, "stitchesCreated": 1 }
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

## Core Concepts to Understand

### 1. Full Step Enumeration (No Repeats in Output)
**Source Format:** Uses phrases like "Repeat rows S3 and S4 four more times."

**Target Format:** The Firestore `steps` array has no concept of a "repeat." Every step is a unique object with its own step number.

**AI Task:** Identify the rows to repeat and the number of repetitions, then generate the explicit sequence of steps with consecutive step numbers.

### 2. Section Organization & Metadata
**Source Format:** Patterns may have implicit sections (setup, body, finishing).

**Target Format:** Each step includes a `section` field ("setup", "increasing", "bobbles", "decreasing", "finishing") and `side` field ("RS", "WS", or null).

**AI Task:** Recognize pattern structure and assign appropriate section names. Track row sides for knitting patterns.

### 3. Interactive Stitch Processing
**Source Format:** Plain text instructions like "k2, kfb, k1".

**Target Format:** Instructions use standard abbreviations that match the `glossary` for color-coded, clickable stitches.

**AI Task:** Use consistent abbreviations that will be recognized by the front-end application for rendering.

### 4. Variable Interpretation in Instructions
**Source Format:** Uses variables like "k to end" or "p to marker."

**Target Format:** Resolves these variables into concrete numbers (e.g., "k7") while maintaining the `startingStitchCount` and `endingStitchCount` fields.

**AI Task:** Maintain state that tracks current stitch counts to calculate specific numbers. Store both the resolved instruction and the calculated stitch counts.

### 5. Stitch Count Calculation is Paramount
**Source Format:** Provides stitch counts only occasionally.

**Target Format:** Requires `startingStitchCount` and `endingStitchCount` for every single step. The system automatically validates count consistency between steps.

**AI Task:** Parse all stitches in each step's instruction. The final stitch count is calculated by taking the `startingStitchCount` and adding the net change for every action in the row. The net change for an action is `stitchesCreated - stitchesUsed`.

### 6. Structural Elements (Edges, Spines, Wedges)
**Source Format:** Patterns like shawls are often built in sections, like [Edge] [Panel 1] [Spine] [Panel 2] [Edge].

**AI Task:** Recognize the pattern's underlying structure. The AI should treat the instructions for each panel as a self-contained unit and apply the consistent edge/spine instructions as a "wrapper" for each row. It must track stitch counts for each section independently to resolve variable instructions like "k to marker".

### 7. Inline Repeats (...)
**Source Format:** Uses parentheses for repeats within the same row, either a fixed number of times `(yo, ssk) 6 times` or variably `(k1, p1)* to marker`.

**AI Task:** For fixed repeats, multiply the enclosed sequence. For variable repeats, calculate how many times the sequence fits into the available stitches for that section.

### 8. References & Charts (Work Row X of Chart Y)
**Source Format:** Instructions may simply refer to a chart or a separate block of instructions.

**AI Task:** Pre-process the pattern to parse and store all named charts and sub-patterns in a structured format. When a reference is encountered, look up the corresponding instructions and insert them into the final, explicit row instruction.

4. NEW: Structural Elements (Edges, Spines, Wedges)
Source Format: Patterns like shawls are often built in sections. A common structure is [Edge stitches] [Wedge 1] [Spine] [Wedge 2] [Edge stitches].

Target Format: These elements are present in every row, often with consistent actions (e.g., k3 for the edge, k1 for the spine, yo increases around the spine).

AI Task: Recognize the pattern's underlying structure. The AI should treat the instructions for each wedge/panel as a self-contained unit and apply the consistent edge/spine instructions as a "wrapper" around the panel instructions for each row. It must track stitch counts for each wedge independently.

5. NEW: Inline Repeats (...)
Source Format: Uses parentheses to denote a sequence of stitches to be repeated within the same row. This can be a fixed number of times or until a certain point.

Fixed: (yo, ssk, k5, k2tog, yo, k1) 6 times

Variable: (k1, p1)* to marker

Target Format: The repeated stitches are fully expanded in the final instruction string.

AI Task:

For fixed repeats, the AI must multiply the enclosed stitch sequence by the specified number.

For variable repeats, the AI must know the number of stitches available in that specific section (wedge) and repeat the sequence as many times as possible until it reaches the marker or runs out of stitches.

6. NEW: References & Charts (Work Row X of Chart Y)
Source Format: Instructions for a row may simply refer to a chart or a separate block of written instructions (e.g., "work Row 1 of Wedge A").

Target Format: The referenced instructions are resolved and inserted into the main row's instruction string.

AI Task: This is an advanced task. The AI must first parse and store all named charts and sub-patterns in a structured format (e.g., a dictionary or map). When it encounters a reference in the main pattern, it must look up the corresponding instructions from its stored data and use them to build the final, explicit row instruction.

## Step-by-Step Instructions for the AI

### Step 1: Document Structure & Metadata Extraction
**Parse Pattern Metadata:** Extract pattern name, author, craft type, etc., for the `metadata` object.

**Build Glossary:** Scan the document for all stitch definitions. Create `glossary` entries with `name`, `description`, `stitchesUsed`, and `stitchesCreated` for each stitch.

**Initialize State:**
- `currentStepNumber`: Start at 1 (or 0 for setup)
- `currentStitchCount`: Initialize based on "Cast on"
- `currentSection`: e.g., "setup"
- `currentSide`: e.g., "RS"
- `outputStepsArray`: An empty array

### Step 2: Section Recognition & Organization
Identify pattern sections based on headings and keywords (Setup, Section 1, Lace, Finishing, etc.). Update `currentSection` as you process the document. For knitting, alternate `currentSide` between "RS" and "WS" for each regular step.

### Step 3: Process Instructions Sequentially

#### A. Handling Setup Instructions
**Action:** For non-row instructions like "Cast on 3 stitches" or "Knit 6 rows," create steps with `type: "specialInstruction"`. These steps describe an action rather than providing a stitch-by-stitch instruction.

```json
{
  "step": 0,
  "description": "Cast on 3 stitches.",
  "section": "setup", 
  "type": "specialInstruction"
}
```

#### B. Handling Regular Steps
**Action:** For each row, parse the instruction, resolve all variables, and calculate the stitch counts.

**Validation:** For each stitch in the instruction, find its `stitchesUsed` and `stitchesCreated` value in the glossary. The `endingStitchCount` is the `startingStitchCount` plus the sum of all `(stitchesCreated - stitchesUsed)` for that row.

**Generate Object:**
```json
{
  "step": 1,
  "startingStitchCount": 3,
  "endingStitchCount": 4,
  "instruction": "k1, kfb, k1",
  "section": "setup",
  "side": "RS",
  "type": "regular"
}
```

## Example Walkthrough: "Set-Up Rows" 

**Cast on 3** → `currentStitchCount = 3`, `currentStepNumber = 1`

**Step S1: k1, kfb, k1**
- Calculation: k1 (1 used → 1 created = 0 net), kfb (1 used → 2 created = +1 net), k1 (1 used → 1 created = 0 net)
- Net change: 0 + 1 + 0 = +1
- startingStitchCount = 3, endingStitchCount = 3 + 1 = 4
- Generate:
```json
{
  "step": 1,
  "startingStitchCount": 3,
  "endingStitchCount": 4,
  "instruction": "k1, kfb, k1",
  "section": "setup",
  "side": "RS",
  "type": "regular"
}
```
- Update: `currentStitchCount = 4`, `currentStepNumber = 2`

**Step S2: BO1, kfb, k1**
- Calculation: BO1 (1 used → 0 created = -1 net), kfb (1 used → 2 created = +1 net), k1 (1 used → 1 created = 0 net)
- Net change: -1 + 1 + 0 = 0
- startingStitchCount = 4, endingStitchCount = 4 + 0 = 4
- Generate:
```json
{
  "step": 2,
  "startingStitchCount": 4,
  "endingStitchCount": 4,
  "instruction": "BO1, kfb, k1",
  "section": "setup",
  "side": "WS",
  "type": "regular"
}
```
- Update: `currentStitchCount = 4`, `currentStepNumber = 3`

**Step S3: k2, kfb, k to end**
- "k to end" needs calculation: k2 (uses 2) + kfb (uses 1) = 3 stitches used, so "k to end" = k(4-3) = k1
- Full instruction becomes: "k2, kfb, k1"
- Calculation: k2 (2 used → 2 created = 0 net), kfb (1 used → 2 created = +1 net), k1 (1 used → 1 created = 0 net)
- Net change: 0 + 1 + 0 = +1
- startingStitchCount = 4, endingStitchCount = 4 + 1 = 5
- Generate:
```json
{
  "step": 3,
  "startingStitchCount": 4,
  "endingStitchCount": 5,
  "instruction": "k2, kfb, k1",
  "section": "setup", 
  "side": "RS",
  "type": "regular"
}
```

**"Repeat rows S3 and S4 four more times"** → The AI generates 8 more explicit steps (steps 4-11), recalculating "k to end" based on each step's current stitch count.