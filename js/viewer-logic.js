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

export function setupInteractiveFeatures() {
    console.log('🔧 Setting up interactive features...');
    
    // Set up click handlers for color-coded stitches
    const stitchElements = document.querySelectorAll('.stitch-clickable');
    console.log('Found', stitchElements.length, 'clickable stitches');
    stitchElements.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const stitchCode = element.dataset.stitch || element.textContent.trim();
            if (window.showStitchDefinition) {
                window.showStitchDefinition(stitchCode);
            }
        });
    });
    
    // Set up stitch finder functionality
    setupStitchFinder();
    
    // Set up row navigation with auto-scroll
    setupRowNavigation();
    
    // Set up pattern tools sidebar
    if (window.setupPatternSidebar) {
        window.setupPatternSidebar();
    }
    
    // Populate sidebar glossary
    if (window.populateSidebarGlossary) {
        window.populateSidebarGlossary();
    }
    
    console.log('✅ Interactive features setup complete');
}

export function scrollToCurrentRow() {
    if (typeof window.currentStep === 'undefined' || !window.currentStep) {
        console.log('Current step is undefined, cannot scroll to row');
        return;
    }
    
    const currentRowElement = document.querySelector(`[data-step="${window.currentStep}"]`);
    if (currentRowElement) {
        // Remove previous highlights
        document.querySelectorAll('.current-step').forEach(el => {
            el.classList.remove('current-step');
        });
        
        // Add current step highlight
        currentRowElement.classList.add('current-step');
        
        // Scroll to the row
        currentRowElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    } else {
        console.log(`No element found for step ${window.currentStep}`);
    }
}

export function updateCurrentStepDisplay() {
    const stepInput = document.getElementById('current-step-input');
    if (stepInput) {
        stepInput.value = window.currentStep;
    }
    
    // Highlight current step
    highlightCurrentStep(true);
    
    console.log('🔧 Current step display updated to:', window.currentStep);
}

export function showStitchDefinition(stitchCode) {
    if (!window.PATTERN_DATA || !window.PATTERN_DATA.glossary || !window.PATTERN_DATA.glossary[stitchCode]) {
        console.warn('No definition found for stitch:', stitchCode);
        return;
    }
    
    // Analytics: Track stitch definition views
    if (window.auth && window.auth.currentUser) {
        import('./stitch-witch.js').then(({ logStitchWitchQuery }) => {
            logStitchWitchQuery({
                type: 'stitch_finder',
                action: 'view_definition',
                stitchCode: stitchCode,
                rowNumber: window.currentStep,
                patternId: window.PATTERN_DATA?.id || 'unknown'
            }, window.db, window.auth);
        });
    }
    
    const stitchModal = document.getElementById('stitch-modal');
    const stitchModalTitle = document.getElementById('stitch-modal-title');
    const stitchModalDefinition = document.getElementById('stitch-modal-definition');
    
    const glossaryEntry = window.PATTERN_DATA.glossary[stitchCode];
    stitchModalTitle.textContent = `${glossaryEntry.name} (${stitchCode})`;
    stitchModalDefinition.textContent = glossaryEntry.description;
    stitchModal.classList.remove('hidden');
}

export function hideStitchDefinition() {
    const stitchModal = document.getElementById('stitch-modal');
    stitchModal.classList.add('hidden');
}

// Expose functions globally for HTML event handlers
window.updateCurrentStepDisplay = updateCurrentStepDisplay;
window.showStitchDefinition = showStitchDefinition;
window.hideStitchDefinition = hideStitchDefinition;

