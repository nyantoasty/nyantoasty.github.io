/**/**

 * Fresh Start Migration Script: Clean Slate for Enhanced Schema * Fresh Start Migration Script: Clean Slate for Enhanced Schema

 *  * 

 * This script provides a clean slate approach for implementing the enhanced * This script provides a clean slate approach for implementing the enhanced

 * LogicGuide schema with human-readable document IDs. * LogicGuide schema with human-readable document IDs.

 *  * 

 * What it does: * What it does:

 * 1. Backs up existing patterns and user_pattern_progress data * 1. Backs up existing patterns and user_pattern_progress data

 * 2. Clears these collections for fresh start * 2. Clears these collections for fresh start

 * 3. Sets up new enhanced schema structure * 3. Sets up new enhanced schema structure

 * 4. Creates sample data to validate the new schema * 4. Creates sample data to validate the new schema

 *  * 

 * Usage: * Usage:

 * - Dry run: freshStart({ dryRun: true }) * - Dry run: freshStart({ dryRun: true })

 * - Real clean slate: freshStart({ dryRun: false }) * - Real clean slate: freshStart({ dryRun: false })

 */ */\n\nimport { \n    collection, \n    getDocs, \n    doc, \n    setDoc, \n    deleteDoc, \n    writeBatch,\n    query,\n    serverTimestamp \n} from 'firebase/firestore';\n\n// Fresh start configuration\nconst FRESH_START_CONFIG = {\n    batchSize: 50,\n    backupCollectionSuffix: '_backup_before_fresh_start',\n    version: '2.0.0_enhanced_schema'\n};\n\n/**\n * Creates human-readable document IDs\n */\nfunction createHumanReadableIds() {\n    return {\n        // Pattern ID: author-name_pattern-name\n        createPatternId: (author, name) => {\n            const authorSlug = author.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);\n            const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 25);\n            return `${authorSlug}_${nameSlug}`;\n        },\n        \n        // Project ID: user-name_pattern-name_project-name\n        createProjectId: (userName, patternName, projectName) => {\n            const userSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);\n            const patternSlug = patternName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);\n            const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);\n            return `${userSlug}_${patternSlug}_${projectSlug}`;\n        },\n        \n        // User ID: use existing Firebase Auth UID (already human-debuggable)\n        // Access ID: pattern-id_user-id\n        createAccessId: (patternId, userId) => `${patternId}_${userId}`,\n        \n        // Share ID: timestamp_from-user_to-user\n        createShareId: (fromUserId, toUserId) => {\n            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');\n            return `${timestamp}_${fromUserId.substring(0, 8)}_${toUserId.substring(0, 8)}`;\n        }\n    };\n}\n\n/**\n * Sample enhanced pattern data using the new LogicGuide schema\n */\nfunction createSampleEnhancedPattern() {\n    const idHelper = createHumanReadableIds();\n    const patternId = idHelper.createPatternId('iris-schreier', 'neon-sky-shawl');\n    \n    return {\n        id: patternId,\n        \n        // Basic metadata (enhanced)\n        name: \"Neon Sky Shawl\",\n        author: \"Iris Schreier\",\n        craft: \"knitting\",\n        category: \"shawl\",\n        difficulty: \"intermediate\",\n        \n        // Ownership and sharing\n        createdBy: \"sample_user_id\",\n        createdAt: serverTimestamp(),\n        updatedAt: serverTimestamp(),\n        visibility: \"public\", // Make sample pattern public for testing\n        \n        // Enhanced pattern structure (NEW - from LogicGuide)\n        metadata: {\n            maxSteps: 117,\n            estimatedTime: \"20 hours\",\n            description: \"A delicate triangular shawl featuring elegant increases and intricate lace patterns.\",\n            tags: [\"shawl\", \"lace\", \"triangular\", \"fingering-weight\"],\n            language: \"en\",\n            version: \"1.0\",\n            copyright: \"© 2024 Iris Schreier. All rights reserved.\",\n            patternSource: \"https://example.com/neon-sky-shawl\",\n            pdfUrl: null\n        },\n        \n        // Materials specification (NEW)\n        materials: {\n            yarn: {\n                primary: {\n                    brand: \"Malabrigo\",\n                    name: \"Sock Yarn\",\n                    weight: \"fingering\",\n                    weightCode: \"1\",\n                    fiber: \"100% Superwash Merino Wool\",\n                    yardageNeeded: 350,\n                    substitutionNotes: \"Any fingering weight yarn with good drape\"\n                },\n                contrast: null\n            },\n            needles: {\n                primary: {\n                    size: \"US 6\",\n                    sizeMetric: \"4.0mm\",\n                    type: \"circular\",\n                    length: \"32 inches\"\n                }\n            },\n            notions: [\n                {\n                    item: \"stitch markers\",\n                    quantity: 8,\n                    essential: true\n                },\n                {\n                    item: \"tapestry needle\", \n                    quantity: 1,\n                    essential: true\n                }\n            ]\n        },\n        \n        // Gauge specification (NEW)\n        gauge: {\n            stitchesPerInch: 5.5,\n            rowsPerInch: 7.5,\n            stitchesIn4Inches: 22,\n            rowsIn4Inches: 30,\n            needleSize: \"US 6 (4.0mm)\",\n            stitch: \"stockinette stitch\",\n            afterBlocking: true,\n            notes: \"Gauge is measured after blocking. Lace patterns will open up significantly.\"\n        },\n        \n        // Multi-size support (NEW) - Single size for this example\n        sizing: {\n            type: \"single-size\",\n            sizes: [\"one-size\"],\n            dimensions: {\n                wingspan: [\"60 inches\"],\n                depth: [\"24 inches\"]\n            }\n        },\n        \n        // Colorwork specification (NEW)\n        colorwork: {\n            type: \"single-color\",\n            numberOfColors: 1,\n            palettes: [\n                {\n                    id: \"p1\",\n                    name: \"Main Color Only\",\n                    yarns: [\n                        {\"colorId\": \"MC\", \"strands\": 1, \"dominant\": true}\n                    ]\n                }\n            ],\n            colorMap: {\n                \"MC\": {\n                    \"name\": \"Main Color\",\n                    \"colorCode\": null,\n                    \"yarnDetails\": {\n                        \"brand\": \"Malabrigo\",\n                        \"colorway\": \"Your Choice\"\n                    }\n                }\n            }\n        },\n        \n        // Visual resources (NEW)\n        images: [],\n        charts: [],\n        \n        // Enhanced glossary (NEW)\n        glossary: {\n            \"k\": {\n                \"name\": \"Knit\",\n                \"description\": \"Insert right needle through front of stitch, wrap yarn, pull through.\",\n                \"stitchesUsed\": 1,\n                \"stitchesCreated\": 1,\n                \"videoUrl\": null\n            },\n            \"yo\": {\n                \"name\": \"Yarn Over\",\n                \"description\": \"Wrap yarn over right needle to create an increase and hole.\",\n                \"stitchesUsed\": 0,\n                \"stitchesCreated\": 1,\n                \"videoUrl\": null\n            },\n            \"k2tog\": {\n                \"name\": \"Knit 2 Together\",\n                \"description\": \"Insert needle through 2 stitches, knit them together.\",\n                \"stitchesUsed\": 2,\n                \"stitchesCreated\": 1,\n                \"videoUrl\": null\n            }\n        },\n        \n        // Sample steps (NEW enhanced format)\n        steps: [\n            {\n                step: 1,\n                instruction: \"Cast on 3 stitches\",\n                startingStitchCount: [0],\n                endingStitchCount: [3],\n                section: \"setup\",\n                type: \"specialInstruction\",\n                side: null,\n                paletteId: \"p1\",\n                chartReference: null,\n                notes: \"Use long-tail cast on for best results\",\n                sizeVariables: {},\n                resolvedInstructions: {\n                    \"one-size\": \"Cast on 3 stitches\"\n                }\n            },\n            {\n                step: 2,\n                instruction: \"Row 1 (RS): k1, yo, k1, yo, k1\",\n                startingStitchCount: [3],\n                endingStitchCount: [5],\n                section: \"setup\",\n                type: \"regular\",\n                side: \"RS\",\n                paletteId: \"p1\",\n                chartReference: null,\n                notes: \"First increase row\",\n                sizeVariables: {},\n                resolvedInstructions: {\n                    \"one-size\": \"Row 1 (RS): k1, yo, k1, yo, k1\"\n                }\n            },\n            {\n                step: 3,\n                instruction: \"Row 2 (WS): k1, p3, k1\",\n                startingStitchCount: [5],\n                endingStitchCount: [5],\n                section: \"setup\",\n                type: \"regular\",\n                side: \"WS\",\n                paletteId: \"p1\",\n                chartReference: null,\n                notes: \"Work yarn overs as regular stitches\",\n                sizeVariables: {},\n                resolvedInstructions: {\n                    \"one-size\": \"Row 2 (WS): k1, p3, k1\"\n                }\n            }\n        ],\n        \n        // Additional resources (NEW)\n        resources: {\n            video: null,\n            errata: null,\n            support: \"mailto:support@example.com\"\n        },\n        \n        // Designer notes (NEW)\n        notes: {\n            general: \"This is a sample pattern to demonstrate the enhanced schema\",\n            designNotes: \"Created as a test pattern for the new system\",\n            modifications: \"Feel free to modify as needed for testing\"\n        },\n        \n        // Sharing and analytics\n        shareCount: 0,\n        viewCount: 0,\n        forkCount: 0,\n        \n        // Export tracking\n        lastExportedAt: null,\n        exportCount: 0\n    };\n}\n\n/**\n * Sample user project data using enhanced progress schema\n */\nfunction createSampleUserProject(userId, patternId) {\n    const idHelper = createHumanReadableIds();\n    const projectId = idHelper.createProjectId('sample-user', 'neon-sky-shawl', 'first-attempt');\n    \n    return {\n        // Basic identifiers\n        userId: userId,\n        patternId: patternId,\n        projectId: projectId,\n        \n        // Core progress tracking\n        currentStep: 1,\n        totalSteps: 3,\n        completedSteps: [],\n        \n        // Timestamps\n        createdAt: serverTimestamp(),\n        lastUpdated: serverTimestamp(),\n        completedAt: null,\n        \n        // Size selection (for single-size patterns)\n        sizeSelection: {\n            selectedSize: \"one-size\",\n            sizeIndex: 0,\n            sizeLockedAt: serverTimestamp(),\n            allowSizeChange: false,\n            sizeNotes: \"Single size pattern\"\n        },\n        \n        // Current step details\n        currentStepDetails: {\n            stepNumber: 1,\n            instruction: \"Cast on 3 stitches\",\n            resolvedInstruction: \"Cast on 3 stitches\",\n            section: \"setup\",\n            side: null,\n            type: \"specialInstruction\",\n            expectedStitchCount: {\n                starting: 0,\n                ending: 3\n            },\n            actualStitchCount: null\n        },\n        \n        // Colorwork state\n        colorworkState: {\n            isColorworkPattern: false,\n            currentPalette: \"p1\",\n            colorTransitions: [],\n            yarnManagement: {\n                activeYarns: [\"MC\"],\n                yarnSupply: {}\n            }\n        },\n        \n        // Project details and actual materials\n        projectDetails: {\n            projectName: \"My First Enhanced Schema Test\",\n            purpose: \"testing\",\n            recipient: null,\n            deadline: null,\n            \n            // User's actual yarns\n            yarns: [\n                {\n                    brand: \"Test Brand\",\n                    colorway: \"Sample Color\",\n                    weight: \"fingering\",\n                    fiberContent: \"100% Test Fiber\",\n                    yardage: 400,\n                    skeinsUsed: 1,\n                    cost: 25.00,\n                    purchaseLocation: \"Test Shop\",\n                    notes: \"Perfect for testing the new schema\",\n                    addedAt: serverTimestamp()\n                }\n            ],\n            \n            // User's actual tools\n            tools: {\n                needleSize: \"US 6\",\n                originalNeedleSize: \"US 6\",\n                needleBrand: \"Test Brand\",\n                needleType: \"circular\",\n                otherTools: [\"stitch markers\", \"tapestry needle\"]\n            },\n            \n            // User's measured gauge\n            actualGauge: null // Will be filled when user measures\n        },\n        \n        // User notes and journey\n        notes: {\n            general: \"Testing the new enhanced schema - looking good so far!\",\n            stepNotes: {},\n            milestones: []\n        },\n        \n        // Progress images\n        progressImages: [],\n        \n        // Section progress\n        sectionProgress: {\n            setup: {\n                completed: false,\n                startedAt: serverTimestamp(),\n                stepRange: [1, 3],\n                currentStep: 1\n            }\n        },\n        \n        // Chart progress (empty for this pattern)\n        chartProgress: {},\n        \n        // Analytics\n        analytics: {\n            timeSpent: {\n                totalMinutes: 0,\n                sessionsCount: 1,\n                averageSessionLength: 0,\n                longestSession: 0\n            },\n            problemsEncountered: [],\n            helpRequestsCount: 0,\n            stitchFinderUsage: 0,\n            glossaryLookups: []\n        },\n        \n        // Pattern metadata\n        patternMetadata: {\n            version: \"1.0\",\n            source: \"created\",\n            sharedBy: null,\n            personalRating: null,\n            wouldRecommend: null\n        },\n        \n        // Status\n        status: \"not_started\",\n        pausedReason: null,\n        completionNotes: null\n    };\n}\n\n/**\n * Backup existing collections before clean slate\n */\nasync function backupExistingData(db, options = {}) {\n    const { log = console.log } = options;\n    const results = { backed_up: 0, errors: [] };\n    \n    try {\n        // Backup patterns collection\n        log('📦 Backing up existing patterns...');\n        const patternsSnapshot = await getDocs(collection(db, 'patterns'));\n        const patternsBackup = collection(db, `patterns${FRESH_START_CONFIG.backupCollectionSuffix}`);\n        \n        const patternsBatch = writeBatch(db);\n        patternsSnapshot.docs.forEach(docSnap => {\n            const backupDocRef = doc(patternsBackup, docSnap.id);\n            patternsBatch.set(backupDocRef, {\n                ...docSnap.data(),\n                backed_up_at: serverTimestamp(),\n                original_id: docSnap.id\n            });\n        });\n        await patternsBatch.commit();\n        results.backed_up += patternsSnapshot.docs.length;\n        log(`✅ Backed up ${patternsSnapshot.docs.length} patterns`);\n        \n        // Backup user_pattern_progress collection\n        log('📦 Backing up existing user progress...');\n        const progressSnapshot = await getDocs(collection(db, 'user_pattern_progress'));\n        const progressBackup = collection(db, `user_pattern_progress${FRESH_START_CONFIG.backupCollectionSuffix}`);\n        \n        const progressBatch = writeBatch(db);\n        progressSnapshot.docs.forEach(docSnap => {\n            const backupDocRef = doc(progressBackup, docSnap.id);\n            progressBatch.set(backupDocRef, {\n                ...docSnap.data(),\n                backed_up_at: serverTimestamp(),\n                original_id: docSnap.id\n            });\n        });\n        await progressBatch.commit();\n        results.backed_up += progressSnapshot.docs.length;\n        log(`✅ Backed up ${progressSnapshot.docs.length} progress records`);\n        \n    } catch (error) {\n        log(`❌ Backup failed: ${error.message}`);\n        results.errors.push(`Backup failed: ${error.message}`);\n        throw error;\n    }\n    \n    return results;\n}\n\n/**\n * Clear existing collections for fresh start\n */\nasync function clearExistingData(db, options = {}) {\n    const { log = console.log, dryRun = false } = options;\n    const results = { deleted: 0, errors: [] };\n    \n    if (dryRun) {\n        log('🔍 DRY RUN: Would clear existing patterns and user_pattern_progress');\n        return results;\n    }\n    \n    try {\n        // Clear patterns collection\n        log('🗑️ Clearing existing patterns...');\n        const patternsSnapshot = await getDocs(collection(db, 'patterns'));\n        const patternsBatch = writeBatch(db);\n        \n        patternsSnapshot.docs.forEach(docSnap => {\n            patternsBatch.delete(doc(db, 'patterns', docSnap.id));\n        });\n        await patternsBatch.commit();\n        results.deleted += patternsSnapshot.docs.length;\n        log(`✅ Deleted ${patternsSnapshot.docs.length} patterns`);\n        \n        // Clear user_pattern_progress collection\n        log('🗑️ Clearing existing user progress...');\n        const progressSnapshot = await getDocs(collection(db, 'user_pattern_progress'));\n        const progressBatch = writeBatch(db);\n        \n        progressSnapshot.docs.forEach(docSnap => {\n            progressBatch.delete(doc(db, 'user_pattern_progress', docSnap.id));\n        });\n        await progressBatch.commit();\n        results.deleted += progressSnapshot.docs.length;\n        log(`✅ Deleted ${progressSnapshot.docs.length} progress records`);\n        \n    } catch (error) {\n        log(`❌ Clear failed: ${error.message}`);\n        results.errors.push(`Clear failed: ${error.message}`);\n        throw error;\n    }\n    \n    return results;\n}\n\n/**\n * Create sample data with new enhanced schema\n */\nasync function createSampleData(db, options = {}) {\n    const { log = console.log, dryRun = false } = options;\n    const results = { created: 0, errors: [] };\n    \n    if (dryRun) {\n        log('🔍 DRY RUN: Would create sample enhanced schema data');\n        return results;\n    }\n    \n    try {\n        // Create sample pattern\n        const samplePattern = createSampleEnhancedPattern();\n        await setDoc(doc(db, 'patterns', samplePattern.id), samplePattern);\n        results.created++;\n        log(`✅ Created sample pattern: ${samplePattern.id}`);\n        \n        // Create sample user project (you can use any user ID for testing)\n        const sampleUserId = 'sample_user_id';\n        const sampleProject = createSampleUserProject(sampleUserId, samplePattern.id);\n        const projectDocId = `${sampleProject.userId}_${sampleProject.patternId}_${sampleProject.projectId}`;\n        \n        await setDoc(doc(db, 'user_pattern_progress', projectDocId), sampleProject);\n        results.created++;\n        log(`✅ Created sample project: ${projectDocId}`);\n        \n        // Log the human-readable structure\n        log('📋 Human-readable document structure:');\n        log(`  Pattern ID: ${samplePattern.id}`);\n        log(`  Project ID: ${projectDocId}`);\n        log('  Both IDs are now human-debuggable!');\n        \n    } catch (error) {\n        log(`❌ Sample data creation failed: ${error.message}`);\n        results.errors.push(`Sample data creation failed: ${error.message}`);\n        throw error;\n    }\n    \n    return results;\n}\n\n/**\n * Main fresh start function\n */\nexport async function freshStart(db, options = {}) {\n    const { \n        log = console.log, \n        dryRun = false,\n        createBackup = true,\n        createSamples = true \n    } = options;\n    \n    const results = {\n        version: FRESH_START_CONFIG.version,\n        timestamp: new Date().toISOString(),\n        dryRun,\n        backup: { backed_up: 0, errors: [] },\n        clear: { deleted: 0, errors: [] },\n        samples: { created: 0, errors: [] },\n        errors: []\n    };\n    \n    try {\n        log('🚀 Starting fresh start migration...');\n        log(`Version: ${FRESH_START_CONFIG.version}`);\n        log(`Dry run: ${dryRun}`);\n        \n        // Step 1: Backup existing data\n        if (createBackup && !dryRun) {\n            results.backup = await backupExistingData(db, { log });\n        }\n        \n        // Step 2: Clear existing data  \n        results.clear = await clearExistingData(db, { log, dryRun });\n        \n        // Step 3: Create sample data with new schema\n        if (createSamples) {\n            results.samples = await createSampleData(db, { log, dryRun });\n        }\n        \n        log('✅ Fresh start migration completed successfully!');\n        \n    } catch (error) {\n        log(`❌ Fresh start migration failed: ${error.message}`);\n        results.errors.push(error.message);\n        throw error;\n    }\n    \n    return results;\n}\n\n/**\n * Utility function to generate human-readable IDs for new patterns\n */\nexport function generateHumanReadableId(type, ...params) {\n    const idHelper = createHumanReadableIds();\n    \n    switch (type) {\n        case 'pattern':\n            return idHelper.createPatternId(params[0], params[1]); // author, name\n        case 'project':\n            return idHelper.createProjectId(params[0], params[1], params[2]); // userName, patternName, projectName\n        case 'access':\n            return idHelper.createAccessId(params[0], params[1]); // patternId, userId\n        case 'share':\n            return idHelper.createShareId(params[0], params[1]); // fromUserId, toUserId\n        default:\n            throw new Error(`Unknown ID type: ${type}`);\n    }\n}\n\nexport { createSampleEnhancedPattern, createSampleUserProject };

