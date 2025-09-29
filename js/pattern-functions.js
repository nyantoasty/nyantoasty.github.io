// pattern-functions.js - Pattern rendering and generation functions
// Version: v2025-09-29-clean-dynamic-chunks

import { getInstructionCategory, addTooltips } from './utils.js';

// Enhanced chunk processing functions
export function processChunk(chunk, stepContext, PATTERN_DATA) {
    if (chunk.type === "dynamic") {
        return processDynamicChunk(chunk, stepContext, PATTERN_DATA);
    } else if (chunk.type === "repeat") {
        return processRepeatChunk(chunk, stepContext, PATTERN_DATA);
    } else {
        // Static chunk - return instructions as-is
        return chunk.instructions || [];
    }
}

function processDynamicChunk(chunk, stepContext, PATTERN_DATA) {
    const totalStitches = stepContext.startingStitchCount || stepContext.endingStitchCount;
    let calculatedCount = 0;
    
    switch(chunk.calculation) {
        case "totalStitches - 6":
            calculatedCount = totalStitches - 6;
            break;
        case "totalStitches - 3":
            calculatedCount = totalStitches - 3;
            break;
        case "toMarker":
            calculatedCount = calculateToMarker(stepContext);
            break;
        case "toLast3":
            calculatedCount = totalStitches - 3;
            break;
        case "toLast4":
            calculatedCount = totalStitches - 4;
            break;
        default:
            console.warn(`Unknown dynamic calculation: ${chunk.calculation}`);
            calculatedCount = 1;
    }
    
    return chunk.instructions.map(instr => ({
        ...instr,
        count: instr.count === "calculated" ? calculatedCount : instr.count
    }));
}

function processRepeatChunk(chunk, stepContext, PATTERN_DATA) {
    const expandedInstructions = [];
    
    for (let rep = 0; rep < chunk.times; rep++) {
        chunk.pattern.forEach(instr => {
            expandedInstructions.push({
                stitch: instr.stitch,
                count: instr.count,
                repeatIteration: rep + 1,
                totalRepeats: chunk.times,
                chunkId: chunk.id
            });
        });
    }
    
    return expandedInstructions;
}

function calculateToMarker(stepContext) {
    // Calculate stitches to marker based on pattern context
    return Math.max(1, Math.floor((stepContext.startingStitchCount || 50) / 3));
}

export function calculateStepStitches(step, PATTERN_DATA) {
    let totalStitches = 0;
    const stepContext = {
        startingStitchCount: step.startingStitchCount,
        endingStitchCount: step.endingStitchCount
    };
    
    step.chunks.forEach(chunk => {
        const processedInstructions = processChunk(chunk, stepContext, PATTERN_DATA);
        
        processedInstructions.forEach(instr => {
            const glossaryEntry = PATTERN_DATA.glossary[instr.stitch];
            totalStitches += (instr.count * glossaryEntry.stitchIndex);
        });
    });
    
    return totalStitches;
}

export function getStitchAtPosition(step, position, PATTERN_DATA) {
    let currentPosition = 1;
    const stepContext = {
        startingStitchCount: step.startingStitchCount,
        endingStitchCount: step.endingStitchCount
    };
    
    for (const chunk of step.chunks) {
        const processedInstructions = processChunk(chunk, stepContext, PATTERN_DATA);
        
        for (const instr of processedInstructions) {
            const glossaryEntry = PATTERN_DATA.glossary[instr.stitch];
            const stitchCount = instr.count * glossaryEntry.stitchIndex;
            
            if (position >= currentPosition && position < currentPosition + stitchCount) {
                return {
                    stitch: instr.stitch,
                    chunkId: chunk.id,
                    chunkType: chunk.type,
                    positionInChunk: position - currentPosition + 1,
                    repeatIteration: instr.repeatIteration,
                    totalRepeats: instr.totalRepeats
                };
            }
            currentPosition += stitchCount;
        }
    }
    
    return null; // Position not found
}

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
    
    console.log(`Generating instructions for ${PATTERN_DATA.steps.length} steps`);
    
    PATTERN_DATA.steps.forEach((step, index) => {
        console.log(`Processing step ${index}:`, step);
        const p = document.createElement('p');
        if(step.step) p.dataset.step = step.step;
        if(step.stepRange) {
            p.dataset.stepStart = step.stepRange[0];
            p.dataset.stepEnd = step.stepRange[1];
        }
        
        let instructionHTML = generateDisplayText(step, PATTERN_DATA);
        console.log(`Generated HTML for step ${index}:`, instructionHTML);
        
        if (instructionHTML && instructionHTML.trim() !== '') {
            p.innerHTML = addTooltips(instructionHTML, PATTERN_DATA);
            section.appendChild(p);
            console.log(`Added step ${index} to DOM`);
        } else {
            console.warn(`Empty step HTML for step ${index}:`, step);
        }
    });
    
    console.log(`Final section contains ${section.children.length} step elements`);
    patternContentEl.appendChild(section);
}

