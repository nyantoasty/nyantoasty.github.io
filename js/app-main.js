// app-main.js - Main application logic and initialization
// Version: v2025-01-27-organized

import { auth, db } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut, 
    getRedirectResult,
    signInWithRedirect 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getDoc, 
    doc, 
    query, 
    collection, 
    where, 
    getDocs, 
    setDoc, 
    updateDoc, 
    serverTimestamp, 
    deleteDoc,
    addDoc,
    limit
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { loadProgressFirestore, saveProgressFirestore } from './viewer-logic.js';
import { getOrCreateProject, saveProjectProgress, getCurrentProject, createNewProject } from './progress-tracking.js';

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
    console.log('=== CHECKING REDIRECT RESULT ===');
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            console.log('✅ Redirect result:', result.user.email);
            return result.user;
        }
        return null;
    } catch (error) {
        console.error('❌ Redirect result error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            console.log('User closed the popup');
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log('Popup request was cancelled');
        } else {
            console.error('Unexpected redirect error:', error.code, error.message);
            alert('Authentication error: ' + error.message);
        }
        return null;
    }
}

// Application state management
export function showNotAuthorized(user) {
    // Show auth container, hide app container
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    
    console.log('👤 User not authorized:', user?.email || 'unknown user');
}

export function showApplication(user, userData = null, roleData = null) {
    // Hide auth container, show app container
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) authContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    
    // Update user display
    const userDisplayElement = document.getElementById('user-display');
    if (userDisplayElement) {
        userDisplayElement.textContent = `Welcome, ${user.displayName || user.email || 'User'}!`;
    }
    
    console.log('🎉 User authorized - showing application');
    
    // Initialize the application
    populateProjectSelector();
    loadUserProjects();
}

// Project management functions
export async function createSampleUserPatternProgress() {
    if (!auth.currentUser) {
        alert('Please log in first');
        return;
    }

    if (!window.PATTERN_DATA) {
        alert('Please load a pattern first');
        return;
    }

    const userId = auth.currentUser.uid;
    const patternId = window.PATTERN_DATA.id;
    
    console.log('Creating sample progress entry...');
    console.log('Pattern data:', window.PATTERN_DATA);
    console.log('User ID:', userId);
    console.log('Pattern ID:', patternId);
    
    // Create a new project instance with correct function signature
    const projectResult = await createNewProject(
        db,
        userId,
        patternId,
        'Sample Project'
    );
    
    const projectId = projectResult.projectId;
    console.log('Created project:', projectResult);
    
    // Update project with additional details using saveProjectProgress
    await saveProjectProgress(
        db,
        userId,
        patternId,
        projectId,
        {
            currentStep: 15,
            'projectDetails.yarns': [{
                brand: 'Sample Yarn Brand',
                weight: 'DK',
                colorway: 'Ocean Blue',
                yardage: 400,
                dyelot: 'ABC123'
            }],
            'projectDetails.tools.needleSize': 'US 6 (4.0mm)',
            'projectDetails.recipient': 'Sample Recipient',
            'projectDetails.projectName': 'My Beautiful Sample Project',
            'notes.general': 'This is a sample project created for testing purposes.',
            'notes.stepNotes.10': 'Remember to check gauge here',
            'notes.stepNotes.15': 'This is where we are now - current step'
        }
    );
    
    console.log('✅ Sample progress entry created!');
    console.log('Project ID:', projectId);
    
    // Refresh the progress display
    if (window.loadUserProgress) {
        await window.loadUserProgress();
    }
}

