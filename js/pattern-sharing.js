// pattern-sharing.js - Pattern sharing functions with individual progress tracking
// Version: v2025-10-01-individual-progress

import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeSharedPatternProgress } from './progress-tracking.js';

/**
 * Share a pattern with another user
 * @param {Object} db - Firestore database instance
 * @param {string} patternId - Pattern ID to share
 * @param {string} targetUserId - User ID to share with
 * @param {string} permission - Permission level ('view', 'edit', 'admin')
 * @param {string} message - Optional sharing message
 * @param {string} sharingUserId - User ID doing the sharing
 */
export async function sharePattern(db, patternId, targetUserId, permission = 'view', message = '', sharingUserId) {
    try {
        // 1. Verify the sharing user has permission to share this pattern
        const sharerAccess = await getPatternAccess(db, patternId, sharingUserId);
        if (!sharerAccess || !['admin', 'edit'].includes(sharerAccess.permission)) {
            throw new Error('You do not have permission to share this pattern');
        }
        
        // 2. Check if target user already has access
        const existingAccess = await getPatternAccess(db, patternId, targetUserId);
        if (existingAccess) {
            console.log(`ℹ️ User ${targetUserId} already has access to pattern ${patternId}`);
            return existingAccess;
        }
        
        // 3. Create access record
        const accessId = `${patternId}_${targetUserId}`;
        const accessData = {
            patternId,
            userId: targetUserId,
            grantedBy: sharingUserId,
            permission,
            grantedAt: serverTimestamp(),
            expiresAt: null,
            status: 'active',
            shareReason: 'shared_by_user',
            shareMessage: message
        };
        
        await setDoc(doc(db, 'pattern_access', accessId), accessData);
        
        // 4. Create share record for tracking
        const shareData = {
            patternId,
            sharedBy: sharingUserId,
            sharedWith: targetUserId,
            shareMethod: 'direct',
            sharedAt: serverTimestamp(),
            message,
            permission,
            accepted: null, // Will be set when user responds
            acceptedAt: null
        };
        
        const shareRef = doc(collection(db, 'pattern_shares'));
        await setDoc(shareRef, shareData);
        
        // 5. Initialize progress tracking for the new user
        await initializeSharedPatternProgress(db, targetUserId, patternId, sharingUserId);
        
        // 6. Update pattern share count
        const patternRef = doc(db, 'patterns', patternId);
        const patternDoc = await getDoc(patternRef);
        if (patternDoc.exists()) {
            const currentData = patternDoc.data();
            await setDoc(patternRef, {
                shareCount: (currentData.shareCount || 0) + 1,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
        
        console.log(`✅ Pattern ${patternId} shared with user ${targetUserId}`);
        return { accessId, shareId: shareRef.id };
        
    } catch (error) {
        console.error('❌ Error sharing pattern:', error);
        throw error;
    }
}

/**
 * Get pattern access information for a user
 * @param {Object} db - Firestore database instance
 * @param {string} patternId - Pattern ID
 * @param {string} userId - User ID
 * @returns {Object|null} Access data or null if no access
 */
export async function getPatternAccess(db, patternId, userId) {
    try {
        const accessId = `${patternId}_${userId}`;
        const accessDoc = await getDoc(doc(db, 'pattern_access', accessId));
        
        if (accessDoc.exists()) {
            const data = accessDoc.data();
            // Check if access is still active and not expired
            if (data.status === 'active' && (!data.expiresAt || data.expiresAt.toDate() > new Date())) {
                return data;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error checking pattern access:', error);
        return null;
    }
}

/**
 * Get all patterns accessible to a user (owned + shared)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @returns {Array} Array of patterns with access info
 */
export async function getUserAccessiblePatterns(db, userId) {
    try {
        // Get all access records for this user
        const accessQuery = query(
            collection(db, 'pattern_access'),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        
        const accessSnapshot = await getDocs(accessQuery);
        const patterns = [];
        
        // For each access record, get the pattern data
        for (const accessDoc of accessSnapshot.docs) {
            const accessData = accessDoc.data();
            
            try {
                const patternDoc = await getDoc(doc(db, 'patterns', accessData.patternId));
                if (patternDoc.exists()) {
                    patterns.push({
                        id: accessData.patternId,
                        ...patternDoc.data(),
                        userAccess: accessData
                    });
                }
            } catch (error) {
                console.warn(`Failed to load pattern ${accessData.patternId}:`, error);
            }
        }
        
        console.log(`✅ Loaded ${patterns.length} accessible patterns for user ${userId}`);
        return patterns;
        
    } catch (error) {
        console.error('❌ Error loading user patterns:', error);
        return [];
    }
}

/**
 * Make a pattern public (accessible to everyone)
 * @param {Object} db - Firestore database instance
 * @param {string} patternId - Pattern ID
 * @param {string} userId - User ID (must be creator or admin)
 */
export async function makePatternPublic(db, patternId, userId) {
    try {
        // Verify user has admin permission
        const userAccess = await getPatternAccess(db, patternId, userId);
        if (!userAccess || userAccess.permission !== 'admin') {
            throw new Error('You do not have permission to make this pattern public');
        }
        
        // Update pattern visibility
        const patternRef = doc(db, 'patterns', patternId);
        await setDoc(patternRef, {
            visibility: 'public',
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ Pattern ${patternId} is now public`);
        return true;
        
    } catch (error) {
        console.error('❌ Error making pattern public:', error);
        throw error;
    }
}

/**
 * Get patterns shared with a user (pending acceptance)
 * @param {Object} db - Firestore database instance
 * @param {string} userId - User ID
 * @returns {Array} Array of pending shares
 */
export async function getPendingShares(db, userId) {
    try {
        const sharesQuery = query(
            collection(db, 'pattern_shares'),
            where('sharedWith', '==', userId),
            where('accepted', '==', null)
        );
        
        const sharesSnapshot = await getDocs(sharesQuery);
        const pendingShares = [];
        
        for (const shareDoc of sharesSnapshot.docs) {
            const shareData = shareDoc.data();
            
            // Get pattern info
            try {
                const patternDoc = await getDoc(doc(db, 'patterns', shareData.patternId));
                if (patternDoc.exists()) {
                    pendingShares.push({
                        shareId: shareDoc.id,
                        ...shareData,
                        pattern: patternDoc.data()
                    });
                }
            } catch (error) {
                console.warn(`Failed to load pattern for share ${shareDoc.id}:`, error);
            }
        }
        
        return pendingShares;
        
    } catch (error) {
        console.error('❌ Error loading pending shares:', error);
        return [];
    }
}

/**
 * Accept or decline a pattern share
 * @param {Object} db - Firestore database instance
 * @param {string} shareId - Share ID
 * @param {boolean} accepted - True to accept, false to decline
 * @param {string} userId - User ID responding to the share
 */
export async function respondToShare(db, shareId, accepted, userId) {
    try {
        const shareRef = doc(db, 'pattern_shares', shareId);
        const shareDoc = await getDoc(shareRef);
        
        if (!shareDoc.exists()) {
            throw new Error('Share not found');
        }
        
        const shareData = shareDoc.data();
        
        // Verify this share is for the current user
        if (shareData.sharedWith !== userId) {
            throw new Error('You are not authorized to respond to this share');
        }
        
        // Update share record
        await setDoc(shareRef, {
            accepted,
            acceptedAt: serverTimestamp()
        }, { merge: true });
        
        if (accepted) {
            // Initialize progress for accepted share (if not already done)
            await initializeSharedPatternProgress(db, userId, shareData.patternId, shareData.sharedBy);
            console.log(`✅ Share accepted: User ${userId}, Pattern ${shareData.patternId}`);
        } else {
            // Remove access record if declined
            const accessId = `${shareData.patternId}_${userId}`;
            await setDoc(doc(db, 'pattern_access', accessId), {
                status: 'declined'
            }, { merge: true });
            console.log(`❌ Share declined: User ${userId}, Pattern ${shareData.patternId}`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error responding to share:', error);
        throw error;
    }
}

/**
 * Revoke access to a pattern
 * @param {Object} db - Firestore database instance
 * @param {string} patternId - Pattern ID
 * @param {string} targetUserId - User to revoke access from
 * @param {string} revokingUserId - User doing the revoking
 */
export async function revokeAccess(db, patternId, targetUserId, revokingUserId) {
    try {
        // Verify revoking user has admin permission
        const revokerAccess = await getPatternAccess(db, patternId, revokingUserId);
        if (!revokerAccess || revokerAccess.permission !== 'admin') {
            throw new Error('You do not have permission to revoke access to this pattern');
        }
        
        // Update access record
        const accessId = `${patternId}_${targetUserId}`;
        await setDoc(doc(db, 'pattern_access', accessId), {
            status: 'revoked',
            revokedBy: revokingUserId,
            revokedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ Access revoked: Pattern ${patternId}, User ${targetUserId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error revoking access:', error);
        throw error;
    }
}