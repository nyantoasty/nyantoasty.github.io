// progress-setup.js - Setup script for Firestore progress tracking system
// Version: v2025-10-02-progress-tracking

import { doc, setDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Setup Firestore collections for progress tracking system
 * @param {Object} db - Firestore database instance
 * @param {Object} auth - Firebase auth instance
 */
export async function setupProgressTracking(db = window.db, auth = window.auth) {
    console.log('🚀 Setting up Firestore progress tracking system...');
    
    if (!db) {
        throw new Error('Firestore database not available');
    }
    
    if (!auth?.currentUser) {
        throw new Error('Please sign in first to set up the progress tracking system');
    }
    
    try {
        // Sample user IDs for testing
        const currentUserId = auth.currentUser.uid;
        const user1Id = 'sample-user-001';
        const user2Id = 'sample-user-002';
        
        // Sample pattern ID (will be created by Sea Witch script)
        const patternId = 'sea-witch-tentacle-scarf';
        
        console.log('📝 Creating sample users...');
        
        // 1. Update current user with preferences
        await setDoc(doc(db, 'users', currentUserId), {
            preferences: {
                defaultCraft: 'knitting',
                displayMode: 'detailed',
                colorTheme: 'default'
            },
            stats: {
                patternsCreated: 1,
                patternsShared: 0,
                patternsReceived: 0
            },
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
        // 2. Create sample test users
        await setDoc(doc(db, 'users', user1Id), {
            email: 'testuser1@example.com',
            displayName: 'Test User 1',
            createdAt: serverTimestamp(),
            preferences: {
                defaultCraft: 'knitting',
                displayMode: 'detailed',
                colorTheme: 'default'
            },
            stats: {
                patternsCreated: 0,
                patternsShared: 0,
                patternsReceived: 1
            }
        });
        
        await setDoc(doc(db, 'users', user2Id), {
            email: 'testuser2@example.com',
            displayName: 'Test User 2',
            createdAt: serverTimestamp(),
            preferences: {
                defaultCraft: 'knitting',
                displayMode: 'compact',
                colorTheme: 'dark'
            },
            stats: {
                patternsCreated: 0,
                patternsShared: 0,
                patternsReceived: 1
            }
        });
        
        console.log('✅ Created sample users');
        
        console.log('🔐 Setting up future access permissions...');
        
        // 3. Create access records for when Sea Witch pattern is created
        // (These will reference the pattern that will be created next)
        
        // Test user 1 access (view)
        await setDoc(doc(db, 'pattern_access', `${patternId}_${user1Id}`), {
            patternId,
            userId: user1Id,
            grantedBy: currentUserId,
            permission: 'view',
            grantedAt: serverTimestamp(),
            expiresAt: null,
            status: 'active',
            shareReason: 'shared_by_creator',
            shareMessage: 'Check out this beautiful scarf pattern!'
        });
        
        // Test user 2 access (view)
        await setDoc(doc(db, 'pattern_access', `${patternId}_${user2Id}`), {
            patternId,
            userId: user2Id,
            grantedBy: currentUserId,
            permission: 'view',
            grantedAt: serverTimestamp(),
            expiresAt: null,
            status: 'active',
            shareReason: 'shared_by_creator',
            shareMessage: 'This would be perfect for your skill level!'
        });
        
        console.log('✅ Created access records');
        
        console.log('📊 Setting up sample progress tracking...');
        
        // 4. Create sample progress records for the test users
        // (These will be for the pattern that will be created next)
        
        // Test user 1 progress (just started)
        await setDoc(doc(db, 'user_pattern_progress', `${user1Id}_${patternId}`), {
            userId: user1Id,
            patternId,
            currentStep: 3,
            lastUpdated: serverTimestamp(),
            notes: 'Shared from creator: Using slightly different yarn weight',
            customMarkings: {}
        });
        
        // Test user 2 progress (further along)
        await setDoc(doc(db, 'user_pattern_progress', `${user2Id}_${patternId}`), {
            userId: user2Id,
            patternId,
            currentStep: 18,
            lastUpdated: serverTimestamp(),
            notes: 'Shared from creator: This is perfect for practicing bobbles!',
            customMarkings: {
                'step_13': 'Love these bobbles!'
            }
        });
        
        console.log('✅ Created sample progress records');
        
        console.log('📤 Setting up sharing records...');
        
        // 5. Create sample sharing records
        await setDoc(doc(collection(db, 'pattern_shares')), {
            patternId,
            sharedBy: currentUserId,
            sharedWith: user1Id,
            shareMethod: 'direct',
            sharedAt: serverTimestamp(),
            message: 'Check out this beautiful scarf pattern!',
            permission: 'view',
            accepted: true,
            acceptedAt: serverTimestamp()
        });
        
        await setDoc(doc(collection(db, 'pattern_shares')), {
            patternId,
            sharedBy: currentUserId,
            sharedWith: user2Id,
            shareMethod: 'direct',
            sharedAt: serverTimestamp(),
            message: 'This would be perfect for your skill level!',
            permission: 'view',
            accepted: true,
            acceptedAt: serverTimestamp()
        });
        
        console.log('✅ Created sharing records');
        
        console.log('\n🎉 Progress tracking setup complete!');
        console.log('\n📋 Summary:');
        console.log('  • User preferences and stats updated');
        console.log('  • 2 test users created with different progress levels');
        console.log('  • Access permissions configured for pattern sharing');
        console.log('  • Individual progress tracking records created');
        console.log('  • Sharing workflow demonstrated');
        
        console.log('\n🧪 Test Scenarios Ready:');
        console.log(`  • You (${currentUserId}): Pattern creator`);
        console.log(`  • Test User 1: Step 3 (just started)`);
        console.log(`  • Test User 2: Step 18 (making progress)`);
        
        console.log('\n✨ Next: Sea Witch pattern will be created with individual progress tracking!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up progress tracking:', error);
        throw error;
    }
}

/**
 * Clear existing progress data (for testing)
 */
async function clearProgressData() {
    console.log('🧹 Clearing existing progress data...');
    
    try {
        // Note: In a real setup, you'd want to be more careful about clearing data
        // This is just for development/testing
        
        console.log('⚠️  This would clear existing progress data');
        console.log('   Run clearProgressData() manually if needed');
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
    }
}

// Make functions available globally for console use
window.setupProgressTracking = setupProgressTracking;
window.clearProgressData = clearProgressData;

// Auto-run setup when script loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧶 Progress tracking setup script loaded');
    console.log('📝 Run setupProgressTracking() to initialize Firestore collections');
    console.log('🧹 Run clearProgressData() to clear existing data (if needed)');
});

export { setupProgressTracking, clearProgressData };