export async function recreateUserPatternProgressCollection() {
    if (!auth.currentUser) {
        alert('Please log in first');
        return;
    }

    console.log('🔄 Recreating user_pattern_progress collection...');

    // This function will ensure the collection exists with proper structure
    // We'll create a sample document to establish the schema and then remove it
    
    const userId = auth.currentUser.uid;
    const samplePatternId = 'sample_pattern_id';
    const sampleProjectId = 'sample_project_id';
    const progressId = `${userId}_${samplePatternId}_${sampleProjectId}`;

    const sampleDocument = {
        userId,
        patternId: samplePatternId,
        projectId: sampleProjectId,
        currentStep: 1,
        totalSteps: 100,
        completedSteps: [],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        status: 'not_started',
        
        projectDetails: {
            projectName: 'Sample Project',
            recipient: 'Sample Recipient',
            startDate: new Date(),
            targetCompletionDate: null,
            yarns: [],
            tools: { needleSize: null },
            modifications: []
        },
        
        notes: {
            general: '',
            stepNotes: {},
            milestones: []
        },
        
        images: [],
        
        experience: {
            difficultyRating: null,
            skillsLearned: [],
            timeSpent: 0,
            mistakesMade: [],
            hintsUsed: [],
            problemsEncountered: []
        },
        
        analytics: {
            sessionCount: 0,
            totalTimeSpent: 0,
            averageSessionTime: 0,
            lastSessionDate: null,
            enjoymentRating: null
        },
        
        privacy: {
            shareProgress: false,
            shareImages: false,
            shareNotes: false
        }
    };

    try {
        // Create the sample document to establish schema
        await setDoc(doc(window.db, 'user_pattern_progress', progressId), sampleDocument);
        console.log('✅ Sample document created to establish schema');
        
        // Immediately delete the sample document
        await updateDoc(doc(window.db, 'user_pattern_progress', progressId), {
            status: 'deleted',
            isDeleted: true
        });
        console.log('✅ Sample document marked as deleted');
        
        console.log('🎉 user_pattern_progress collection recreated with enhanced schema!');
        
    } catch (error) {
        console.error('❌ Error recreating collection:', error);
        throw error;
    }
}

export async function discoverPatterns() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in, cannot discover patterns');
            availablePatterns = [];
            return [];
        }
        
        console.log('🔍 Loading patterns from Firestore...');
        availablePatterns = [];
        
        // Load patterns the user created
        const userPatternsQuery = query(
            collection(db, 'patterns'),
            where('createdBy', '==', user.uid)
        );
        
        const userPatterns = await getDocs(userPatternsQuery);
        
        userPatterns.forEach(docSnapshot => {
            const patternData = docSnapshot.data();
            availablePatterns.push({
                id: docSnapshot.id,
                filename: docSnapshot.id,
                source: 'firestore',
                name: patternData.metadata?.name || patternData.name || docSnapshot.id,
                author: patternData.metadata?.author || patternData.author || 'Unknown',
                description: patternData.metadata?.description || patternData.description || '',
                createdBy: patternData.createdBy,
                createdAt: patternData.createdAt,
                isPublic: patternData.isPublic || false,
                data: patternData
            });
        });
        
        // TODO: Also load patterns shared with the user via pattern_access collection
        // For now, we're just loading user's own patterns
        
        console.log(`✅ Found ${availablePatterns.length} patterns`);
        populatePatternSelector();
        return availablePatterns;
        
    } catch (error) {
        console.error('Error discovering patterns:', error);
        // Fallback to empty list
        availablePatterns = [];
        populatePatternSelector();
        return [];
    }
}

export async function loadUserProjects() {
    if (!auth.currentUser) return [];
    
    try {
        const userId = auth.currentUser.uid;
        const progressQuery = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(progressQuery);
        const projects = new Map();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter based on archived status
            const isArchived = data.status === 'archived';
            if (window.showArchivedProjects !== isArchived) {
                return; // Skip if doesn't match current view
            }
            
            const projectKey = `${data.patternId}_${data.projectId}`;
            
            // Only keep the most recent version of each project
            if (!projects.has(projectKey) || 
                (data.lastUpdated && data.lastUpdated.toDate() > projects.get(projectKey).lastUpdate)) {
                
                projects.set(projectKey, {
                    ...data,
                    docId: doc.id,
                    startDate: data.createdAt?.toDate() || new Date(),
                    lastUpdate: data.lastUpdated?.toDate() || data.createdAt?.toDate() || new Date()
                });
            }
        });
        
        return Array.from(projects.values());
    } catch (error) {
        console.error('Error loading user projects:', error);
        return [];
    }
}

