// firestore-glossary.js - Firestore Global Glossary Management
// Connects to the stitchWitch_Glossary collection in Firestore

import { db } from './firebase-config.js';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

/**
 * Firestore Global Glossary Manager
 * Manages the global stitch glossary stored in Firestore
 */
class FirestoreGlossary {
    constructor() {
        this.COLLECTION_NAME = 'stitchWitch_Glossary';
        this.cache = new Map(); // Local cache for performance
        this.lastFetch = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all glossary entries from Firestore
     * @param {boolean} forceRefresh - Force refresh from Firestore
     * @returns {Promise<Array>} Array of glossary entries
     */
    async getAllEntries(forceRefresh = false) {
        const now = Date.now();
        
        // Use cache if valid and not forcing refresh
        if (!forceRefresh && this.lastFetch && (now - this.lastFetch < this.CACHE_DURATION) && this.cache.size > 0) {
            return Array.from(this.cache.values());
        }

        try {
            const glossaryRef = collection(db, this.COLLECTION_NAME);
            const querySnapshot = await getDocs(glossaryRef);
            
            this.cache.clear();
            const entries = [];

            querySnapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                this.cache.set(doc.id, data);
                entries.push(data);
            });

            this.lastFetch = now;
            console.log(`📖 Loaded ${entries.length} entries from Firestore glossary`);
            
            // Sort by craft type, then by name
            return entries.sort((a, b) => {
                const craftA = a.id.charAt(0);
                const craftB = b.id.charAt(0);
                if (craftA !== craftB) return craftA.localeCompare(craftB);
                return (a.Name || '').localeCompare(b.Name || '');
            });

        } catch (error) {
            console.error('❌ Error loading glossary from Firestore:', error);
            return [];
        }
    }

    /**
     * Get entries for a specific craft
     * @param {string} craft - Craft type (K, C, T)
     * @returns {Promise<Array>} Array of entries for that craft
     */
    async getEntriesByCraft(craft) {
        const allEntries = await this.getAllEntries();
        return allEntries.filter(entry => entry.id.startsWith(craft + '_'));
    }

    /**
     * Get a specific entry by ID
     * @param {string} entryId - Document ID (e.g., "K_Knit")
     * @returns {Promise<Object|null>} Entry data or null
     */
    async getEntry(entryId) {
        // Check cache first
        if (this.cache.has(entryId)) {
            return this.cache.get(entryId);
        }

        try {
            const docRef = doc(db, this.COLLECTION_NAME, entryId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                this.cache.set(entryId, data);
                return data;
            }
            return null;
        } catch (error) {
            console.error(`❌ Error getting entry ${entryId}:`, error);
            return null;
        }
    }

    /**
     * Add or update a glossary entry
     * @param {string} entryId - Document ID (e.g., "K_Knit")
     * @param {Object} entryData - Entry data
     * @returns {Promise<boolean>} Success status
     */
    async addOrUpdateEntry(entryId, entryData) {
        try {
            // Validate entry ID format
            if (!this.isValidEntryId(entryId)) {
                throw new Error('Invalid entry ID. Must start with K_, C_, or T_');
            }

            const docRef = doc(db, this.COLLECTION_NAME, entryId);
            await setDoc(docRef, entryData, { merge: true });
            
            // Update cache
            this.cache.set(entryId, { id: entryId, ...entryData });
            
            console.log(`✅ ${this.cache.has(entryId) ? 'Updated' : 'Added'} glossary entry: ${entryId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error adding/updating entry ${entryId}:`, error);
            return false;
        }
    }

    /**
     * Delete a glossary entry
     * @param {string} entryId - Document ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteEntry(entryId) {
        try {
            const docRef = doc(db, this.COLLECTION_NAME, entryId);
            await deleteDoc(docRef);
            
            // Remove from cache
            this.cache.delete(entryId);
            
            console.log(`🗑️ Deleted glossary entry: ${entryId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting entry ${entryId}:`, error);
            return false;
        }
    }

    /**
     * Search entries by name or abbreviation
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} Matching entries
     */
    async searchEntries(searchTerm) {
        const allEntries = await this.getAllEntries();
        const term = searchTerm.toLowerCase();
        
        return allEntries.filter(entry => {
            return (entry.Name && entry.Name.toLowerCase().includes(term)) ||
                   (entry.Abbreviation && entry.Abbreviation.toLowerCase().includes(term)) ||
                   (entry.Description && entry.Description.toLowerCase().includes(term));
        });
    }

    /**
     * Validate entry ID format
     * @param {string} entryId - Entry ID to validate
     * @returns {boolean} Valid format
     */
    isValidEntryId(entryId) {
        return /^[KCT]_[A-Za-z][A-Za-z0-9_]*$/.test(entryId);
    }

    /**
     * Generate a suggested entry ID from a stitch name
     * @param {string} stitchName - Stitch name
     * @param {string} craft - Craft type (K, C, T)
     * @returns {string} Suggested ID
     */
    generateEntryId(stitchName, craft = 'K') {
        const cleanName = stitchName
            .replace(/[^A-Za-z0-9\s]/g, '') // Remove special chars
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
        
        return `${craft}_${cleanName}`;
    }

    /**
     * Get craft name from prefix
     * @param {string} prefix - Craft prefix (K, C, T)
     * @returns {string} Full craft name
     */
    getCraftName(prefix) {
        const craftNames = {
            'K': 'Knitting',
            'C': 'Crochet', 
            'T': 'Tunisian Crochet'
        };
        return craftNames[prefix] || 'Unknown';
    }

    /**
     * Get available craft types
     * @returns {Array} Array of craft objects with prefix and name
     */
    getCraftTypes() {
        return [
            { prefix: 'K', name: 'Knitting' },
            { prefix: 'C', name: 'Crochet' },
            { prefix: 'T', name: 'Tunisian Crochet' }
        ];
    }

    /**
     * Validate entry data
     * @param {Object} entryData - Entry data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateEntryData(entryData) {
        const errors = [];
        
        if (!entryData.Name || entryData.Name.trim() === '') {
            errors.push('Name is required');
        }
        
        if (!entryData.Abbreviation || entryData.Abbreviation.trim() === '') {
            errors.push('Abbreviation is required');
        }
        
        if (!entryData.Description || entryData.Description.trim() === '') {
            errors.push('Description is required');
        }
        
        if (!entryData.Craft || !['Knit', 'Crochet', 'Tunisian Crochet'].includes(entryData.Craft)) {
            errors.push('Valid craft type is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Export glossary data for backup
     * @returns {Promise<Object>} Exported data
     */
    async exportGlossary() {
        const entries = await this.getAllEntries(true); // Force fresh data
        return {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            totalEntries: entries.length,
            entries: entries
        };
    }
}

