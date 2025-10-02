// viewer-logic.js - Pattern viewer navigation and progress functions
// Version: v2025-10-01-firestore-progress

import { getCurrentStep, setCurrentStep } from './progress-tracking.js';

export function loadProgressSimple(progressKey) {
    const savedStep = localStorage.getItem(progressKey);
    return savedStep ? parseInt(savedStep, 10) : 1;
}

export function loadProgress(progressKey, currentStepRef, updateDisplayFn) {
    const savedStep = localStorage.getItem(progressKey);
    const newStep = savedStep ? parseInt(savedStep, 10) : 1;
    currentStepRef.value = newStep;
    updateDisplayFn(false);
    return newStep;
}

export function saveProgress(progressKey, currentStep) {
    localStorage.setItem(progressKey, currentStep);
}

// NEW: Firestore-based progress functions
export async function loadProgressFirestore(db, userId, patternId, currentStepRef, updateDisplayFn) {
    const currentStep = await getCurrentStep(db, userId, patternId);
    if (currentStepRef) {
        currentStepRef.value = currentStep;
    }
    if (updateDisplayFn) {
        updateDisplayFn(false);
    }
    return currentStep;
}

export async function saveProgressFirestore(db, userId, patternId, currentStep) {
    await setCurrentStep(db, userId, patternId, currentStep);
}

export function updateDisplay(currentStep, shouldScroll = true) {
    // Update step input
    const stepInput = document.getElementById('current-step-input');
    if (stepInput) {
        stepInput.value = currentStep;
    }
    
    // Update step type display
    const stepTypeEl = document.getElementById('step-type');
    if (stepTypeEl) {
        const instruction = findInstructionForStep(currentStep);
        if (instruction) {
            let stepInfo = '';
            if (instruction.stepType) stepInfo += instruction.stepType + ' ';
            if (instruction.side) stepInfo += `(${instruction.side.toUpperCase()})`;
            stepTypeEl.textContent = stepInfo.trim() || 'ROW';
        } else {
            stepTypeEl.textContent = 'ROW';
        }
    }
    
    // Highlight current step in pattern - Enhanced highlighting
    const allSteps = document.querySelectorAll('[data-step], [data-step-start]');
    allSteps.forEach(el => {
        el.classList.remove('current-step');
        el.style.backgroundColor = '';
        el.style.padding = '';
        el.style.margin = '';
        el.style.borderRadius = '';
    });
    
    const currentStepEl = findStepElement(currentStep);
    if (currentStepEl) {
        currentStepEl.classList.add('current-step');
        // Enhanced highlighting with better visibility
        currentStepEl.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
        currentStepEl.style.padding = '0.75rem';
        currentStepEl.style.margin = '0.25rem 0';
        currentStepEl.style.borderRadius = '0.5rem';
        currentStepEl.style.border = '2px solid rgba(139, 92, 246, 0.5)';
        
        if (shouldScroll) {
            currentStepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

export function findInstructionForStep(stepNumber, PATTERN_DATA) {
    if (!PATTERN_DATA) return null;
    
    // Handle NEW Firestore schema format with steps array
    if (PATTERN_DATA.steps && Array.isArray(PATTERN_DATA.steps)) {
        return PATTERN_DATA.steps.find(step => {
            if (step.step === stepNumber) return true;
            if (step.stepRange && stepNumber >= step.stepRange[0] && stepNumber <= step.stepRange[1]) {
                return true;
            }
            return false;
        });
    }
    
    // Handle LEGACY format with instructions array
    if (PATTERN_DATA.instructions && Array.isArray(PATTERN_DATA.instructions)) {
        return PATTERN_DATA.instructions.find(instr => {
            if (instr.step === stepNumber) return true;
            if (instr.stepRange && stepNumber >= instr.stepRange[0] && stepNumber <= instr.stepRange[1]) {
                return true;
            }
            return false;
        });
    }
    
    return null;
}

export function findStepElement(stepNumber) {
    // Look for exact step match first
    let stepEl = document.querySelector(`[data-step="${stepNumber}"]`);
    if (stepEl) return stepEl;
    
    // Look for step range
    const rangeElements = document.querySelectorAll('[data-step-start]');
    for (const el of rangeElements) {
        const start = parseInt(el.dataset.stepStart);
        const end = parseInt(el.dataset.stepEnd);
        if (stepNumber >= start && stepNumber <= end) {
            return el;
        }
    }
    
    return null;
}

export function getStitchCount(stepNumber, PATTERN_DATA) {
    if (!PATTERN_DATA) return 0;
    
    const instruction = findInstructionForStep(stepNumber, PATTERN_DATA);
    if (!instruction) return 0;
    
    // Handle NEW Firestore schema format
    if (instruction.endingStitchCount !== undefined) {
        return instruction.endingStitchCount;
    }
    if (instruction.startingStitchCount !== undefined) {
        return instruction.startingStitchCount;
    }
    
    // Handle LEGACY format
    // If explicitly defined, use that
    if (instruction.stitchCount !== undefined) {
        return instruction.stitchCount;
    }
    
    // For dynamic chunks, calculate based on step number and pattern
    if (instruction.dynamicChunks && instruction.chunks) {
        return calculateDynamicStitchCount(stepNumber, instruction);
    }
    
    // For static chunks, count the stitches
    if (instruction.chunks) {
        return calculateStaticStitchCount(instruction.chunks);
    }
    
    return 0;
}

function calculateDynamicStitchCount(stepNumber, instruction) {
    // This would need to implement the dynamic calculation logic
    // For now, return a reasonable default
    return 50; // Placeholder
}

function calculateStaticStitchCount(chunks) {
    let total = 0;
    chunks.forEach(chunk => {
        if (chunk.repeat) {
            let repeatCount = 0;
            chunk.repeat.instructions.forEach(repeatInstr => {
                repeatCount += repeatInstr.count || 1;
            });
            total += repeatCount * chunk.repeat.times;
        } else {
            total += chunk.count || 1;
        }
    });
    return total;
}