export async function loadFirestorePatterns() {
    try {
        const patternsQuery = query(collection(db, 'patterns'));
        const querySnapshot = await getDocs(patternsQuery);
        const patterns = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            patterns.push({
                id: doc.id,
                ...data,
                filename: doc.id // Use document ID as filename
            });
        });
        
        return patterns;
    } catch (error) {
        console.error('Error loading Firestore patterns:', error);
        return [];
    }
}

export async function populateProjectSelector() {
    const selector = document.getElementById('project-selector');
    const projectInfo = document.getElementById('project-info');
    const noProjectState = document.getElementById('no-project-state');
    
    selector.innerHTML = '<option value="">Loading your projects...</option>';
    
    const userProjects = await loadUserProjects();
    
    if (userProjects.length === 0) {
        const emptyMessage = window.showArchivedProjects ? 'No archived projects' : 'No active projects yet';
        selector.innerHTML = `<option value="">${emptyMessage}</option>`;
        projectInfo.classList.add('hidden');
        noProjectState.classList.remove('hidden');
        return;
    }
    
    noProjectState.classList.add('hidden');
    const selectMessage = window.showArchivedProjects ? '-- Select archived project --' : '-- Select a project --';
    selector.innerHTML = `<option value="">${selectMessage}</option>`;
    
    userProjects.forEach(project => {
        const option = document.createElement('option');
        option.value = `${project.patternId}_${project.projectId}`;
        option.textContent = `${project.projectDetails?.projectName || project.projectId} - ${project.patternName}`;
        selector.appendChild(option);
    });
    
    // Auto-select the most recently updated project if none is selected
    if (!selector.value && userProjects.length > 0) {
        const mostRecent = userProjects.sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
        const autoSelectValue = `${mostRecent.patternId}_${mostRecent.projectId}`;
        selector.value = autoSelectValue;
        
        // Trigger the change event to load the project
        const changeEvent = new Event('change');
        selector.dispatchEvent(changeEvent);
    }
}

export async function loadSelectedProject(projectKey, userProjects) {
    const project = userProjects.find(p => `${p.patternId}_${p.projectId}` === projectKey);
    if (!project) return;
    
    // Update project info display
    const projectInfo = document.getElementById('project-info');
    const projectName = document.getElementById('project-name');
    const projectPatternInfo = document.getElementById('project-pattern-info');
    const projectPatternName = document.getElementById('project-pattern-name');
    const projectStartDate = document.getElementById('project-start-date');
    const projectLastUpdate = document.getElementById('project-last-update');
    const projectProgressSummary = document.getElementById('project-progress-summary');
    
    // Show the actual project name the user gave it
    const customProjectName = project.projectId.startsWith('Project_') 
        ? `${project.patternName} Project` // Auto-generated, show pattern name
        : project.projectId; // Custom name from user
    
    projectName.textContent = customProjectName;
    projectPatternInfo.textContent = `Working on step ${project.currentStep}`;
    projectPatternName.textContent = project.patternName; // This is the pattern name
    projectStartDate.textContent = project.startDate.toLocaleDateString();
    projectLastUpdate.textContent = project.lastUpdate.toLocaleDateString();
    projectProgressSummary.textContent = `Step ${project.currentStep}`;
    
    projectInfo.classList.remove('hidden');
    
    // Update archive/unarchive button based on project status and current view
    const deleteBtn = document.getElementById('delete-project-btn');
    if (window.showArchivedProjects && project.status === 'archived') {
        // Viewing archived project - show unarchive option
        deleteBtn.textContent = '📤 Restore';
        deleteBtn.title = 'Restore to Active Projects';
        deleteBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
        deleteBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        deleteBtn.disabled = false;
    } else {
        // Viewing active project - show archive option
        deleteBtn.textContent = '🗃️ Archive';
        deleteBtn.title = 'Archive or Permanently Delete Project';
        deleteBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        deleteBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
        deleteBtn.disabled = false;
    }
    
    // Load the pattern data from Firestore - this will populate pattern-name and pattern-author elements
    await loadPatternFromFirestore(project.patternId);
    
    // Set current project and step - ensure all viewer components are updated
    window.currentProject = project;
    window.currentStep = project.currentStep;
    window.currentStep = project.currentStep; // Set local variable too
    
    console.log('🔧 Project loaded, setting currentStep to:', window.currentStep);
    
    // Update step input if it exists
    const stepInput = document.getElementById('current-step-input');
    if (stepInput) {
        stepInput.value = window.currentStep;
        console.log('🔧 Step input value set to:', stepInput.value);
    }
    
    if (window.currentStepRef) {
        window.currentStepRef.value = project.currentStep;
        // Force update the display to show pattern name and enable functionality
        if (window.PATTERN_DATA && window.updateStepDisplay) {
            window.updateStepDisplay(false);
        }
    }
    
    // Update footer to show pattern is loaded
    if (window.PATTERN_DATA) {
        const footerControls = document.getElementById('footer-controls');
        if (footerControls) {
            footerControls.classList.remove('hidden');
        }
    }
}

