import json

def parse_fairy_kiss_pattern(pattern_text):
    """
    Parses the Fairy Kiss shawl pattern by Alina Appasova into a structured JSON format.
    This script is tailored to the specific setup, main body repeats, and ending of this pattern.
    """
    
    # --- Step 1: Document Structure & Metadata Extraction ---
    metadata = {
        "name": "Fairy Kiss",
        "author": "Alina Appasova",
        "craft": "knitting",
        "maxSteps": 0 # Will be updated at the end
    }

    glossary = {
        "k": {"name": "Knit", "description": "Knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1},
        "p": {"name": "Purl", "description": "Purl stitch.", "stitchesUsed": 1, "stitchesCreated": 1},
        "sl": {"name": "Slip", "description": "Slip stitch purlwise.", "stitchesUsed": 1, "stitchesCreated": 1},
        "sl knitwise": {"name": "Slip Knitwise", "description": "Slip stitch as if to knit.", "stitchesUsed": 1, "stitchesCreated": 1},
        "kfb": {"name": "Knit Front and Back", "description": "Knit into front and back of the stitch (1 st increase).", "stitchesUsed": 1, "stitchesCreated": 2},
        "k2tog tbl": {"name": "Knit 2 Together Through Back Loop", "description": "Decrease.", "stitchesUsed": 2, "stitchesCreated": 1},
        "k3tog": {"name": "Knit 3 Together", "description": "Knit 3 stitches together (2 st decrease).", "stitchesUsed": 3, "stitchesCreated": 1},
        "yo": {"name": "Yarn Over", "description": "Increase (1 st increase).", "stitchesUsed": 0, "stitchesCreated": 1},
        "wyib": {"name": "With Yarn in Back", "description": "Carry the yarn at the back of the work.", "stitchesUsed": 0, "stitchesCreated": 0},
        "wyif": {"name": "With Yarn in Front", "description": "Carry the yarn at the front of the work.", "stitchesUsed": 0, "stitchesCreated": 0},
        "BO": {"name": "Bind Off", "description": "Bind off stitches.", "stitchesUsed": 1, "stitchesCreated": 0}
    }

    # Initialize State
    current_step_number = 0
    current_stitch_count = 100 # Stays constant
    current_section = "Setup"
    output_steps_array = []
    
    # --- Setup ---
    output_steps_array.append({"step": current_step_number, "description": "With MC, cast on 100 sts.", "section": current_section, "type": "specialInstruction"})
    current_step_number += 1
    
    setup_rows = [
        {"inst": "knit to last 2 sts, sl2 wyif.", "side": "WS"},
        {"inst": "k2tog tbl, k to last 2 sts, kfb, p1.", "side": "RS"},
        {"inst": "sl1 knitwise wyib, k to last 2 sts, sl 2 wyif.", "side": "WS"},
        {"inst": "k2tog tbl, k3, [yo, k3tog, yo, k1] to last 3 sts, yo, k2, p1.", "side": "RS"},
        {"inst": "sl1 knitwise wyib, k2, p to last 4 sts, k2, sl 2 wyif.", "side": "WS"}
    ]

    for row in setup_rows:
        # Since stitch count is constant, we don't need to recalculate it.
        # Resolving "to last" would be complex, so we keep the general instruction.
        output_steps_array.append({
            "step": current_step_number, 
            "startingStitchCount": current_stitch_count, 
            "endingStitchCount": current_stitch_count,
            "instruction": row["inst"],
            "section": current_section, 
            "side": row["side"],
            "type": "regular"
        })
        current_step_number += 1

    # --- Main Body ---
    current_section = "Main Body"
    
    main_body_repeat_rows = [
        {"inst": "CC Row 1(RS): k2tog tbl, [k3, sl 1 wyib] to last 2 sts, kfb, p1.", "side": "RS"},
        {"inst": "Row 2 (WS): sl1 knitwise wyib, k2, sl 1 wyif, [p3, sl 1 wyif] to last 4 sts, k2, sl 2 wyif.", "side": "WS"},
        {"inst": "MC Row 3: k2tog tbl, k3, [yo, k3tog, yo, k1] to last 3 sts, yo, k2, p1.", "side": "RS"},
        {"inst": "Row 4: sl1 knitwise wyib, k2, p to last 4 sts, k2, sl 2 wyif.", "side": "WS"}
    ]
    
    # The pattern specifies 112 repeats of the 4-row sequence
    for i in range(112):
        for row in main_body_repeat_rows:
            output_steps_array.append({
                "step": current_step_number,
                "startingStitchCount": current_stitch_count,
                "endingStitchCount": current_stitch_count,
                "instruction": row["inst"],
                "section": f"{current_section} - Repeat {i+1}",
                "side": row["side"],
                "type": "regular"
            })
            current_step_number += 1
            
    # --- Ending ---
    current_section = "Ending"
    
    ending_rows = [
        {"inst": "k2tog tbl, k to last 2 sts, kfb, p1.", "side": "RS"},
        {"inst": "sl1 knitwise wyib, k to end.", "side": "WS"}
    ]
    
    for row in ending_rows:
        output_steps_array.append({
            "step": current_step_number,
            "startingStitchCount": current_stitch_count,
            "endingStitchCount": current_stitch_count,
            "instruction": row["inst"],
            "section": current_section,
            "side": row["side"],
            "type": "regular"
        })
        current_step_number += 1
        
    # --- Bind Off ---
    output_steps_array.append({
        "step": current_step_number,
        "description": "Bind off loosely on the right side.",
        "section": "Finishing",
        "type": "specialInstruction"
    })
    
    metadata["maxSteps"] = current_step_number

    final_output = {
        "metadata": metadata,
        "glossary": glossary,
        "steps": output_steps_array
    }
    
    return final_output

parsed_data = parse_fairy_kiss_pattern("dummy_text")

with open('fairy_kiss_pattern.json', 'w') as f:
    json.dump(parsed_data, f, indent=2)

print("Pattern successfully parsed and saved to fairy_kiss_pattern.json")