export function generateDisplayText(step, PATTERN_DATA) {
    // Handle special instructions
    if (step.type === 'specialInstruction') {
        return `<b>Step ${step.step || step.stepRange?.join('-') || ''}:</b> ${step.description}`;
    }
    
    // Handle regular steps with chunks
    let text = '';
    const stepText = step.step ? `Step ${step.step}: ` : 
                    step.stepRange ? `Steps ${step.stepRange[0]}-${step.stepRange[1]} (${step.stepType || 'all'}): ` : '';
    
    text += stepText;
    
    if (step.section) text += `<em class="text-gray-400">[${step.section}] </em>`;
    if (step.subsection) text += `<em class="text-gray-500">${step.subsection} </em>`;
    if (step.side) text += `<span class="text-xs bg-blue-600 text-white px-1 rounded">${step.side.toUpperCase()}</span> `;
    
    // Handle chunk-based format
    if (step.chunks) {
        text += formatChunksForDisplay(step.chunks, step, PATTERN_DATA);
    }
    
    // Display stitch counts
    if (step.startingStitchCount) {
        text += ` <span class="text-blue-300">(${step.startingStitchCount} sts)</span>`;
    } else if (step.stitchCount !== undefined) {
        text += ` <span class="text-yellow-300">(${step.stitchCount} sts)</span>`;
    }
    
    if (step.stitchCountChange && step.stitchCountChange !== "0") {
        text += ` <span class="text-green-300">(${step.stitchCountChange})</span>`;
    }
    
    return text;
}

export function formatChunksForDisplay(chunks, stepContext, PATTERN_DATA) {
    return chunks.map(chunk => {
        const processedInstructions = processChunk(chunk, stepContext, PATTERN_DATA);
        
        if (chunk.type === "repeat") {
            // Display repeat in compact form
            const patternText = chunk.pattern.map(instr => 
                instr.count > 1 ? `${instr.stitch}${instr.count}` : instr.stitch
            ).join(', ');
            return `[${patternText}] ${chunk.times}x`;
        } else if (chunk.type === "dynamic") {
            // Display dynamic chunk with calculation hint
            const instrText = processedInstructions.map(instr => {
                const category = getInstructionCategory(instr.stitch, PATTERN_DATA);
                const displayText = instr.count > 1 ? `${instr.stitch}${instr.count}` : instr.stitch;
                return `<span class="${category}">${displayText}</span>`;
            }).join(', ');
            return `${instrText} <em class="text-gray-500">(${chunk.calculation})</em>`;
        } else {
            // Static chunk
            return processedInstructions.map(instr => {
                const category = getInstructionCategory(instr.stitch, PATTERN_DATA);
                const displayText = instr.count > 1 ? `${instr.stitch}${instr.count}` : instr.stitch;
                return `<span class="${category}">${displayText}</span>`;
            }).join(', ');
        }
    }).join(', ');
}

export function generatePatternTheme(PATTERN_DATA) {
    if (!PATTERN_DATA) return;
    
    // Collect all categories used in this pattern
    const categories = new Set(['main']); // Always include main
    
    PATTERN_DATA.steps.forEach(step => {
        if (step.chunks && Array.isArray(step.chunks)) {
            step.chunks.forEach(chunk => {
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