import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc, 
    writeBatch,
    query,
    serverTimestamp 
} from 'firebase/firestore';

// Fresh start configuration
const FRESH_START_CONFIG = {
    batchSize: 50,
    backupCollectionSuffix: '_backup_before_fresh_start',
    version: '2.0.0_enhanced_schema'
};

/**
 * Creates human-readable document IDs
 */
function createHumanReadableIds() {
    return {
        // Pattern ID: author-name_pattern-name
        createPatternId: (author, name) => {
            const authorSlug = author.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);
            const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 25);
            return `${authorSlug}_${nameSlug}`;
        },
        
        // Project ID: user-name_pattern-name_project-name
        createProjectId: (userName, patternName, projectName) => {
            const userSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);
            const patternSlug = patternName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
            const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15);
            return `${userSlug}_${patternSlug}_${projectSlug}`;
        },
        
        // User ID: use existing Firebase Auth UID (already human-debuggable)
        // Access ID: pattern-id_user-id
        createAccessId: (patternId, userId) => `${patternId}_${userId}`,
        
        // Share ID: timestamp_from-user_to-user
        createShareId: (fromUserId, toUserId) => {
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            return `${timestamp}_${fromUserId.substring(0, 8)}_${toUserId.substring(0, 8)}`;
        }
    };
}

