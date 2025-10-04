// pattern-functions.js - Pattern rendering and generation functions
// Version: v2025-09-29-steprange-interpreter

import { getInstructionCategory, addTooltips } from './utils.js';

// Get step data for any step number, resolving stepRanges
export function getStepData(stepNumber, PATTERN_DATA) {
    if (!PATTERN_DATA) return null;
    
    // Handle NEW Firestore schema format with steps array
    if (PATTERN_DATA.steps && Array.isArray(PATTERN_DATA.steps)) {
        // First check for exact step match
        const exactStep = PATTERN_DATA.steps.find(step => step.step === stepNumber);
        if (exactStep) {
            return exactStep;
        }
        
        // Check stepRange entries
        const rangeStep = PATTERN_DATA.steps.find(step => 
            step.stepRange && 
            stepNumber >= step.stepRange[0] && 
            stepNumber <= step.stepRange[1]
        );
        
        if (rangeStep) {
            // Calculate stitch count for this specific step
            const startingStitchCount = calculateStitchCountForStep(stepNumber, PATTERN_DATA);
            const endingStitchCount = calculateEndingStitchCount(stepNumber, rangeStep, startingStitchCount);
            
            // Return a resolved step based on the template
            return {
                ...rangeStep,
                step: stepNumber,
                startingStitchCount: startingStitchCount,
                endingStitchCount: endingStitchCount,
                // Remove stepRange since this is now a resolved individual step
                stepRange: undefined
            };
        }
    }
    
    // Handle LEGACY format with instructions array
    if (PATTERN_DATA.instructions && Array.isArray(PATTERN_DATA.instructions)) {
        // First check for exact step match
        const exactStep = PATTERN_DATA.instructions.find(step => step.step === stepNumber);
        if (exactStep) {
            return exactStep;
        }
        
        // Check stepRange entries
        const rangeStep = PATTERN_DATA.instructions.find(step => 
            step.stepRange && 
            stepNumber >= step.stepRange[0] && 
            stepNumber <= step.stepRange[1]
        );
        
        if (rangeStep) {
            // Calculate stitch count for this specific step
            const startingStitchCount = calculateStitchCountForStep(stepNumber, PATTERN_DATA);
            const endingStitchCount = calculateEndingStitchCount(stepNumber, rangeStep, startingStitchCount);
            
            // Return a resolved step based on the template
            return {
                ...rangeStep,
                step: stepNumber,
                startingStitchCount: startingStitchCount,
                endingStitchCount: endingStitchCount,
                // Remove stepRange since this is now a resolved individual step
                stepRange: undefined
            };
        }
    }
    
    return null; // Step not found
}

function calculateStitchCountForStep(stepNumber, PATTERN_DATA) {
    if (stepNumber === 1) {
        // Find first step's starting count
        const firstStep = PATTERN_DATA.steps.find(s => s.step === 1);
        return firstStep?.startingStitchCount || 9; // Default for this pattern
    }
    
    // Calculate based on previous step
    const prevStepData = getStepData(stepNumber - 1, PATTERN_DATA);
    return prevStepData?.endingStitchCount || calculateStitchCountForStep(stepNumber - 1, PATTERN_DATA);
}

function calculateEndingStitchCount(stepNumber, stepTemplate, startingStitchCount) {
    let change = 0;
    
    if (stepTemplate.stitchCountChange) {
        if (typeof stepTemplate.stitchCountChange === 'string') {
            if (stepTemplate.stitchCountChange.startsWith('+')) {
                change = parseInt(stepTemplate.stitchCountChange.substring(1), 10) || 0;
            } else if (stepTemplate.stitchCountChange.startsWith('-')) {
                change = -parseInt(stepTemplate.stitchCountChange.substring(1), 10) || 0;
            }
        } else if (typeof stepTemplate.stitchCountChange === 'number') {
            change = stepTemplate.stitchCountChange;
        }
    }
    
    return startingStitchCount + change;
}

// Enhanced chunk processing functions
export function processChunk(chunk, stepContext, PATTERN_DATA) {
    if (chunk.type === "dynamic") {
        return processDynamicChunk(chunk, stepContext, PATTERN_DATA);
    } else if (chunk.type === "repeat") {
        return processRepeatChunk(chunk, stepContext, PATTERN_DATA);
    } else if (chunk.instructions) {
        // New format with instructions array
        return chunk.instructions;
    } else {
        // Legacy format with direct instruction/stitch properties
        return [{
            stitch: chunk.instruction || chunk.stitch,
            count: chunk.count
        }];
    }
}

