// utils.js - Shared utility functions
// Version: v2025-09-29-modular

/**
 * Centralized Token Registry
 * Ensures consistent token assignments across all pattern displays
 */
class TokenRegistry {
    constructor() {
        this.stitchTokenMap = {};
        this.tokenCounters = {
            increase: 1,
            decrease: 1,
            special: 1,
            basic: 1,
            generic: 1
        };
    }

    // Reset the registry for a new pattern
    reset() {
        this.stitchTokenMap = {};
        this.tokenCounters = {
            increase: 1,
            decrease: 1,
            special: 1,
            basic: 1,
            generic: 1
        };
    }

    // Get or assign a token for a stitch
    getTokenForStitch(stitchKey, category) {
        // Return existing assignment if available
        if (this.stitchTokenMap[stitchKey]) {
            return this.stitchTokenMap[stitchKey];
        }

        // Assign new token based on category
        let semanticToken = 'token-basic-01'; // fallback
        if (category) {
            const counter = this.tokenCounters[category] || 1;
            const counterStr = String(counter).padStart(2, '0');
            
            switch (category) {
                case 'increase':
                    semanticToken = `token-stitch-${counterStr}`;
                    this.tokenCounters.increase++;
                    break;
                case 'decrease':
                    semanticToken = `token-stitch-${counterStr}`;
                    this.tokenCounters.decrease++;
                    break;
                case 'special':
                    semanticToken = `token-special-${counterStr}`;
                    this.tokenCounters.special++;
                    break;
                case 'basic':
                    semanticToken = `token-stitch-${counterStr}`;
                    this.tokenCounters.basic++;
                    break;
                default:
                    semanticToken = `token-generic-${counterStr}`;
                    this.tokenCounters.generic++;
            }
        }
        
        // Store the assignment
        this.stitchTokenMap[stitchKey] = semanticToken;
        return semanticToken;
    }

    // Initialize registry from pattern data (should be called once per pattern load)
    initializeFromPattern(PATTERN_DATA) {
        if (!PATTERN_DATA?.glossary) return;

        // Sort stitches alphabetically for consistent assignment order
        const sortedStitches = Object.keys(PATTERN_DATA.glossary).sort();
        
        // Pre-assign tokens to all glossary stitches in alphabetical order
        sortedStitches.forEach(stitchKey => {
            const item = PATTERN_DATA.glossary[stitchKey];
            if (item?.category) {
                this.getTokenForStitch(stitchKey, item.category);
            }
        });
    }
}

// Global token registry instance
export const globalTokenRegistry = new TokenRegistry();

/**
 * Global stitch token registry
 * Ensures each stitch gets a consistent token assignment across all contexts
 */
class StitchTokenRegistry {
    constructor() {
        this.registry = new Map(); // stitch key -> token
        this.counters = {
            increase: 1,
            decrease: 1, 
            special: 1,
            basic: 1,
            generic: 1
        };
    }

    /**
     * Get or assign a token for a stitch
     * @param {string} stitchKey - The stitch identifier (e.g., "kfb", "MB5")
     * @param {string} category - The stitch category (increase, decrease, special, etc.)
     * @returns {string} The consistent token class name
     */
    getToken(stitchKey, category) {
        // Check if we already have a token for this stitch
        if (this.registry.has(stitchKey)) {
            return this.registry.get(stitchKey);
        }

        // Assign a new token based on category
        let token;
        const counter = this.counters[category] || 1;
        const counterStr = String(counter).padStart(2, '0');
        
        switch (category) {
            case 'increase':
            case 'decrease':
                token = `token-stitch-${counterStr}`;
                this.counters[category]++;
                break;
            case 'special':
                token = `token-special-${counterStr}`;
                this.counters.special++;
                break;
            case 'basic':
                token = `token-stitch-${counterStr}`;
                this.counters.basic++;
                break;
            default:
                token = `token-generic-${counterStr}`;
                this.counters.generic++;
        }

        // Store the assignment
        this.registry.set(stitchKey, token);
        return token;
    }

    /**
     * Get all registered stitches sorted by category and then alphabetically
     * @returns {Array} Array of {stitchKey, token, category} objects
     */
    getAllStitches() {
        const stitches = [];
        for (const [stitchKey, token] of this.registry) {
            // Derive category from token type
            let category = 'generic';
            if (token.includes('token-stitch-')) {
                category = 'stitch';
            } else if (token.includes('token-special-')) {
                category = 'special';
            }
            stitches.push({ stitchKey, token, category });
        }
        
        // Sort by category first, then alphabetically by stitch key
        return stitches.sort((a, b) => {
            if (a.category !== b.category) {
                const order = { 'increase': 0, 'decrease': 1, 'special': 2, 'basic': 3, 'generic': 4 };
                return (order[a.category] || 99) - (order[b.category] || 99);
            }
            return a.stitchKey.localeCompare(b.stitchKey);
        });
    }

    /**
     * Reset the registry (useful for testing or reloading patterns)
     */
    reset() {
        this.registry.clear();
        this.counters = {
            increase: 1,
            decrease: 1,
            special: 1,
            basic: 1,
            generic: 1
        };
    }
}

// Global instance
export const stitchTokenRegistry = new StitchTokenRegistry();
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
    
    // Use centralized token registry for consistent assignment
    if (PATTERN_DATA?.glossary) {
        const glossaryEntry = PATTERN_DATA.glossary[instruction] || PATTERN_DATA.glossary[cleanInstruction];
        if (glossaryEntry?.category) {
            return globalTokenRegistry.getTokenForStitch(instruction || cleanInstruction, glossaryEntry.category);
        }
    }
    
    // Default to neutral token
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