/**
 * Sample enhanced pattern data using the new LogicGuide schema
 */
function createSampleEnhancedPattern() {
    const idHelper = createHumanReadableIds();
    const patternId = idHelper.createPatternId('iris-schreier', 'neon-sky-shawl');
    
    return {
        id: patternId,
        
        // Basic metadata (enhanced)
        name: "Neon Sky Shawl",
        author: "Iris Schreier",
        craft: "knitting",
        category: "shawl",
        difficulty: "intermediate",
        
        // Ownership and sharing
        createdBy: "sample_user_id",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: "public", // Make sample pattern public for testing
        
        // Enhanced pattern structure (NEW - from LogicGuide)
        metadata: {
            maxSteps: 117,
            estimatedTime: "20 hours",
            description: "A delicate triangular shawl featuring elegant increases and intricate lace patterns.",
            tags: ["shawl", "lace", "triangular", "fingering-weight"],
            language: "en",
            version: "1.0",
            copyright: "© 2024 Iris Schreier. All rights reserved.",
            patternSource: "https://example.com/neon-sky-shawl",
            pdfUrl: null
        },
        
        // Materials specification (NEW)
        materials: {
            yarn: {
                primary: {
                    brand: "Malabrigo",
                    name: "Sock Yarn",
                    weight: "fingering",
                    weightCode: "1",
                    fiber: "100% Superwash Merino Wool",
                    yardageNeeded: 350,
                    substitutionNotes: "Any fingering weight yarn with good drape"
                },
                contrast: null
            },
            needles: {
                primary: {
                    size: "US 6",
                    sizeMetric: "4.0mm",
                    type: "circular",
                    length: "32 inches"
                }
            },
            notions: [
                {
                    item: "stitch markers",
                    quantity: 8,
                    essential: true
                },
                {
                    item: "tapestry needle", 
                    quantity: 1,
                    essential: true
                }
            ]
        },
        
        // Gauge specification (NEW)
        gauge: {
            stitchesPerInch: 5.5,
            rowsPerInch: 7.5,
            stitchesIn4Inches: 22,
            rowsIn4Inches: 30,
            needleSize: "US 6 (4.0mm)",
            stitch: "stockinette stitch",
            afterBlocking: true,
            notes: "Gauge is measured after blocking. Lace patterns will open up significantly."
        },
        
        // Multi-size support (NEW) - Single size for this example
        sizing: {
            type: "single-size",
            sizes: ["one-size"],
            dimensions: {
                wingspan: ["60 inches"],
                depth: ["24 inches"]
            }
        },
        
        // Colorwork specification (NEW)
        colorwork: {
            type: "single-color",
            numberOfColors: 1,
            palettes: [
                {
                    id: "p1",
                    name: "Main Color Only",
                    yarns: [
                        {"colorId": "MC", "strands": 1, "dominant": true}
                    ]
                }
            ],
            colorMap: {
                "MC": {
                    "name": "Main Color",
                    "colorCode": null,
                    "yarnDetails": {
                        "brand": "Malabrigo",
                        "colorway": "Your Choice"
                    }
                }
            }
        },
        
        // Visual resources (NEW)
        images: [],
        charts: [],
        
        // Enhanced glossary (NEW)
        glossary: {
            "k": {
                "name": "Knit",
                "description": "Insert right needle through front of stitch, wrap yarn, pull through.",
                "stitchesUsed": 1,
                "stitchesCreated": 1,
                "videoUrl": null
            },
            "yo": {
                "name": "Yarn Over",
                "description": "Wrap yarn over right needle to create an increase and hole.",
                "stitchesUsed": 0,
                "stitchesCreated": 1,
                "videoUrl": null
            },
            "k2tog": {
                "name": "Knit 2 Together",
                "description": "Insert needle through 2 stitches, knit them together.",
                "stitchesUsed": 2,
                "stitchesCreated": 1,
                "videoUrl": null
            }
        },
        
        // Sample steps (NEW enhanced format)
        steps: [
            {
                step: 1,
                instruction: "Cast on 3 stitches",
                startingStitchCount: [0],
                endingStitchCount: [3],
                section: "setup",
                type: "specialInstruction",
                side: null,
                paletteId: "p1",
                chartReference: null,
                notes: "Use long-tail cast on for best results",
                sizeVariables: {},
                resolvedInstructions: {
                    "one-size": "Cast on 3 stitches"
                }
            },
            {
                step: 2,
                instruction: "Row 1 (RS): k1, yo, k1, yo, k1",
                startingStitchCount: [3],
                endingStitchCount: [5],
                section: "setup",
                type: "regular",
                side: "RS",
                paletteId: "p1",
                chartReference: null,
                notes: "First increase row",
                sizeVariables: {},
                resolvedInstructions: {
                    "one-size": "Row 1 (RS): k1, yo, k1, yo, k1"
                }
            },
            {
                step: 3,
                instruction: "Row 2 (WS): k1, p3, k1",
                startingStitchCount: [5],
                endingStitchCount: [5],
                section: "setup",
                type: "regular",
                side: "WS",
                paletteId: "p1",
                chartReference: null,
                notes: "Work yarn overs as regular stitches",
                sizeVariables: {},
                resolvedInstructions: {
                    "one-size": "Row 2 (WS): k1, p3, k1"
                }
            }
        ],
        
        // Additional resources (NEW)
        resources: {
            video: null,
            errata: null,
            support: "mailto:support@example.com"
        },
        
        // Designer notes (NEW)
        notes: {
            general: "This is a sample pattern to demonstrate the enhanced schema",
            designNotes: "Created as a test pattern for the new system",
            modifications: "Feel free to modify as needed for testing"
        },
        
        // Sharing and analytics
        shareCount: 0,
        viewCount: 0,
        forkCount: 0,
        
        // Export tracking
        lastExportedAt: null,
        exportCount: 0
    };
}