export async function loadPatternFromFirestore(patternId) {
    try {
        const patternDoc = await getDoc(doc(db, 'patterns', patternId));
        if (patternDoc.exists()) {
            const patternData = patternDoc.data();
            window.PATTERN_DATA = patternData;
            window.PATTERN_DATA = patternData; // Also set local variable
            
            if (patternData.metadata && patternData.metadata.name) {
                // Pattern loaded successfully, set up the viewer
                window.setupViewer(); // Call the global function
                console.log('✅ Pattern loaded from Firestore:', patternData.metadata.name);
            } else {
                console.error('❌ Pattern data missing required metadata');
            }
        } else {
            console.error('❌ Pattern not found in Firestore:', patternId);
        }
    } catch (error) {
        console.error('❌ Error loading pattern from Firestore:', error);
    }
}

export function resetViewer() {
    const projectInfo = document.getElementById('project-info');
    const noProjectState = document.getElementById('no-project-state');
    
    projectInfo.classList.add('hidden');
    document.getElementById('pattern-content').innerHTML = '';
    const footerControls = document.getElementById('footer-controls');
    if (footerControls) {
        footerControls.classList.add('hidden');
    }
    window.PATTERN_DATA = null;
    window.currentProject = null;
    
    // Remove pattern-specific theme
    const existingStyle = document.getElementById('pattern-theme');
    if (existingStyle) {
        existingStyle.remove();
    }
}

