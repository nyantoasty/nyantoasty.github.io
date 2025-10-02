// progress-tracking.js - Firestore-based progress tracking functions
// Version: v2025-10-01-firestore-progress

import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Save user's progress on a specific pattern to Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID  
 * @param {number} currentStep - Current step number
 * @param {string|null} notes - Optional user notes
 * @param {Object|null} customMarkings - Optional custom step markings
 */
export async function saveUserProgress(db, userId, patternId, currentStep, notes = null, customMarkings = null) {
    try {
        const progressId = `${userId}_${patternId}`;
        const progressData = {
            userId,
            patternId,
            currentStep: parseInt(currentStep),
            lastUpdated: serverTimestamp()
        };
        
        // Add optional fields if provided
        if (notes !== null) {
            progressData.notes = notes;
        }
        if (customMarkings !== null) {
            progressData.customMarkings = customMarkings;
        }
        
        await setDoc(doc(db, 'user_pattern_progress', progressId), progressData, { merge: true });
        
        // Also save to localStorage as backup
        const localKey = `pattern-progress-${patternId}`;
        localStorage.setItem(localKey, currentStep.toString());
        
        console.log(`✅ Progress saved: User ${userId}, Pattern ${patternId}, Step ${currentStep}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving progress to Firestore:', error);
        
        // Fallback to localStorage only
        const localKey = `pattern-progress-${patternId}`;
        localStorage.setItem(localKey, currentStep.toString());
        return false;
    }
}

/**
 * Load user's progress on a specific pattern from Firestore
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @returns {Object} Progress data with currentStep, notes, etc.
 */
export async function loadUserProgress(db, userId, patternId) {
    try {
        const progressId = `${userId}_${patternId}`;
        const docRef = doc(db, 'user_pattern_progress', progressId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log(`✅ Progress loaded from Firestore: Step ${data.currentStep}`);
            return {
                currentStep: data.currentStep || 1,
                notes: data.notes || null,
                customMarkings: data.customMarkings || {},
                lastUpdated: data.lastUpdated
            };
        } else {
            // No Firestore record, check localStorage
            const localKey = `pattern-progress-${patternId}`;
            const localStep = localStorage.getItem(localKey);
            const currentStep = localStep ? parseInt(localStep, 10) : 1;
            
            console.log(`📁 No Firestore progress, using localStorage: Step ${currentStep}`);
            
            // Save to Firestore for future use
            if (userId) {
                await saveUserProgress(db, userId, patternId, currentStep);
            }
            
            return {
                currentStep,
                notes: null,
                customMarkings: {},
                lastUpdated: null
            };
        }
        
    } catch (error) {
        console.error('❌ Error loading progress from Firestore:', error);
        
        // Fallback to localStorage
        const localKey = `pattern-progress-${patternId}`;
        const localStep = localStorage.getItem(localKey);
        const currentStep = localStep ? parseInt(localStep, 10) : 1;
        
        console.log(`📁 Firestore error, falling back to localStorage: Step ${currentStep}`);
        return {
            currentStep,
            notes: null,
            customMarkings: {},
            lastUpdated: null
        };
    }
}

/**
 * Get all patterns with progress for a specific user
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @returns {Array} Array of progress records
 */
export async function getUserProgressList(db, userId) {
    try {
        const q = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const progressList = [];
        
        querySnapshot.forEach((doc) => {
            progressList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Loaded ${progressList.length} progress records for user ${userId}`);
        return progressList;
        
    } catch (error) {
        console.error('❌ Error loading user progress list:', error);
        return [];
    }
}

/**
 * Add or update user notes for a specific step
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {number} stepNumber - Step number
 * @param {string} note - Note text
 */
export async function addStepNote(db, userId, patternId, stepNumber, note) {
    try {
        const progressId = `${userId}_${patternId}`;
        const progressData = await loadUserProgress(db, userId, patternId);
        
        const customMarkings = progressData.customMarkings || {};
        customMarkings[`step_${stepNumber}`] = note;
        
        await saveUserProgress(db, userId, patternId, progressData.currentStep, progressData.notes, customMarkings);
        console.log(`✅ Added note to step ${stepNumber}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error adding step note:', error);
        return false;
    }
}

/**
 * Create initial progress record when a pattern is shared
 * @param {Object} db - Firestore database instance
 * @param {string} userId - New user receiving the pattern
 * @param {string} patternId - Pattern ID
 * @param {string} sharedFromUserId - User who shared the pattern
 */
export async function initializeSharedPatternProgress(db, userId, patternId, sharedFromUserId) {
    try {
        // Check if user already has progress on this pattern
        const existingProgress = await loadUserProgress(db, userId, patternId);
        if (existingProgress.lastUpdated) {
            console.log(`ℹ️ User ${userId} already has progress on pattern ${patternId}`);
            return existingProgress;
        }
        
        // Get sharer's notes (not progress) to include as reference
        let sharedNotes = null;
        if (sharedFromUserId) {
            const sharerProgress = await loadUserProgress(db, sharedFromUserId, patternId);
            if (sharerProgress.notes) {
                sharedNotes = `Shared notes from creator: ${sharerProgress.notes}`;
            }
        }
        
        // Create new progress record starting at step 1
        await saveUserProgress(db, userId, patternId, 1, sharedNotes);
        
        console.log(`✅ Initialized progress for shared pattern: User ${userId}, Pattern ${patternId}`);
        return { currentStep: 1, notes: sharedNotes, customMarkings: {} };
        
    } catch (error) {
        console.error('❌ Error initializing shared pattern progress:', error);
        return { currentStep: 1, notes: null, customMarkings: {} };
    }
}

/**
 * Helper function to get current user's progress with fallback
 * @param {Object} db - Firestore database instance
 * @param {string|null} userId - User ID (null if not authenticated)
 * @param {string} patternId - Pattern ID
 * @returns {number} Current step number
 */
export async function getCurrentStep(db, userId, patternId) {
    if (!userId) {
        // Anonymous user - use localStorage only
        const localKey = `pattern-progress-${patternId}`;
        const localStep = localStorage.getItem(localKey);
        return localStep ? parseInt(localStep, 10) : 1;
    }
    
    const progress = await loadUserProgress(db, userId, patternId);
    return progress.currentStep;
}

/**
 * Helper function to save current step with fallback
 * @param {Object} db - Firestore database instance
 * @param {string|null} userId - User ID (null if not authenticated)
 * @param {string} patternId - Pattern ID
 * @param {number} currentStep - Step number to save
 */
export async function setCurrentStep(db, userId, patternId, currentStep) {
    if (!userId) {
        // Anonymous user - use localStorage only
        const localKey = `pattern-progress-${patternId}`;
        localStorage.setItem(localKey, currentStep.toString());
        return;
    }
    
    await saveUserProgress(db, userId, patternId, currentStep);
}