/**
 * Sample user project data using enhanced progress schema
 */
function createSampleUserProject(userId, patternId) {
    const idHelper = createHumanReadableIds();
    const projectId = idHelper.createProjectId('sample-user', 'neon-sky-shawl', 'first-attempt');
    
    return {
        // Basic identifiers
        userId: userId,
        patternId: patternId,
        projectId: projectId,
        
        // Core progress tracking
        currentStep: 1,
        totalSteps: 3,
        completedSteps: [],
        
        // Timestamps
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        completedAt: null,
        
        // Size selection (for single-size patterns)
        sizeSelection: {
            selectedSize: "one-size",
            sizeIndex: 0,
            sizeLockedAt: serverTimestamp(),
            allowSizeChange: false,
            sizeNotes: "Single size pattern"
        },
        
        // Current step details
        currentStepDetails: {
            stepNumber: 1,
            instruction: "Cast on 3 stitches",
            resolvedInstruction: "Cast on 3 stitches",
            section: "setup",
            side: null,
            type: "specialInstruction",
            expectedStitchCount: {
                starting: 0,
                ending: 3
            },
            actualStitchCount: null
        },
        
        // Colorwork state
        colorworkState: {
            isColorworkPattern: false,
            currentPalette: "p1",
            colorTransitions: [],
            yarnManagement: {
                activeYarns: ["MC"],
                yarnSupply: {}
            }
        },
        
        // Project details and actual materials
        projectDetails: {
            projectName: "My First Enhanced Schema Test",
            purpose: "testing",
            recipient: null,
            deadline: null,
            
            // User's actual yarns
            yarns: [
                {
                    brand: "Test Brand",
                    colorway: "Sample Color",
                    weight: "fingering",
                    fiberContent: "100% Test Fiber",
                    yardage: 400,
                    skeinsUsed: 1,
                    cost: 25.00,
                    purchaseLocation: "Test Shop",
                    notes: "Perfect for testing the new schema",
                    addedAt: serverTimestamp()
                }
            ],
            
            // User's actual tools
            tools: {
                needleSize: "US 6",
                originalNeedleSize: "US 6",
                needleBrand: "Test Brand",
                needleType: "circular",
                otherTools: ["stitch markers", "tapestry needle"]
            },
            
            // User's measured gauge
            actualGauge: null // Will be filled when user measures
        },
        
        // User notes and journey
        notes: {
            general: "Testing the new enhanced schema - looking good so far!",
            stepNotes: {},
            milestones: []
        },
        
        // Progress images
        progressImages: [],
        
        // Section progress
        sectionProgress: {
            setup: {
                completed: false,
                startedAt: serverTimestamp(),
                stepRange: [1, 3],
                currentStep: 1
            }
        },
        
        // Chart progress (empty for this pattern)
        chartProgress: {},
        
        // Analytics
        analytics: {
            timeSpent: {
                totalMinutes: 0,
                sessionsCount: 1,
                averageSessionLength: 0,
                longestSession: 0
            },
            problemsEncountered: [],
            helpRequestsCount: 0,
            stitchFinderUsage: 0,
            glossaryLookups: []
        },
        
        // Pattern metadata
        patternMetadata: {
            version: "1.0",
            source: "created",
            sharedBy: null,
            personalRating: null,
            wouldRecommend: null
        },
        
        // Status
        status: "not_started",
        pausedReason: null,
        completionNotes: null
    };
}

