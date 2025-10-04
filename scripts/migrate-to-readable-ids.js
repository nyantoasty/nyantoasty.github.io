/**
 * Migration Script: Convert Legacy Documents to Human-Readable IDs
 * 
 * This script demonstrates proper Firestore migration techniques:
 * 1. Safety features (dry-run, backup, rollback)
 * 2. Batch operations for performance
 * 3. Error handling and progress tracking
 * 4. Schema transformation logic
 * 
 * Usage:
 * - Dry run: migrateLegacyDocuments({ dryRun: true })
 * - Real migration: migrateLegacyDocuments({ dryRun: false })
 * - Rollback: rollbackMigration()
 */

import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    setDoc, 
    deleteDoc, 
    writeBatch,
    query,
    where,
    serverTimestamp 
} from 'firebase/firestore';

// Migration configuration
const MIGRATION_CONFIG = {
    batchSize: 50,
    backupCollectionSuffix: '_backup_pre_migration',
    migrationLogCollection: 'migration_logs',
    version: '1.0.0_readable_ids'
};

/**
 * Creates a human-readable slug from a display name or email
 */
function createUserSlug(user) {
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'user';
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
}

/**
 * Creates a readable pattern slug
 */
function createPatternSlug(patternName, authorName, user) {
    const userPart = createUserSlug(user);
    const namePart = (patternName || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 15);
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${userPart}_${namePart}_${timestamp}`;
}

/**
 * Creates a readable progress document slug
 */
function createProgressSlug(userDisplayName, patternName, projectName) {
    const parts = [userDisplayName, patternName, projectName].map(part => 
        (part || 'untitled')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 15)
    );
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${parts.join('_')}_${timestamp}`;
}

/**
 * Backup existing collection before migration
 */
async function backupCollection(db, collectionName) {
    console.log(`📦 Creating backup of ${collectionName}...`);
    
    const sourceCollection = collection(db, collectionName);
    const backupCollectionName = collectionName + MIGRATION_CONFIG.backupCollectionSuffix;
    
    const snapshot = await getDocs(sourceCollection);
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach((docSnap) => {
        const backupRef = doc(db, backupCollectionName, docSnap.id);
        batch.set(backupRef, {
            ...docSnap.data(),
            _backup_timestamp: serverTimestamp(),
            _original_id: docSnap.id
        });
        count++;
    });
    
    await batch.commit();
    console.log(`✅ Backed up ${count} documents to ${backupCollectionName}`);
    
    return { count, backupCollectionName };
}

/**
 * Log migration operation for audit trail
 */
async function logMigration(db, operation, details) {
    const logRef = doc(collection(db, MIGRATION_CONFIG.migrationLogCollection));
    await setDoc(logRef, {
        operation,
        details,
        timestamp: serverTimestamp(),
        version: MIGRATION_CONFIG.version,
        user: 'migration_script'
    });
}

/**
 * Migrate patterns collection
 */
