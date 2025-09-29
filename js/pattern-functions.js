// pattern-functions.js - Pattern rendering and generation functions
// Version: v2025-09-29-modular

import { getInstructionCategory, addTooltips } from './utils.js';

export function generateGlossary(PATTERN_DATA) {
    // Defensive check: ensure PATTERN_DATA is loaded
    if (!PATTERN_DATA || !PATTERN_DATA.glossary || Object.keys(PATTERN_DATA.glossary).length === 0) {
        console.log('No glossary data available or PATTERN_DATA not loaded');
        return;
    }
    
    let glossaryHTML = '<h2 class="text-2xl font-semibold text-white mb-4">Stitch Glossary</h2><div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
    
    for (const key in PATTERN_DATA.glossary) {
        const item = PATTERN_DATA.glossary[key];
        if (item && item.name && item.description) {
            // Use stitchIndex for the new format
            const stitchInfo = item.stitchIndex !== undefined ? ` (${item.stitchIndex} st)` : '';
            glossaryHTML += `<div><h3 class="font-bold text-violet-300">${item.name} (${key})${stitchInfo}</h3><p class="text-sm text-gray-400">${item.description}</p></div>`;
        }
    }
    
    glossaryHTML += '</div>';
    const section = document.createElement('section');
    section.className = 'bg-gray-800 p-6 rounded-lg shadow-lg';
    section.innerHTML = glossaryHTML;
    
    // Find the pattern content element dynamically
    const patternContentEl = document.getElementById('pattern-content');
    if (patternContentEl) {
        patternContentEl.appendChild(section);
    } else {
        console.error('patternContentEl not found when trying to append glossary');
    }
}

export function generateInstructions(PATTERN_DATA) {
    const patternContentEl = document.getElementById('pattern-content');
    const section = document.createElement('section');
    section.className = 'bg-gray-800 p-6 rounded-lg shadow-lg pattern-text';
    section.innerHTML = '<h2 class="text-2xl font-semibold text-white mb-4">Instructions</h2>';
    
    console.log(`Generating instructions for ${PATTERN_DATA.instructions.length} instruction blocks`);
    
    PATTERN_DATA.instructions.forEach((instr, index) => {
        console.log(`Processing instruction ${index}:`, instr);
        const p = document.createElement('p');
        if(instr.step) p.dataset.step = instr.step;
        if(instr.stepRange) {
            p.dataset.stepStart = instr.stepRange[0];
            p.dataset.stepEnd = instr.stepRange[1];
        }
        
        // Generate display text from the JSON structure
        let instructionHTML = generateDisplayText(instr, PATTERN_DATA);
        console.log(`Generated HTML for instruction ${index}:`, instructionHTML);
        
        if (instructionHTML && instructionHTML.trim() !== '') {
            p.innerHTML = addTooltips(instructionHTML, PATTERN_DATA);
            section.appendChild(p);
            console.log(`Added instruction ${index} to DOM`);
        } else {
            console.warn(`Empty instruction HTML for instruction ${index}:`, instr);
        }
    });
    
    console.log(`Final section contains ${section.children.length} instruction elements`);
    patternContentEl.appendChild(section);
}

export function generateDisplayText(instr, PATTERN_DATA) {
    // Handle special instructions
    if (instr.type === 'specialInstruction') {
        return `<b>Step ${instr.step || instr.stepRange?.join('-') || ''}:</b> ${instr.description}`;
    }
    
    // Handle regular instructions with chunks
    let text = '';
    const stepText = instr.step ? `Step ${instr.step}: ` : 
                    instr.stepRange ? `Steps ${instr.stepRange[0]}-${instr.stepRange[1]} (${instr.stepType || 'all'}): ` : '';
    
    text += stepText;
    
    if (instr.section) text += `<em class="text-gray-400">[${instr.section}] </em>`;
    if (instr.side) text += `<span class="text-xs bg-blue-600 text-white px-1 rounded">${instr.side.toUpperCase()}</span> `;
    
    // Format chunks for display
    if (instr.chunks) {
        text += formatChunksForDisplay(instr.chunks, PATTERN_DATA);
    }
    
    if (instr.stitchCount !== undefined) {
        text += ` <span class="text-yellow-300">(${instr.stitchCount} sts)</span>`;
    }
    if (instr.stitchCountChange && instr.stitchCountChange !== "0") {
        text += ` <span class="text-green-300">(${instr.stitchCountChange})</span>`;
    }
    
    return text;
}

export function formatChunksForDisplay(chunks, PATTERN_DATA) {
    return chunks.map(chunk => {
        if (chunk.repeat) {
            const repeatInstr = chunk.repeat.instructions.map(r => 
                r.count && r.count !== 1 ? `${r.instruction}${r.count}` : r.instruction
            ).join(', ');
            return `[${repeatInstr}] ${chunk.repeat.times}x`;
        }
        
        const category = getInstructionCategory(chunk.instruction, PATTERN_DATA);
        const displayText = chunk.count && chunk.count !== 1 ? `${chunk.instruction}${chunk.count}` : chunk.instruction;
        return `<span class="${category}">${displayText}</span>`;
    }).join(', ');
}

export function generatePatternTheme(PATTERN_DATA) {
    if (!PATTERN_DATA) return;
    
    // Collect all categories used in this pattern
    const categories = new Set(['main']); // Always include main
    
    PATTERN_DATA.instructions.forEach(instr => {
        if (instr.chunks && Array.isArray(instr.chunks)) {
            instr.chunks.forEach(chunk => {
                if (chunk && chunk.instruction) {
                    const category = getInstructionCategory(chunk.instruction, PATTERN_DATA);
                    categories.add(category);
                }
                if (chunk && chunk.repeat && chunk.repeat.instructions && Array.isArray(chunk.repeat.instructions)) {
                    chunk.repeat.instructions.forEach(repeatInstr => {
                        if (repeatInstr && repeatInstr.instruction) {
                            const category = getInstructionCategory(repeatInstr.instruction, PATTERN_DATA);
                            categories.add(category);
                        }
                    });
                }
            });
        }
    });
    
    console.log('Generated pattern theme for categories:', Array.from(categories));
    
    // Define color mappings
    const colorMap = {
        main: '#93c5fd',
        increase: '#86efac', 
        edge: '#d8b4fe',
        decrease: '#f87171',
        spine: '#f87171'
    };
    
    // Generate CSS rules
    let cssRules = 'CSS Rules: ';
    categories.forEach(cat => {
        const color = colorMap[cat] || '#93c5fd';
        cssRules += `.${cat} { color: ${color}; } `;
    });
    
    console.log(cssRules);
    
    // Inject or update the dynamic theme
    let styleEl = document.getElementById('pattern-theme');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'pattern-theme';
        document.head.appendChild(styleEl);
    }
    
    const dynamicCSS = Array.from(categories).map(cat => {
        const color = colorMap[cat] || '#93c5fd';
        return `.${cat} { color: ${color}; font-weight: 500; }`;
    }).join('\n');
    
    styleEl.textContent = dynamicCSS;
}