/**
 * Backup existing collections before clean slate
 */
async function backupExistingData(db, options = {}) {
    const { log = console.log } = options;
    const results = { backed_up: 0, errors: [] };
    
    try {
        // Backup patterns collection
        log('📦 Backing up existing patterns...');
        const patternsSnapshot = await getDocs(collection(db, 'patterns'));
        const patternsBackup = collection(db, `patterns${FRESH_START_CONFIG.backupCollectionSuffix}`);
        
        const patternsBatch = writeBatch(db);
        patternsSnapshot.docs.forEach(docSnap => {
            const backupDocRef = doc(patternsBackup, docSnap.id);
            patternsBatch.set(backupDocRef, {
                ...docSnap.data(),
                backed_up_at: serverTimestamp(),
                original_id: docSnap.id
            });
        });
        await patternsBatch.commit();
        results.backed_up += patternsSnapshot.docs.length;
        log(`✅ Backed up ${patternsSnapshot.docs.length} patterns`);
        
        // Backup user_pattern_progress collection
        log('📦 Backing up existing user progress...');
        const progressSnapshot = await getDocs(collection(db, 'user_pattern_progress'));
        const progressBackup = collection(db, `user_pattern_progress${FRESH_START_CONFIG.backupCollectionSuffix}`);
        
        const progressBatch = writeBatch(db);
        progressSnapshot.docs.forEach(docSnap => {
            const backupDocRef = doc(progressBackup, docSnap.id);
            progressBatch.set(backupDocRef, {
                ...docSnap.data(),
                backed_up_at: serverTimestamp(),
                original_id: docSnap.id
            });
        });
        await progressBatch.commit();
        results.backed_up += progressSnapshot.docs.length;
        log(`✅ Backed up ${progressSnapshot.docs.length} progress records`);
        
    } catch (error) {
        log(`❌ Backup failed: ${error.message}`);
        results.errors.push(`Backup failed: ${error.message}`);
        throw error;
    }
    
    return results;
}

