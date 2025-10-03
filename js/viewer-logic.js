// viewer-logic.js - Pattern viewer navigation and progress functions
// Version: v2025-10-02-enhanced-progress

import { getCurrentStep, setCurrentStep, getOrCreateProject, saveProjectProgress, getCurrentProject } from './progress-tracking.js';

// Global footer update function - available via window.updateFooterMetadata
function updateFooterMetadata() {
    console.log('🏷️ updateFooterMetadata called');
    const currentPatternName = document.getElementById('current-pattern-name');
    const footerCurrentStep = document.getElementById('footer-current-step');
    const footerMaxSteps = document.getElementById('footer-max-steps');
    
    console.log('🏷️ Footer elements:', {
        currentPatternName: currentPatternName?.textContent,
        footerCurrentStep: footerCurrentStep?.textContent,
        footerMaxSteps: footerMaxSteps?.textContent
    });
    
    console.log('🏷️ Pattern data:', {
        PATTERN_DATA: !!window.PATTERN_DATA,
        patternName: window.PATTERN_DATA?.metadata?.name,
        currentStep: window.currentStep,
        maxSteps: window.maxSteps
    });
    
    if (currentPatternName && footerCurrentStep && footerMaxSteps) {
        const patternName = window.PATTERN_DATA?.metadata?.name || 'Unknown Pattern';
        const activeCurrentStep = window.currentStep || 1;
        const activeMaxSteps = window.maxSteps || 1;
        
        console.log('🏷️ Updating footer with:', { patternName, activeCurrentStep, activeMaxSteps });
        currentPatternName.textContent = patternName;
        footerCurrentStep.textContent = activeCurrentStep;
        footerMaxSteps.textContent = activeMaxSteps;
    } else {
        console.log('🏷️ Cannot update footer - missing elements:', {
            currentPatternName: !!currentPatternName,
            footerCurrentStep: !!footerCurrentStep,
            footerMaxSteps: !!footerMaxSteps
        });
    }
}

// Expose updateFooterMetadata globally
window.updateFooterMetadata = updateFooterMetadata;

// Expose updateDisplay globally for cross-module access
window.updateDisplay = updateDisplay;

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

// Enhanced Firestore-based progress functions
export async function loadProgressFirestore(db, userId, patternId, currentStepRef, updateDisplayFn) {
    try {
        const currentStep = await getCurrentStep(db, userId, patternId);
        if (currentStepRef) {
            currentStepRef.value = currentStep;
        }
        if (updateDisplayFn) {
            updateDisplayFn(false);
        }
        return currentStep;
    } catch (error) {
        console.error('❌ Error loading progress from Firestore:', error);
        // Fallback to localStorage
        const fallbackStep = loadProgressSimple(`pattern-progress-${patternId}`);
        if (currentStepRef) {
            currentStepRef.value = fallbackStep;
        }
        if (updateDisplayFn) {
            updateDisplayFn(false);
        }
        return fallbackStep;
    }
}

export async function saveProgressFirestore(db, userId, patternId, currentStep) {
    try {
        await setCurrentStep(db, userId, patternId, currentStep);
        return true;
    } catch (error) {
        console.error('❌ Error saving progress to Firestore:', error);
        // Fallback to localStorage
        saveProgress(`pattern-progress-${patternId}`, currentStep);
        return false;
    }
}

// Enhanced project management functions
export async function getOrCreateCurrentProject(db, userId, patternId, projectName = null) {
    try {
        return await getOrCreateProject(db, userId, patternId, projectName);
    } catch (error) {
        console.error('❌ Error getting or creating project:', error);
        return null;
    }
}

export async function saveEnhancedProgress(db, userId, patternId, projectId, progressData) {
    try {
        return await saveProjectProgress(db, userId, patternId, projectId, progressData);
    } catch (error) {
        console.error('❌ Error saving enhanced progress:', error);
        // Fallback to localStorage for basic step tracking
        if (progressData.currentStep) {
            saveProgress(`pattern-progress-${patternId}`, progressData.currentStep);
        }
        return false;
    }
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
    
    // PERFORMANCE FIX: Use CSS classes instead of inline styles and batch DOM operations
    // Remove current step highlighting from all elements at once
    const allSteps = document.querySelectorAll('[data-step], [data-step-start]');
    allSteps.forEach(el => {
        el.classList.remove('current-step', 'previous-step');
    });
    
    // Only highlight the current step - no more looping through hundreds of previous steps!
    const currentStepEl = findStepElement(currentStep);
    if (currentStepEl) {
        currentStepEl.classList.add('current-step');
        
        if (shouldScroll) {
            currentStepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Optional: Mark only the immediately previous step if needed
    if (currentStep > 1) {
        const prevStepEl = findStepElement(currentStep - 1);
        if (prevStepEl) {
            prevStepEl.classList.add('previous-step');
        }
    }
    
    // Update footer metadata when display updates
    if (typeof window.updateFooterMetadata === 'function') {
        window.updateFooterMetadata();
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

export function setupStitchFinder() {
    const findStitchBtn = document.getElementById('find-stitch-btn');
    const stitchInput = document.getElementById('stitch-input');
    
    function findStitch() {
        const stitchNumber = parseInt(stitchInput.value);
        if (!stitchNumber || stitchNumber < 1) {
            alert('Please enter a valid stitch number');
            return;
        }
        
        // Find the current row's instruction element
        const currentRowElement = document.querySelector(`[data-step="${window.currentStep}"]`);
        if (!currentRowElement) {
            alert('Current row not found');
            return;
        }
        
        // Highlight the stitch (basic implementation - could be enhanced)
        currentRowElement.style.backgroundColor = '#8b5cf6';
        currentRowElement.style.color = 'white';
        currentRowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
            currentRowElement.style.backgroundColor = '';
            currentRowElement.style.color = '';
        }, 3000);
        
        // Analytics
        if (window.auth && window.auth.currentUser && window.db) {
            // Analytics tracking would go here
            console.log('Stitch finder used:', { step: window.currentStep, stitch: stitchNumber });
        }
    }
    
    if (findStitchBtn) {
        findStitchBtn.addEventListener('click', findStitch);
    }
    
    if (stitchInput) {
        stitchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                findStitch();
            }
        });
    }
}

