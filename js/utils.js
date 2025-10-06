// utils.js - Shared utility functions  
// Version: v2025-10-06-global-glossary

// Import the global living glossary system
import { globalGlossary, getInstructionCategory as getInstructionCategoryFromGlossary } from './global-glossary.js';

// Export globalGlossary for use in other modules
export { globalGlossary };

/**
 * Get instruction category/token using the global glossary system
 * @param {string} instruction - The stitch instruction
 * @param {Object} PATTERN_DATA - Pattern data (for fallback)
 * @returns {string} Token class name
 */
export function getInstructionCategory(instruction, PATTERN_DATA) {
    return getInstructionCategoryFromGlossary(instruction, PATTERN_DATA);
}

/**
 * Add tooltips to text using the global glossary
 * @param {string} text - Text to process
 * @param {Object} PATTERN_DATA - Pattern data for context
 * @returns {string} Text with tooltip spans
 */
export function addTooltips(text, PATTERN_DATA) {
    // Load pattern glossary into global system first
    if (PATTERN_DATA?.glossary) {
        globalGlossary.loadPatternGlossary(PATTERN_DATA.glossary, PATTERN_DATA.name || 'current-pattern');
    }
    
    // Get all known stitches from global glossary
    const allStitches = globalGlossary.getAllStitches();
    if (allStitches.length === 0) return text;
    
    // Create regex for all known stitches
    const stitchKeys = allStitches.map(s => s.key).sort((a, b) => b.length - a.length); // Longer matches first
    const regex = new RegExp(`\\b(${stitchKeys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b(?![^<]*?>)`, 'g');
    
    return text.replace(regex, (match) => {
        const stitchDef = globalGlossary.getStitch(match);
        if (!stitchDef) return match;
        
        const token = stitchDef.token || 'token-stitch-03';
        const title = `${stitchDef.name}: ${stitchDef.description}`;
        
        return `<span class="${token} stitch-clickable relative tooltip-trigger font-semibold cursor-pointer underline decoration-dotted decoration-1" data-stitch="${match}" title="${title}">${match}<span class="tooltip mono">${stitchDef.name}</span></span>`;
    });
}

/**
 * Expand pattern shorthand notation
 * @param {Array} patternArray - Array of pattern instructions
 * @returns {Array} Expanded pattern array
 */
export function expandPattern(patternArray) {
    const expanded = [];
    patternArray.forEach(p => {
        const match = p.match(/^([a-zA-Z_]+)(\d+)$/);
        if (match) {
            const instruction = match[1];
            const count = parseInt(match[2], 10);
            for (let i = 0; i < count; i++) expanded.push(instruction);
        } else {
            expanded.push(p);
        }
    });
    return expanded;
}

/**
 * Initialize global glossary from pattern data
 * Call this when loading a new pattern to ensure all stitches are registered
 * @param {Object} PATTERN_DATA - Pattern data containing glossary
 * @param {string} patternId - Optional pattern identifier
 */
export function initializeGlossaryFromPattern(PATTERN_DATA, patternId) {
    if (PATTERN_DATA?.glossary) {
        globalGlossary.loadPatternGlossary(PATTERN_DATA.glossary, patternId || PATTERN_DATA.name || 'pattern');
        console.log(`🔄 Initialized global glossary from pattern: ${patternId || 'unknown'}`);
    }
}

/**
 * Get sorted glossary entries for display
 * @returns {Array} Sorted array of stitch definitions
 */
export function getSortedGlossary() {
    return globalGlossary.getAllStitches();
}

/**
 * Legacy compatibility exports - these now delegate to global glossary
 */

// Deprecated: Use globalGlossary directly instead
export const globalTokenRegistry = {
    getTokenForStitch: (stitchKey, category) => globalGlossary.getToken(stitchKey, category),
    initializeFromPattern: (PATTERN_DATA) => initializeGlossaryFromPattern(PATTERN_DATA),
    reset: () => console.warn('⚠️ globalTokenRegistry.reset() is deprecated. Use globalGlossary.clear() if needed.')
};

// Deprecated: Use globalGlossary directly instead  
export const stitchTokenRegistry = {
    getToken: (stitchKey, category) => globalGlossary.getToken(stitchKey, category),
    getAllStitches: () => globalGlossary.getAllStitches(),
    reset: () => console.warn('⚠️ stitchTokenRegistry.reset() is deprecated. Use globalGlossary.clear() if needed.')
};