/**
 * Clear existing collections for fresh start
 */
async function clearExistingData(db, options = {}) {
    const { log = console.log, dryRun = false } = options;
    const results = { deleted: 0, errors: [] };
    
    if (dryRun) {
        log('🔍 DRY RUN: Would clear existing patterns and user_pattern_progress');
        return results;
    }
    
    try {
        // Clear patterns collection
        log('🗑️ Clearing existing patterns...');
        const patternsSnapshot = await getDocs(collection(db, 'patterns'));
        const patternsBatch = writeBatch(db);
        
        patternsSnapshot.docs.forEach(docSnap => {
            patternsBatch.delete(doc(db, 'patterns', docSnap.id));
        });
        await patternsBatch.commit();
        results.deleted += patternsSnapshot.docs.length;
        log(`✅ Deleted ${patternsSnapshot.docs.length} patterns`);
        
        // Clear user_pattern_progress collection
        log('🗑️ Clearing existing user progress...');
        const progressSnapshot = await getDocs(collection(db, 'user_pattern_progress'));
        const progressBatch = writeBatch(db);
        
        progressSnapshot.docs.forEach(docSnap => {
            progressBatch.delete(doc(db, 'user_pattern_progress', docSnap.id));
        });
        await progressBatch.commit();
        results.deleted += progressSnapshot.docs.length;
        log(`✅ Deleted ${progressSnapshot.docs.length} progress records`);
        
    } catch (error) {
        log(`❌ Clear failed: ${error.message}`);
        results.errors.push(`Clear failed: ${error.message}`);
        throw error;
    }
    
    return results;
}