function processDynamicChunk(chunk, stepContext, PATTERN_DATA) {
    const totalStitches = stepContext.startingStitchCount || stepContext.endingStitchCount;
    let calculatedCount = 0;
    
    // Handle legacy chunk format with direct calculation strings
    if (chunk.count === "to last 3") {
        calculatedCount = totalStitches - 6; // 3 stitches on each side
    } else if (chunk.count === "to last 4") {
        calculatedCount = totalStitches - 7; // Account for edge stitches
    } else if (chunk.count === "to marker") {
        calculatedCount = calculateToMarker(stepContext);
    } else {
        // Handle new format with explicit calculations
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
                calculatedCount = totalStitches - 6;
                break;
            case "toLast4":
                calculatedCount = totalStitches - 7;
                break;
            default:
                console.warn(`Unknown dynamic calculation: ${chunk.calculation}`);
                calculatedCount = 1;
        }
    }
    
    // Handle both legacy and new chunk formats
    if (chunk.instructions) {
        // New format
        return chunk.instructions.map(instr => ({
            ...instr,
            count: instr.count === "calculated" ? calculatedCount : instr.count
        }));
    } else {
        // Legacy format
        return [{
            stitch: chunk.instruction,
            count: calculatedCount
        }];
    }
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
            totalStitches += (instr.count * glossaryEntry.stitchesCreated);
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
            const stitchCount = instr.count * glossaryEntry.stitchesCreated;
            
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
            // Get the category and color for this stitch
            const category = getInstructionCategory(key, PATTERN_DATA);
            
            // Use stitchesCreated for the new format
            const stitchInfo = item.stitchesCreated !== undefined ? ` (${item.stitchesCreated} st)` : '';
            
            // Preserve newlines in description by replacing \n with <br>
            const formattedDescription = item.description
                .replace(/\\n/g, '<br>')
                .replace(/\n/g, '<br>');
            
            glossaryHTML += `
                <div class="cursor-pointer hover:bg-gray-700 p-3 rounded border-l-4 border-gray-600" data-stitch="${key}">
                    <h3 class="font-bold ${category} text-lg mb-1">
                        ${item.name} (${key})${stitchInfo}
                    </h3>
                    <p class="text-sm text-gray-400 leading-relaxed">${formattedDescription}</p>
                </div>
            `;
        }
    }
    
    glossaryHTML += '</div>';
    const section = document.createElement('section');
    section.className = 'bg-gray-800 p-6 rounded-lg shadow-lg';
    section.innerHTML = glossaryHTML;
    
    // Add click handlers for main glossary items to show modal
    section.addEventListener('click', (e) => {
        const stitchDiv = e.target.closest('[data-stitch]');
        if (stitchDiv && window.showStitchDefinition) {
            const stitchCode = stitchDiv.dataset.stitch;
            window.showStitchDefinition(stitchCode);
        }
    });
    
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
    
    // Handle NEW Firestore schema format with steps array
    if (PATTERN_DATA.steps && Array.isArray(PATTERN_DATA.steps)) {
        console.log(`Generating instructions for ${PATTERN_DATA.steps.length} steps (Firestore format)`);
        
        PATTERN_DATA.steps.forEach((step, index) => {
            console.log(`Processing step ${index}:`, step);
            const p = document.createElement('p');
            
            // Set data attributes for navigation
            if (step.step !== undefined) {
                p.dataset.step = step.step;
            }
            if (step.stepRange) {
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
    }
    // Handle LEGACY format with instructions array (for backwards compatibility)
    else if (PATTERN_DATA.instructions && Array.isArray(PATTERN_DATA.instructions)) {
        console.log(`Generating instructions for ${PATTERN_DATA.instructions.length} step templates (legacy format)`);
        
        PATTERN_DATA.instructions.forEach((step, index) => {
            console.log(`Processing step ${index}:`, step);
            const p = document.createElement('p');
            if (step.step) p.dataset.step = step.step;
            if (step.stepRange) {
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
    }
    else {
        console.error('No valid pattern data found. Expected steps or instructions array.');
        section.innerHTML += '<p class="text-red-400">No pattern instructions found.</p>';
    }
    
    console.log(`Final section contains ${section.children.length} step elements`);
    patternContentEl.appendChild(section);
}

// Generate instructions for a specific step number
export function generateInstructionsForStep(stepNumber, PATTERN_DATA) {
    const stepData = getStepData(stepNumber, PATTERN_DATA);
    if (!stepData) return null;
    
    const stepContext = {
        startingStitchCount: stepData.startingStitchCount,
        endingStitchCount: stepData.endingStitchCount
    };
    
    let formattedInstructions = [];
    
    if (stepData.chunks) {
        stepData.chunks.forEach(chunk => {
            const processedInstructions = processChunk(chunk, stepContext, PATTERN_DATA);
            
            processedInstructions.forEach(instr => {
                const glossaryEntry = PATTERN_DATA.glossary[instr.stitch];
                const category = getInstructionCategory(instr.stitch, PATTERN_DATA);
                
                formattedInstructions.push({
                    text: `${instr.stitch}${instr.count > 1 ? instr.count : ''}`,
                    stitch: instr.stitch,
                    count: instr.count,
                    glossary: glossaryEntry,
                    category: category,
                    chunkId: chunk.id,
                    chunkType: chunk.type
                });
            });
        });
    }
    
    return addTooltips(formattedInstructions);
}

export function generateDisplayText(step, PATTERN_DATA) {
    // Handle special instructions
    if (step.type === 'specialInstruction') {
        return `<b>Setup:</b> ${step.description}`;
    }
    
    // Handle regular steps - NEW FIRESTORE SCHEMA FORMAT
    let text = '';
    const stepText = step.step ? `Row ${step.step}: ` : 
                    step.stepRange ? `Rows ${step.stepRange[0]}-${step.stepRange[1]} (${step.stepType || 'all'}): ` : '';
    
    text += stepText;
    
    if (step.section) text += `<em class="text-gray-400">[${step.section}] </em>`;
    if (step.subsection) text += `<em class="text-gray-500">${step.subsection} </em>`;
    if (step.side) text += `<span class="text-xs bg-blue-600 text-white px-1 rounded">${step.side.toUpperCase()}</span> `;
    
    // Handle NEW simple instruction format (Firestore schema)
    if (step.instruction) {
        // Use highlightTokens if available (enhanced schema)
        if (step.highlightTokens && Array.isArray(step.highlightTokens)) {
            text += formatInstructionWithTokens(step.instruction, step.highlightTokens, PATTERN_DATA);
        } else {
            // Fallback to basic parsing for legacy patterns
            text += formatInstructionForDisplay(step.instruction, PATTERN_DATA);
        }
    }
    // Handle LEGACY chunk-based format (for backwards compatibility)
    else if (step.chunks) {
        text += formatChunksForDisplay(step.chunks, step, PATTERN_DATA);
    }
    
    // Display stitch counts
    if (step.endingStitchCount) {
        text += ` <span class="text-blue-300">(${step.endingStitchCount} sts)</span>`;
    } else if (step.startingStitchCount) {
        text += ` <span class="text-blue-300">(${step.startingStitchCount} sts)</span>`;
    } else if (step.stitchCount !== undefined) {
        text += ` <span class="text-yellow-300">(${step.stitchCount} sts)</span>`;
    }
    
    if (step.stitchCountChange && step.stitchCountChange !== "0") {
        text += ` <span class="text-green-300">(${step.stitchCountChange})</span>`;
    }
    
    return text;
}

// NEW function to format simple instruction strings
export function formatInstructionForDisplay(instruction, PATTERN_DATA) {
    if (!instruction) return '';
    
    // Split instruction by commas and spaces to identify individual stitches
    const parts = instruction.split(/[,\s]+/).filter(part => part.trim());
    
    return parts.map(part => {
        const trimmedPart = part.trim();
        
        // Check if this part matches a glossary term
        if (PATTERN_DATA.glossary && PATTERN_DATA.glossary[trimmedPart]) {
            const category = getInstructionCategory(trimmedPart, PATTERN_DATA);
            return `<span class="${category}" title="${PATTERN_DATA.glossary[trimmedPart].description}">${trimmedPart}</span>`;
        }
        
        // Handle numbered instructions like "k2", "MB3", etc.
        const stitchMatch = trimmedPart.match(/^([a-zA-Z]+)(\d+)?$/);
        if (stitchMatch) {
            const [, stitchCode, count] = stitchMatch;
            if (PATTERN_DATA.glossary && PATTERN_DATA.glossary[stitchCode]) {
                const category = getInstructionCategory(stitchCode, PATTERN_DATA);
                const title = PATTERN_DATA.glossary[stitchCode].description;
                return `<span class="${category}" title="${title}">${trimmedPart}</span>`;
            }
        }
        
        // Default formatting for unrecognized terms
        return `<span class="main">${trimmedPart}</span>`;
    }).join(' ');
}

// NEW function to format instructions using highlightTokens array from enhanced schema
export function formatInstructionWithTokens(instruction, highlightTokens, PATTERN_DATA) {
    if (!instruction || !highlightTokens || !Array.isArray(highlightTokens)) {
        return formatInstructionForDisplay(instruction, PATTERN_DATA);
    }
    
    let result = instruction;
    
    // Sort tokens by position in text (if they have positions) or by length (longest first)
    const sortedTokens = highlightTokens.sort((a, b) => {
        if (a.start !== undefined && b.start !== undefined) {
            return a.start - b.start;
        }
        // Sort by length descending to handle longer matches first
        return b.text.length - a.text.length;
    });
    
    // Apply highlighting tokens
    sortedTokens.forEach(tokenData => {
        const { text, token } = tokenData;
        if (!text || !token) return;
        
        // Get tooltip from glossary if available
        let tooltip = '';
        let clickableClass = '';
        if (PATTERN_DATA.glossary && PATTERN_DATA.glossary[text]) {
            tooltip = ` title="${PATTERN_DATA.glossary[text].description}"`;
            clickableClass = ' stitch-clickable'; // Only make it clickable if it has a glossary entry
        }
        
        // Use global replace to handle multiple occurrences of the same text
        const regex = new RegExp(`\\b${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        result = result.replace(regex, `<span class="${token}${clickableClass}"${tooltip}>${text}</span>`);
    });
    
    return result;
}

export function formatChunksForDisplay(chunks, stepContext, PATTERN_DATA) {
    return chunks.map(chunk => {
        const processedInstructions = processChunk(chunk, stepContext, PATTERN_DATA);
        
        if (chunk.type === "repeat") {
            // Display repeat in compact form
            const patternText = processedInstructions.map(instr => 
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
    
    // Collect all semantic tokens used in this pattern
    const semanticTokens = new Set(['token-stitch-03']); // Always include basic stitches
    
    PATTERN_DATA.steps.forEach(step => {
        if (step.chunks && Array.isArray(step.chunks)) {
            step.chunks.forEach(chunk => {
                if (chunk && chunk.instruction) {
                    const tokenClass = getInstructionCategory(chunk.instruction, PATTERN_DATA);
                    semanticTokens.add(tokenClass);
                }
                if (chunk && chunk.repeat && chunk.repeat.instructions && Array.isArray(chunk.repeat.instructions)) {
                    chunk.repeat.instructions.forEach(repeatInstr => {
                        if (repeatInstr && repeatInstr.instruction) {
                            const tokenClass = getInstructionCategory(repeatInstr.instruction, PATTERN_DATA);
                            semanticTokens.add(tokenClass);
                        }
                    });
                }
            });
        }
    });
    
    console.log('� Semantic tokens detected in pattern:', Array.from(semanticTokens));
    
    // The three-tier token system handles all styling automatically
    // No dynamic CSS generation needed!
    
    console.log('✅ Pattern uses semantic token system - all styling handled by CSS');
    
    // Remove any old dynamic CSS that might exist
    const oldStyleEl = document.getElementById('dynamic-pattern-colors');
    if (oldStyleEl) {
        oldStyleEl.remove();
        console.log('🧹 Removed old dynamic CSS');
    }
    
    // Update sidebar color key with semantic tokens
    updateSidebarColorKey(Array.from(semanticTokens));
}

// Function to update the sidebar color key dynamically
export function updateSidebarColorKey(semanticTokens) {
    const sidebarColorKey = document.getElementById('sidebar-color-key');
    if (!sidebarColorKey) {
        console.log('❌ Sidebar color key element not found');
        return;
    }
    
    // Define semantic token descriptions
    const tokenDescriptions = {
        'token-stitch-01': 'Primary stitches',
        'token-stitch-02': 'Secondary stitches', 
        'token-stitch-03': 'Basic stitches',
        'token-stitch-04': 'Texture stitches',
        'token-special-01': 'Increase techniques',
        'token-special-02': 'Decrease techniques',
        'token-special-03': 'Special techniques',
        'token-generic-01': 'Instructions',
        'token-generic-02': 'Markers & Notes',
        'token-generic-03': 'Repeats'
    };
    
    let colorKeyHTML = '';
    
    // Convert to Array and sort for consistent display
    const sortedTokens = Array.from(semanticTokens).sort();
    
    // Create color key entries for each semantic token
    sortedTokens.forEach(token => {
        const description = tokenDescriptions[token] || token.replace('token-', '').replace('-', ' ');
        
        colorKeyHTML += `
            <div class="flex items-center space-x-2 mb-1">
                <div class="w-4 h-4 rounded ${token}"></div>
                <span class="${token} font-medium">${description}</span>
            </div>
        `;
    });
    
    if (colorKeyHTML) {
        sidebarColorKey.innerHTML = colorKeyHTML;
        console.log('✅ Sidebar color key updated with semantic tokens:', sortedTokens);
    } else {
        sidebarColorKey.innerHTML = '<div class="text-gray-500 text-sm">No color coding in this pattern</div>';
        console.log('ℹ️ No semantic tokens found for color key');
    }
}