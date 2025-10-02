// utils.js - Shared utility functions
// Version: v2025-09-29-modular

export function getInstructionCategory(instruction, PATTERN_DATA) {
    // Defensive check: ensure instruction is provided
    if (!instruction || typeof instruction !== 'string') {
        console.warn('getInstructionCategory called with invalid instruction:', instruction);
        return 'main';
    }
    
    // Clean the instruction for matching
    const cleanInstruction = instruction.toLowerCase().trim();
    
    // If PATTERN_DATA is not available, use basic categorization
    if (!PATTERN_DATA) {
        return getBasicCategory(cleanInstruction);
    }
    
    // First check if the pattern defines custom categories
    if(PATTERN_DATA?.categories?.[instruction] || PATTERN_DATA?.categories?.[cleanInstruction]) {
        return PATTERN_DATA.categories[instruction] || PATTERN_DATA.categories[cleanInstruction];
    }
    
    // Check glossary for category information
    if (PATTERN_DATA?.glossary) {
        const glossaryEntry = PATTERN_DATA.glossary[instruction] || PATTERN_DATA.glossary[cleanInstruction];
        if (glossaryEntry?.category) {
            return glossaryEntry.category;
        }
    }
    
    // Craft-specific category mappings
    const craft = PATTERN_DATA?.metadata?.craft?.toLowerCase();
    
    if(craft === 'knitting') {
        return getKnittingCategory(cleanInstruction);
    } else if(craft === 'crochet') {
        return getCrochetCategory(cleanInstruction);
    }
    
    // Default fallback
    return getBasicCategory(cleanInstruction);
}

function getBasicCategory(instruction) {
    const basicMap = {
        // Basic stitches
        'k': 'main', 'p': 'main', 'knit': 'main', 'purl': 'main',
        
        // Increases
        'kfb': 'increase', 'yo': 'increase', 'm1': 'increase', 'm1l': 'increase', 'm1r': 'increase',
        'inc': 'increase', 'increase': 'increase',
        
        // Decreases  
        'k2tog': 'decrease', 'ssk': 'decrease', 'cdd': 'decrease', 'dec': 'decrease',
        'decrease': 'decrease', 'bo1': 'decrease',
        
        // Edge/markers
        'pm': 'edge', 'sm': 'edge', 'rm': 'edge', 'sl': 'edge', 'slip': 'edge',
        
        // Bobbles
        'mb': 'bobble', 'mb3': 'bobble', 'mb5': 'bobble', 'mb7': 'bobble', 'mb9': 'bobble',
        
        // Lace
        'lh': 'lace', 'rh': 'lace', 'mh': 'lace', 'lace': 'lace',
        
        // Cables
        'c4f': 'cable', 'c4b': 'cable', 'c6f': 'cable', 'c6b': 'cable', 'cable': 'cable',
        
        // Special techniques
        'tbl': 'special', 'wyif': 'special', 'wyib': 'special',
        
        // Cast and bind
        'co': 'cast', 'cast': 'cast', 'bo': 'bind', 'bind': 'bind',
        
        // Texture
        'seed': 'texture', 'moss': 'texture', 'rib': 'texture', 'garter': 'texture'
    };
    
    // Check for partial matches
    for (const [key, category] of Object.entries(basicMap)) {
        if (instruction.includes(key)) {
            return category;
        }
    }
    
    return 'main';
}

function getKnittingCategory(instruction) {
    const knittingMap = {
        // Basic stitches
        'k': 'main', 'p': 'main', 'knit': 'main', 'purl': 'main', 'st': 'main',
        
        // Increases
        'kfb': 'increase', 'm1l': 'increase', 'm1r': 'increase', 'yo': 'increase',
        'kf&b': 'increase', 'inc': 'increase', 'yf': 'increase', 'yfwd': 'increase',
        
        // Decreases
        'k2tog': 'decrease', 'ssk': 'decrease', 'cdd': 'decrease', 'sl2tog': 'decrease',
        'p2tog': 'decrease', 'ssp': 'decrease', 'dec': 'decrease', 'bo1': 'decrease',
        
        // Edge work and markers
        'pm': 'edge', 'sm': 'edge', 'rm': 'edge', 'sl1': 'edge', 'sl': 'edge',
        'wyif': 'edge', 'wyib': 'edge', 'purlwise': 'edge', 'knitwise': 'edge',
        
        // Bobbles and texture
        'mb': 'bobble', 'mb3': 'bobble', 'mb5': 'bobble', 'mb7': 'bobble', 'mb9': 'bobble',
        'bobble': 'bobble', 'popcorn': 'bobble',
        
        // Lace techniques
        'lh': 'lace', 'rh': 'lace', 'mh': 'lace', 'lace': 'lace', 'dyo': 'lace',
        'leaf': 'lace', 'eyelet': 'lace',
        
        // Cable techniques
        'c4f': 'cable', 'c4b': 'cable', 'c6f': 'cable', 'c6b': 'cable',
        'cable': 'cable', 'cross': 'cable', 'twist': 'cable',
        
        // Special techniques
        'tbl': 'special', 'through': 'special', 'back': 'special', 'front': 'special',
        'wrap': 'special', 'turn': 'special', 'short': 'special',
        
        // Cast on and bind off
        'co': 'cast', 'cast': 'cast', 'long': 'cast', 'tail': 'cast',
        'bo': 'bind', 'bind': 'bind', 'off': 'bind', 'picot': 'bind',
        
        // Texture patterns
        'seed': 'texture', 'moss': 'texture', 'rib': 'texture', 'ribbing': 'texture',
        'garter': 'texture', 'stockinette': 'texture', 'reverse': 'texture'
    };
    
    // Check exact matches first
    if (knittingMap[instruction]) {
        return knittingMap[instruction];
    }
    
    // Check for partial matches
    for (const [key, category] of Object.entries(knittingMap)) {
        if (instruction.includes(key)) {
            return category;
        }
    }
    
    return getBasicCategory(instruction);
}

function getCrochetCategory(instruction) {
    const crochetMap = {
        'ch': 'cast', 'chain': 'cast',
        'sc': 'main', 'hdc': 'main', 'dc': 'main', 'tr': 'main', 'dtr': 'main',
        'single': 'main', 'half': 'main', 'double': 'main', 'treble': 'main',
        'inc': 'increase', '2sc': 'increase', '2dc': 'increase',
        'dec': 'decrease', '2tog': 'decrease', 'tog': 'decrease',
        'sl st': 'edge', 'ss': 'edge', 'slip': 'edge',
        'magic': 'special', 'ring': 'special', 'loop': 'special'
    };
    
    return crochetMap[instruction] || getBasicCategory(instruction);
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