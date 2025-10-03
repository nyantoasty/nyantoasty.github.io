// progress-tracking.js - Enhanced Firestore-based progress tracking functions
// Version: v2025-10-02-enhanced-progress

import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp, 
    collection, 
    query, 
    where, 
    getDocs,
    orderBy,
    FieldValue,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Generate unique project ID
 * @returns {string} Unique project identifier
 */
export function generateProjectId() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]; // YYYYMMDDHHMMSS
    const random = Math.random().toString(36).substr(2, 6); // 6 random characters
    return `proj_${timestamp}_${random}`;
}

/**
 * Create a new project instance for a pattern
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string|null} projectName - Optional project name
 * @param {string} purpose - Project purpose (gift, personal, commission, sample, teaching)
 * @param {string|null} recipient - Optional recipient name
 * @returns {Object} Project data with projectId and progressId
 */
export async function createNewProject(db, userId, patternId, projectName = null, purpose = 'personal', recipient = null) {
    try {
        const projectId = generateProjectId();
        const progressId = `${userId}_${patternId}_${projectId}`;
        
        const initialData = {
            userId,
            patternId,
            projectId,
            currentStep: 1,
            totalSteps: null, // Will be set when pattern is loaded
            completedSteps: [],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            status: 'not_started',
            
            projectDetails: {
                projectName: projectName || `New Project ${new Date().toLocaleDateString()}`,
                purpose,
                recipient,
                deadline: null,
                yarns: [],
                tools: {
                    needleSize: null,
                    originalNeedleSize: null,
                    hookSize: null,
                    otherTools: []
                },
                modifications: [],
                targetSize: {
                    width: null,
                    length: null
                },
                gauge: {
                    stitchesPerInch: null,
                    rowsPerInch: null,
                    measuredOn: null
                }
            },
            
            notes: {
                general: "",
                stepNotes: {},
                milestones: []
            },
            
            images: [],
            
            experience: {
                skillLevel: "intermediate",
                estimatedDifficulty: null,
                actualDifficulty: null,
                timeSpent: {
                    totalMinutes: 0,
                    sessionsCount: 0,
                    averageSessionLength: 0,
                    longestSession: 0
                },
                problemsEncountered: []
            },
            
            analytics: {
                preferredCraftingTimes: [],
                productivityPatterns: {
                    averageStepsPerSession: 0,
                    fastestProgress: {
                        steps: 0,
                        timeMinutes: 0,
                        date: null
                    }
                },
                helpRequestsCount: 0,
                stitchFinderUsage: 0,
                glossaryLookups: [],
                progressShares: 0,
                helpReceived: []
            },
            
            patternMetadata: {
                version: null,
                source: "created",
                sharedBy: null,
                tags: [],
                personalRating: null,
                wouldRecommend: null,
                publicReview: null
            },
            
            privacy: {
                shareProgress: true,
                shareLocation: false,
                sharePhotos: true,
                shareAnalytics: true,
                profileVisibility: 'friends'
            },
            
            location: {
                enabled: false,
                startLocation: null,
                progressLocations: []
            },
            
            pausedReason: null,
            completionNotes: null,
            
            futureData: {
                aiSuggestions: [],
                communityConnections: [],
                achievementsUnlocked: [],
                patternRecommendations: []
            }
        };
        
        await setDoc(doc(db, 'user_pattern_progress', progressId), initialData);
        
        console.log(`✅ Created new project: ${projectId} for pattern ${patternId}`);
        return { 
            projectId, 
            progressId, 
            projectData: initialData 
        };
        
    } catch (error) {
        console.error('❌ Error creating new project:', error);
        throw error;
    }
}

/**
 * Get the user's current/active project for a pattern (most recently updated)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @returns {Object|null} Current project data or null if none exists
 */