/**
 * Create sample data with new enhanced schema
 */
async function createSampleData(db, options = {}) {
    const { log = console.log, dryRun = false } = options;
    const results = { created: 0, errors: [] };
    
    if (dryRun) {
        log('🔍 DRY RUN: Would create sample enhanced schema data');
        return results;
    }
    
    try {
        // Create sample pattern
        const samplePattern = createSampleEnhancedPattern();
        await setDoc(doc(db, 'patterns', samplePattern.id), samplePattern);
        results.created++;
        log(`✅ Created sample pattern: ${samplePattern.id}`);
        
        // Create sample user project (you can use any user ID for testing)
        const sampleUserId = 'sample_user_id';
        const sampleProject = createSampleUserProject(sampleUserId, samplePattern.id);
        const projectDocId = `${sampleProject.userId}_${sampleProject.patternId}_${sampleProject.projectId}`;
        
        await setDoc(doc(db, 'user_pattern_progress', projectDocId), sampleProject);
        results.created++;
        log(`✅ Created sample project: ${projectDocId}`);
        
        // Log the human-readable structure
        log('📋 Human-readable document structure:');
        log(`  Pattern ID: ${samplePattern.id}`);
        log(`  Project ID: ${projectDocId}`);
        log('  Both IDs are now human-debuggable!');
        
    } catch (error) {
        log(`❌ Sample data creation failed: ${error.message}`);
        results.errors.push(`Sample data creation failed: ${error.message}`);
        throw error;
    }
    
    return results;
}

