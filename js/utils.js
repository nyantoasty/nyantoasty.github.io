// utils.js - Shared utility functions
// Version: v2025-09-29-modular

export function getInstructionCategory(instruction, PATTERN_DATA) {
    // Defensive check: ensure instruction is provided
    if (!instruction || typeof instruction !== 'string') {
        console.warn('getInstructionCategory called with invalid instruction:', instruction);
        return 'main';
    }
    
    // If PATTERN_DATA is not available, use basic categorization
    if (!PATTERN_DATA) {
        // Basic categorization without pattern data
        const basicMap = {
            'k': 'main', 'p': 'main',
            'kfb': 'increase', 'yo': 'increase', 'YO': 'increase',
            'k2tog': 'decrease', 'ssk': 'decrease', 'BO1': 'decrease',
            'MB3': 'bobble', 'MB5': 'bobble', 'MB7': 'bobble', 'MB9': 'bobble'
        };
        return basicMap[instruction] || 'main';
    }
    
    // First check if the pattern defines custom categories
    if(PATTERN_DATA?.categories?.[instruction]) {
        return PATTERN_DATA.categories[instruction];
    }
    
    // Craft-specific category mappings
    const craft = PATTERN_DATA?.metadata?.craft?.toLowerCase();
    
    if(craft === 'knitting') {
        const knittingMap = {
            'k': 'main', 'p': 'main',
            'kfb': 'increase', 'm1l': 'increase', 'm1r': 'increase', 'yo': 'increase', 'YO': 'increase',
            'k2tog': 'decrease', 'ssk': 'decrease', 'cdd': 'decrease',
            'pm': 'edge', 'sm': 'edge', 'rm': 'edge',
            'BO1': 'decrease', 'bo1': 'decrease',
            'MB3': 'bobble', 'MB5': 'bobble', 'MB7': 'bobble', 'MB9': 'bobble',
            'mb3': 'bobble', 'mb5': 'bobble', 'mb7': 'bobble', 'mb9': 'bobble'
        };
        return knittingMap[instruction] || 'main';
    } else if(craft === 'crochet') {
        const crochetMap = {
            'ch': 'foundation', 'sc': 'main', 'hdc': 'main', 'dc': 'main', 'tr': 'main',
            'inc': 'increase', 'dec': 'decrease', '2tog': 'decrease',
            'sl st': 'edge', 'ss': 'edge'
        };
        return crochetMap[instruction] || 'main';
    }
    
    // Default fallback categories
    const generalMap = {
        'inc': 'increase', 'increase': 'increase',
        'dec': 'decrease', 'decrease': 'decrease',
        'edge': 'edge', 'border': 'edge'
    };
    
    return generalMap[instruction] || 'main';
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