export async function getCurrentProject(db, userId, patternId) {
    try {
        const q = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId),
            where('patternId', '==', patternId),
            orderBy('lastUpdated', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const mostRecent = snapshot.docs[0];
            const projectData = {
                id: mostRecent.id,
                ...mostRecent.data()
            };
            
            console.log(`✅ Found current project: ${projectData.projectId}`);
            return projectData;
        }
        
        console.log(`ℹ️ No existing projects for pattern ${patternId}, will need to create new project`);
        return null;
        
    } catch (error) {
        console.error('❌ Error getting current project:', error);
        return null;
    }
}

/**
 * Get all projects for a user on a specific pattern
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @returns {Array} Array of project records
 */
export async function getUserProjectsForPattern(db, userId, patternId) {
    try {
        const q = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId),
            where('patternId', '==', patternId),
            orderBy('lastUpdated', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`✅ Found ${projects.length} projects for pattern ${patternId}`);
        return projects;
        
    } catch (error) {
        console.error('❌ Error getting user projects:', error);
        return [];
    }
}

/**
 * Save/update progress for a specific project
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string} projectId - Project ID
 * @param {Object} progressData - Progress data to update
 * @returns {boolean} Success status
 */
export async function saveProjectProgress(db, userId, patternId, projectId, progressData) {
    try {
        const progressId = `${userId}_${patternId}_${projectId}`;
        const updateData = {
            ...progressData,
            lastUpdated: serverTimestamp()
        };
        
        // If this is a step update, also update completedSteps array
        if (progressData.currentStep) {
            const currentProject = await getDoc(doc(db, 'user_pattern_progress', progressId));
            if (currentProject.exists()) {
                const data = currentProject.data();
                const completedSteps = data.completedSteps || [];
                const newStep = progressData.currentStep;
                
                // Add current step to completed steps if not already there
                if (!completedSteps.includes(newStep)) {
                    updateData.completedSteps = arrayUnion(newStep);
                }
            }
        }
        
        await updateDoc(doc(db, 'user_pattern_progress', progressId), updateData);
        
        // Also save to localStorage as backup for offline use
        const localKey = `pattern-progress-${patternId}`;
        if (progressData.currentStep) {
            localStorage.setItem(localKey, progressData.currentStep.toString());
        }
        
        console.log(`✅ Progress saved for project ${projectId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving project progress:', error);
        
        // Fallback to localStorage only
        if (progressData.currentStep) {
            const localKey = `pattern-progress-${patternId}`;
            localStorage.setItem(localKey, progressData.currentStep.toString());
        }
        return false;
    }
}

/**
 * Get or create a project for the user, ensuring they have one to work with
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string|null} projectName - Optional project name for new projects
 * @returns {Object} Project data
 */
export async function getOrCreateProject(db, userId, patternId, projectName = null) {
    try {
        // Try to get current project first
        let currentProject = await getCurrentProject(db, userId, patternId);
        
        if (!currentProject) {
            // No existing project, create a new one
            console.log(`Creating new project for pattern ${patternId}`);
            const result = await createNewProject(db, userId, patternId, projectName);
            currentProject = result.projectData;
            currentProject.id = result.progressId;
            currentProject.projectId = result.projectId;
        }
        
        return currentProject;
        
    } catch (error) {
        console.error('❌ Error getting or creating project:', error);
        throw error;
    }
}

/**
 * Add a note to a project (either general or step-specific)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string} projectId - Project ID
 * @param {string} note - Note text
 * @param {number|null} step - Step number for step-specific notes, null for general notes
 * @returns {boolean} Success status
 */
export async function addProjectNote(db, userId, patternId, projectId, note, step = null) {
    try {
        const progressId = `${userId}_${patternId}_${projectId}`;
        const updateData = {
            lastUpdated: serverTimestamp()
        };
        
        if (step === null) {
            // General note
            updateData['notes.general'] = note;
        } else {
            // Step-specific note
            updateData[`notes.stepNotes.${step}`] = note;
        }
        
        await updateDoc(doc(db, 'user_pattern_progress', progressId), updateData);
        
        console.log(`✅ Added note to project ${projectId}${step ? ` for step ${step}` : ''}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error adding project note:', error);
        return false;
    }
}

/**
 * Track analytics event for a project
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string} projectId - Project ID
 * @param {string} event - Event type
 * @param {Object} data - Event data
 * @returns {boolean} Success status
 */
export async function trackProjectAnalytics(db, userId, patternId, projectId, event, data = {}) {
    try {
        const progressId = `${userId}_${patternId}_${projectId}`;
        const updateData = {
            lastUpdated: serverTimestamp()
        };
        
        switch(event) {
            case 'stitch_finder_used':
                updateData['analytics.stitchFinderUsage'] = FieldValue.increment(1);
                break;
            case 'glossary_lookup':
                updateData['analytics.glossaryLookups'] = arrayUnion(data.term);
                break;
            case 'help_request':
                updateData['analytics.helpRequestsCount'] = FieldValue.increment(1);
                break;
            case 'progress_share':
                updateData['analytics.progressShares'] = FieldValue.increment(1);
                break;
        }
        
        await updateDoc(doc(db, 'user_pattern_progress', progressId), updateData);
        
        console.log(`✅ Tracked analytics event: ${event} for project ${projectId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error tracking project analytics:', error);
        return false;
    }
}

/**
 * Helper function to get current step for compatibility with existing code
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
    
    try {
        const currentProject = await getCurrentProject(db, userId, patternId);
        return currentProject ? currentProject.currentStep : 1;
    } catch (error) {
        console.error('❌ Error getting current step:', error);
        // Fallback to localStorage
        const localKey = `pattern-progress-${patternId}`;
        const localStep = localStorage.getItem(localKey);
        return localStep ? parseInt(localStep, 10) : 1;
    }
}

/**
 * Helper function to save current step for compatibility with existing code
 * @param {Object} db - Firestore database instance
 * @param {string|null} userId - User ID (null if not authenticated)
 * @param {string} patternId - Pattern ID
 * @param {number} currentStep - Step number to save
 * @returns {boolean} Success status
 */
export async function setCurrentStep(db, userId, patternId, currentStep) {
    if (!userId) {
        // Anonymous user - use localStorage only
        const localKey = `pattern-progress-${patternId}`;
        localStorage.setItem(localKey, currentStep.toString());
        return true;
    }
    
    try {
        const currentProject = await getOrCreateProject(db, userId, patternId);
        return await saveProjectProgress(db, userId, patternId, currentProject.projectId, {
            currentStep: parseInt(currentStep)
        });
    } catch (error) {
        console.error('❌ Error setting current step:', error);
        // Fallback to localStorage
        const localKey = `pattern-progress-${patternId}`;
        localStorage.setItem(localKey, currentStep.toString());
        return false;
    }
}

/**
 * Load user progress with enhanced data (compatibility function)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @returns {Object} Progress data
 */
export async function loadUserProgress(db, userId, patternId) {
    try {
        const currentProject = await getCurrentProject(db, userId, patternId);
        
        if (currentProject) {
            return {
                currentStep: currentProject.currentStep || 1,
                notes: currentProject.notes?.general || null,
                customMarkings: currentProject.notes?.stepNotes || {},
                lastUpdated: currentProject.lastUpdated,
                projectId: currentProject.projectId,
                projectName: currentProject.projectDetails?.projectName,
                enhanced: currentProject // Full enhanced data
            };
        } else {
            // No project exists, check localStorage for backward compatibility
            const localKey = `pattern-progress-${patternId}`;
            const localStep = localStorage.getItem(localKey);
            const currentStep = localStep ? parseInt(localStep, 10) : 1;
            
            return {
                currentStep,
                notes: null,
                customMarkings: {},
                lastUpdated: null,
                projectId: null,
                projectName: null,
                enhanced: null
            };
        }
        
    } catch (error) {
        console.error('❌ Error loading user progress:', error);
        
        // Fallback to localStorage
        const localKey = `pattern-progress-${patternId}`;
        const localStep = localStorage.getItem(localKey);
        const currentStep = localStep ? parseInt(localStep, 10) : 1;
        
        return {
            currentStep,
            notes: null,
            customMarkings: {},
            lastUpdated: null,
            projectId: null,
            projectName: null,
            enhanced: null
        };
    }
}