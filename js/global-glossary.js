// global-glossary.js - Living Glossary System
// A persistent, global stitch glossary that grows and improves over time

/**
 * Global Living Glossary System
 * - Persists across sessions using localStorage
 * - Handles conflicts gracefully with versioning
 * - Provides consistent token assignments
 * - Allows community/user updates
 * - Offers fallbacks for incomplete patterns
 */
class GlobalLivingGlossary {
    constructor() {
        this.STORAGE_KEY = 'nyantoasty_global_glossary';
        this.VERSION_KEY = 'nyantoasty_glossary_version';
        this.CURRENT_VERSION = '1.0.0';
        
        // In-memory cache
        this.glossary = new Map(); // stitchKey -> {definition, token, metadata}
        this.tokenCounters = {
            increase: 1,
            decrease: 1,
            special: 1,
            basic: 1,
            generic: 1
        };
        
        // Load persisted data
        this.load();
    }

    /**
     * Load glossary from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const version = localStorage.getItem(this.VERSION_KEY);
            
            if (stored && version === this.CURRENT_VERSION) {
                const data = JSON.parse(stored);
                
                // Restore glossary
                Object.entries(data.glossary || {}).forEach(([key, value]) => {
                    this.glossary.set(key, value);
                });
                
                // Restore counters
                this.tokenCounters = { ...this.tokenCounters, ...(data.tokenCounters || {}) };
                
                console.log(`🔄 Loaded global glossary with ${this.glossary.size} entries`);
            } else {
                console.log('🆕 Starting fresh global glossary');
                this.initializeDefaultGlossary();
            }
        } catch (error) {
            console.warn('⚠️ Failed to load global glossary, starting fresh:', error);
            this.initializeDefaultGlossary();
        }
    }

    /**
     * Save glossary to localStorage
     */
    save() {
        try {
            const data = {
                glossary: Object.fromEntries(this.glossary),
                tokenCounters: this.tokenCounters,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
            
            console.log(`💾 Saved global glossary with ${this.glossary.size} entries`);
        } catch (error) {
            console.warn('⚠️ Failed to save global glossary:', error);
        }
    }

    /**
     * Initialize with common knitting terms
     */
    initializeDefaultGlossary() {
        const defaults = [
            // Common increases
            { key: 'kfb', name: 'Knit Front and Back', category: 'increase', description: 'Knit into the front then back of the same stitch' },
            { key: 'm1', name: 'Make One', category: 'increase', description: 'Create a new stitch by lifting the bar between stitches' },
            { key: 'yo', name: 'Yarn Over', category: 'increase', description: 'Wrap yarn over the right needle to create a hole and add a stitch' },
            
            // Common decreases  
            { key: 'k2tog', name: 'Knit 2 Together', category: 'decrease', description: 'Insert right needle into first two stitches on left needle and knit them together' },
            { key: 'ssk', name: 'Slip, Slip, Knit', category: 'decrease', description: 'Slip two stitches knitwise, then knit them together through the back loops' },
            { key: 'p2tog', name: 'Purl 2 Together', category: 'decrease', description: 'Purl two stitches together' },
            
            // Basic stitches
            { key: 'k', name: 'Knit', category: 'basic', description: 'The basic knit stitch' },
            { key: 'p', name: 'Purl', category: 'basic', description: 'The basic purl stitch' },
            { key: 'sl', name: 'Slip', category: 'basic', description: 'Slip stitch from left to right needle without working it' },
        ];

        defaults.forEach(stitch => {
            this.addStitch(stitch.key, stitch, { source: 'default', addedAt: new Date().toISOString() });
        });

        this.save();
    }

    /**
     * Get or assign a consistent token for a stitch
     * @param {string} stitchKey - The stitch identifier
     * @param {string} category - The stitch category
     * @returns {string} Consistent token class name
     */
    getToken(stitchKey, category) {
        const entry = this.glossary.get(stitchKey);
        if (entry?.token) {
            return entry.token;
        }

        // Assign new token
        const counter = this.tokenCounters[category] || 1;
        const counterStr = String(counter).padStart(2, '0');
        
        let token;
        switch (category) {
            case 'increase':
            case 'decrease':
                token = `token-stitch-${counterStr}`;
                this.tokenCounters[category]++;
                break;
            case 'special':
                token = `token-special-${counterStr}`;
                this.tokenCounters.special++;
                break;
            case 'basic':
                token = `token-stitch-${counterStr}`;
                this.tokenCounters.basic++;
                break;
            default:
                token = `token-generic-${counterStr}`;
                this.tokenCounters.generic++;
        }

        // Update entry with token
        if (entry) {
            entry.token = token;
        } else {
            this.glossary.set(stitchKey, { 
                token, 
                category,
                name: stitchKey.toUpperCase(),
                description: `${category} technique`,
                metadata: { source: 'auto-assigned', addedAt: new Date().toISOString() }
            });
        }

        this.save();
        return token;
    }

    /**
     * Add or update a stitch definition
     * @param {string} stitchKey - The stitch identifier
     * @param {Object} definition - Stitch definition {name, description, category, etc.}
     * @param {Object} metadata - Source and update info
     * @returns {boolean} True if added/updated, false if conflict needs resolution
     */
    addStitch(stitchKey, definition, metadata = {}) {
        const existing = this.glossary.get(stitchKey);
        
        if (existing && this.hasConflict(existing, definition)) {
            return this.handleConflict(stitchKey, existing, definition, metadata);
        }

        // Assign token if not present
        if (!definition.token && definition.category) {
            definition.token = this.getToken(stitchKey, definition.category);
        }

        // Prepare enhanced definition with new fields
        const enhancedDefinition = {
            name: definition.name || stitchKey.toUpperCase(),
            description: definition.description || '',
            category: definition.category || 'basic',
            // New multimedia fields
            videoLink: definition.videoLink || '',
            pictureLink: definition.pictureLink || '',
            alternateVideos: definition.alternateVideos || [],
            // Technical fields  
            stitchesCreated: definition.stitchesCreated || 1,
            difficulty: definition.difficulty || 'beginner',
            tags: definition.tags || [],
            // Existing fields
            token: definition.token,
            stitchesUsed: definition.stitchesUsed,
            needlePosition: definition.needlePosition,
            ...definition
        };

        // Add metadata
        const fullDefinition = {
            ...enhancedDefinition,
            metadata: {
                ...metadata,
                lastUpdated: new Date().toISOString(),
                version: this.CURRENT_VERSION
            }
        };

        this.glossary.set(stitchKey, fullDefinition);
        this.save();
        
        console.log(`✅ Added stitch: ${stitchKey} -> ${enhancedDefinition.token}`);
        return true;
    }

    /**
     * Check if two definitions conflict
     */
    hasConflict(existing, newDef) {
        return existing.category !== newDef.category ||
               (existing.description && newDef.description && 
                existing.description !== newDef.description);
    }

    /**
     * Handle conflicts between existing and new definitions
     */
    handleConflict(stitchKey, existing, newDef, metadata) {
        // For now, prefer more detailed definitions
        if (newDef.description && newDef.description.length > (existing.description?.length || 0)) {
            console.log(`🔄 Updating ${stitchKey} with better definition`);
            
            // Directly update without calling addStitch to avoid recursion
            const updatedDef = {
                ...existing,
                ...newDef,
                metadata: {
                    ...metadata,
                    lastUpdated: new Date().toISOString(),
                    version: this.CURRENT_VERSION
                }
            };
            
            this.glossary.set(stitchKey, updatedDef);
            this.save();
            return true;
        }
        
        // Keep existing if no improvement
        console.log(`⚠️ Keeping existing definition for ${stitchKey}`);
        return false;
    }

    /**
     * Load pattern-specific glossary into global system
     * @param {Object} patternGlossary - Pattern's glossary object
     * @param {string} patternId - Pattern identifier for metadata
     */
    loadPatternGlossary(patternGlossary, patternId = 'unknown') {
        if (!patternGlossary) return;

        const metadata = { 
            source: 'pattern', 
            patternId,
            addedAt: new Date().toISOString() 
        };

        // Sort keys for consistent token assignment
        const sortedKeys = Object.keys(patternGlossary).sort();
        
        sortedKeys.forEach(key => {
            const definition = patternGlossary[key];
            this.addStitch(key, definition, metadata);
        });

        console.log(`📖 Loaded ${sortedKeys.length} stitches from pattern ${patternId}`);
    }

    /**
     * Get stitch definition
     * @param {string} stitchKey 
     * @returns {Object|null} Stitch definition or null
     */
    getStitch(stitchKey) {
        return this.glossary.get(stitchKey) || null;
    }

    /**
     * Get all stitches sorted by category and name
     * @returns {Array} Sorted array of stitch entries
     */
    getAllStitches() {
        const stitches = Array.from(this.glossary.entries()).map(([key, def]) => ({
            key,
            ...def
        }));

        return stitches.sort((a, b) => {
            // Sort by category first
            const categoryOrder = { 'basic': 0, 'increase': 1, 'decrease': 2, 'special': 3, 'generic': 4 };
            const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
            if (catDiff !== 0) return catDiff;
            
            // Then by key alphabetically
            return a.key.localeCompare(b.key);
        });
    }

    /**
     * Export glossary for backup/sharing
     */
    export() {
        return {
            version: this.CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            glossary: Object.fromEntries(this.glossary),
            tokenCounters: this.tokenCounters
        };
    }

    /**
     * Import glossary data
     */
    import(data) {
        if (data.version && data.glossary) {
            Object.entries(data.glossary).forEach(([key, value]) => {
                this.addStitch(key, value, { source: 'import', importedAt: new Date().toISOString() });
            });
            
            if (data.tokenCounters) {
                // Update counters to highest values
                Object.keys(this.tokenCounters).forEach(category => {
                    this.tokenCounters[category] = Math.max(
                        this.tokenCounters[category],
                        data.tokenCounters[category] || 1
                    );
                });
            }
            
            this.save();
            console.log(`📥 Imported ${Object.keys(data.glossary).length} stitches`);
            return true;
        }
        return false;
    }

    /**
     * Generate a unique document ID with collision handling
     * @param {string} stitchKey - The stitch key
     * @param {string} craftPrefix - The craft prefix (K, C, T, F)
     * @returns {Promise<string>} Unique document ID
     */
    async generateUniqueDocId(stitchKey, craftPrefix) {
        // Generate base timestamp with milliseconds for better uniqueness
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 17); // YYYYMMDDTHHMMSSSS (includes milliseconds)
        
        // Clean stitch key to ensure Firestore compatibility
        const cleanStitchKey = stitchKey.replace(/[^a-zA-Z0-9_]/g, '_');
        
        let baseId = `${craftPrefix}_${cleanStitchKey}_${timestamp}`;
        
        // Check for collision and add counter if needed
        if (window.db) {
            let collision = 0;
            let finalId = baseId;
            
            while (collision < 10) { // Limit collision attempts
                try {
                    const docRef = window.db.collection('stitchWitch_Glossary').doc(finalId);
                    const docSnap = await docRef.get();
                    
                    if (!docSnap.exists) {
                        return finalId; // Found unique ID
                    }
                    
                    // Collision detected, increment counter
                    collision++;
                    finalId = `${baseId}_${collision.toString().padStart(2, '0')}`;
                } catch (error) {
                    console.warn(`⚠️ Error checking document existence for ${finalId}:`, error);
                    break;
                }
            }
        }
        
        return baseId; // Fallback if collision checking fails
    }

