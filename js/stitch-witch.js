// stitch-witch.js - Analytics and user interaction tracking
// Version: v2025-09-29-modular

export async function logStitchWitchQuery(queryData, db) {
    try {
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

// Enhanced stitch locator with ±4 context window
export function getStitchContext(patternData, step, stitchPosition, contextSize = 4) {
    // Find the instruction for this step
    const instruction = patternData.instructions.find(instr => {
        if (instr.step === step) return true;
        if (instr.stepRange && step >= instr.stepRange[0] && step <= instr.stepRange[1]) {
            return true;
        }
        return false;
    });
    
    if (!instruction || !instruction.chunks) {
        return {
            startPosition: Math.max(1, stitchPosition - contextSize),
            endPosition: stitchPosition + contextSize,
            stitches: [],
            chunkInfo: {
                inChunk: false,
                chunkType: null,
                chunkDescription: null
            }
        };
    }
    
    // Expand the chunks to get individual stitches
    const expandedStitches = [];
    let chunkInfo = {
        inChunk: false,
        chunkType: 'regular',
        chunkDescription: instruction.section || 'Pattern instruction'
    };
    
    instruction.chunks.forEach(chunk => {
        if (chunk.repeat) {
            chunkInfo.chunkType = 'repeat';
            chunkInfo.chunkDescription = `Repeat section (${chunk.repeat.times}x)`;
            
            for (let rep = 0; rep < chunk.repeat.times; rep++) {
                chunk.repeat.instructions.forEach(repeatInstr => {
                    const count = repeatInstr.count || 1;
                    for (let i = 0; i < count; i++) {
                        expandedStitches.push(repeatInstr.instruction);
                    }
                });
            }
        } else {
            const count = chunk.count === "to marker" || chunk.count === "to last 3" || chunk.count === "to last 4" ? 1 : (chunk.count || 1);
            for (let i = 0; i < count; i++) {
                expandedStitches.push(chunk.instruction);
            }
        }
    });
    
    // Check if target stitch is within a chunk
    if (stitchPosition >= 1 && stitchPosition <= expandedStitches.length) {
        chunkInfo.inChunk = true;
    }
    
    // Get context window
    const startPosition = Math.max(1, stitchPosition - contextSize);
    const endPosition = Math.min(expandedStitches.length, stitchPosition + contextSize);
    
    const contextStitches = [];
    for (let i = startPosition; i <= endPosition; i++) {
        if (i >= 1 && i <= expandedStitches.length) {
            contextStitches.push(expandedStitches[i - 1]); // Convert to 0-based index
        }
    }
    
    return {
        startPosition,
        endPosition,
        stitches: contextStitches,
        chunkInfo
    };
}