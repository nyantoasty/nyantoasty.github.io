# Enhanced User Pattern Progress Schema

## Enhanced Progress Tracking Structure

This document outlines the enhanced user_pattern_progress collection with rich metadata for better analytics and user experience.

### Collection: `user_pattern_progress`

#### Document ID: `{userId}_{patternId}_{projectId}`

```javascript
{
  // Basic identifiers
  userId: "user123",
  patternId: "original_pattern_uuid",
  projectId: "proj_20241002_143052_abc123", // Auto-generated unique ID for this specific project instance
  
  // Core progress tracking
  currentStep: 45,
  totalSteps: 120,
  completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Array of completed step numbers
  
  // Timestamps
  createdAt: timestamp, // When user first started this pattern
  lastUpdated: timestamp, // Last progress update
  completedAt: timestamp | null, // When pattern was finished (null if ongoing)
  
  // Location data (optional, user can enable/disable)
  location: {
    enabled: true, // User preference
    startLocation: {
      city: "Seattle",
      country: "US",
      coordinates: { lat: 47.6062, lng: -122.3321 } // Optional precise location
    },
    progressLocations: [
      {
        step: 25,
        city: "Portland", 
        timestamp: timestamp,
        note: "On vacation!"
      }
    ]
  },
  
  // Project details and customizations
  projectDetails: {
    // Project identification
    projectName: "Mom's Christmas Scarf", // User-given name for this specific project
    purpose: "gift", // gift, personal, commission, sample, teaching
    recipient: "Mom", // Optional recipient if it's a gift
    deadline: timestamp, // Optional completion deadline
    
    // Yarn information
    yarns: [
      {
        brand: "Lion Brand",
        colorway: "Heartland - Sequoia",
        weight: "Worsted",
        fiberContent: "100% Acrylic",
        yardage: 251,
        skeinsUsed: 2,
        notes: "Softer than expected"
      }
    ],
    
    // Tool modifications
    tools: {
      needleSize: "US 8 (5.0mm)",
      originalNeedleSize: "US 7 (4.5mm)", // Pattern recommendation
      hookSize: null, // For crochet patterns
      otherTools: ["stitch markers", "tapestry needle"]
    },
    
    // Pattern modifications
    modifications: [
      {
        step: 23,
        type: "stitch_count", 
        originalInstruction: "k2tog",
        modifiedInstruction: "ssk",
        reason: "Left-leaning decrease preference"
      },
      {
        step: 45,
        type: "size_adjustment",
        description: "Added 10 extra stitches for wider scarf",
        stepsAffected: [45, 46, 47, 48, 49, 50]
      }
    ],
    
    // Size and gauge
    targetSize: {
      width: "8 inches",
      length: "60 inches"
    },
    gauge: {
      stitchesPerInch: 4.5,
      rowsPerInch: 6,
      measuredOn: timestamp
    }
  },
  
  // User notes and journal
  notes: {
    general: "This is my first lace project - going slowly!",
    stepNotes: {
      "15": "This row was tricky - watch the yarn overs",
      "32": "Mistake here - had to rip back 3 rows",
      "67": "Finally getting the rhythm!"
    },
    milestones: [
      {
        step: 30,
        timestamp: timestamp,
        note: "First repeat completed!",
        celebrationType: "milestone" // milestone, completion, problem_solved
      }
    ]
  },
  
  // Visual progress tracking
  images: [
    {
      id: "img_001",
      step: 25,
      timestamp: timestamp,
      url: "gs://bucket/user123/progress_photos/img_001.jpg",
      thumbnailUrl: "gs://bucket/user123/progress_photos/thumbs/img_001.jpg",
      caption: "First 25 rows complete!",
      type: "progress", // progress, problem, finished, detail
      metadata: {
        fileSize: 2458392,
        dimensions: { width: 1920, height: 1080 },
        device: "iPhone 14"
      }
    }
  ],
  
  // Difficulty and experience tracking
  experience: {
    skillLevel: "intermediate", // beginner, intermediate, advanced
    estimatedDifficulty: 7, // 1-10 scale, user's initial assessment
    actualDifficulty: 8, // User's assessment after completion/during work
    timeSpent: {
      totalMinutes: 1440, // 24 hours
      sessionsCount: 12,
      averageSessionLength: 120, // minutes
      longestSession: 240 // minutes
    },
    problemsEncountered: [
      {
        step: 32,
        type: "mistake",
        description: "Dropped stitches",
        resolution: "Picked up stitches and continued",
        timeToResolve: 30 // minutes
      }
    ]
  },
  
  // Analytics and insights
  analytics: {
    // User behavior patterns
    preferredCraftingTimes: ["evening", "weekend"], // morning, afternoon, evening, weekend
    productivityPatterns: {
      averageStepsPerSession: 8.5,
      fastestProgress: {
        steps: 15,
        timeMinutes: 90,
        date: timestamp
      }
    },
    
    // Pattern engagement
    helpRequestsCount: 3,
    stitchFinderUsage: 23, // Times used stitch locator
    glossaryLookups: ["k2tog", "ssk", "yo"], // Most looked up terms
    
    // Sharing and social
    progressShares: 5, // Times shared progress photos/updates
    helpReceived: [
      {
        fromUser: "expert_knitter_jane",
        topic: "fixing dropped stitches",
        timestamp: timestamp
      }
    ]
  },
  
  // Pattern-specific metadata
  patternMetadata: {
    version: "1.2", // Version of pattern when started
    source: "shared", // created, shared, purchased
    sharedBy: "creator_user_id",
    tags: ["lace", "scarf", "intermediate"],
    personalRating: null, // 1-5 stars, set when completed
    wouldRecommend: null, // true/false, set when completed
    publicReview: null // Optional public review text
  },
  
  // Privacy and sharing settings
  privacy: {
    shareProgress: true, // Share with pattern creator/community
    shareLocation: false, // Include location in shared data
    sharePhotos: true, // Allow photos to be shared
    shareAnalytics: true, // Contribute to anonymous pattern analytics
    profileVisibility: "friends" // public, friends, private
  },
  
  // Status and completion
  status: "in_progress", // not_started, in_progress, paused, completed, abandoned
  pausedReason: null, // "too_difficult", "no_time", "materials", "other"
  completionNotes: null, // Set when status becomes "completed"
  
  // Future features preparation
  futureData: {
    aiSuggestions: [], // AI-generated tips based on progress
    communityConnections: [], // Other users working on same pattern
    achievementsUnlocked: [], // Gamification elements
    patternRecommendations: [] // Based on this progress and preferences
  }
}
```