export function setupRowNavigation() {
    console.log('🔧 Setting up row navigation...');
    console.log('🔧 Current values:', { currentStep: window.currentStep, maxSteps: window.maxSteps });
    
    const stepInput = document.getElementById('current-step-input');
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const toggleNotesBtn = document.getElementById('toggle-notes-sidebar');
    
    console.log('🔧 Found elements:', {
        stepInput: !!stepInput,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        toggleNotesBtn: !!toggleNotesBtn
    });
    
    // Get progress key from current project
    const progressKey = window.currentProject ? 
        `pattern-progress-${window.currentProject.patternId}` : 
        'pattern-progress-default';
    
    // Remove existing listeners to prevent duplicates
    if (stepInput && !stepInput.hasAttribute('data-listener-added')) {
        stepInput.setAttribute('data-listener-added', 'true');
        
        const handleStepChange = (value, shouldSave = true) => {
            const newStep = parseInt(value) || 1;
            if (newStep < 1 || newStep > window.maxSteps) return;
            
            window.currentStep = newStep;
            stepInput.value = window.currentStep;
            
            if (shouldSave) {
                // Save immediately to localStorage for instant response
                localStorage.setItem(progressKey, window.currentStep);
                if (window.currentProject) {
                    window.currentProject.currentStep = window.currentStep;
                }
                
                // Save to Firestore in background if functions available
                if (typeof window.saveProjectProgress === 'function' && window.currentProject && window.auth.currentUser) {
                    window.saveProjectProgress(window.db, window.auth.currentUser.uid, window.currentProject.patternId, window.currentProject.projectId, {
                        currentStep: window.currentStep
                    }).catch(err => console.warn('Background save failed:', err));
                }
            }
            
            updateDisplay(window.currentStep, true);
        };
        
        // Real-time input for immediate visual feedback
        stepInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= window.maxSteps) {
                handleStepChange(value, false); // Don't save on every keystroke
            }
        });
        
        // Final change event when user finishes typing
        stepInput.addEventListener('change', (e) => {
            handleStepChange(e.target.value, true); // Save when user finishes
        });
        
        // Enter key for instant jump
        stepInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleStepChange(e.target.value, true);
                e.target.blur();
            }
        });
        console.log('✅ Step input listener added');
    }
    
    if (prevBtn && !prevBtn.hasAttribute('data-listener-added')) {
        prevBtn.setAttribute('data-listener-added', 'true');
        prevBtn.addEventListener('click', () => {
            if (window.currentStep > 1) {
                window.currentStep--;
                stepInput.value = window.currentStep;
                
                // Save immediately to localStorage for instant response
                localStorage.setItem(progressKey, window.currentStep);
                if (window.currentProject) {
                    window.currentProject.currentStep = window.currentStep;
                }
                
                // Save to Firestore in background
                if (typeof window.saveProjectProgress === 'function' && window.currentProject && window.auth.currentUser) {
                    window.saveProjectProgress(window.db, window.auth.currentUser.uid, window.currentProject.patternId, window.currentProject.projectId, {
                        currentStep: window.currentStep
                    }).catch(err => console.warn('Background save failed:', err));
                }
                
                updateDisplay(window.currentStep, true);
            }
        });
        console.log('✅ Previous button listener added');
    }
    
    if (nextBtn && !nextBtn.hasAttribute('data-listener-added')) {
        nextBtn.setAttribute('data-listener-added', 'true');
        nextBtn.addEventListener('click', () => {
            if (window.currentStep < window.maxSteps) {
                window.currentStep++;
                stepInput.value = window.currentStep;
                
                // Save immediately to localStorage for instant response
                localStorage.setItem(progressKey, window.currentStep);
                if (window.currentProject) {
                    window.currentProject.currentStep = window.currentStep;
                }
                
                // Save to Firestore in background
                if (typeof window.saveProjectProgress === 'function' && window.currentProject && window.auth.currentUser) {
                    window.saveProjectProgress(window.db, window.auth.currentUser.uid, window.currentProject.patternId, window.currentProject.projectId, {
                        currentStep: window.currentStep
                    }).catch(err => console.warn('Background save failed:', err));
                }
                
                updateDisplay(window.currentStep, true);
            }
        });
        console.log('✅ Next button listener added');
    }
    
    // Notes sidebar toggle
    if (toggleNotesBtn && !toggleNotesBtn.hasAttribute('data-listener-added')) {
        toggleNotesBtn.setAttribute('data-listener-added', 'true');
        toggleNotesBtn.addEventListener('click', () => {
            if (typeof window.toggleNotesSidebar === 'function') {
                window.toggleNotesSidebar();
            }
        });
        console.log('✅ Notes toggle button listener added');
    }
    
    // Update footer when current step changes
    updateFooterMetadata();
}

// Expose functions globally for HTML access
window.setupStitchFinder = setupStitchFinder;
window.setupRowNavigation = setupRowNavigation;