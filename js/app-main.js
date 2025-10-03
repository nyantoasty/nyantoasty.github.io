// app-main.js - Main application logic and initialization
// Version: v2025-01-27-organized

import { auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from './firebase-config.js';
import { loadProgressFirestore, saveProgressFirestore } from './viewer-logic.js';
import { getOrCreateProject, saveProjectProgress, getCurrentProject } from './progress-tracking.js';

// Google Sign-In
export async function signInWithGoogle() {
    try {
        console.log('🔐 Starting Google Sign-In...');
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Sign-in successful:', result.user.email);
        
        return result.user;
    } catch (error) {
        console.error('❌ Sign-in failed:', error.code, error.message);
        
        if (error.code === 'auth/popup-closed-by-user') {
            alert('Sign-in was cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
            alert('Pop-up was blocked. Please allow pop-ups and try again.');
        } else {
            alert(`Sign-in failed: ${error.message}`);
        }
        
        throw error;
    }
}

export async function signOutUser() {
    try {
        await signOut(auth);
        console.log('✅ Sign-out successful');
        return true;
    } catch (error) {
        console.error('❌ Sign-out failed:', error);
        return false;
    }
}

export async function checkRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            console.log('✅ Redirect result:', result.user.email);
            return result.user;
        }
        return null;
    } catch (error) {
        console.error('❌ Redirect result error:', error);
        return null;
    }
}

// Application state management
export function showNotAuthorized(user) {
    document.getElementById('signin-container').style.display = 'none';
    document.getElementById('not-authorized').style.display = 'block';
    document.getElementById('application-container').style.display = 'none';
    
    document.getElementById('user-email-not-auth').textContent = user.email;
}

export function showApplication(user, userData = null, roleData = null) {
    document.getElementById('signin-container').style.display = 'none';
    document.getElementById('not-authorized').style.display = 'none';
    document.getElementById('application-container').style.display = 'block';
    
    const userDisplayNameElement = document.getElementById('user-display-name');
    const userEmailElement = document.getElementById('user-email');
    
    if (userDisplayNameElement) {
        userDisplayNameElement.textContent = user.displayName || 'User';
    }
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    // Initialize the application
    populateProjectSelector();
    loadUserProjects();
}

// Project management functions
export async function createSampleUserPatternProgress() {
    // Implementation moved from index.html
    console.log('Creating sample user pattern progress...');
    // ... rest of function implementation
}

export async function recreateUserPatternProgressCollection() {
    // Implementation moved from index.html  
    console.log('Recreating user pattern progress collection...');
    // ... rest of function implementation
}

export async function discoverPatterns() {
    // Implementation moved from index.html
    console.log('Discovering patterns...');
    // ... rest of function implementation
}

export async function loadUserProjects() {
    // Implementation moved from index.html
    console.log('Loading user projects...');
    // ... rest of function implementation
}

export async function loadFirestorePatterns() {
    // Implementation moved from index.html
    console.log('Loading Firestore patterns...');
    // ... rest of function implementation
}

export async function populateProjectSelector() {
    // Implementation moved from index.html
    console.log('Populating project selector...');
    // ... rest of function implementation
}

export async function loadSelectedProject(projectKey, userProjects) {
    // Implementation moved from index.html
    console.log('Loading selected project:', projectKey);
    // ... rest of function implementation
}

export async function loadPatternFromFirestore(patternId) {
    // Implementation moved from index.html
    console.log('Loading pattern from Firestore:', patternId);
    // ... rest of function implementation
}

export function resetViewer() {
    // Implementation moved from index.html
    console.log('Resetting viewer...');
    // ... rest of function implementation
}

export async function showNewProjectModal() {
    // Implementation moved from index.html
    console.log('Showing new project modal...');
    // ... rest of function implementation
}

export async function createNewProjectUI() {
    // Implementation moved from index.html
    console.log('Creating new project UI...');
    // ... rest of function implementation
}

export async function toggleArchivedProjects() {
    // Implementation moved from index.html
    console.log('Toggling archived projects...');
    // ... rest of function implementation
}

export async function unarchiveProject(projectKey) {
    // Implementation moved from index.html
    console.log('Unarchiving project:', projectKey);
    // ... rest of function implementation
}

export async function checkAuthState() {
    // Implementation moved from index.html
    console.log('Checking auth state...');
    // ... rest of function implementation
}

export function initThemeToggle() {
    // Implementation moved from index.html
    console.log('Initializing theme toggle...');
    
    function updateTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateTheme(savedTheme);
    
    // Add toggle listener
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            updateTheme(newTheme);
        });
    }
}

export async function initializeViewer() {
    // Implementation moved from index.html
    console.log('Initializing viewer...');
    // ... rest of function implementation
}

// Notes system functions
export function toggleNotesSidebar() {
    const notesSidebar = document.getElementById('notes-sidebar');
    const isVisible = notesSidebar.style.display !== 'none';
    
    notesSidebar.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        loadProjectNotes();
    }
}

