"""
Iterative Pattern Processing Module

This module implements the iterative approach to pattern processing
based on the LogicGuide principles. It provides modular, DRY processing
passes that can be executed sequentially with user review at each step.
"""

import json
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ProcessingContext:
    """Maintains state between processing passes"""
    original_text: str
    metadata: Dict[str, Any]
    structure: Optional[Dict[str, Any]] = None
    glossary: Optional[Dict[str, Any]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    user_context: Optional[str] = None

class PatternProcessor:
    """Main class for iterative pattern processing"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        
    async def process_pattern_iteratively(self, 
                                        pattern_text: str, 
                                        pattern_name: str, 
                                        author_name: str) -> Dict[str, Any]:
        """
        Main entry point for iterative pattern processing
        
        Args:
            pattern_text: Raw pattern text from OCR or user input
            pattern_name: Name of the pattern
            author_name: Pattern author/designer name
            
        Returns:
            Processing result with status and data
        """
        try:
            context = ProcessingContext(
                original_text=pattern_text,
                metadata={
                    "name": pattern_name,
                    "author": author_name,
                    "craft": "knitting"
                }
            )
            
            # Execute processing passes
            result = await self._execute_processing_pipeline(context)
            return result
            
        except Exception as e:
            logger.error(f"Pattern processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "step": "initialization"
            }
    
    async def _execute_processing_pipeline(self, context: ProcessingContext) -> Dict[str, Any]:
        """Execute the full processing pipeline"""
        
        # Pass 1: Structure Analysis
        structure_result = await self.pass_1_structure_analysis(context)
        if not structure_result["success"]:
            return structure_result
        
        context.structure = structure_result["data"]
        
        # Pass 2: Glossary Building  
        glossary_result = await self.pass_2_glossary_building(context)
        if not glossary_result["success"]:
            return glossary_result
        
        context.glossary = glossary_result["data"]
        
        # Pass 3: Section Processing
        processing_result = await self.pass_3_section_processing(context)
        if not processing_result["success"]:
            return processing_result
            
        context.steps = processing_result["data"]
        
        # Pass 4: Validation and Assembly
        final_result = await self.pass_4_validation_assembly(context)
        return final_result
    
    async def pass_1_structure_analysis(self, context: ProcessingContext) -> Dict[str, Any]:
        """
        Pass 1: Structure Discovery
        
        Implements LogicGuide Step 1.3 - Identify Structure
        Analyzes pattern text to identify sections, repeats, and organization
        """
        try:
            prompt = self._create_structure_analysis_prompt(context.original_text)
            
            response = await self._call_gemini_api(prompt)
            
            if not response.get("success"):
                return response
            
            # Parse and validate structure response
            structure_data = self._parse_structure_response(response["text"])
            
            return {
                "success": True,
                "data": structure_data,
                "step": "structure_analysis"
            }
            
        except Exception as e:
            logger.error(f"Structure analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "step": "structure_analysis"
            }
    
    async def pass_2_glossary_building(self, context: ProcessingContext) -> Dict[str, Any]:
        """
        Pass 2: Glossary Building
        
        Implements LogicGuide Step 1.2 - Build Glossary
        Creates comprehensive stitch glossary with stitch counts
        """
        try:
            prompt = self._create_glossary_building_prompt(context)
            
            response = await self._call_gemini_api(prompt)
            
            if not response.get("success"):
                return response
            
            # Parse and validate glossary response
            glossary_data = self._parse_glossary_response(response["text"])
            
            return {
                "success": True,
                "data": glossary_data,
                "step": "glossary_building"
            }
            
        except Exception as e:
            logger.error(f"Glossary building failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "step": "glossary_building"
            }
    
    async def pass_3_section_processing(self, context: ProcessingContext) -> Dict[str, Any]:
        """
        Pass 3: Section Processing
        
        Implements LogicGuide Step 2 - Sequential Row Processing
        Processes each section with stitch count calculations
        """
        try:
            prompt = self._create_section_processing_prompt(context)
            
            response = await self._call_gemini_api(prompt)
            
            if not response.get("success"):
                return response
            
            # Parse and validate steps response
            steps_data = self._parse_steps_response(response["text"])
            
            return {
                "success": True,
                "data": steps_data,
                "step": "section_processing"
            }
            
        except Exception as e:
            logger.error(f"Section processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "step": "section_processing"
            }
    
    async def pass_4_validation_assembly(self, context: ProcessingContext) -> Dict[str, Any]:
        """
        Pass 4: Validation and Assembly
        
        Validates mathematical consistency and assembles final pattern
        """
        try:
            # Validate stitch count consistency
            validation_result = self._validate_stitch_counts(context.steps)
            
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "error": f"Validation failed: {validation_result['error']}",
                    "step": "validation"
                }
            
            # Assemble final pattern
            final_pattern = {
                "metadata": {
                    **context.metadata,
                    "maxSteps": len(context.steps) if context.steps else 0
                },
                "glossary": context.glossary or {},
                "steps": context.steps or []
            }
            
            return {
                "success": True,
                "data": final_pattern,
                "step": "validation_assembly"
            }
            
        except Exception as e:
            logger.error(f"Validation and assembly failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "step": "validation_assembly"
            }
    
    def _create_structure_analysis_prompt(self, pattern_text: str) -> str:
        """Create prompt for structure analysis pass"""
        return f"""You are a knitting pattern structure analyst. Analyze this pattern text and identify its organizational structure.

Following the LogicGuide principles, identify:

1. SECTIONS: Different parts of the pattern (cast-on, setup, body, bind-off)
2. REPEATS: Any repeat instructions (row repeats, section repeats)
3. STRUCTURAL ELEMENTS: Edges, spines, panels, charts
4. SPECIAL INSTRUCTIONS: Cast-on, bind-off, setup instructions
5. VARIABLES: Instructions like "k to end", "p to marker"

Pattern Text:
{pattern_text}

Return your analysis as a JSON object with this structure:
{{
  "sections": [
    {{"name": "setup", "startLine": 1, "endLine": 5, "description": "Initial setup rows"}},
    {{"name": "body", "startLine": 6, "endLine": 20, "description": "Main pattern body"}}
  ],
  "repeats": [
    {{"type": "row", "instruction": "Repeat rows 3-4 five times", "startRow": 3, "endRow": 4, "times": 5}},
    {{"type": "within_row", "instruction": "(yo, ssk) 6 times", "sequence": "yo, ssk", "times": 6}}
  ],
  "structuralElements": [
    {{"type": "edge", "pattern": "k2", "position": "start"}},
    {{"type": "spine", "pattern": "k1, yo, k1", "position": "center"}}
  ],
  "specialInstructions": [
    {{"type": "cast_on", "instruction": "Cast on 42 sts", "stitchCount": 42}},
    {{"type": "bind_off", "instruction": "Bind off all sts"}}
  ],
  "variables": [
    {{"instruction": "k to end", "context": "depends on current stitch count"}},
    {{"instruction": "p to marker", "context": "depends on marker placement"}}
  ]
}}

Return ONLY the JSON object, no other text."""
    
    def _create_glossary_building_prompt(self, context: ProcessingContext) -> str:
        """Create prompt for glossary building pass"""
        structure_info = json.dumps(context.structure, indent=2) if context.structure else "No structure analysis available"
        
        return f"""You are a knitting pattern glossary specialist. Build a complete glossary for this pattern.

Following the LogicGuide principles, create glossary entries for EVERY stitch abbreviation used in the pattern.

Pattern Text:
{context.original_text}

Structure Analysis:
{structure_info}

For each stitch abbreviation, provide:
- name: Full name of the stitch
- description: Clear explanation of the technique  
- stitchesUsed: How many stitches are consumed from left needle
- stitchesCreated: How many stitches are placed on right needle

The net change for any stitch is: stitchesCreated - stitchesUsed

Examples:
- k (knit): 1 used, 1 created = 0 net change
- kfb (increase): 1 used, 2 created = +1 net change  
- k2tog (decrease): 2 used, 1 created = -1 net change

Return your glossary as a JSON object with this structure:
{{
  "k": {{"name": "Knit", "description": "A standard knit stitch.", "stitchesUsed": 1, "stitchesCreated": 1}},
  "p": {{"name": "Purl", "description": "A standard purl stitch.", "stitchesUsed": 1, "stitchesCreated": 1}},
  "yo": {{"name": "Yarn Over", "description": "An increase that creates a hole.", "stitchesUsed": 0, "stitchesCreated": 1}},
  "k2tog": {{"name": "Knit 2 Together", "description": "A right-leaning decrease.", "stitchesUsed": 2, "stitchesCreated": 1}}
}}

Scan the entire pattern text and include EVERY abbreviation used. Return ONLY the JSON object, no other text."""
    
    def _create_section_processing_prompt(self, context: ProcessingContext) -> str:
        """Create prompt for section processing pass"""
        structure_info = json.dumps(context.structure, indent=2) if context.structure else "No structure analysis"
        glossary_info = json.dumps(context.glossary, indent=2) if context.glossary else "No glossary available"
        
        return f"""You are a knitting pattern section processor. Process this pattern into enumerated steps.

Following the LogicGuide principles:

1. EXPAND ALL REPEATS: No loops in final output - every row must be explicitly listed
2. RESOLVE ALL VARIABLES: Calculate "k to end" based on stitch counts
3. CALCULATE STITCH COUNTS: Every step must have startingStitchCount and endingStitchCount
4. SEQUENTIAL NUMBERING: Steps numbered consecutively from 1

Pattern Text:
{context.original_text}

Structure Analysis:
{structure_info}

Glossary:
{glossary_info}

Process the pattern into explicit steps. For each step:
- Calculate exact stitch counts using the glossary
- Resolve all variables like "k to end"
- Expand all repeats fully
- Ensure mathematical consistency

Return an array of step objects with this structure:
[
  {{
    "step": 1,
    "startingStitchCount": 42,
    "endingStitchCount": 42,
    "instruction": "k to end",
    "section": "setup",
    "side": "RS",
    "type": "regular"
  }},
  {{
    "step": 2,
    "startingStitchCount": 42,
    "endingStitchCount": 44,
    "instruction": "k2, yo, k to last 2 sts, yo, k2",
    "section": "body", 
    "side": "WS",
    "type": "regular"
  }}
]

Return ONLY the JSON array, no other text."""
    
    async def _call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """Call Gemini API with the given prompt"""
        # This would be implemented with actual Gemini API call
        # For now, return a placeholder response
        return {
            "success": True,
            "text": '{"placeholder": "This would contain the actual Gemini API response"}'
        }
    
    def _parse_structure_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate structure analysis response"""
        try:
            structure = json.loads(response_text)
            
            # Validate required fields
            required_fields = ["sections", "repeats", "structuralElements", "specialInstructions", "variables"]
            for field in required_fields:
                if field not in structure:
                    structure[field] = []
            
            return structure
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse structure response: {e}")
            raise Exception(f"Invalid JSON in structure response: {e}")
    
    def _parse_glossary_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate glossary response"""
        try:
            glossary = json.loads(response_text)
            
            # Validate glossary entries
            for abbrev, stitch in glossary.items():
                required_fields = ["name", "description", "stitchesUsed", "stitchesCreated"]
                for field in required_fields:
                    if field not in stitch:
                        raise Exception(f"Glossary entry '{abbrev}' missing required field: {field}")
                
                # Validate numeric fields
                if not isinstance(stitch["stitchesUsed"], (int, float)):
                    raise Exception(f"Glossary entry '{abbrev}' has invalid stitchesUsed value")
                if not isinstance(stitch["stitchesCreated"], (int, float)):
                    raise Exception(f"Glossary entry '{abbrev}' has invalid stitchesCreated value")
            
            return glossary
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse glossary response: {e}")
            raise Exception(f"Invalid JSON in glossary response: {e}")
    
    def _parse_steps_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse and validate steps response"""
        try:
            steps = json.loads(response_text)
            
            if not isinstance(steps, list):
                raise Exception("Steps response must be an array")
            
            # Validate step objects
            for i, step in enumerate(steps):
                required_fields = ["step", "startingStitchCount", "endingStitchCount", "instruction", "section", "type"]
                for field in required_fields:
                    if field not in step:
                        raise Exception(f"Step {i+1} missing required field: {field}")
                
                # Validate step numbering
                if step["step"] != i + 1:
                    raise Exception(f"Step numbering error: expected {i+1}, got {step['step']}")
            
            return steps
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse steps response: {e}")
            raise Exception(f"Invalid JSON in steps response: {e}")
    
    def _validate_stitch_counts(self, steps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate stitch count consistency across all steps"""
        if not steps:
            return {"valid": True}
        
        for i in range(len(steps) - 1):
            current_step = steps[i]
            next_step = steps[i + 1]
            
            # Check if endingStitchCount matches next startingStitchCount
            if current_step["endingStitchCount"] != next_step["startingStitchCount"]:
                return {
                    "valid": False,
                    "error": f"Stitch count mismatch between steps {current_step['step']} and {next_step['step']}: "
                            f"{current_step['endingStitchCount']} != {next_step['startingStitchCount']}"
                }
        
        return {"valid": True}

# Factory function for creating processor instance
def create_pattern_processor(gemini_api_key: str) -> PatternProcessor:
    """Create a new PatternProcessor instance"""
    return PatternProcessor(gemini_api_key)