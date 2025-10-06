// auth-guard.js - Centralized authentication management
// This module ensures only authenticated users can access protected pages

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Firebase configuration - consistent across all pages
const firebaseConfig = {
    apiKey: "AIzaSyBmI_9qHr18VWclwzomAUElLTmgJ_MCI3g",
    authDomain: "nyantoasty.github.io",
    projectId: "arachne-edda2",
    storageBucket: "arachne-edda2.firebasestorage.app",
    messagingSenderId: "285468127259",
    appId: "1:285468127259:web:9a1285684a1a6b9b1548be",
    measurementId: "G-208TQKEXGG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configuration
const LOGIN_PAGE = '/login.html';
const DEFAULT_REDIRECT = '/index.html';

/**
 * Authentication Guard - Protects pages from unauthenticated access
 * 
 * Usage in protected pages:
 * ```
 * import { requireAuth } from './js/auth-guard.js';
 * 
 * requireAuth().then(user => {
 *     // User is authenticated, initialize page
 *     initializePage(user);
 * });
 * ```
 */
export function requireAuth() {
    return new Promise((resolve, reject) => {
        console.log('🔍 requireAuth called from:', window.location.href);
        
        // Check if we're already on the login page
        if (window.location.pathname === LOGIN_PAGE) {
            console.log('❌ Already on login page, rejecting');
            reject(new Error('Already on login page'));
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('🔍 Auth state changed, user:', user ? user.email : 'null');
            unsubscribe(); // Clean up listener
            
            if (user) {
                // User is authenticated
                console.log('✅ Authentication verified:', user.email);
                console.log('✅ User details:', {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    emailVerified: user.emailVerified
                });
                resolve(user);
            } else {
                // User is not authenticated - redirect to login
                console.log('❌ Authentication required, redirecting to login');
                console.log('🔍 Current path:', window.location.pathname + window.location.search);
                
                // Store the intended destination for post-login redirect
                const currentPath = window.location.pathname + window.location.search;
                // Normalize root path to index.html
                const normalizedPath = currentPath === '/' ? '/index.html' : currentPath;
                if (normalizedPath !== LOGIN_PAGE) {
                    sessionStorage.setItem('auth_redirect_url', normalizedPath);
                    console.log('💾 Stored redirect URL:', normalizedPath);
                }
                
                // Redirect to login page
                console.log('🔄 Redirecting to:', LOGIN_PAGE);
                window.location.replace(LOGIN_PAGE);
                reject(new Error('Authentication required'));
            }
        }, (error) => {
            // Authentication error
            console.error('🚨 Authentication error:', error);
            console.error('🚨 Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            window.location.replace(LOGIN_PAGE);
            reject(error);
        });
    });
}

/**
 * Redirect authenticated users away from login page
 * Use this on login.html to prevent authenticated users from seeing login form
 */
export function redirectIfAuthenticated() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Clean up listener
            
            if (user) {
                // User is already authenticated, redirect them
                const redirectUrl = sessionStorage.getItem('auth_redirect_url') || DEFAULT_REDIRECT;
                sessionStorage.removeItem('auth_redirect_url'); // Clean up
                
                console.log('✅ User already authenticated, redirecting to:', redirectUrl);
                window.location.replace(redirectUrl);
            } else {
                // User is not authenticated, let them see login page
                resolve();
            }
        }, (error) => {
            console.error('🚨 Auth state check error:', error);
            resolve(); // Let them see login page on error
        });
    });
}

/**
 * Sign out user and redirect to login
 */
export async function signOutUser() {
    try {
        await auth.signOut();
        console.log('✅ User signed out');
        window.location.replace(LOGIN_PAGE);
    } catch (error) {
        console.error('❌ Sign out error:', error);
        // Force redirect even on error
        window.location.replace(LOGIN_PAGE);
    }
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Export auth and app instances for other modules
 */
export { auth, app };

console.log('🔐 Auth Guard module loaded');