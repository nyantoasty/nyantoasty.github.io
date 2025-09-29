# Firestore Schema v2.0 - Pattern Storage with Sharing

## Overview

This schema supports:
- Pattern storage and management
- User-to-user pattern sharing
- Permission-based access control
- Analytics and usage tracking
- Export capabilities

## Collection Structure

```
firestore
├── users/                           # User profiles and preferences
├── patterns/                        # All patterns (shared storage)
├── pattern_access/                  # Permission management
├── pattern_shares/                  # Sharing requests and history
├── stitch_finder_queries/          # Analytics (existing)
├── navigation_events/              # Analytics (existing)
└── generator_events/               # Analytics (existing)
```

## Detailed Schema

### 1. users/{userId}
```javascript
{
  email: "user@example.com",
  displayName: "Jane Crafter",
  createdAt: timestamp,
  lastLoginAt: timestamp,
  preferences: {
    defaultCraft: "knitting",        // knitting, crochet, etc.
    displayMode: "detailed",         // detailed, compact
    colorTheme: "default"
  },
  stats: {
    patternsCreated: 5,
    patternsShared: 2,
    patternsReceived: 8
  }
}
```

### 2. patterns/{patternId}
**Core pattern storage - this is where the actual pattern data lives**
```javascript
{
  // Metadata
  id: "pattern_uuid",
  name: "Neon Sky Shawl",
  author: "Iris Schreier",
  craft: "knitting",
  difficulty: "intermediate",         // beginner, intermediate, advanced
  
  // Ownership and sharing
  createdBy: "userId_who_created",
  createdAt: timestamp,
  updatedAt: timestamp,
  visibility: "private",              // private, shared, public
  
  // Pattern structure (our existing format)
  metadata: {
    maxSteps: 117,
    estimatedTime: "20 hours",
    materials: ["worsted weight yarn", "size 8 needles"]
  },
  glossary: {
    "k": {
      "name": "Knit",
      "description": "Knit stitch.",
      "stitchIndex": 1
    }
    // ... rest of glossary
  },
  steps: [
    // Our existing step format with chunks
  ],
  
  // Sharing and analytics
  shareCount: 0,
  viewCount: 0,
  forkCount: 0,                       // How many times pattern was copied/modified
  tags: ["shawl", "lace", "triangular"],
  
  // Export tracking
  lastExportedAt: timestamp,
  exportCount: 3
}
```

### 3. pattern_access/{accessId}
**Manages who can access which patterns**
```javascript
{
  patternId: "pattern_uuid",
  userId: "user_who_has_access",
  grantedBy: "user_who_granted_access",
  permission: "view",                 // view, edit, admin
  grantedAt: timestamp,
  expiresAt: null,                    // null = no expiration
  status: "active",                   // active, revoked, expired
  
  // Sharing context
  shareReason: "shared_by_creator",   // shared_by_creator, public_pattern, forked
  shareMessage: "Check out this beautiful shawl pattern!"
}
```

### 4. pattern_shares/{shareId}
**Tracks sharing activity and requests**
```javascript
{
  patternId: "pattern_uuid",
  sharedBy: "userId_sharing",
  sharedWith: "userId_receiving",     // null for public shares
  shareMethod: "direct",              // direct, public_link, export
  sharedAt: timestamp,
  
  // Share details
  message: "I thought you'd love this pattern!",
  permission: "view",
  accepted: true,
  acceptedAt: timestamp,
  
  // Analytics
  viewedAt: timestamp,
  downloadedAt: timestamp
}
```

## Access Control Logic

### Pattern Visibility Levels:
1. **private** - Only creator can access
2. **shared** - Creator + users in pattern_access collection
3. **public** - Anyone can view (read-only)

### Permission Types:
1. **view** - Can view and export pattern
2. **edit** - Can modify pattern (creates new version)
3. **admin** - Can share pattern and manage permissions

## API Functions for Sharing

### Core Pattern Operations
```javascript
// Create pattern (Firestore integration)
async function createPattern(patternData, userId)

// Get user's patterns
async function getUserPatterns(userId)

// Get pattern with permissions check
async function getPattern(patternId, userId)

// Update pattern (with permission check)
async function updatePattern(patternId, updates, userId)
```

### Sharing Operations
```javascript
// Share pattern with specific user
async function sharePattern(patternId, targetUserId, permission, message, sharingUserId)

// Make pattern public
async function makePatternPublic(patternId, userId)

// Get patterns shared with user
async function getSharedPatterns(userId)

// Accept/decline pattern share
async function respondToShare(shareId, accepted, userId)

// Revoke access to pattern
async function revokeAccess(patternId, targetUserId, userId)
```

### Export Operations
```javascript
// Export pattern as JSON with comments
async function exportPattern(patternId, userId, includeComments = true)

// Fork pattern (create copy)
async function forkPattern(patternId, newName, userId)
```

## Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pattern access control
    match /patterns/{patternId} {
      allow read: if hasPatternAccess(patternId, request.auth.uid);
      allow write: if hasPatternPermission(patternId, request.auth.uid, 'edit');
      allow create: if request.auth != null;
    }
    
    // Pattern access records
    match /pattern_access/{accessId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.grantedBy == request.auth.uid);
      allow write: if request.auth != null && 
        hasPatternPermission(resource.data.patternId, request.auth.uid, 'admin');
    }
    
    // Helper functions
    function hasPatternAccess(patternId, userId) {
      return exists(/databases/$(database)/documents/pattern_access/$(patternId + '_' + userId)) ||
             get(/databases/$(database)/documents/patterns/$(patternId)).data.visibility == 'public' ||
             get(/databases/$(database)/documents/patterns/$(patternId)).data.createdBy == userId;
    }
  }
}
```

## Implementation Strategy

### Phase 1: Basic Pattern Storage
1. Update Generator to create Firestore write operations
2. Update pattern viewer to load from Firestore
3. Add pattern management UI (list, create, delete)

### Phase 2: Sharing Features
1. Implement sharing UI and permissions
2. Add pattern discovery (public patterns)
3. Create sharing notifications

### Phase 3: Advanced Features
1. Pattern forking and versions
2. Collaborative editing
3. Pattern collections/folders

## Benefits for Future Sharing

✅ **Clean separation** - Patterns and permissions are separate
✅ **Granular control** - Different permission levels
✅ **Audit trail** - Complete sharing history
✅ **Scalable** - Supports millions of patterns and users
✅ **Flexible** - Easy to add new sharing methods
✅ **Analytics ready** - Built-in usage tracking

This schema will handle everything from private patterns to large-scale pattern sharing communities!