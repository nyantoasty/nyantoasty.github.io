// firebase-config.js - Firebase configuration and initialization for modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmI_9qHr18VWclwzomAUElLTmgJ_MCI3g",
    authDomain: "arachne-edda2.firebaseapp.com",
    projectId: "arachne-edda2",
    storageBucket: "arachne-edda2.firebasestorage.app",
    messagingSenderId: "285468127259",
    appId: "1:285468127259:web:9a1285684a1a6b9b1548be",
    measurementId: "G-208TQKEXGG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };

console.log('🔥 Firebase config module loaded');