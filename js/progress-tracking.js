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
 * Create a human-readable slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
function createSlug(text) {
    if (!text) return 'unknown';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 30); // Limit length
}

/**
 * Generate a human-readable document ID
 * @param {string} userDisplayName - User's display name or email
 * @param {string} patternName - Pattern name
 * @param {string} projectName - Project name
 * @returns {string} Human-readable document ID
 */
function generateReadableDocId(userDisplayName, patternName, projectName) {
    const userSlug = createSlug(userDisplayName?.split('@')[0] || 'user'); // Use part before @ for emails
    const patternSlug = createSlug(patternName);
    const projectSlug = createSlug(projectName);
    const dateStamp = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    return `${userSlug}_${patternSlug}_${projectSlug}_${dateStamp}`;
}

/**
 * Ensure document ID uniqueness by appending counter if needed
 * @param {Object} db - Firestore database instance
 * @param {string} baseId - Base document ID
 * @returns {string} Unique document ID
 */
async function ensureUniqueDocId(db, baseId) {
    let counter = 1;
    let testId = baseId;
    
    while (true) {
        const docRef = doc(db, 'user_pattern_progress', testId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
            return testId;
        }
        
        // If document exists, try with counter
        testId = `${baseId}_${counter}`;
        counter++;
        
        // Safety limit to prevent infinite loops
        if (counter > 99) {
            // Fallback to timestamp-based ID
            const timestamp = Date.now();
            return `${baseId}_${timestamp}`;
        }
    }
}

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
 * @param {Object} user - User object with displayName/email
 * @param {Object} patternData - Pattern data with metadata
 * @returns {Object} Project data with projectId and progressId
 */
export async function createNewProject(db, userId, patternId, projectName = null, purpose = 'personal', recipient = null, user = null, patternData = null) {
    try {
        const projectId = generateProjectId();
        
        // Generate human-readable document ID
        const userDisplayName = user?.displayName || user?.email || 'user';
        const patternName = patternData?.metadata?.name || patternData?.name || patternId;
        const finalProjectName = projectName || `${patternName} Project`;
        
        // Create base human-readable ID
        const baseDocId = generateReadableDocId(userDisplayName, patternName, finalProjectName);
        
        // Ensure uniqueness
        const progressId = await ensureUniqueDocId(db, baseDocId);
        
        console.log('📝 Creating project with readable ID:', {
            userId,
            patternId,
            projectId,
            readableDocId: progressId,
            userDisplayName,
            patternName,
            projectName: finalProjectName
        });
        
        // Create human-readable user identifier
        const createUserSlug = (user) => {
            const displayName = user?.displayName || user?.email?.split('@')[0] || 'user';
            return displayName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 20);
        };
        
        const userFriendlyId = createUserSlug(user);
        
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
            
            // Debugging: Add human-readable user identifiers
            createdByUser: userFriendlyId,
            createdByEmail: user?.email,
            createdByName: user?.displayName || user?.email,
            
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
 * Find a project document by userId, patternId, and projectId
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @param {string} patternId - Pattern ID
 * @param {string} projectId - Project ID
 * @returns {Object|null} Document reference and data, or null if not found
 */
async function findProjectDocument(db, userId, patternId, projectId) {
    try {
        const q = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId),
            where('patternId', '==', patternId),
            where('projectId', '==', projectId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        // Return the first (should be only) match
        const doc = querySnapshot.docs[0];
        return {
            docRef: doc.ref,
            docId: doc.id,
            data: doc.data()
        };
    } catch (error) {
        console.error('Error finding project document:', error);
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
        // Find the project document
        const projectDoc = await findProjectDocument(db, userId, patternId, projectId);
        
        if (!projectDoc) {
            console.error('❌ Project document not found:', { userId, patternId, projectId });
            return false;
        }
        
        const updateData = {
            ...progressData,
            lastUpdated: serverTimestamp()
        };
        
        // If this is a step update, also update completedSteps array
        if (progressData.currentStep) {
            const data = projectDoc.data;
            const completedSteps = data.completedSteps || [];
            const newStep = progressData.currentStep;
                
            // Add current step to completed steps if not already there
            if (!completedSteps.includes(newStep)) {
                updateData.completedSteps = arrayUnion(newStep);
            }
        }
        
        await updateDoc(projectDoc.docRef, updateData);
        
        // Also save to localStorage as backup for offline use
        const localKey = `pattern-progress-${patternId}`;
        if (progressData.currentStep) {
            localStorage.setItem(localKey, progressData.currentStep.toString());
        }
        
        console.log(`✅ Progress saved for project ${projectId} (doc: ${projectDoc.docId})`);
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