export async function showNewProjectModal() {
    const firestorePatterns = await loadFirestorePatterns();
    
    if (firestorePatterns.length === 0) {
        alert('No patterns available. Please add patterns to Firestore first.');
        return;
    }
    
    let patternOptions = firestorePatterns.map(pattern => 
        `<option value="${pattern.id}">${pattern.metadata?.name || pattern.id} by ${pattern.metadata?.author || 'Unknown'}</option>`
    ).join('');
    
    const modalHtml = `
        <div id="new-project-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-white mb-4">Create New Project</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Select Pattern:</label>
                        <select id="new-project-pattern" class="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2">
                            <option value="">-- Choose a pattern --</option>
                            ${patternOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Project Name (optional):</label>
                        <input type="text" id="new-project-name" placeholder="e.g., 'Birthday Gift', 'Winter Scarf'" 
                               class="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2">
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button id="create-project-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded transition-colors">
                            Create Project
                        </button>
                        <button id="cancel-project-btn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Event handlers
    document.getElementById('create-project-btn').addEventListener('click', createNewProjectUI);
    document.getElementById('cancel-project-btn').addEventListener('click', () => {
        document.getElementById('new-project-modal').remove();
    });
}

export async function createNewProjectUI() {
    const patternId = document.getElementById('new-project-pattern').value;
    const projectName = document.getElementById('new-project-name').value.trim();
    
    if (!patternId) {
        alert('Please select a pattern.');
        return;
    }
    
    if (!auth.currentUser) {
        alert('Please log in first.');
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        
        console.log('🔧 Creating project with:', { patternId, projectName, userId });
        
        // Load pattern metadata to get the actual pattern name and author
        const patternDoc = await getDoc(doc(db, 'patterns', patternId));
        if (!patternDoc.exists()) {
            alert('Selected pattern not found.');
            return;
        }
        
        const patternData = patternDoc.data();
        const patternName = patternData.metadata?.name || patternData.name || 'Unknown Pattern';
        const patternAuthor = patternData.metadata?.author || patternData.author || 'Unknown Author';
        
        console.log('📜 Loaded pattern data:', { patternName, patternAuthor });
        
        // Use user's custom project name or create a meaningful default
        const finalProjectName = projectName || `${patternName} Project`;
        
        console.log('📝 Final project name:', finalProjectName);
        
        // Create project with proper pattern information
        const newProject = await createNewProject(db, userId, patternId, finalProjectName);
        
        console.log('✅ Project created:', newProject);
        
        // Update the project with pattern metadata that wasn't included in createNewProject
        const progressId = `${userId}_${patternId}_${newProject.projectId}`;
        await updateDoc(doc(db, 'user_pattern_progress', progressId), {
            patternName: patternName,
            patternAuthor: patternAuthor,
            'patternMetadata.name': patternName,
            'patternMetadata.author': patternAuthor,
            'patternMetadata.source': 'firestore'
        });
        
        console.log('✅ Project metadata updated');
        
        // Close modal
        document.getElementById('new-project-modal').remove();
        
        // Refresh project list
        await populateProjectSelector();
        
        // Auto-select new project
        const selector = document.getElementById('project-selector');
        const newProjectKey = `${patternId}_${newProject.projectId}`;
        selector.value = newProjectKey;
        
        const userProjects = await loadUserProjects();
        await loadSelectedProject(newProjectKey, userProjects);
        
        console.log('✅ New project created and selected:', newProject.projectId);
    } catch (error) {
        console.error('❌ Error creating project:', error);
        console.error('❌ Error details:', error.message, error.stack);
        alert(`Error creating project: ${error.message}`);
    }
}

export async function toggleArchivedProjects() {
    window.showArchivedProjects = !window.showArchivedProjects;
    
    const button = document.getElementById('toggle-archived-btn');
    if (button) {
        button.textContent = window.showArchivedProjects ? 'Show Active Projects' : 'Show Archived Projects';
    }
    
    // Refresh the project selector
    await populateProjectSelector();
}

export async function unarchiveProject(projectKey) {
    if (!projectKey) return;
    
    try {
        const userId = auth.currentUser.uid;
        const [patternId, projectId] = projectKey.split('_');
        const progressId = `${userId}_${patternId}_${projectId}`;
        
        console.log('📤 Unarchiving project:', progressId);
        
        const docRef = doc(db, 'user_pattern_progress', progressId);
        await updateDoc(docRef, {
            status: 'in_progress',
            unarchivedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
        
        console.log('✅ Project unarchived successfully');
        alert('Project restored to active projects!');
        
        // Refresh the current view
        await populateProjectSelector();
        
    } catch (error) {
        console.error('❌ Error unarchiving project:', error);
        alert(`Error restoring project: ${error.message}`);
    }
}

export async function checkAuthState() {
    console.log('=== STEP 1: Starting checkAuthState ===');
    
    // Set up auth state listener FIRST to catch any immediate auth changes
    console.log('=== STEP 1.5: Setting up auth state listener ===');
    onAuthStateChanged(auth, async (user) => {
        console.log('🔥 AUTH STATE CHANGED EVENT FIRED!');
        console.log('Raw user object:', user);
        console.log('User from auth state change:', user ? user.email : 'null');
        console.log('User is null?', user === null);
        console.log('User is undefined?', user === undefined);
        
        if (user) {
            console.log('✅ USER FOUND VIA AUTH STATE CHANGE!');
            console.log('User email:', user.email);
            console.log('User UID:', user.uid);
            console.log('User emailVerified:', user.emailVerified);
            console.log('User providerData:', user.providerData);
            
            try {
                // Check if user exists in the users collection
                console.log('🔍 Checking user in Firebase users collection...');
                console.log('Looking for document path: users/' + user.uid);
                
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                console.log('User document exists:', userDocSnap.exists());
                
                if (userDocSnap.exists()) {
                    // User exists, get their role and permissions
                    const userData = userDocSnap.data();
                    console.log('✅ User found in database:', userData);
                    
                    // Get role details
                    const roleDocRef = doc(db, "roles", userData.role);
                    const roleDocSnap = await getDoc(roleDocRef);
                    
                    if (roleDocSnap.exists()) {
                        const roleData = roleDocSnap.data();
                        console.log('✅ User role data:', roleData);
                        
                        // Check if user has permission to view patterns
                        if (roleData.permissions && roleData.permissions.includes('view_patterns')) {
                            console.log('🎉 User authorized - showing application');
                            
                            // Update last login
                            await updateDoc(userDocRef, {
                                lastLogin: new Date().toISOString()
                            });
                            
                            showApplication(user, userData, roleData);
                        } else {
                            console.log('❌ User role does not have view_patterns permission');
                            showNotAuthorized(user);
                        }
                    } else {
                        console.log('❌ User role not found in roles collection');
                        showNotAuthorized(user);
                    }
                } else {
                    // User doesn't exist, create them with default 'viewer' role
                    console.log('👤 New user detected - creating user document');
                    
                    try {
                        const newUserData = {
                            email: user.email,
                            displayName: user.displayName || user.email.split('@')[0],
                            role: 'viewer',
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString()
                        };
                        
                        console.log('Creating user document with data:', newUserData);
                        await setDoc(userDocRef, newUserData);
                        console.log('✅ Successfully created new user document');
                        
                        // Get the viewer role permissions
                        const roleDocRef = doc(db, "roles", "viewer");
                        const roleDocSnap = await getDoc(roleDocRef);
                        const roleData = roleDocSnap.exists() ? roleDocSnap.data() : { permissions: ['view_patterns'], name: 'Viewer' };
                        
                        console.log('New user role data:', roleData);
                        showApplication(user, newUserData, roleData);
                        
                    } catch (createError) {
                        console.error('🚨 Error creating user document:', createError);
                        if (createError.code === 'permission-denied') {
                            alert('Permission denied when creating user account. Please check Firebase security rules.');
                        } else {
                            alert(`Error creating user account: ${createError.message}`);
                        }
                        showNotAuthorized(user);
                    }
                }
                
            } catch (error) {
                console.error('🚨 Error checking user authorization:', error);
                if (error.code === 'permission-denied') {
                    alert('Permission denied. Please check your Firebase security rules.');
                } else {
                    alert(`Authentication error: ${error.message}`);
                }
                showNotAuthorized(user);
            }
            
        } else {
            console.log('Auth state change: no user - showing login screen');
            const authContainer = document.getElementById('signin-container');
            const appContainer = document.getElementById('application-container');
            if (authContainer) authContainer.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
        }
    });
    
    console.log('=== STEP 2: Checking current auth state (popup method) ===');
    
    console.log('=== STEP 3: Checking current user ===');
    const currentUser = auth.currentUser;
    console.log('auth.currentUser:', currentUser);
    
    if (currentUser) {
        console.log('✅ Current user found:', currentUser.email);
        // Trigger the auth state change manually if needed
        console.log('Current user exists, but auth state change should handle this');
    }
    
    console.log('=== STEP 4: No user found, showing login screen ===');
    const authContainer = document.getElementById('signin-container');
    const appContainer = document.getElementById('application-container');
    if (authContainer) authContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
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
    if (notesSidebar) {
        const isOpen = !notesSidebar.classList.contains('translate-x-full');
        
        if (isOpen) {
            notesSidebar.classList.add('translate-x-full');
        } else {
            notesSidebar.classList.remove('translate-x-full');
            loadProjectNotes();
        }
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

export async function loadSelectedPattern(patternId) {
    const patternNameEl = document.getElementById('pattern-name');
    const patternAuthorEl = document.getElementById('pattern-author');
    const patternContentEl = document.getElementById('pattern-content');
    
    try {
        patternNameEl.textContent = 'Loading...';
        
        // Find the selected pattern data from our loaded list
        const selectedPattern = window.availablePatterns.find(p => p.filename === patternId);
        
        if (selectedPattern && selectedPattern.source === 'firestore') {
            // Load from Firestore
            console.log('📖 Loading pattern from Firestore:', patternId);
            const docRef = doc(window.db, 'patterns', patternId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error('Pattern not found in Firestore');
            }
            
            const firestoreData = docSnap.data();
            console.log('🔍 Raw Firestore data:', firestoreData);
            
            // Extract pattern data from Firestore document
            window.PATTERN_DATA = {
                metadata: firestoreData.metadata,
                glossary: firestoreData.glossary,
                steps: firestoreData.steps
            };
            
            console.log('🔍 Extracted pattern data:', window.PATTERN_DATA);
            
        } else {
            // Fallback to JSON file loading (for compatibility)
            console.log('📖 Loading pattern from JSON file:', patternId);
            const cacheBust = new Date().getTime();
            const response = await fetch(`/patterns/${patternId}?v=${cacheBust}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            window.PATTERN_DATA = await response.json();
        }
        
        // Generate dynamic CSS for this pattern's categories
        if (window.generatePatternTheme) {
            window.generatePatternTheme(window.PATTERN_DATA);
        }
        
        // Update UI with pattern info
        const name = window.PATTERN_DATA.name || window.PATTERN_DATA.metadata?.name;
        const author = window.PATTERN_DATA.author || window.PATTERN_DATA.metadata?.author;
        const max = window.PATTERN_DATA.metadata?.maxSteps;
        
        patternNameEl.textContent = name;
        patternAuthorEl.textContent = `by ${author}`;
        window.maxSteps = max;
        document.getElementById('current-step-input').max = max;
        
        // Store current pattern ID for progress tracking
        window.currentPatternId = patternId;
        
        // Use project-specific progress key for proper project isolation
        if (window.currentProject && window.currentProject.projectId) {
            window.progressKey = `project-progress-${window.currentProject.projectId}`;
            console.log('📁 Using project-specific progress key:', window.progressKey);
        } else {
            // Fallback to pattern-only for compatibility
            window.progressKey = `pattern-progress-${patternId}`;
            console.log('📄 Using pattern-only progress key (no project selected):', window.progressKey);
        }
        
        // Clear and regenerate content
        patternContentEl.innerHTML = '';
        if (window.generateGlossary) {
            window.generateGlossary(window.PATTERN_DATA);
        }
        if (window.generateInstructions) {
            window.generateInstructions(window.PATTERN_DATA);
        }
        
        // Set up interactive features AFTER pattern content is generated
        if (window.setupInteractiveFeatures) {
            window.setupInteractiveFeatures();
        }
        
        // Load saved progress for this specific project
        if (window.currentProject && window.currentProject.currentStep) {
            window.currentStep = window.currentProject.currentStep;
            console.log('📍 Loaded currentStep from project:', window.currentStep);
        } else {
            // Fallback to localStorage for compatibility
            if (window.loadProgressSimple) {
                window.currentStep = await window.loadProgressSimple(window.progressKey);
                console.log('📍 Loaded currentStep from localStorage:', window.currentStep);
            }
        }
        
        // Ensure currentStep is valid
        if (window.currentStep < 1) window.currentStep = 1;
        if (window.currentStep > max) window.currentStep = max;
        
        // Set up the current step display
        const stepInput = document.getElementById('current-step-input');
        if (stepInput) {
            stepInput.value = window.currentStep;
            stepInput.max = max;
        }
        
        // Update footer metadata immediately after pattern loads
        if (window.updateFooterMetadata) {
            window.updateFooterMetadata();
        }
        
        // Update display and scroll to current row (with timeout to ensure DOM is ready)
        setTimeout(() => {
            if (window.updateDisplay) {
                window.updateDisplay(window.currentStep, true);
                console.log('🎯 Pattern loaded and display updated for step:', window.currentStep);
            }
        }, 100);
        
        const footerControls = document.getElementById('footer-controls');
        if (footerControls) {
            footerControls.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error loading pattern:', error);
        patternNameEl.textContent = 'Error Loading Pattern';
        patternAuthorEl.textContent = '';
        patternContentEl.innerHTML = `<p class="text-center text-red-400">Failed to load pattern: ${error.message}</p>`;
    }
}

