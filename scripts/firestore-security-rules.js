// firestore-security-rules.js - Security rules for progress tracking system
// Copy these rules to your Firestore Security Rules in the Firebase Console

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function hasPatternAccess(patternId, permission) {
      return isAuthenticated() && 
             (isAdmin() ||
              (exists(/databases/$(database)/documents/pattern_access/$(patternId + '_' + request.auth.uid)) &&
               get(/databases/$(database)/documents/pattern_access/$(patternId + '_' + request.auth.uid)).data.status == 'active' &&
               get(/databases/$(database)/documents/pattern_access/$(patternId + '_' + request.auth.uid)).data.permission in permission));
    }
    
    function isPatternCreator(patternId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/patterns/$(patternId)).data.createdBy == request.auth.uid;
    }

    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Roles collection - authenticated users can read roles to check permissions
    match /roles/{roleId} {
      allow read: if isAuthenticated();
    }

    // Patterns collection - read based on access, write for creators/editors, admins have full access
    match /patterns/{patternId} {
      allow read: if isAdmin() ||
                     hasPatternAccess(patternId, ['view', 'edit', 'admin']) || 
                     resource.data.visibility == 'public';
      allow write: if isAdmin() ||
                      hasPatternAccess(patternId, ['edit', 'admin']);
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.createdBy;
    }

    // Pattern access - admin can manage, users can read their own access
    match /pattern_access/{accessId} {
      allow read: if isAdmin() ||
                     (isAuthenticated() && 
                      (resource.data.userId == request.auth.uid ||
                       hasPatternAccess(resource.data.patternId, ['admin'])));
      allow write: if isAdmin() ||
                      (isAuthenticated() && 
                       hasPatternAccess(resource.data.patternId, ['admin']));
    }

    // Pattern shares - users can read shares meant for them, creators can create shares
    match /pattern_shares/{shareId} {
      allow read: if isAuthenticated() && 
                     (resource.data.sharedWith == request.auth.uid ||
                      resource.data.sharedBy == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.sharedBy &&
                       hasPatternAccess(request.resource.data.patternId, ['admin', 'edit']);
      allow update: if isAuthenticated() && 
                       resource.data.sharedWith == request.auth.uid &&
                       request.resource.data.keys().hasOnly(['accepted', 'acceptedAt']);
    }

    // User pattern progress - users can only access their own progress, admins can access all
    match /user_pattern_progress/{progressId} {
      allow read, write: if isAdmin() ||
                            (isAuthenticated() && 
                             resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.userId &&
                       (isAdmin() || hasPatternAccess(request.resource.data.patternId, ['view', 'edit', 'admin']));
    }

    // Analytics collections - users can write their own data, admins can read
    match /stitch_finder_queries/{queryId} {
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.userId;
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid ||
                      hasPatternAccess(resource.data.patternId, ['admin']));
    }

    match /navigation_events/{eventId} {
      allow create: if isAuthenticated() && 
                       request.auth.uid == request.resource.data.userId;
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid ||
                      hasPatternAccess(resource.data.patternId, ['admin']));
    }

    match /generator_events/{eventId} {
      allow create, read: if isAuthenticated() && 
                             request.auth.uid == resource.data.userId;
    }

    // Deny all other requests
    match /{document=**} {
      allow read, write: if false;
    }
  }
}