/**
 * Main fresh start function
 */
export async function freshStart(db, options = {}) {
    const { 
        log = console.log, 
        dryRun = false,
        createBackup = true,
        createSamples = true 
    } = options;
    
    const results = {
        version: FRESH_START_CONFIG.version,
        timestamp: new Date().toISOString(),
        dryRun,
        backup: { backed_up: 0, errors: [] },
        clear: { deleted: 0, errors: [] },
        samples: { created: 0, errors: [] },
        errors: []
    };
    
    try {
        log('🚀 Starting fresh start migration...');
        log(`Version: ${FRESH_START_CONFIG.version}`);
        log(`Dry run: ${dryRun}`);
        
        // Step 1: Backup existing data
        if (createBackup && !dryRun) {
            results.backup = await backupExistingData(db, { log });
        }
        
        // Step 2: Clear existing data  
        results.clear = await clearExistingData(db, { log, dryRun });
        
        // Step 3: Create sample data with new schema
        if (createSamples) {
            results.samples = await createSampleData(db, { log, dryRun });
        }
        
        log('✅ Fresh start migration completed successfully!');
        
    } catch (error) {
        log(`❌ Fresh start migration failed: ${error.message}`);
        results.errors.push(error.message);
        throw error;
    }
    
    return results;
}

/**
 * Utility function to generate human-readable IDs for new patterns
 */
export function generateHumanReadableId(type, ...params) {
    const idHelper = createHumanReadableIds();
    
    switch (type) {
        case 'pattern':
            return idHelper.createPatternId(params[0], params[1]); // author, name
        case 'project':
            return idHelper.createProjectId(params[0], params[1], params[2]); // userName, patternName, projectName
        case 'access':
            return idHelper.createAccessId(params[0], params[1]); // patternId, userId
        case 'share':
            return idHelper.createShareId(params[0], params[1]); // fromUserId, toUserId
        default:
            throw new Error(`Unknown ID type: ${type}`);
    }
}

export { createSampleEnhancedPattern, createSampleUserProject };