export function updateRowNotesList() {
    const rowNotesList = document.getElementById('row-notes-list');
    if (!rowNotesList || !window.currentProject?.notes?.stepNotes) return;
    
    rowNotesList.innerHTML = '';
    
    Object.entries(window.currentProject.notes.stepNotes).forEach(([step, note]) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'p-2 bg-gray-800 rounded text-sm';
        noteDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="font-medium text-violet-300">Row ${step}:</span>
                <button onclick="goToRowWithNote(${step})" class="text-xs text-blue-400 hover:text-blue-300">Go to</button>
            </div>
            <div class="text-gray-300 mt-1">${note}</div>
        `;
        rowNotesList.appendChild(noteDiv);
    });
}

export async function saveAllProjectNotes() {
    if (!window.currentProject || !window.auth.currentUser) return;
    
    const generalNotes = document.getElementById('general-notes')?.value?.trim();
    const yarnInfo = document.getElementById('yarn-info')?.value?.trim();
    const toolInfo = document.getElementById('tool-info')?.value?.trim();
    const modifications = document.getElementById('modifications')?.value?.trim();
    
    try {
        const updateData = {};
        
        if (generalNotes) {
            updateData['notes.general'] = generalNotes;
        }
        
        if (yarnInfo) {
            updateData['projectDetails.yarns'] = [{
                brand: yarnInfo.split(' ')[0] || '',
                colorway: yarnInfo.split(' ').slice(1).join(' ') || '',
                weight: 'DK', // Default
                yardage: null,
                dyelot: null
            }];
        }
        
        if (toolInfo) {
            updateData['projectDetails.tools.needleSize'] = toolInfo;
        }
        
        if (modifications) {
            updateData['projectDetails.modifications'] = modifications.split('\n').filter(m => m.trim());
        }
        
        // Import saveProjectProgress dynamically to avoid circular imports
        const { saveProjectProgress } = await import('./progress-tracking.js');
        await saveProjectProgress(window.db, window.auth.currentUser.uid, window.currentProject.patternId, window.currentProject.projectId, updateData);
        
        alert('All notes saved!');
    } catch (error) {
        console.error('Error saving project notes:', error);
        alert('Error saving notes. Please try again.');
    }
}

export function showSection(sectionName) {
    console.log('📍 Switching to section:', sectionName);
    
    // Hide all main sections
    const viewerSection = document.getElementById('viewer-section');
    const generatorSection = document.getElementById('generator-section');
    const standaloneGenerator = document.getElementById('standalone-generator');
    const appContainer = document.getElementById('app-container');
    
    // Reset visibility
    if (viewerSection) viewerSection.classList.remove('hidden');
    if (generatorSection) generatorSection.classList.add('hidden');
    if (standaloneGenerator) standaloneGenerator.classList.add('hidden');
    
    switch(sectionName) {
        case 'viewer':
            // Default state - viewer section visible, others hidden
            if (appContainer) appContainer.classList.remove('hidden');
            break;
            
        case 'generator':
            // Show standalone generator, hide app container
            if (appContainer) appContainer.classList.add('hidden');
            if (standaloneGenerator) standaloneGenerator.classList.remove('hidden');
            break;
            
        default:
            console.warn('Unknown section:', sectionName);
            break;
    }
    
    // Log analytics
    if (window.auth && window.auth.currentUser && window.db) {
        import('./stitch-witch.js').then(({ logStitchWitchQuery }) => {
            logStitchWitchQuery('navigation', 'section_switch', sectionName);
        });
    }
}

// Expose to global scope
window.loadSelectedPattern = loadSelectedPattern;
window.updateRowNotesList = updateRowNotesList;
window.saveAllProjectNotes = saveAllProjectNotes;
window.showSection = showSection;