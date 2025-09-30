// stitch-witch.js - Analytics and user interaction tracking
// Version: v2025-09-29-modular

export async function logStitchWitchQuery(queryData, db = null) {
    try {
        // If db is not provided, try to get it from global context
        if (!db && typeof window !== 'undefined' && window.db) {
            db = window.db;
        }
        
        if (!db) {
            console.warn('No Firestore database instance available for logging');
            return null;
        }
        
        // Import Firestore functions
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        // Add timestamp and generate session ID if not provided
        const docData = {
            ...queryData,
            timestamp: serverTimestamp(),
            sessionId: queryData.sessionId || generateSessionId()
        };
        
        console.log('🧙‍♀️ StitchWitch logging query:', docData);
        
        // Add document to stitchWitch collection
        const docRef = await addDoc(collection(db, 'stitchWitch'), docData);
        console.log('✅ StitchWitch query logged with ID:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        console.error('❌ Error logging StitchWitch query:', error);
        return null;
    }
}

export function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getDeviceType() {
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

export function createStitchFinderQuery(userEmail, patternData, step, stitchPosition, contextWindow, chunkInfo) {
    return {
        userEmail,
        queryType: 'stitch_finder',
        patternName: patternData?.metadata?.name || 'Unknown Pattern',
        patternAuthor: patternData?.metadata?.author || 'Unknown Author',
        step,
        stitchPosition,
        contextWindow,
        chunkInfo,
        deviceType: getDeviceType()
    };
}

export function createNavigationQuery(userEmail, patternData, fromStep, toStep, direction) {
    return {
        userEmail,
        queryType: 'navigation',
        patternName: patternData?.metadata?.name || 'Unknown Pattern',
        patternAuthor: patternData?.metadata?.author || 'Unknown Author',
        fromStep,
        toStep,
        direction,
        deviceType: getDeviceType()
    };
}

export function createGeneratorQuery(userEmail, generatorType, promptUsed, successful = true) {
    return {
        userEmail,
        queryType: 'generator',
        generatorType,
        promptUsed,
        successful,
        deviceType: getDeviceType()
    };
}

// Enhanced stitch context function for new Firestore schema
export function getStitchContext(stepData, stitchPosition, PATTERN_DATA, contextSize = 4) {
    if (!stepData || !stepData.instruction) {
        return null;
    }
    
    // Parse the simple instruction format (e.g., "k2, kfb, k3")
    const instructionParts = stepData.instruction.split(/[,\s]+/).filter(part => part.trim());
    const expandedStitches = [];
    
    // Expand each instruction part
    instructionParts.forEach(part => {
        const trimmedPart = part.trim();
        
        // Handle numbered instructions like "k2", "MB3", etc.
        const match = trimmedPart.match(/^([a-zA-Z]+)(\d+)?$/);
        if (match) {
            const [, stitchCode, count] = match;
            const repeatCount = count ? parseInt(count) : 1;
            
            for (let i = 0; i < repeatCount; i++) {
                expandedStitches.push({ stitch: stitchCode, position: expandedStitches.length + 1 });
            }
        } else {
            // Single stitch without count
            expandedStitches.push({ stitch: trimmedPart, position: expandedStitches.length + 1 });
        }
    });
    
    // Check if target stitch position is valid
    if (stitchPosition < 1 || stitchPosition > expandedStitches.length) {
        return null;
    }
    
    // Get context window
    const startIndex = Math.max(0, stitchPosition - 1 - contextSize);
    const endIndex = Math.min(expandedStitches.length - 1, stitchPosition - 1 + contextSize);
    
    const contextStitches = expandedStitches.slice(startIndex, endIndex + 1);
    
    return {
        startPosition: startIndex + 1,
        endPosition: endIndex + 1,
        context: contextStitches,
        totalStitches: expandedStitches.length,
        targetStitch: expandedStitches[stitchPosition - 1],
        instruction: stepData.instruction,
        section: stepData.section
    };
}