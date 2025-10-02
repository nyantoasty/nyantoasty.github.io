# Pattern Progress Tracking Schema

## Current Issue
- Progress stored in localStorage (device-specific)
- When patterns are shared, progress isn't transferred
- No sync across devices for same user

## Proposed Solution: Firestore-based Progress Tracking

### Collection Structure
```
firestore
├── patterns/                        # Master pattern storage
├── pattern_access/                  # Who can access which patterns
├── user_pattern_progress/           # Individual progress tracking
└── pattern_instances/               # Optional: User-specific pattern copies
```

### Schema Design

#### Option 1: Shared Pattern + Individual Progress (RECOMMENDED)
```javascript
// patterns/{originalPatternId} - Master pattern (unchanged)
{
  id: "original_pattern_uuid",
  name: "Sea Witch Scarf",
  steps: [...],
  // ... all pattern data
}

// user_pattern_progress/{userId}_{patternId}
{
  userId: "user123",
  patternId: "original_pattern_uuid", 
  currentStep: 45,
  lastUpdated: timestamp,
  notes: "Remember to count carefully on bobble rows",
  customMarkings: {
    "step_23": "difficult section",
    "step_67": "repeat from here"
  },
  
  // Optional: User customizations
  personalNotes: "Using different yarn weight",
  modifications: ["Using size 10 needles instead of 8"]
}

// pattern_access/{accessId} - Permission system (unchanged)
{
  patternId: "original_pattern_uuid",
  userId: "user123", 
  permission: "view",
  grantedBy: "original_creator"
}
```

#### Option 2: Pattern Instances (Alternative)
```javascript
// pattern_instances/{userId}_{originalPatternId}
{
  id: "user123_original_pattern_uuid",
  originalPatternId: "original_pattern_uuid",
  userId: "user123",
  
  // Copy of pattern data (can be customized)
  name: "My Sea Witch Scarf",
  steps: [...], // Copy of original or modified
  
  // Progress tracking
  currentStep: 45,
  personalNotes: "Modified for worsted weight",
  
  // Metadata
  sharedFrom: "original_creator_id",
  createdAt: timestamp,
  lastUpdated: timestamp
}
```

## Recommended Implementation: Option 1

**Why Option 1 is better:**
- ✅ Preserves single source of truth for pattern data
- ✅ Efficient storage (no pattern duplication)
- ✅ Pattern updates propagate to all users
- ✅ Clean separation of pattern vs. progress
- ✅ Easier analytics and pattern management

## Updated API Functions

### Progress Management
```javascript
// Save progress for user on specific pattern
async function saveUserProgress(userId, patternId, currentStep, notes = null) {
  const progressId = `${userId}_${patternId}`;
  await db.collection('user_pattern_progress').doc(progressId).set({
    userId,
    patternId,
    currentStep,
    lastUpdated: serverTimestamp(),
    notes
  }, { merge: true });
}

// Load progress for user on specific pattern  
async function loadUserProgress(userId, patternId) {
  const progressId = `${userId}_${patternId}`;
  const doc = await db.collection('user_pattern_progress').doc(progressId).get();
  return doc.exists ? doc.data() : { currentStep: 1 };
}

// Get all patterns with progress for a user
async function getUserPatternsWithProgress(userId) {
  const [patterns, progress] = await Promise.all([
    getUserAccessiblePatterns(userId),
    getUserProgressList(userId)
  ]);
  
  // Merge pattern data with progress
  return patterns.map(pattern => ({
    ...pattern,
    userProgress: progress[pattern.id] || { currentStep: 1 }
  }));
}
```

### Sharing Workflow
```javascript
// When sharing a pattern
async function sharePatternWithProgress(originalPatternId, targetUserId, sharingUserId) {
  // 1. Grant access to original pattern
  await grantPatternAccess(originalPatternId, targetUserId, 'view', sharingUserId);
  
  // 2. Create initial progress record (step 1)
  await saveUserProgress(targetUserId, originalPatternId, 1);
  
  // 3. Optional: Copy sharer's notes (not progress)
  const sharerProgress = await loadUserProgress(sharingUserId, originalPatternId);
  if (sharerProgress.notes) {
    await saveUserProgress(targetUserId, originalPatternId, 1, 
      `Shared notes: ${sharerProgress.notes}`);
  }
}
```

## Migration Strategy

### Phase 1: Add Firestore Progress Tracking
1. Update `saveProgress()` to write to both localStorage AND Firestore
2. Update `loadProgress()` to read from Firestore first, fall back to localStorage
3. Maintain backward compatibility

### Phase 2: Sync Existing Progress
1. Create migration script to upload localStorage progress to Firestore
2. Show users a "Sync Progress" option in UI

### Phase 3: Remove localStorage Dependency
1. Make Firestore the primary source
2. Keep localStorage as backup for offline use

## Benefits

### For Users
- ✅ Progress syncs across devices
- ✅ Progress preserved when patterns are shared
- ✅ Can add personal notes and modifications
- ✅ See progress on all their patterns in one place

### For Developers  
- ✅ Better analytics (know where users get stuck)
- ✅ Can implement features like "continue where you left off"
- ✅ Foundation for collaborative features
- ✅ Easier pattern recommendation based on progress

### For Pattern Sharing
- ✅ Clean separation of pattern vs. user data
- ✅ Multiple users can work on same pattern independently
- ✅ Pattern creators can see aggregate progress analytics
- ✅ Foundation for premium features (progress backup, etc.)