export function setupPatternSidebar() {
    console.log('🔧 Setting up pattern sidebar...');
    
    const sidebar = document.getElementById('pattern-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const returnToRowBtn = document.getElementById('return-to-row');
    
    console.log('Sidebar elements found:', {
        sidebar: !!sidebar,
        sidebarToggle: !!sidebarToggle,
        sidebarClose: !!sidebarClose,
        sidebarOverlay: !!sidebarOverlay,
        returnToRowBtn: !!returnToRowBtn
    });
    
    function toggleSidebar(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔄 Toggling sidebar');
        if (sidebar && sidebarOverlay) {
            const isCurrentlyOpen = sidebar.classList.contains('open');
            console.log('Sidebar currently open:', isCurrentlyOpen);
            
            if (isCurrentlyOpen) {
                // Close the sidebar
                sidebar.classList.remove('open');
                sidebarOverlay.classList.add('hidden');
                console.log('✅ Sidebar closed');
            } else {
                // Open the sidebar
                sidebar.classList.add('open');
                sidebarOverlay.classList.remove('hidden');
                console.log('✅ Sidebar opened');
            }
        }
    }
    
    function closeSidebar() {
        console.log('❌ Closing sidebar');
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.add('hidden');
        }
    }
    
    if (sidebarToggle) {
        console.log('✅ Adding click handler to sidebar toggle');
        sidebarToggle.addEventListener('click', toggleSidebar);
    } else {
        console.error('❌ Sidebar toggle button not found!');
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    if (returnToRowBtn) {
        returnToRowBtn.addEventListener('click', () => {
            scrollToCurrentRow();
            closeSidebar();
        });
    }
    
    // Handle section navigation
    const sidebarLinks = document.querySelector('.sidebar-links');
    if (sidebarLinks) {
        sidebarLinks.addEventListener('click', (e) => {
            if (e.target.dataset.section) {
                e.preventDefault();
                const sectionElement = document.getElementById(e.target.dataset.section);
                if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    closeSidebar();
                }
            }
        });
    }
    
    console.log('✅ Pattern sidebar setup complete');
}

export function populateSidebarGlossary() {
    const sidebarGlossary = document.getElementById('sidebar-glossary');
    if (!sidebarGlossary || !window.PATTERN_DATA || !window.PATTERN_DATA.glossary) {
        return;
    }
    
    // Clear any existing event listeners
    const newSidebarGlossary = sidebarGlossary.cloneNode(false);
    sidebarGlossary.parentNode.replaceChild(newSidebarGlossary, sidebarGlossary);
    
    let glossaryHTML = '';
    const usedCategories = new Set();
    
    for (const [key, item] of Object.entries(window.PATTERN_DATA.glossary)) {
        if (item && item.name) {
            // Import getInstructionCategory dynamically to avoid circular imports
            import('./utils.js').then(({ getInstructionCategory }) => {
                const category = getInstructionCategory(key, window.PATTERN_DATA);
                usedCategories.add(category);
                
                // Get the color for this category from CSS variables
                const colorClass = `color-${category}`;
                
                glossaryHTML += `
                    <div class="cursor-pointer hover:bg-gray-700 p-3 rounded mb-2 border-l-4 border-gray-600" data-stitch="${key}">
                        <div class="${colorClass} font-bold text-lg mb-1" style="color: var(--color-${category})">${key}</div>
                        <div class="text-gray-300 font-medium mb-1">${item.name}</div>
                        ${item.description ? `<div class="text-gray-400 text-sm leading-relaxed">${item.description}</div>` : ''}
                    </div>
                `;
            });
        }
    }
    
    newSidebarGlossary.innerHTML = glossaryHTML;
    
    // Add click handlers for sidebar glossary items
    newSidebarGlossary.addEventListener('click', (e) => {
        const stitchDiv = e.target.closest('[data-stitch]');
        if (stitchDiv) {
            const stitchCode = stitchDiv.dataset.stitch;
            showStitchDefinition(stitchCode);
        }
    });
    
    // Update the sidebar color key to reflect the actual categories used
    import('./pattern-functions.js').then(({ updateSidebarColorKey }) => {
        updateSidebarColorKey(usedCategories);
    });
}

// Expose functions globally for HTML access
window.setupStitchFinder = setupStitchFinder;
window.setupRowNavigation = setupRowNavigation;
window.setupInteractiveFeatures = setupInteractiveFeatures;
window.scrollToCurrentRow = scrollToCurrentRow;
window.setupPatternSidebar = setupPatternSidebar;
window.populateSidebarGlossary = populateSidebarGlossary;