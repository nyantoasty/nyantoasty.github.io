// utils.js - Shared utility functions
// Version: v2025-09-29-modular

export function getInstructionCategory(instruction, PATTERN_DATA) {
    // Defensive check: ensure instruction is provided
    if (!instruction || typeof instruction !== 'string') {
        console.warn('getInstructionCategory called with invalid instruction:', instruction);
        return 'token-stitch-03'; // Default neutral token
    }
    
    // Clean the instruction for matching
    const cleanInstruction = instruction.toLowerCase().trim();
    
    // If PATTERN_DATA is not available, return neutral token
    if (!PATTERN_DATA) {
        return 'token-stitch-03';
    }
    
    // First check if the pattern defines custom categories/tokens
    if(PATTERN_DATA?.categories?.[instruction] || PATTERN_DATA?.categories?.[cleanInstruction]) {
        return PATTERN_DATA.categories[instruction] || PATTERN_DATA.categories[cleanInstruction];
    }
    
    // Check glossary for token information - this is where AI-assigned tokens live
    if (PATTERN_DATA?.glossary) {
        const glossaryEntry = PATTERN_DATA.glossary[instruction] || PATTERN_DATA.glossary[cleanInstruction];
        if (glossaryEntry?.token) {
            return glossaryEntry.token;
        }
        // Fallback to category if token not set
        if (glossaryEntry?.category) {
            return glossaryEntry.category;
        }
    }
    
    // Default to neutral token - proper assignment happens during pattern generation by AI
    return 'token-stitch-03';
}

export function addTooltips(text, PATTERN_DATA) {
    if(!PATTERN_DATA?.glossary) return text;
    
    const regex = new RegExp(`\\b(${Object.keys(PATTERN_DATA.glossary).join('|')})\\b(?![^<]*?>)`, 'g');
    return text.replace(regex, (match) => {
        const term = PATTERN_DATA.glossary[match];
        if(!term) return match;
        const category = getInstructionCategory(match, PATTERN_DATA);
        return `<span class="${category} stitch-clickable relative tooltip-trigger font-semibold cursor-pointer underline decoration-dotted decoration-1" data-stitch="${match}" title="${term.name}: ${term.description}">${match}<span class="tooltip mono">${term.name}</span></span>`;
    });
}

export function expandPattern(patternArray) {
    const expanded = [];
    patternArray.forEach(p => {
        const match = p.match(/^([a-zA-Z_]+)(\d+)$/);
        if(match) {
            const instruction = match[1];
            const count = parseInt(match[2], 10);
            for(let i = 0; i < count; i++) expanded.push(instruction);
        } else {
            expanded.push(p);
        }
    });
    return expanded;
}