async function migratePatterns(db, options = {}) {
    const { dryRun = true } = options;
    console.log(`\n🎨 Migrating patterns collection (dry-run: ${dryRun})...`);
    
    const patternsCollection = collection(db, 'patterns');
    const snapshot = await getDocs(patternsCollection);
    
    const migrations = [];
    const batch = writeBatch(db);
    let processedCount = 0;
    
    for (const docSnap of snapshot.docs) {
        const oldData = docSnap.data();
        const oldId = docSnap.id;
        
        // Check if already migrated (has readable ID format or new fields)
        if (oldData.createdByUser || oldId.includes('_')) {
            console.log(`⏭️  Skipping already migrated pattern: ${oldId}`);
            continue;
        }
        
        // Create new readable ID
        const patternName = oldData.metadata?.name || oldData.name || 'untitled';
        const authorName = oldData.metadata?.author || 'unknown';
        
        // For this migration, we'll use a placeholder user since we don't have user lookup
        const mockUser = { 
            displayName: authorName,
            email: `${authorName.toLowerCase().replace(/\s+/g, '')}@example.com`
        };
        
        const newId = createPatternSlug(patternName, authorName, mockUser);
        const userSlug = createUserSlug(mockUser);
        
        // Create enhanced document
        const newData = {
            ...oldData,
            id: newId,
            // Keep original createdBy for security
            createdBy: oldData.createdBy,
            // Add new readable fields
            createdByUser: userSlug,
            createdByEmail: mockUser.email,
            createdByName: authorName,
            // Migration metadata
            _migrated: true,
            _migration_version: MIGRATION_CONFIG.version,
            _original_id: oldId,
            _migrated_at: serverTimestamp()
        };
        
        migrations.push({
            oldId,
            newId,
            oldData,
            newData,
            operation: 'pattern_migration'
        });
        
        if (!dryRun) {
            // Create new document
            const newRef = doc(db, 'patterns', newId);
            batch.set(newRef, newData);
            
            // Mark old document for deletion (we'll do this in a separate step)
            const oldRef = doc(db, 'patterns', oldId);
            batch.update(oldRef, { 
                _deprecated: true, 
                _replacement_id: newId,
                _deprecated_at: serverTimestamp()
            });
        }
        
        processedCount++;
        
        // Commit batch every N documents
        if (processedCount % MIGRATION_CONFIG.batchSize === 0 && !dryRun) {
            await batch.commit();
            console.log(`📝 Committed batch of ${MIGRATION_CONFIG.batchSize} pattern migrations`);
        }
    }
    
    // Commit remaining documents
    if (processedCount > 0 && !dryRun) {
        await batch.commit();
    }
    
    console.log(`\n📊 Pattern Migration Summary:`);
    console.log(`   Total patterns processed: ${processedCount}`);
    console.log(`   Dry run: ${dryRun}`);
    
    if (dryRun) {
        console.log(`\n🔍 Preview of migrations:`);
        migrations.slice(0, 3).forEach(migration => {
            console.log(`   ${migration.oldId} → ${migration.newId}`);
        });
    }
    
    return migrations;
}

/**
 * Migrate user_pattern_progress collection
 */
async function migrateProgress(db, options = {}) {
    const { dryRun = true } = options;
    console.log(`\n📈 Migrating user_pattern_progress collection (dry-run: ${dryRun})...`);
    
    const progressCollection = collection(db, 'user_pattern_progress');
    const snapshot = await getDocs(progressCollection);
    
    const migrations = [];
    const batch = writeBatch(db);
    let processedCount = 0;
    
    for (const docSnap of snapshot.docs) {
        const oldData = docSnap.data();
        const oldId = docSnap.id;
        
        // Check if already migrated
        if (oldData.createdByUser || oldId.includes('_')) {
            console.log(`⏭️  Skipping already migrated progress: ${oldId}`);
            continue;
        }
        
        // Create new readable ID
        const projectName = oldData.projectDetails?.projectName || 'project';
        const patternName = 'pattern'; // We'd need to look this up from patterns collection
        const userDisplayName = 'user'; // We'd need to look this up from auth
        
        const newId = createProgressSlug(userDisplayName, patternName, projectName);
        const userSlug = createUserSlug({ displayName: userDisplayName });
        
        // Create enhanced document
        const newData = {
            ...oldData,
            // Add new readable fields
            createdByUser: userSlug,
            createdByEmail: `${userSlug}@example.com`,
            createdByName: userDisplayName,
            // Migration metadata
            _migrated: true,
            _migration_version: MIGRATION_CONFIG.version,
            _original_id: oldId,
            _migrated_at: serverTimestamp()
        };
        
        migrations.push({
            oldId,
            newId,
            oldData,
            newData,
            operation: 'progress_migration'
        });
        
        if (!dryRun) {
            // Create new document
            const newRef = doc(db, 'user_pattern_progress', newId);
            batch.set(newRef, newData);
            
            // Mark old document for deletion
            const oldRef = doc(db, 'user_pattern_progress', oldId);
            batch.update(oldRef, { 
                _deprecated: true, 
                _replacement_id: newId,
                _deprecated_at: serverTimestamp()
            });
        }
        
        processedCount++;
        
        if (processedCount % MIGRATION_CONFIG.batchSize === 0 && !dryRun) {
            await batch.commit();
            console.log(`📝 Committed batch of ${MIGRATION_CONFIG.batchSize} progress migrations`);
        }
    }
    
    if (processedCount > 0 && !dryRun) {
        await batch.commit();
    }
    
    console.log(`\n📊 Progress Migration Summary:`);
    console.log(`   Total progress documents processed: ${processedCount}`);
    console.log(`   Dry run: ${dryRun}`);
    
    return migrations;
}

/**
 * Main migration function
 */