// Global instance
export const firestoreGlossary = new FirestoreGlossary();

// Helper functions for easy access
export const glossaryHelpers = {
    // Get all knitting stitches
    getKnittingStitches: () => firestoreGlossary.getEntriesByCraft('K'),
    
    // Get all crochet stitches  
    getCrochetStitches: () => firestoreGlossary.getEntriesByCraft('C'),
    
    // Get all Tunisian crochet stitches
    getTunisianStitches: () => firestoreGlossary.getEntriesByCraft('T'),
    
    // Quick add knitting stitch
    addKnittingStitch: (name, abbreviation, description, additionalData = {}) => {
        const entryId = firestoreGlossary.generateEntryId(name, 'K');
        return firestoreGlossary.addOrUpdateEntry(entryId, {
            Name: name,
            Abbreviation: abbreviation,
            Description: description,
            Craft: 'Knit',
            Difficulty: 'Easy',
            ...additionalData
        });
    },
    
    // Quick add crochet stitch
    addCrochetStitch: (name, abbreviation, description, additionalData = {}) => {
        const entryId = firestoreGlossary.generateEntryId(name, 'C');
        return firestoreGlossary.addOrUpdateEntry(entryId, {
            Name: name,
            Abbreviation: abbreviation,
            Description: description,
            Craft: 'Crochet',
            Difficulty: 'Easy',
            ...additionalData
        });
    }
};