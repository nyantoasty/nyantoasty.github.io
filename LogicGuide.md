# Logic Guide for Interpreting and Enumerating Knitting Patterns

## Objective

To translate a condensed, human-readable knitting pattern into a fully enumerated, step-by-step Firestore document. This creates a rich, interactive experience for the crafter, with features like color-coded stitches, clickable definitions, and precise row-by-row navigation.

The core philosophy is to **transform ambiguity into certainty**. We will eliminate all loops, repeats, and variables, producing a complete, explicit list of actions from cast on to bind off.

## The Target Firestore Schema

Our goal is to populate a Firestore document with this structure:

```json
{
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer Name",
    "craft": "knitting", 
    "maxSteps": 280
  },
  "glossary": {
    "k": { "name": "Knit", "description": "A standard knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1 },
    "kfb": { "name": "Knit Front and Back", "description": "A one-stitch increase.", "stitchesUsed": 1, "stitchesCreated": 2 },
    "k2tog": { "name": "Knit 2 Together", "description": "A one-stitch decrease.", "stitchesUsed": 2, "stitchesCreated": 1 }
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

## Core Concepts for Translation

### 1. The Glossary: The Foundation of Automation

The glossary is the most critical component. It is the dictionary that gives our logic meaning. For the system to automatically calculate stitch counts, it must have a complete and accurate entry for every single abbreviation used in the pattern.

- **stitchesUsed**: How many stitches are taken off the left-hand needle to perform the action.
- **stitchesCreated**: How many stitches are placed onto the right-hand needle after the action is complete.

The net change for any stitch is simply `stitchesCreated - stitchesUsed`.

- **Knit (k)**: 1 used, 1 created = 0 net change.
- **Increase (kfb)**: 1 used, 2 created = +1 net change.  
- **Decrease (k2tog)**: 2 used, 1 created = -1 net change.

By defining these values upfront, we empower the AI to calculate the `endingStitchCount` for any given row with perfect accuracy, which is paramount for the entire process.

### 2. Full Step Enumeration (No Repeats)

A pattern might say, "Repeat Rows 3 and 4 five more times." Our target format does not use repeats. Every single row must be a unique, numbered step in the `steps` array.

**AI Task**: Identify the rows to be repeated and the number of repetitions. Generate the full, explicit sequence of steps with consecutive step numbers, recalculating any variables for each new row.

### 3. Stitch Count Calculation is Paramount

Every step must have a `startingStitchCount` and an `endingStitchCount`. This provides a constant check for pattern integrity. The `endingStitchCount` of one step becomes the `startingStitchCount` of the next.

**AI Task**: For each step, parse every stitch in the instruction. The final stitch count is calculated by taking the `startingStitchCount` and adding the net change for every action in the row, as determined by the glossary.

### 4. Resolving Variables in Instructions

Instructions like "k to end" or "p to marker" are relative. They depend entirely on the number of stitches present at that moment.

**AI Task**: Maintain a running stitch count. When a variable instruction is encountered, calculate the specific number of stitches it represents. For example, in a row with 10 stitches that starts with "k2, yo," the instruction "k to end" would resolve to "k7" (10 stitches - 2 knit - 1 yarn over stitch created = 7 remaining). The final instruction in the JSON should be the fully resolved version (e.g., "k2, yo, k7").

### 5. Handling Repeats Within a Row

Parentheses `()` or asterisks `*` denote a sequence to be repeated within a single row.

- **Fixed Repeats**: `(yo, ssk) 6 times`
- **Variable Repeats**: `(k1, p1) to last 2 sts`

**AI Task**:
- For fixed repeats, expand the sequence fully. `(yo, ssk) 2 times` becomes `yo, ssk, yo, ssk`.
- For variable repeats, calculate how many times the sequence fits into the available stitches for that section before the specified endpoint.

### 6. Recognizing Structural Elements (Edges, Spines, Panels)

Complex patterns, like shawls, often have a consistent structure applied to every row, such as `[Edge] [Panel 1] [Spine] [Panel 2] [Edge]`.

**AI Task**: Identify these structural elements. Treat the instructions for each panel as a self-contained unit and "wrap" them with the consistent edge and spine instructions for each row. This requires tracking the stitch count for each section independently to resolve variables like "k to marker" correctly.

## AI Implementation: A Step-by-Step Guide

### Step 1: Initialization & Pre-Processing

1. **Parse Metadata**: Extract the pattern's name, author, etc., to build the `metadata` object.

2. **Build Glossary**: Scan the entire pattern for all stitch abbreviations and their definitions. Meticulously create the `glossary` object. This step cannot be skipped or rushed.

3. **Identify Structure**: Pre-process the pattern to identify any persistent structural elements like edges and spines, or separate charts and sub-patterns (e.g., "Work Row 1 of Chart A"). Store these for later reference.

4. **Initialize State**:
   - `currentStepNumber`: Start at 1.
   - `currentStitchCount`: Initialize based on the "Cast on" instruction.
   - `currentSection`: e.g., "setup".
   - `currentSide`: e.g., "RS".

### Step 2: Sequential Row Processing

Iterate through the pattern instructions one line at a time.

1. **Handle Special Instructions**: For non-row instructions like "Cast on 3 stitches," create a step with `type: "specialInstruction"`. These describe an action but don't have stitch counts.

2. **Process a Regular Row**:
   - **Set Starting State**: The `startingStitchCount` is the `currentStitchCount` from the previous step.
   - **Resolve Variables**: Calculate all "knit to end" or "purl to marker" phrases based on the `startingStitchCount` and the stitches that come before them in the instruction.
   - **Expand Repeats**: Expand all `(...)` or `*...*` repeats into a full, explicit sequence of stitches.
   - **Assemble Final Instruction**: Combine all parts (edges, panels, spines, resolved variables, expanded repeats) into the final, complete instruction string.
   - **Calculate Ending Stitch Count**: Iterate through the final instruction string. For each stitch, look up its net change in the glossary and add it to the `startingStitchCount`. The final sum is the `endingStitchCount`.
   - **Generate Step Object**: Create the JSON object for the current step with all the calculated data.
   - **Update State**: Set `currentStitchCount = endingStitchCount`, increment `currentStepNumber`, and alternate `currentSide` ("RS" to "WS").

3. **Process Loops**: When you encounter a "repeat rows X-Y" instruction, loop through the stored instructions for rows X-Y the specified number of times, running each one through the "Process a Regular Row" logic above.

## Example Walkthrough: "Set-Up Rows" 

**Cast on 3** → `currentStitchCount = 3`, `currentStepNumber = 1`

**Step S1: k1, kfb, k1**
- Calculation: k1 (1 used → 1 created = 0 net), kfb (1 used → 2 created = +1 net), k1 (1 used → 1 created = 0 net)
- Net change: 0 + 1 + 0 = +1
- `startingStitchCount = 3`, `endingStitchCount = 3 + 1 = 4`

**Step S2: k2, kfb, k to end**
- "k to end" needs calculation: k2 (uses 2) + kfb (uses 1) = 3 stitches used, so "k to end" = k(4-3) = k1
- Full instruction becomes: "k2, kfb, k1"
- Net change: 0 + 1 + 0 = +1
- `startingStitchCount = 4`, `endingStitchCount = 4 + 1 = 5`

**"Repeat rows S1 and S2 four more times"** → The AI generates 8 more explicit steps, recalculating "k to end" based on each step's current stitch count.

By following this meticulous process, you can successfully translate the artful shorthand of a knitting pattern into a flawless, machine-readable format that integrates seamlessly with our enhanced progress tracking system.