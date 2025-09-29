// firestore-init.js - Client-side Firestore initialization
// Add this to your index.html or run in browser console

async function initializeFirestoreCollections() {
  console.log('Initializing Firestore collections...');
  
  try {
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('Please sign in first');
      return;
    }
    
    const userId = user.uid;
    const db = firebase.firestore();
    
    // 1. Update user document (merge with existing data)
    await db.collection('users').doc(userId).set({
      preferences: {
        defaultCraft: 'knitting',
        displayMode: 'detailed',
        colorTheme: 'default'
      },
      stats: {
        patternsCreated: 0,
        patternsShared: 0,
        patternsReceived: 0
      }
    }, { merge: true }); // This preserves your existing fields
    
    console.log('✅ Updated user document');
    
    // 2. Create sample pattern
    const patternRef = db.collection('patterns').doc();
    const patternId = patternRef.id;
    
    await patternRef.set({
      id: patternId,
      name: 'Test Pattern',
      author: user.displayName || 'Unknown',
      craft: 'knitting',
      difficulty: 'beginner',
      
      createdBy: userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      visibility: 'private',
      
      metadata: {
        maxSteps: 10,
        estimatedTime: '2 hours',
        materials: ['yarn', 'needles']
      },
      
      glossary: {
        'k': { name: 'Knit', description: 'Knit stitch.', stitchIndex: 1 },
        'p': { name: 'Purl', description: 'Purl stitch.', stitchIndex: 1 }
      },
      
      steps: [
        {
          step: 1,
          section: 'Setup',
          startingStitchCount: 10,
          endingStitchCount: 10,
          chunks: [
            {
              id: 'row1-all',
              type: 'static',
              instructions: [
                { stitch: 'k', count: 10 }
              ]
            }
          ]
        }
      ],
      
      shareCount: 0,
      viewCount: 0,
      forkCount: 0,
      tags: ['test'],
      exportCount: 0
    });
    
    console.log('✅ Created pattern:', patternId);
    
    // 3. Create access record
    await db.collection('pattern_access').doc(`${patternId}_${userId}`).set({
      patternId: patternId,
      userId: userId,
      grantedBy: userId,
      permission: 'admin',
      grantedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      shareReason: 'pattern_creator'
    });
    
    console.log('✅ Created access record');
    console.log('🎉 Firestore initialization complete!');
    
    return patternId;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Auto-run when user is signed in
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('User signed in, ready to initialize Firestore');
    // Uncomment to auto-initialize:
    // initializeFirestoreCollections();
  }
});

// Make function available globally
window.initializeFirestoreCollections = initializeFirestoreCollections;