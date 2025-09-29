// firestore-setup.js - Initialize Firestore collections and sample data
// Run with: node firestore-setup.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need your service account key)
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'your-project-id'
});

const db = admin.firestore();

async function setupFirestore() {
  console.log('Setting up Firestore collections...');
  
  try {
    // 1. Create sample user
    const userId = 'sample-user-123';
    await db.collection('users').doc(userId).set({
      email: 'user@example.com',
      displayName: 'John Doe',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'viewer', // Your existing field
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
    });
    console.log('✅ Created sample user');

    // 2. Create sample pattern
    const patternId = 'neon-sky-shawl';
    await db.collection('patterns').doc(patternId).set({
      id: patternId,
      name: 'Neon Sky Shawl',
      author: 'Iris Schreier',
      craft: 'knitting',
      difficulty: 'intermediate',
      
      // Ownership
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      visibility: 'private',
      
      // Pattern data (your existing structure)
      metadata: {
        maxSteps: 117,
        estimatedTime: '20 hours',
        materials: ['worsted weight yarn', 'size 8 needles']
      },
      
      glossary: {
        'k': {
          name: 'Knit',
          description: 'Knit stitch.',
          stitchIndex: 1
        },
        'p': {
          name: 'Purl', 
          description: 'Purl stitch.',
          stitchIndex: 1
        },
        'kfb': {
          name: 'Knit Front and Back',
          description: 'Increase stitch.',
          stitchIndex: 2
        }
      },
      
      steps: [
        {
          step: 1,
          section: 'Setup',
          side: 'rs',
          startingStitchCount: 9,
          endingStitchCount: 11,
          chunks: [
            {
              id: 'setup1-edge-left',
              type: 'static',
              instructions: [
                { stitch: 'k', count: 3 }
              ]
            },
            {
              id: 'setup1-increase',
              type: 'static', 
              instructions: [
                { stitch: 'kfb', count: 1 }
              ]
            }
          ]
        }
        // Add more steps as needed
      ],
      
      // Analytics
      shareCount: 0,
      viewCount: 0,
      forkCount: 0,
      tags: ['shawl', 'lace', 'triangular'],
      exportCount: 0
    });
    console.log('✅ Created sample pattern');

    // 3. Create access record
    await db.collection('pattern_access').doc(`${patternId}_${userId}`).set({
      patternId: patternId,
      userId: userId,
      grantedBy: userId,
      permission: 'admin',
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: null,
      status: 'active',
      shareReason: 'pattern_creator'
    });
    console.log('✅ Created access record');

    // 4. Initialize analytics collections with sample data
    await db.collection('stitch_finder_queries').add({
      userId: userId,
      patternId: patternId,
      step: 5,
      position: 23,
      stitchFound: 'k',
      context: ['k', 'k', 'p', 'p', 'k', 'k', 'k'],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sessionId: 'session-123'
    });
    console.log('✅ Created sample analytics data');

    console.log('\n🎉 Firestore setup complete!');
    console.log('You can now test your pattern viewer with the sample data.');
    
  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
  }
  
  process.exit(0);
}

// Run the setup
setupFirestore();