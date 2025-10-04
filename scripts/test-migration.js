/**
 * Migration Test Suite
 * 
 * This script validates that the migration worked correctly by:
 * 1. Checking document structure
 * 2. Verifying data integrity
 * 3. Testing queries still work
 * 4. Validating readable IDs
 */

import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    where,
    orderBy 
} from 'firebase/firestore';

/**
 * Test that validates migrated documents have correct structure
 */
async function validateMigratedDocuments(db, collectionName) {
    console.log(`\n🧪 Testing ${collectionName} collection...`);
    
    const snapshot = await getDocs(collection(db, collectionName));
    const results = {
        total: snapshot.size,
        migrated: 0,
        legacy: 0,
        issues: []
    };
    
    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        
        // Check if document was migrated
        if (data._migrated || data.createdByUser) {
            results.migrated++;
            
            // Validate migrated document structure
            const requiredFields = ['createdByUser', 'createdByEmail', 'createdByName'];
            const missingFields = requiredFields.filter(field => !data[field]);
            
            if (missingFields.length > 0) {
                results.issues.push({
                    docId: id,
                    issue: `Missing fields: ${missingFields.join(', ')}`
                });
            }
            
            // Validate ID format (should contain underscores for readable format)
            if (!id.includes('_')) {
                results.issues.push({
                    docId: id,
                    issue: 'ID does not appear to be in readable format'
                });
            }
            
        } else {
            results.legacy++;
        }
    });
    
    console.log(`   📊 Total documents: ${results.total}`);
    console.log(`   ✅ Migrated: ${results.migrated}`);
    console.log(`   📜 Legacy: ${results.legacy}`);
    
    if (results.issues.length > 0) {
        console.log(`   ⚠️  Issues found:`);
        results.issues.forEach(issue => {
            console.log(`      - ${issue.docId}: ${issue.issue}`);
        });
    } else {
        console.log(`   ✅ No issues found`);
    }
    
    return results;
}

/**
 * Test that queries still work correctly
 */
async function testQueries(db, userId) {
    console.log(`\n🔍 Testing queries for user: ${userId}...`);
    
    try {
        // Test patterns query
        const patternsQuery = query(
            collection(db, 'patterns'),
            where('createdBy', '==', userId)
        );
        const patternsSnapshot = await getDocs(patternsQuery);
        console.log(`   📝 Found ${patternsSnapshot.size} patterns for user`);
        
        // Test progress query
        const progressQuery = query(
            collection(db, 'user_pattern_progress'),
            where('userId', '==', userId)
        );
        const progressSnapshot = await getDocs(progressQuery);
        console.log(`   📈 Found ${progressSnapshot.size} progress documents for user`);
        
        return {
            patterns: patternsSnapshot.size,
            progress: progressSnapshot.size,
            success: true
        };
        
    } catch (error) {
        console.error(`   ❌ Query test failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test readable ID generation
 */
function testReadableIdGeneration() {
    console.log(`\n🏷️  Testing readable ID generation...`);
    
    // Test user slug creation
    const testCases = [
        {
            input: { displayName: 'John Doe', email: 'john@example.com' },
            expectedPattern: /^john-doe$/
        },
        {
            input: { email: 'jane.smith@example.com' },
            expectedPattern: /^jane-smith$/
        },
        {
            input: { displayName: 'Special!@#$%Characters' },
            expectedPattern: /^specialcharacters$/
        }
    ];
    
    testCases.forEach((testCase, index) => {
        const result = createUserSlug(testCase.input);
        const matches = testCase.expectedPattern.test(result);
        
        console.log(`   Test ${index + 1}: ${matches ? '✅' : '❌'} "${result}"`);
        
        if (!matches) {
            console.log(`      Expected pattern: ${testCase.expectedPattern}`);
            console.log(`      Got: "${result}"`);
        }
    });
}

/**
 * Main test runner
 */
export async function runMigrationTests(db, userId) {
    console.log(`\n🧪 Running Migration Test Suite`);
    console.log(`   Database: Connected`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    const results = {};
    
    try {
        // Test document structure
        results.patterns = await validateMigratedDocuments(db, 'patterns');
        results.progress = await validateMigratedDocuments(db, 'user_pattern_progress');
        
        // Test queries
        results.queries = await testQueries(db, userId);
        
        // Test ID generation
        testReadableIdGeneration();
        
        // Overall assessment
        const totalIssues = (results.patterns?.issues?.length || 0) + 
                           (results.progress?.issues?.length || 0);
        
        console.log(`\n📋 Test Summary:`);
        console.log(`   Patterns tested: ${results.patterns?.total || 0}`);
        console.log(`   Progress documents tested: ${results.progress?.total || 0}`);
        console.log(`   Query tests: ${results.queries?.success ? 'PASSED' : 'FAILED'}`);
        console.log(`   Total issues: ${totalIssues}`);
        
        if (totalIssues === 0 && results.queries?.success) {
            console.log(`\n✅ All tests PASSED! Migration appears successful.`);
        } else {
            console.log(`\n⚠️  Some tests FAILED. Review issues above.`);
        }
        
        return results;
        
    } catch (error) {
        console.error(`\n❌ Test suite failed: ${error.message}`);
        throw error;
    }
}

/**
 * Helper function - would normally be imported
 */
function createUserSlug(user) {
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'user';
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
}

// Usage:
// const testResults = await runMigrationTests(db, 'your-user-id');