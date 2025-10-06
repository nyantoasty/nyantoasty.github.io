# Firebase Integration Guidelines

## Overview
To avoid "Firebase App named '[DEFAULT]' already exists" errors, all pages must use the shared Firebase configuration.

## Correct Pattern ✅

```javascript
// Import the shared Firebase instances
import { auth, db, app } from './js/firebase-config.js';

// Import specific Firebase functions as needed
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Use the imported instances directly
onAuthStateChanged(auth, (user) => {
    // Your auth logic here
});
```

## Incorrect Pattern ❌

```javascript
// DON'T DO THIS - Creates duplicate Firebase app
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = { /* config */ };
const app = initializeApp(firebaseConfig); // ERROR: Duplicate app!
const auth = getAuth(app);
```

## Rules

1. **Always import from `./js/firebase-config.js`** - Never initialize Firebase directly
2. **Import specific functions** - Only import the Firebase functions you actually need
3. **Use shared instances** - Use the exported `auth`, `db`, and `app` instances
4. **No duplicate configs** - Never define firebaseConfig in individual pages

## Page Template

```html
<script type="module">
    // 1. Import shared Firebase instances
    import { auth, db, app } from './js/firebase-config.js';
    
    // 2. Import only needed Firebase functions
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
    
    // 3. Use the shared instances
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User signed in:', user.uid);
        }
    });
</script>
```

## Updated Pages
- ✅ index.html - Uses shared config
- ✅ pattern-upload.html - Uses shared config  
- ✅ pattern-manager.html - Uses shared config
- ✅ Stitch_Glossary.html - Fixed to use shared config

## Common Import Combinations

### Auth Only
```javascript
import { auth } from './js/firebase-config.js';
import { onAuthStateChanged, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
```

### Firestore Only
```javascript
import { db } from './js/firebase-config.js';
import { doc, getDoc, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
```

### Both Auth and Firestore
```javascript
import { auth, db } from './js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
```

This pattern ensures consistent Firebase usage across all pages and prevents duplicate app errors.