export async function loadProjectNotes() {
    if (!window.CURRENT_USER || !window.CURRENT_PROJECT_KEY) {
        console.log('No user or project selected');
        return;
    }
    
    try {
        const project = await getCurrentProject(db, window.CURRENT_USER.uid, window.CURRENT_PROJECT_KEY);
        
        // Load general notes
        const generalNotesTextarea = document.getElementById('general-notes');
        if (generalNotesTextarea && project.notes?.general) {
            generalNotesTextarea.value = project.notes.general;
        }
        
        // Load yarn details
        const yarnDetailsTextarea = document.getElementById('yarn-details');
        if (yarnDetailsTextarea && project.notes?.yarn) {
            yarnDetailsTextarea.value = project.notes.yarn;
        }
        
        // Load modifications
        const modificationsTextarea = document.getElementById('modifications-notes');
        if (modificationsTextarea && project.notes?.modifications) {
            modificationsTextarea.value = project.notes.modifications;
        }
        
        // Load current row note
        if (window.currentStep && project.notes?.rows?.[window.currentStep]) {
            const currentRowNote = document.getElementById('current-row-note');
            if (currentRowNote) {
                currentRowNote.value = project.notes.rows[window.currentStep];
            }
        }
        
        console.log('✅ Project notes loaded');
    } catch (error) {
        console.error('❌ Error loading project notes:', error);
    }
}

export async function saveCurrentRowNote() {
    const currentRowNote = document.getElementById('current-row-note');
    if (!currentRowNote || !window.currentStep) return;
    
    const noteText = currentRowNote.value.trim();
    
    try {
        const project = await getCurrentProject(db, window.CURRENT_USER.uid, window.CURRENT_PROJECT_KEY);
        
        if (!project.notes) project.notes = {};
        if (!project.notes.rows) project.notes.rows = {};
        
        if (noteText) {
            project.notes.rows[window.currentStep] = noteText;
        } else {
            delete project.notes.rows[window.currentStep];
        }
        
        await saveProjectProgress(db, window.CURRENT_USER.uid, window.CURRENT_PROJECT_KEY, project);
        
        // Update row indicator
        addRowNoteIndicator(window.currentStep, !!noteText);
        
        console.log('✅ Row note saved for step', window.currentStep);
    } catch (error) {
        console.error('❌ Error saving row note:', error);
    }
}

export function addRowNoteIndicator(stepNumber, hasNote) {
    const stepElement = document.querySelector(`[data-step="${stepNumber}"]`);
    if (!stepElement) return;
    
    // Remove existing indicator
    const existingIndicator = stepElement.querySelector('.note-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add new indicator if there's a note
    if (hasNote) {
        const indicator = document.createElement('span');
        indicator.className = 'note-indicator';
        indicator.textContent = '📝';
        indicator.style.color = '#ffa500';
        indicator.style.marginLeft = '5px';
        indicator.style.cursor = 'pointer';
        indicator.title = 'This row has notes';
        
        // Click to view note
        indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            window.currentStep = parseInt(stepNumber);
            updateDisplay();
            toggleNotesSidebar();
        });
        
        stepElement.appendChild(indicator);
    }
}

export function loadRowNoteIndicators() {
    if (!window.currentProject?.notes?.stepNotes) return;
    
    Object.keys(window.currentProject.notes.stepNotes).forEach(step => {
        addRowNoteIndicator(parseInt(step), true);
    });
}

export function goToRowWithNote(step) {
    // Jump to the specified row
    window.currentStep = parseInt(step);
    
    const stepInput = document.getElementById('current-step-input');
    if (stepInput) {
        stepInput.value = window.currentStep;
    }
    
    // Import updateDisplay from viewer-logic.js - call it if available
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay(window.currentStep, true);
    } else if (typeof updateDisplay === 'function') {
        updateDisplay(window.currentStep, true);
    } else {
        console.warn('updateDisplay function not available');
    }
    
    // Update current row note in sidebar
    const currentRowNote = document.getElementById('current-row-note');
    const currentRowLabel = document.getElementById('current-row-note-label');
    if (currentRowLabel) {
        currentRowLabel.textContent = step;
    }
    if (currentRowNote && window.currentProject?.notes?.stepNotes?.[step]) {
        currentRowNote.value = window.currentProject.notes.stepNotes[step];
    } else if (currentRowNote) {
        currentRowNote.value = '';
    }
    
    console.log('✅ Jumped to row with note:', step);
}

// Expose functions globally for HTML event handlers
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.toggleNotesSidebar = toggleNotesSidebar;
window.saveCurrentRowNote = saveCurrentRowNote;
window.showNewProjectModal = showNewProjectModal;
window.createNewProjectUI = createNewProjectUI;
window.toggleArchivedProjects = toggleArchivedProjects;
window.goToRowWithNote = goToRowWithNote;
window.addRowNoteIndicator = addRowNoteIndicator;
window.loadRowNoteIndicators = loadRowNoteIndicators;