## Enhanced API Functions

### Core Progress Functions

```javascript
// Generate unique project ID
function generateProjectId() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]; // YYYYMMDDHHMMSS
  const random = Math.random().toString(36).substr(2, 6); // 6 random characters
  return `proj_${timestamp}_${random}`;
}

// Enhanced save progress with optional rich data
async function saveUserProgressEnhanced(userId, patternId, projectId, progressData) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const updateData = {
    userId,
    patternId,
    projectId,
    lastUpdated: serverTimestamp(),
    ...progressData
  };
  
  // If this is the first save, set createdAt
  const existing = await db.collection('user_pattern_progress').doc(progressId).get();
  if (!existing.exists) {
    updateData.createdAt = serverTimestamp();
    updateData.status = 'in_progress';
  }
  
  await db.collection('user_pattern_progress').doc(progressId).set(updateData, { merge: true });
}

// Create a new project instance for a pattern
async function createNewProject(userId, patternId, projectName = null, purpose = 'personal') {
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
      recipient: null,
      deadline: null
    },
    privacy: {
      shareProgress: true,
      shareLocation: false,
      sharePhotos: true,
      shareAnalytics: true,
      profileVisibility: 'friends'
    }
  };
  
  await db.collection('user_pattern_progress').doc(progressId).set(initialData);
  return { projectId, progressId };
}

// Get all projects for a user on a specific pattern
async function getUserProjectsForPattern(userId, patternId) {
  const query = db.collection('user_pattern_progress')
    .where('userId', '==', userId)
    .where('patternId', '==', patternId)
    .orderBy('lastUpdated', 'desc');
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Add progress note
async function addProgressNote(userId, patternId, projectId, step, note, type = 'general') {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const updatePath = type === 'general' ? 'notes.general' : `notes.stepNotes.${step}`;
  
  await db.collection('user_pattern_progress').doc(progressId).update({
    [updatePath]: note,
    lastUpdated: serverTimestamp()
  });
}

// Add progress photo
async function addProgressPhoto(userId, patternId, projectId, step, photoFile, caption = '') {
  // Upload to Firebase Storage
  const photoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const photoPath = `progress_photos/${userId}/${patternId}/${projectId}/${photoId}`;
  
  // Upload original and generate thumbnail
  const [originalUrl, thumbnailUrl] = await uploadProgressPhoto(photoFile, photoPath);
  
  const photoData = {
    id: photoId,
    step,
    timestamp: serverTimestamp(),
    url: originalUrl,
    thumbnailUrl,
    caption,
    type: 'progress',
    metadata: {
      fileSize: photoFile.size,
      dimensions: await getImageDimensions(photoFile),
      device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    }
  };
  
  const progressId = `${userId}_${patternId}_${projectId}`;
  await db.collection('user_pattern_progress').doc(progressId).update({
    images: FieldValue.arrayUnion(photoData),
    lastUpdated: serverTimestamp()
  });
  
  return photoData;
}

// Update project details
async function updateProjectDetails(userId, patternId, projectId, details) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  await db.collection('user_pattern_progress').doc(progressId).update({
    projectDetails: details,
    lastUpdated: serverTimestamp()
  });
}

// Track analytics event
async function trackProgressAnalytics(userId, patternId, projectId, event, data = {}) {
  const progressId = `${userId}_${patternId}_${projectId}`;
  const analyticsUpdate = {};
  
  switch(event) {
    case 'stitch_finder_used':
      analyticsUpdate['analytics.stitchFinderUsage'] = FieldValue.increment(1);
      break;
    case 'glossary_lookup':
      analyticsUpdate['analytics.glossaryLookups'] = FieldValue.arrayUnion(data.term);
      break;
    case 'help_request':
      analyticsUpdate['analytics.helpRequestsCount'] = FieldValue.increment(1);
      break;
  }
  
  analyticsUpdate.lastUpdated = serverTimestamp();
  
  await db.collection('user_pattern_progress').doc(progressId).update(analyticsUpdate);
}
```

## Benefits of Enhanced Schema

### For Users

- **Rich Project Documentation**: Complete record of their crafting journey
- **Progress Photos**: Visual timeline of their work
- **Detailed Notes**: Capture yarn choices, modifications, and lessons learned
- **Analytics Insights**: Understand their crafting patterns and productivity
- **Community Features**: Share progress and get help from other crafters

### For Stitch Witch Analytics

- **Detailed Pattern Insights**: See where users struggle, what modifications are common
- **Yarn Compatibility**: Track which yarns work well with patterns
- **Difficulty Validation**: Compare estimated vs actual difficulty ratings
- **Geographic Trends**: Understand regional crafting preferences
- **Engagement Metrics**: Detailed user interaction patterns

### For Pattern Creators

- **Pattern Performance**: Detailed analytics on how their patterns are used
- **Community Feedback**: Rich user reviews and modifications
- **Version Tracking**: See which pattern versions are most successful
- **Support Insights**: Common problems and user solutions