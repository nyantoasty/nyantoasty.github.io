# Fiber Arts Pattern JSON Schema v2.0

## AI Pattern Generator Instructions

This document provides comprehensive guidance for AI systems generating fiber arts patterns in our JSON format.

## Core Principles

1. **Step Resolution**: Use stepRanges for efficiency, individual steps for uniqueness
2. **Dynamic Calculations**: Leverage dynamic chunks for "to last X" scenarios  
3. **Stitch Indexing**: Every stitch type has a stitchIndex indicating needle positions created
4. **Chunk Architecture**: Organize instructions into logical chunks for better analytics

## Schema Structure

```json
{
  "_schemaVersion": "2.0",
  "_aiInstructions": { /* AI guidance object */ },
  "metadata": {
    "name": "Pattern Name",
    "author": "Designer Name", 
    "craft": "knitting|crochet|weaving",
    "maxSteps": 117
  },
  "glossary": {
    "k": {
      "name": "Knit",
      "description": "Knit stitch description",
      "stitchIndex": 1  // How many needle positions this creates
    }
  },
  "steps": [ /* Array of step templates */ ]
}
```

## Step Types

### Individual Steps
Use for unique steps that don't follow a pattern:
```json
{
  "step": 1,
  "section": "Setup",
  "side": "rs|ws", 
  "startingStitchCount": 9,
  "endingStitchCount": 11,
  "chunks": [ /* chunk array */ ]
}
```

### Step Ranges
Use for repeating patterns:
```json
{
  "stepRange": [3, 61],
  "stepType": "odd|even|all",
  "section": "Top of Shawl",
  "side": "rs",
  "stitchCountChange": "+4",
  "chunks": [ /* chunk template */ ]
}
```

## Chunk Types

### Static Chunks
Fixed instructions that never change:
```json
{
  "id": "edge-left",
  "type": "static",
  "instructions": [
    { "stitch": "k", "count": 3 }
  ]
}
```

### Dynamic Chunks
Instructions with calculated counts:
```json
{
  "id": "center-section", 
  "type": "dynamic",
  "calculation": "totalStitches - 6",
  "instructions": [
    { "stitch": "p", "count": "calculated" }
  ]
}
```

### Repeat Chunks
Repeated pattern sections:
```json
{
  "id": "lace-repeat",
  "type": "repeat", 
  "times": 6,
  "pattern": [
    { "stitch": "k", "count": 1 },
    { "stitch": "yo", "count": 1 },
    { "stitch": "ssk", "count": 1 }
  ]
}
```

## Dynamic Calculations

| Calculation | Use Case | Example |
|-------------|----------|---------|
| `totalStitches - 6` | "k3, p to last 3, k3" | Center purl section |
| `totalStitches - 3` | "k to last 3" | Most of row except edges |
| `toMarker` | "k to marker" | Variable distance to marker |
| `toLast3` | Same as totalStitches - 6 | Shorthand for common pattern |
| `toLast4` | "k to last 4" | Leave 4 stitches for edge |

## Stitch Index Guide

Each stitch in the glossary needs a stitchIndex indicating how many needle positions it creates:

```json
{
  "k": { "stitchIndex": 1 },      // Creates 1 stitch
  "kfb": { "stitchIndex": 2 },    // Creates 2 stitches  
  "k2tog": { "stitchIndex": 1 },  // Creates 1 stitch (from 2)
  "yo": { "stitchIndex": 1 },     // Creates 1 stitch
  "pm": { "stitchIndex": 0 },     // Creates 0 stitches (just marker)
  "cdd": { "stitchIndex": 1 }     // Creates 1 stitch (from 3)
}
```

## Stitch Count Management

### Automatic Calculation
The interpreter automatically calculates stitch counts:
- `startingStitchCount` = previous step's `endingStitchCount`
- `endingStitchCount` = `startingStitchCount` + `stitchCountChange`

### Change Notation
```json
{
  "stitchCountChange": "+4",  // Increase by 4
  "stitchCountChange": "-2",  // Decrease by 2  
  "stitchCountChange": "0"    // No change
}
```

## Pattern Sections

Organize patterns into logical sections:
- `"Setup"` - Cast on and initial rows
- `"Top of Shawl"` - Increase section
- `"Shawl Body"` - Main pattern area
- `"Edging"` - Border or finishing
- `"Bind Off"` - Final instructions

## Side Notation
- `"rs"` - Right side rows
- `"ws"` - Wrong side rows
- Omit for rows that work the same on both sides

## Example Patterns

### Simple Increase Row
```json
{
  "stepRange": [3, 61],
  "stepType": "odd", 
  "side": "rs",
  "stitchCountChange": "+4",
  "chunks": [
    {
      "id": "edge-left",
      "type": "static",
      "instructions": [{ "stitch": "k", "count": 3 }]
    },
    {
      "id": "increase1", 
      "type": "static",
      "instructions": [{ "stitch": "kfb", "count": 1 }]
    },
    {
      "id": "to-marker",
      "type": "dynamic", 
      "calculation": "toMarker",
      "instructions": [{ "stitch": "k", "count": "calculated" }]
    }
  ]
}
```

### Lace Pattern Row
```json
{
  "step": 63,
  "subsection": "Lace Pattern 1, Row 1",
  "chunks": [
    {
      "id": "lace-repeat",
      "type": "repeat",
      "times": 6, 
      "pattern": [
        { "stitch": "k", "count": 1 },
        { "stitch": "yo", "count": 1 },
        { "stitch": "ssk", "count": 1 },
        { "stitch": "k", "count": 5 },
        { "stitch": "k2tog", "count": 1 },
        { "stitch": "yo", "count": 1 }
      ]
    }
  ]
}
```

## Best Practices

1. **Use stepRanges for efficiency** - Don't create 59 individual steps for a repeating pattern
2. **Chunk by logical groups** - Edge stitches, center work, increases should be separate chunks  
3. **Consistent naming** - Use descriptive chunk IDs like "edge-left", "center-work", "lace-repeat"
4. **Dynamic calculations** - Use for "to last X" scenarios rather than hardcoding counts
5. **Validate stitch counts** - Ensure stitchCountChange matches actual stitch increase/decrease

## Error Prevention

- Always include stitchIndex for every stitch type
- Use consistent property names (stitch, not instruction)
- Validate that dynamic calculations make sense
- Ensure stepRanges don't overlap
- Check that stitch counts progress logically

## Analytics Support

The chunk architecture enables detailed analytics:
- Track which chunk types users struggle with
- Monitor stitch location queries
- Analyze common error patterns
- Provide contextual help based on chunk type

This format balances human readability, AI efficiency, and analytical capability.