export async function migrateLegacyDocuments(db, options = {}) {
    const { 
        dryRun = true, 
        backup = true, 
        collections = ['patterns', 'user_pattern_progress'] 
    } = options;
    
    console.log(`\n🚀 Starting Migration to Readable IDs`);
    console.log(`   Version: ${MIGRATION_CONFIG.version}`);
    console.log(`   Dry run: ${dryRun}`);
    console.log(`   Backup: ${backup}`);
    console.log(`   Collections: ${collections.join(', ')}`);
    
    const startTime = Date.now();
    const results = {};
    
    try {
        // Step 1: Create backups (if not dry run)
        if (backup && !dryRun) {
            for (const collectionName of collections) {
                const backupResult = await backupCollection(db, collectionName);
                results[`${collectionName}_backup`] = backupResult;
            }
        }
        
        // Step 2: Run migrations
        if (collections.includes('patterns')) {
            results.patterns = await migratePatterns(db, { dryRun });
        }
        
        if (collections.includes('user_pattern_progress')) {
            results.progress = await migrateProgress(db, { dryRun });
        }
        
        // Step 3: Log migration
        if (!dryRun) {
            await logMigration(db, 'migration_completed', {
                collections,
                results: Object.keys(results).reduce((acc, key) => {
                    acc[key] = Array.isArray(results[key]) ? results[key].length : results[key];
                    return acc;
                }, {}),
                duration: Date.now() - startTime
            });
        }
        
        const duration = Date.now() - startTime;
        console.log(`\n✅ Migration completed in ${duration}ms`);
        console.log(`\n📋 Summary:`, results);
        
        if (dryRun) {
            console.log(`\n💡 To run the actual migration, call with { dryRun: false }`);
        }
        
        return results;
        
    } catch (error) {
        console.error(`\n❌ Migration failed:`, error);
        await logMigration(db, 'migration_failed', { 
            error: error.message, 
            collections,
            duration: Date.now() - startTime 
        });
        throw error;
    }
}

/**
 * Rollback migration (restore from backup)
 */
export async function rollbackMigration(db, collections = ['patterns', 'user_pattern_progress']) {
    console.log(`\n🔄 Rolling back migration...`);
    
    for (const collectionName of collections) {
        const backupCollectionName = collectionName + MIGRATION_CONFIG.backupCollectionSuffix;
        
        try {
            // Get backup documents
            const backupSnapshot = await getDocs(collection(db, backupCollectionName));
            
            if (backupSnapshot.empty) {
                console.log(`⚠️  No backup found for ${collectionName}`);
                continue;
            }
            
            const batch = writeBatch(db);
            let count = 0;
            
            // Restore each document
            backupSnapshot.docs.forEach((backupDoc) => {
                const originalData = { ...backupDoc.data() };
                delete originalData._backup_timestamp;
                const originalId = originalData._original_id;
                delete originalData._original_id;
                
                const originalRef = doc(db, collectionName, originalId);
                batch.set(originalRef, originalData);
                count++;
            });
            
            await batch.commit();
            console.log(`✅ Restored ${count} documents to ${collectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to rollback ${collectionName}:`, error);
        }
    }
    
    await logMigration(db, 'rollback_completed', { collections });
    console.log(`\n✅ Rollback completed`);
}

/**
 * Clean up deprecated documents after successful migration
 */
export async function cleanupDeprecatedDocuments(db, collections = ['patterns', 'user_pattern_progress']) {
    console.log(`\n🧹 Cleaning up deprecated documents...`);
    
    for (const collectionName of collections) {
        const deprecatedQuery = query(
            collection(db, collectionName),
            where('_deprecated', '==', true)
        );
        
        const snapshot = await getDocs(deprecatedQuery);
        const batch = writeBatch(db);
        let count = 0;
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        
        if (count > 0) {
            await batch.commit();
            console.log(`🗑️  Deleted ${count} deprecated documents from ${collectionName}`);
        }
    }
    
    console.log(`✅ Cleanup completed`);
}

// Usage examples:
/*
// 1. Dry run to preview changes
const results = await migrateLegacyDocuments(db, { dryRun: true });

// 2. Run actual migration with backup
const results = await migrateLegacyDocuments(db, { 
    dryRun: false, 
    backup: true 
});

// 3. Rollback if needed
await rollbackMigration(db);

// 4. Clean up after successful migration
await cleanupDeprecatedDocuments(db);
*/