    /**
     * Sync glossary with Firestore
     * Upload local glossary to Firestore with craft-prefixed IDs and timestamps
     */
    async syncToFirestore() {
        if (!window.db) {
            console.warn('⚠️ Firestore not available for sync');
            return false;
        }

        try {
            const stitches = Array.from(this.glossary.entries());
            const results = [];

            // Process each stitch individually to handle unique ID generation
            for (const [stitchKey, definition] of stitches) {
                try {
                    // Create craft-prefixed ID with enhanced collision handling
                    const craftPrefix = this.getCraftPrefix(definition.category);
                    const docId = await this.generateUniqueDocId(stitchKey, craftPrefix);
                    
                    console.log(`📝 Creating Firestore document: ${docId}`);
                    
                    const docRef = window.db.collection('stitchWitch_Glossary').doc(docId);
                    
                    // Prepare Firestore document
                    const firestoreDoc = {
                        id: docId,
                        stitchKey: stitchKey,
                        name: definition.name,
                        description: definition.description,
                        category: definition.category,
                        craft: craftPrefix,
                        
                        // Multimedia fields
                        videoLink: definition.videoLink || '',
                        pictureLink: definition.pictureLink || '',
                        alternateVideos: definition.alternateVideos || [],
                        
                        // Technical fields
                        stitchesCreated: definition.stitchesCreated || 1,
                        difficulty: definition.difficulty || 'beginner',
                        tags: definition.tags || [],
                        
                        // CSS theming integration
                        cssToken: definition.token,
                        tokenCategory: this.getTokenCategory(definition.token),
                        tokenLevel: this.getTokenLevel(definition.token),
                        
                        // Metadata
                        source: definition.metadata?.source || 'global-glossary',
                        createdAt: definition.metadata?.addedAt || new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        version: this.CURRENT_VERSION
                    };
                    
                    await docRef.set(firestoreDoc);
                    results.push({ success: true, docId, stitchKey });
                } catch (stitchError) {
                    console.error(`❌ Failed to sync stitch ${stitchKey}:`, stitchError);
                    results.push({ success: false, stitchKey, error: stitchError.message });
                }
            }
            
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`🔄 Sync complete: ${successful} successful, ${failed} failed`);
            return failed === 0;
        } catch (error) {
            console.error('❌ Failed to sync to Firestore:', error);
            return false;
        }
    }

    /**
     * Load glossary from Firestore 
     * Merge Firestore data with local glossary
     */
    async syncFromFirestore() {
        if (!window.db) {
            console.warn('⚠️ Firestore not available for sync');
            return false;
        }

        try {
            const snapshot = await window.db.collection('stitchWitch_Glossary').get();
            let loaded = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Convert Firestore document back to local format
                const definition = {
                    name: data.name,
                    description: data.description,
                    category: data.category,
                    token: data.cssToken,
                    
                    // New multimedia fields
                    videoLink: data.videoLink || '',
                    pictureLink: data.pictureLink || '',
                    alternateVideos: data.alternateVideos || [],
                    
                    // Technical fields
                    stitchesCreated: data.stitchesCreated || 1,
                    difficulty: data.difficulty || 'beginner',
                    tags: data.tags || [],
                    
                    metadata: {
                        source: data.source || 'firestore',
                        addedAt: data.createdAt,
                        lastUpdated: data.lastUpdated,
                        version: data.version || '1.0'
                    }
                };

                // Use original stitch key, not the prefixed document ID
                this.glossary.set(data.stitchKey, definition);
                loaded++;
            });

            this.save(); // Save to localStorage
            console.log(`🔄 Loaded ${loaded} stitches from Firestore`);
            return true;
        } catch (error) {
            console.error('❌ Failed to load from Firestore:', error);
            return false;
        }
    }

    /**
     * Get craft prefix based on stitch category
     */
    getCraftPrefix(category) {
        const categoryMap = {
            'increase': 'K', 'decrease': 'K', 'basic': 'K', 'cable': 'K', 'lace': 'K',
            'crochet': 'C', 'single-crochet': 'C', 'double-crochet': 'C',
            'tunisian': 'T', 'tunisian-knit': 'T', 'tunisian-purl': 'T'
        };
        return categoryMap[category] || 'K'; // Default to knitting
    }

    /**
     * Extract token category from token string
     */
    getTokenCategory(token) {
        if (!token) return 'stitch';
        const match = token.match(/token-(\w+)-/);
        return match ? match[1] : 'stitch';
    }

    /**
     * Extract token level from token string  
     */
    getTokenLevel(token) {
        if (!token) return '01';
        const match = token.match(/token-\w+-(\d+)/);
        return match ? match[1] : '01';
    }

    /**
     * Clear all data (for testing/reset)
     */
    clear() {
        this.glossary.clear();
        this.tokenCounters = { increase: 1, decrease: 1, special: 1, basic: 1, generic: 1 };
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.VERSION_KEY);
        console.log('🗑️ Cleared global glossary');
    }
}

// Global instance - THE source of truth for all stitch information
export const globalGlossary = new GlobalLivingGlossary();

// Legacy compatibility - these functions now use the global glossary
export function getInstructionCategory(instruction, PATTERN_DATA) {
    if (!instruction) return 'token-stitch-03';
    
    const cleanInstruction = instruction.toLowerCase().trim();
    
    // Check global glossary first
    const globalEntry = globalGlossary.getStitch(instruction) || globalGlossary.getStitch(cleanInstruction);
    if (globalEntry?.token) {
        return globalEntry.token;
    }
    
    // Fallback to pattern-specific data
    if (PATTERN_DATA?.glossary) {
        const patternEntry = PATTERN_DATA.glossary[instruction] || PATTERN_DATA.glossary[cleanInstruction];
        if (patternEntry?.category) {
            return globalGlossary.getToken(instruction || cleanInstruction, patternEntry.category);
        }
    }
    
    // Default fallback
    return 'token-stitch-03';
}