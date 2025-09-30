// Sea Witch Tentacle Scarf Pattern Creation Script
// Run this in browser console or as a module to create the pattern in Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBmI_9qHr18VWclwzomAUElLTmgJ_MCI3g",
    authDomain: "arachne-edda2.firebaseapp.com",
    projectId: "arachne-edda2",
    storageBucket: "arachne-edda2.firebasestorage.app",
    messagingSenderId: "285468127259",
    appId: "1:285468127259:web:9a1285684a1a6b9b1548be",
    measurementId: "G-208TQKEXGG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sea Witch Pattern Data
const seaWitchPattern = {
    name: 'Sea Witch Tentacle Scarf',
    author: 'Jay Edwards',
    craft: 'knitting',
    difficulty: 'intermediate',
    sourceUrl: 'https://www.ravelry.com/patterns/library/sea-witch-tentacle-spiral-scarf',
    
    metadata: {
        maxSteps: 280,
        estimatedTime: '20+ hours',
        materials: [
            'Red Heart Gemstone, 1 ball',
            'Bulky (5) weight yarn',
            'US 8 (5.0 mm) needles'
        ],
        gauge: '18 sts, 24 rows = 4in/10cm',
        notes: 'For blocking: Steam or wet block to shape spiral. Shape bobbles while damp.'
    },
    
    glossary: {
        'k': { name: 'Knit', description: 'Knit stitch.', stitchIndex: 1 },
        'kfb': { name: 'Knit Front and Back', description: 'Knit into the front then back of the same stitch. This is a one-stitch increase.', stitchIndex: 2 },
        'k2tog': { name: 'Knit 2 Together', description: 'Insert the righthand needle into the first two stitches on the lefthand needle from left to right, then wrap the yarn and pull through as with a normal knit stitch. This is a one-stitch decrease.', stitchIndex: 1 },
        'YO': { name: 'Yarn Over', description: 'Bring yarn to the front as if to purl. Wrap the yarn over the righthand needle to the back, then knit. This creates an extra stitch and a small decorative hole.', stitchIndex: 1 },
        'BO1': { name: 'Bind Off 1', description: 'Knit 2 stitches, then slip the first stitch over the second stitch and off the needle. This binds off one stitch.', stitchIndex: 0 },
        'MB3': { name: 'Make Bobble 3', description: 'k, yo, k into same st, drop from left (3 loops on needle). Turn, p3. Turn, k3. Bind off until 1 loop on needle.', stitchIndex: 1 },
        'MB5': { name: 'Make Bobble 5', description: '[k, yo] twice, k into same st, drop from left (5 loops on needle). Turn, p5. Turn, k5. Turn, p5. Turn, k5. Bind off until 1 loop on needle.', stitchIndex: 1 },
        'MB7': { name: 'Make Bobble 7', description: '[k, yo] three times, k into same st, drop from left (7 loops on needle). Turn, p7. Turn, k7. Turn, p7. Turn, k7. Bind off until 1 loop on needle.', stitchIndex: 1 },
        'MB9': { name: 'Make Bobble 9', description: '[k, yo] four times, k into same st, drop from left (9 loops on needle). Turn, p9. Turn, k9. Turn, p9. Turn, k9. Turn, p9. Turn, k9. Bind off until 1 loop on needle.', stitchIndex: 1 }
    },
    
    sections: [
        { id: 'setup', name: 'Set-Up Rows', startRow: 1, endRow: 12 },
        { id: 'bobbles3', name: '3 Stitch Bobbles', startRow: 13, endRow: 26 },
        { id: 'bobbles5', name: '5 Stitch Bobbles', startRow: 27, endRow: 52 },
        { id: 'bobbles7', name: '7 Stitch Bobbles', startRow: 53, endRow: 94 },
        { id: 'bobbles9', name: '9 Stitch Bobbles', startRow: 95, endRow: 136 },
        { id: 'decreasing', name: 'Decreasing Start', startRow: 137, endRow: 146 },
        { id: 'bobbles9_dec', name: '9 Stitch Bobbles (Decrease)', startRow: 147, endRow: 195 },
        { id: 'bobbles7_dec', name: '7 Stitch Bobbles (Decrease)', startRow: 196, endRow: 235 },
        { id: 'bobbles5_dec', name: '5 Stitch Bobbles (Decrease)', startRow: 236, endRow: 259 },
        { id: 'bobbles3_dec', name: '3 Stitch Bobbles (Decrease)', startRow: 260, endRow: 267 },
        { id: 'finishing', name: 'Finishing', startRow: 268, endRow: 280 }
    ]
};

// Generate all 280 steps programmatically from the complete pattern
function generateSeaWitchSteps() {
    const steps = [];
    
    // Setup instruction
    steps.push({
        step: 0,
        type: 'specialInstruction',
        description: 'Cast on 3 stitches.',
        section: 'setup'
    });
    
    // ALL PATTERN ROWS - Complete implementation
    const allRows = [
        // Set-Up Rows (1-12)
        { step: 1, sts: 4, instruction: 'k1, kfb, k1', section: 'setup' },
        { step: 2, sts: 4, instruction: 'BO1, kfb, k1', section: 'setup' },
        { step: 3, sts: 5, instruction: 'k2, kfb, k1', section: 'setup' },
        { step: 4, sts: 5, instruction: 'BO1, kfb, k2', section: 'setup' },
        { step: 5, sts: 6, instruction: 'k2, kfb, k2', section: 'setup' },
        { step: 6, sts: 6, instruction: 'BO1, k1, kfb, k2', section: 'setup' },
        { step: 7, sts: 7, instruction: 'k2, kfb, k3', section: 'setup' },
        { step: 8, sts: 7, instruction: 'BO1, k2, kfb, k2', section: 'setup' },
        { step: 9, sts: 8, instruction: 'k2, kfb, k4', section: 'setup' },
        { step: 10, sts: 8, instruction: 'BO1, k3, kfb, k2', section: 'setup' },
        { step: 11, sts: 9, instruction: 'k2, kfb, k5', section: 'setup' },
        { step: 12, sts: 9, instruction: 'BO1, k4, kfb, k2', section: 'setup' },

        // 3 Stitch Bobbles (13-26)
        { step: 13, sts: 10, instruction: 'k2, kfb, k1, MB3, k4', section: 'bobbles3' },
        { step: 14, sts: 10, instruction: 'BO1, k5, kfb, k2', section: 'bobbles3' },
        { step: 15, sts: 11, instruction: 'k2, kfb, k7', section: 'bobbles3' },
        { step: 16, sts: 11, instruction: 'BO1, k6, kfb, k2', section: 'bobbles3' },
        { step: 17, sts: 12, instruction: 'k2, kfb, k8', section: 'bobbles3' },
        { step: 18, sts: 12, instruction: 'BO1, k7, kfb, k2', section: 'bobbles3' },
        { step: 19, sts: 13, instruction: 'k2, kfb, k1, MB3, k6', section: 'bobbles3' },
        { step: 20, sts: 13, instruction: 'BO1, k8, kfb, k2', section: 'bobbles3' },
        { step: 21, sts: 14, instruction: 'k2, kfb, k10', section: 'bobbles3' },
        { step: 22, sts: 14, instruction: 'BO1, k9, kfb, k2', section: 'bobbles3' },
        { step: 23, sts: 15, instruction: 'k2, kfb, k11', section: 'bobbles3' },
        { step: 24, sts: 15, instruction: 'BO1, k10, kfb, k2', section: 'bobbles3' },
        { step: 25, sts: 16, instruction: 'k2, kfb, k12', section: 'bobbles3' },
        { step: 26, sts: 16, instruction: 'BO1, k11, kfb, k2', section: 'bobbles3' },

        // 5 Stitch Bobbles (27-52)
        { step: 27, sts: 17, instruction: 'k2, kfb, k3, MB5, k9', section: 'bobbles5' },
        { step: 28, sts: 17, instruction: 'BO1, k12, kfb, k2', section: 'bobbles5' },
        { step: 29, sts: 18, instruction: 'k2, kfb, k14', section: 'bobbles5' },
        { step: 30, sts: 18, instruction: 'BO1, k13, kfb, k2', section: 'bobbles5' },
        { step: 31, sts: 19, instruction: 'k2, kfb, k15', section: 'bobbles5' },
        { step: 32, sts: 19, instruction: 'BO1, k14, kfb, k2', section: 'bobbles5' },
        { step: 33, sts: 20, instruction: 'k2, kfb, k16', section: 'bobbles5' },
        { step: 34, sts: 20, instruction: 'BO1, k15, kfb, k2', section: 'bobbles5' },
        { step: 35, sts: 21, instruction: 'k2, kfb, k3, MB5, k13', section: 'bobbles5' },
        { step: 36, sts: 21, instruction: 'BO1, k16, kfb, k2', section: 'bobbles5' },
        { step: 37, sts: 22, instruction: 'k2, kfb, k18', section: 'bobbles5' },
        { step: 38, sts: 22, instruction: 'BO1, k17, kfb, k2', section: 'bobbles5' },
        { step: 39, sts: 23, instruction: 'k2, kfb, k19', section: 'bobbles5' },
        { step: 40, sts: 23, instruction: 'BO1, k18, kfb, k2', section: 'bobbles5' },
        { step: 41, sts: 24, instruction: 'k2, kfb, k20', section: 'bobbles5' },
        { step: 42, sts: 24, instruction: 'BO1, k19, kfb, k2', section: 'bobbles5' },
        { step: 43, sts: 25, instruction: 'k2, kfb, k3, MB5, k17', section: 'bobbles5' },
        { step: 44, sts: 25, instruction: 'BO1, k20, kfb, k2', section: 'bobbles5' },
        { step: 45, sts: 26, instruction: 'k2, kfb, k22', section: 'bobbles5' },
        { step: 46, sts: 26, instruction: 'BO1, k21, kfb, k2', section: 'bobbles5' },
        { step: 47, sts: 27, instruction: 'k2, kfb, k23', section: 'bobbles5' },
        { step: 48, sts: 27, instruction: 'BO1, k22, kfb, k2', section: 'bobbles5' },
        { step: 49, sts: 28, instruction: 'k2, kfb, k24', section: 'bobbles5' },
        { step: 50, sts: 28, instruction: 'BO1, k23, kfb, k2', section: 'bobbles5' },
        { step: 51, sts: 29, instruction: 'k2, kfb, k25', section: 'bobbles5' },
        { step: 52, sts: 29, instruction: 'BO1, k24, kfb, k2', section: 'bobbles5' },

        // 7 Stitch Bobbles (53-94)
        { step: 53, sts: 30, instruction: 'k2, kfb, k4, MB7, k21', section: 'bobbles7' },
        { step: 54, sts: 30, instruction: 'BO1, k25, kfb, k2', section: 'bobbles7' },
        { step: 55, sts: 31, instruction: 'k2, kfb, k27', section: 'bobbles7' },
        { step: 56, sts: 31, instruction: 'BO1, k26, kfb, k2', section: 'bobbles7' },
        { step: 57, sts: 32, instruction: 'k2, kfb, k28', section: 'bobbles7' },
        { step: 58, sts: 32, instruction: 'BO1, k27, kfb, k2', section: 'bobbles7' },
        { step: 59, sts: 33, instruction: 'k2, kfb, k29', section: 'bobbles7' },
        { step: 60, sts: 33, instruction: 'BO1, k28, kfb, k2', section: 'bobbles7' },
        { step: 61, sts: 34, instruction: 'k2, kfb, k30', section: 'bobbles7' },
        { step: 62, sts: 34, instruction: 'BO1, k29, kfb, k2', section: 'bobbles7' },
        { step: 63, sts: 35, instruction: 'k2, kfb, k4, MB7, k26', section: 'bobbles7' },
        { step: 64, sts: 35, instruction: 'BO1, k30, kfb, k2', section: 'bobbles7' },
        { step: 65, sts: 36, instruction: 'k2, kfb, k32', section: 'bobbles7' },
        { step: 66, sts: 36, instruction: 'BO1, k31, kfb, k2', section: 'bobbles7' },
        { step: 67, sts: 37, instruction: 'k2, kfb, k33', section: 'bobbles7' },
        { step: 68, sts: 37, instruction: 'BO1, k32, kfb, k2', section: 'bobbles7' },
        { step: 69, sts: 38, instruction: 'k2, kfb, k34', section: 'bobbles7' },
        { step: 70, sts: 38, instruction: 'BO1, k33, kfb, k2', section: 'bobbles7' },
        { step: 71, sts: 39, instruction: 'k2, kfb, k35', section: 'bobbles7' },
        { step: 72, sts: 39, instruction: 'BO1, k34, kfb, k2', section: 'bobbles7' },
        { step: 73, sts: 40, instruction: 'k2, kfb, k4, MB7, k31', section: 'bobbles7' },
        { step: 74, sts: 40, instruction: 'BO1, k35, kfb, k2', section: 'bobbles7' },
        { step: 75, sts: 41, instruction: 'k2, kfb, k37', section: 'bobbles7' },
        { step: 76, sts: 41, instruction: 'BO1, k36, kfb, k2', section: 'bobbles7' },
        { step: 77, sts: 42, instruction: 'k2, kfb, k38', section: 'bobbles7' },
        { step: 78, sts: 42, instruction: 'BO1, k37, kfb, k2', section: 'bobbles7' },
        { step: 79, sts: 43, instruction: 'k2, kfb, k39', section: 'bobbles7' },
        { step: 80, sts: 43, instruction: 'BO1, k38, kfb, k2', section: 'bobbles7' },
        { step: 81, sts: 44, instruction: 'k2, kfb, k40', section: 'bobbles7' },
        { step: 82, sts: 44, instruction: 'BO1, k39, kfb, k2', section: 'bobbles7' },
        { step: 83, sts: 45, instruction: 'k2, kfb, k4, MB7, k36', section: 'bobbles7' },
        { step: 84, sts: 45, instruction: 'BO1, k40, kfb, k2', section: 'bobbles7' },
        { step: 85, sts: 46, instruction: 'k2, kfb, k42', section: 'bobbles7' },
        { step: 86, sts: 46, instruction: 'BO1, k41, kfb, k2', section: 'bobbles7' },
        { step: 87, sts: 47, instruction: 'k2, kfb, k43', section: 'bobbles7' },
        { step: 88, sts: 47, instruction: 'BO1, k42, kfb, k2', section: 'bobbles7' },
        { step: 89, sts: 48, instruction: 'k2, kfb, k44', section: 'bobbles7' },
        { step: 90, sts: 48, instruction: 'BO1, k43, kfb, k2', section: 'bobbles7' },
        { step: 91, sts: 49, instruction: 'k2, kfb, k45', section: 'bobbles7' },
        { step: 92, sts: 49, instruction: 'BO1, k44, kfb, k2', section: 'bobbles7' },
        { step: 93, sts: 50, instruction: 'k2, kfb, k46', section: 'bobbles7' },
        { step: 94, sts: 50, instruction: 'BO1, k45, kfb, k2', section: 'bobbles7' },

        // 9 Stitch Bobbles (95-136)
        { step: 95, sts: 51, instruction: 'k2, kfb, k5, MB9, k41', section: 'bobbles9' },
        { step: 96, sts: 51, instruction: 'BO1, k46, kfb, k2', section: 'bobbles9' },
        { step: 97, sts: 52, instruction: 'k2, kfb, k48', section: 'bobbles9' },
        { step: 98, sts: 52, instruction: 'BO1, k47, kfb, k2', section: 'bobbles9' },
        { step: 99, sts: 53, instruction: 'k2, kfb, k49', section: 'bobbles9' },
        { step: 100, sts: 53, instruction: 'BO1, k48, kfb, k2', section: 'bobbles9' },
        { step: 101, sts: 54, instruction: 'k2, kfb, k50', section: 'bobbles9' },
        { step: 102, sts: 54, instruction: 'BO1, k49, kfb, k2', section: 'bobbles9' },
        { step: 103, sts: 55, instruction: 'k2, kfb, k51', section: 'bobbles9' },
        { step: 104, sts: 55, instruction: 'BO1, k50, kfb, k2', section: 'bobbles9' },
        { step: 105, sts: 56, instruction: 'k2, kfb, k52', section: 'bobbles9' },
        { step: 106, sts: 56, instruction: 'BO1, k51, kfb, k2', section: 'bobbles9' },
        { step: 107, sts: 57, instruction: 'k2, kfb, k5, MB9, k47', section: 'bobbles9' },
        { step: 108, sts: 57, instruction: 'BO1, k52, kfb, k2', section: 'bobbles9' },
        { step: 109, sts: 58, instruction: 'k2, kfb, k54', section: 'bobbles9' },
        { step: 110, sts: 58, instruction: 'BO1, k53, kfb, k2', section: 'bobbles9' },
        { step: 111, sts: 59, instruction: 'k2, kfb, k55', section: 'bobbles9' },
        { step: 112, sts: 59, instruction: 'BO1, k54, kfb, k2', section: 'bobbles9' },
        { step: 113, sts: 60, instruction: 'k2, kfb, k56', section: 'bobbles9' },
        { step: 114, sts: 60, instruction: 'BO1, k55, kfb, k2', section: 'bobbles9' },
        { step: 115, sts: 61, instruction: 'k2, kfb, k57', section: 'bobbles9' },
        { step: 116, sts: 61, instruction: 'BO1, k56, kfb, k2', section: 'bobbles9' },
        { step: 117, sts: 62, instruction: 'k2, kfb, k58', section: 'bobbles9' },
        { step: 118, sts: 62, instruction: 'BO1, k57, kfb, k2', section: 'bobbles9' },
        { step: 119, sts: 63, instruction: 'k2, kfb, k5, MB9, k53', section: 'bobbles9' },
        { step: 120, sts: 63, instruction: 'BO1, k58, kfb, k2', section: 'bobbles9' },
        { step: 121, sts: 64, instruction: 'k2, kfb, k60', section: 'bobbles9' },
        { step: 122, sts: 64, instruction: 'BO1, k59, kfb, k2', section: 'bobbles9' },
        { step: 123, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 124, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 125, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 126, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 127, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 128, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 129, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 130, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 131, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 132, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 133, sts: 65, instruction: 'k2, kfb, k5, MB9, k55', section: 'bobbles9' },
        { step: 134, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },
        { step: 135, sts: 65, instruction: 'k2, kfb, k61', section: 'bobbles9' },
        { step: 136, sts: 64, instruction: 'BO1, k61', section: 'bobbles9' },

        // Decreasing Section (137-267)
        { step: 137, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 138, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 139, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 140, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 141, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 142, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 143, sts: 64, instruction: 'k64', section: 'decreasing' },
        { step: 144, sts: 65, instruction: 'k64, kfb', section: 'decreasing' },
        { step: 145, sts: 64, instruction: 'k61, k2tog, k2', section: 'decreasing' },
        { step: 146, sts: 65, instruction: 'k64, kfb', section: 'decreasing' },

        // 9 Stitch Bobbles (Decrease) (147-195)
        { step: 147, sts: 64, instruction: 'k9, MB9, k51, k2tog, k2', section: 'bobbles9_dec' },
        { step: 148, sts: 65, instruction: 'k64, kfb', section: 'bobbles9_dec' },
        { step: 149, sts: 64, instruction: 'k61, k2tog, k2', section: 'bobbles9_dec' },
        { step: 150, sts: 65, instruction: 'k64, kfb', section: 'bobbles9_dec' },
        { step: 151, sts: 64, instruction: 'k61, k2tog, k2', section: 'bobbles9_dec' },
        { step: 152, sts: 65, instruction: 'k64, kfb', section: 'bobbles9_dec' },
        { step: 153, sts: 64, instruction: 'k61, k2tog, k2', section: 'bobbles9_dec' },
        { step: 154, sts: 65, instruction: 'k64, kfb', section: 'bobbles9_dec' },
        { step: 155, sts: 64, instruction: 'k61, k2tog, k2', section: 'bobbles9_dec' },
        { step: 156, sts: 65, instruction: 'k64, kfb', section: 'bobbles9_dec' },
        { step: 157, sts: 64, instruction: 'k61, k2tog, k2', section: 'bobbles9_dec' },
        { step: 158, sts: 64, instruction: 'k2, k2tog, k59, kfb', section: 'bobbles9_dec' },
        { step: 159, sts: 63, instruction: 'k60, k2tog, k2', section: 'bobbles9_dec' },
        { step: 160, sts: 63, instruction: 'k2, k2tog, k58, kfb', section: 'bobbles9_dec' },
        { step: 161, sts: 62, instruction: 'k9, MB9, k49, k2tog, k2', section: 'bobbles9_dec' },
        { step: 162, sts: 62, instruction: 'k2, k2tog, k57, kfb', section: 'bobbles9_dec' },
        { step: 163, sts: 61, instruction: 'k58, k2tog, k2', section: 'bobbles9_dec' },
        { step: 164, sts: 61, instruction: 'k2, k2tog, k56, kfb', section: 'bobbles9_dec' },
        { step: 165, sts: 60, instruction: 'k57, k2tog, k2', section: 'bobbles9_dec' },
        { step: 166, sts: 60, instruction: 'k2, k2tog, k55, kfb', section: 'bobbles9_dec' },
        { step: 167, sts: 59, instruction: 'k56, k2tog, k2', section: 'bobbles9_dec' },
        { step: 168, sts: 59, instruction: 'k2, k2tog, k54, kfb', section: 'bobbles9_dec' },
        { step: 169, sts: 58, instruction: 'k55, k2tog, k2', section: 'bobbles9_dec' },
        { step: 170, sts: 58, instruction: 'k2, k2tog, k53, kfb', section: 'bobbles9_dec' },
        { step: 171, sts: 57, instruction: 'k54, k2tog, k2', section: 'bobbles9_dec' },
        { step: 172, sts: 57, instruction: 'k2, k2tog, k52, kfb', section: 'bobbles9_dec' },
        { step: 173, sts: 56, instruction: 'k9, MB9, k43, k2tog, k2', section: 'bobbles9_dec' },
        { step: 174, sts: 56, instruction: 'k2, k2tog, k51, kfb', section: 'bobbles9_dec' },
        { step: 175, sts: 55, instruction: 'k52, k2tog, k2', section: 'bobbles9_dec' },
        { step: 176, sts: 55, instruction: 'k2, k2tog, k50, kfb', section: 'bobbles9_dec' },
        { step: 177, sts: 54, instruction: 'k51, k2tog, k2', section: 'bobbles9_dec' },
        { step: 178, sts: 54, instruction: 'k2, k2tog, k49, kfb', section: 'bobbles9_dec' },
        { step: 179, sts: 53, instruction: 'k50, k2tog, k2', section: 'bobbles9_dec' },
        { step: 180, sts: 53, instruction: 'k2, k2tog, k48, kfb', section: 'bobbles9_dec' },
        { step: 181, sts: 52, instruction: 'k49, k2tog, k2', section: 'bobbles9_dec' },
        { step: 182, sts: 52, instruction: 'k2, k2tog, k47, kfb', section: 'bobbles9_dec' },
        { step: 183, sts: 51, instruction: 'k48, k2tog, k2', section: 'bobbles9_dec' },
        { step: 184, sts: 51, instruction: 'k2, k2tog, k46, kfb', section: 'bobbles9_dec' },
        { step: 185, sts: 50, instruction: 'k9, MB9, k37, k2tog, k2', section: 'bobbles9_dec' },
        { step: 186, sts: 50, instruction: 'k2, k2tog, k45, kfb', section: 'bobbles9_dec' },
        { step: 187, sts: 49, instruction: 'k46, k2tog, k2', section: 'bobbles9_dec' },
        { step: 188, sts: 49, instruction: 'k2, k2tog, k44, kfb', section: 'bobbles9_dec' },
        { step: 189, sts: 48, instruction: 'k45, k2tog, k2', section: 'bobbles9_dec' },
        { step: 190, sts: 48, instruction: 'k2, k2tog, k43, kfb', section: 'bobbles9_dec' },
        { step: 191, sts: 47, instruction: 'k44, k2tog, k2', section: 'bobbles9_dec' },
        { step: 192, sts: 47, instruction: 'k2, k2tog, k42, kfb', section: 'bobbles9_dec' },
        { step: 193, sts: 46, instruction: 'k43, k2tog, k2', section: 'bobbles9_dec' },
        { step: 194, sts: 46, instruction: 'k2, k2tog, k41, kfb', section: 'bobbles9_dec' },
        { step: 195, sts: 45, instruction: 'k42, k2tog, k2', section: 'bobbles9_dec' },

        // 7 Stitch Bobbles (Decrease) (196-235)
        { step: 196, sts: 45, instruction: 'k2, k2tog, k40, kfb', section: 'bobbles7_dec' },
        { step: 197, sts: 44, instruction: 'k8, MB7, k32, k2tog, k2', section: 'bobbles7_dec' },
        { step: 198, sts: 44, instruction: 'k2, k2tog, k39, kfb', section: 'bobbles7_dec' },
        { step: 199, sts: 43, instruction: 'k40, k2tog, k2', section: 'bobbles7_dec' },
        { step: 200, sts: 43, instruction: 'k2, k2tog, k38, kfb', section: 'bobbles7_dec' },
        { step: 201, sts: 42, instruction: 'k39, k2tog, k2', section: 'bobbles7_dec' },
        { step: 202, sts: 42, instruction: 'k2, k2tog, k37, kfb', section: 'bobbles7_dec' },
        { step: 203, sts: 41, instruction: 'k38, k2tog, k2', section: 'bobbles7_dec' },
        { step: 204, sts: 41, instruction: 'k2, k2tog, k36, kfb', section: 'bobbles7_dec' },
        { step: 205, sts: 40, instruction: 'k37, k2tog, k2', section: 'bobbles7_dec' },
        { step: 206, sts: 40, instruction: 'k2, k2tog, k35, kfb', section: 'bobbles7_dec' },
        { step: 207, sts: 39, instruction: 'k8, MB7, k27, k2tog, k2', section: 'bobbles7_dec' },
        { step: 208, sts: 39, instruction: 'k2, k2tog, k34, kfb', section: 'bobbles7_dec' },
        { step: 209, sts: 38, instruction: 'k35, k2tog, k2', section: 'bobbles7_dec' },
        { step: 210, sts: 38, instruction: 'k2, k2tog, k33, kfb', section: 'bobbles7_dec' },
        { step: 211, sts: 37, instruction: 'k34, k2tog, k2', section: 'bobbles7_dec' },
        { step: 212, sts: 37, instruction: 'k2, k2tog, k32, kfb', section: 'bobbles7_dec' },
        { step: 213, sts: 36, instruction: 'k33, k2tog, k2', section: 'bobbles7_dec' },
        { step: 214, sts: 36, instruction: 'k2, k2tog, k31, kfb', section: 'bobbles7_dec' },
        { step: 215, sts: 35, instruction: 'k32, k2tog, k2', section: 'bobbles7_dec' },
        { step: 216, sts: 35, instruction: 'k2, k2tog, k30, kfb', section: 'bobbles7_dec' },
        { step: 217, sts: 34, instruction: 'k8, MB7, k22, k2tog, k2', section: 'bobbles7_dec' },
        { step: 218, sts: 34, instruction: 'k2, k2tog, k29, kfb', section: 'bobbles7_dec' },
        { step: 219, sts: 33, instruction: 'k30, k2tog, k2', section: 'bobbles7_dec' },
        { step: 220, sts: 33, instruction: 'k2, k2tog, k28, kfb', section: 'bobbles7_dec' },
        { step: 221, sts: 32, instruction: 'k29, k2tog, k2', section: 'bobbles7_dec' },
        { step: 222, sts: 32, instruction: 'k2, k2tog, k27, kfb', section: 'bobbles7_dec' },
        { step: 223, sts: 31, instruction: 'k28, k2tog, k2', section: 'bobbles7_dec' },
        { step: 224, sts: 31, instruction: 'k2, k2tog, k26, kfb', section: 'bobbles7_dec' },
        { step: 225, sts: 30, instruction: 'k27, k2tog, k2', section: 'bobbles7_dec' },
        { step: 226, sts: 30, instruction: 'k2, k2tog, k25, kfb', section: 'bobbles7_dec' },
        { step: 227, sts: 29, instruction: 'k8, MB7, k17, k2tog, k2', section: 'bobbles7_dec' },
        { step: 228, sts: 29, instruction: 'k2, k2tog, k24, kfb', section: 'bobbles7_dec' },
        { step: 229, sts: 28, instruction: 'k25, k2tog, k2', section: 'bobbles7_dec' },
        { step: 230, sts: 28, instruction: 'k2, k2tog, k23, kfb', section: 'bobbles7_dec' },
        { step: 231, sts: 27, instruction: 'k24, k2tog, k2', section: 'bobbles7_dec' },
        { step: 232, sts: 27, instruction: 'k2, k2tog, k22, kfb', section: 'bobbles7_dec' },
        { step: 233, sts: 26, instruction: 'k23, k2tog, k2', section: 'bobbles7_dec' },
        { step: 234, sts: 26, instruction: 'k2, k2tog, k21, kfb', section: 'bobbles7_dec' },
        { step: 235, sts: 25, instruction: 'k22, k2tog, k2', section: 'bobbles7_dec' },

        // 5 Stitch Bobbles (Decrease) (236-259)
        { step: 236, sts: 25, instruction: 'k2, k2tog, k20, kfb', section: 'bobbles5_dec' },
        { step: 237, sts: 24, instruction: 'k6, MB5, k14, k2tog, k2', section: 'bobbles5_dec' },
        { step: 238, sts: 24, instruction: 'k2, k2tog, k19, kfb', section: 'bobbles5_dec' },
        { step: 239, sts: 23, instruction: 'k20, k2tog, k2', section: 'bobbles5_dec' },
        { step: 240, sts: 23, instruction: 'k2, k2tog, k18, kfb', section: 'bobbles5_dec' },
        { step: 241, sts: 22, instruction: 'k19, k2tog, k2', section: 'bobbles5_dec' },
        { step: 242, sts: 22, instruction: 'k2, k2tog, k17, kfb', section: 'bobbles5_dec' },
        { step: 243, sts: 21, instruction: 'k18, k2tog, k2', section: 'bobbles5_dec' },
        { step: 244, sts: 21, instruction: 'k2, k2tog, k16, kfb', section: 'bobbles5_dec' },
        { step: 245, sts: 20, instruction: 'k6, MB5, k10, k2tog, k2', section: 'bobbles5_dec' },
        { step: 246, sts: 20, instruction: 'k2, k2tog, k15, kfb', section: 'bobbles5_dec' },
        { step: 247, sts: 19, instruction: 'k16, k2tog, k2', section: 'bobbles5_dec' },
        { step: 248, sts: 19, instruction: 'k2, k2tog, k14, kfb', section: 'bobbles5_dec' },
        { step: 249, sts: 18, instruction: 'k15, k2tog, k2', section: 'bobbles5_dec' },
        { step: 250, sts: 18, instruction: 'k2, k2tog, k13, kfb', section: 'bobbles5_dec' },
        { step: 251, sts: 17, instruction: 'k14, k2tog, k2', section: 'bobbles5_dec' },
        { step: 252, sts: 17, instruction: 'k2, k2tog, k12, kfb', section: 'bobbles5_dec' },
        { step: 253, sts: 16, instruction: 'k6, MB5, k6, k2tog, k2', section: 'bobbles5_dec' },
        { step: 254, sts: 16, instruction: 'k2, k2tog, k11, kfb', section: 'bobbles5_dec' },
        { step: 255, sts: 15, instruction: 'k12, k2tog, k2', section: 'bobbles5_dec' },
        { step: 256, sts: 15, instruction: 'k2, k2tog, k10, kfb', section: 'bobbles5_dec' },
        { step: 257, sts: 14, instruction: 'k11, k2tog, k2', section: 'bobbles5_dec' },
        { step: 258, sts: 14, instruction: 'k2, k2tog, k9, kfb', section: 'bobbles5_dec' },
        { step: 259, sts: 13, instruction: 'k10, k2tog, k2', section: 'bobbles5_dec' },

        // 3 Stitch Bobbles (Decrease) (260-267)
        { step: 260, sts: 13, instruction: 'k2, k2tog, k8, kfb', section: 'bobbles3_dec' },
        { step: 261, sts: 12, instruction: 'k4, MB3, k4, k2tog, k2', section: 'bobbles3_dec' },
        { step: 262, sts: 12, instruction: 'k2, k2tog, k7, kfb', section: 'bobbles3_dec' },
        { step: 263, sts: 11, instruction: 'k8, k2tog, k2', section: 'bobbles3_dec' },
        { step: 264, sts: 11, instruction: 'k2, k2tog, k6, kfb', section: 'bobbles3_dec' },
        { step: 265, sts: 10, instruction: 'k7, k2tog, k2', section: 'bobbles3_dec' },
        { step: 266, sts: 10, instruction: 'k2, k2tog, k5, kfb', section: 'bobbles3_dec' },
        { step: 267, sts: 9, instruction: 'k4, MB3, k1, k2tog, k2', section: 'bobbles3_dec' },

        // Finishing (268-280)
        { step: 268, sts: 9, instruction: 'k2, k2tog, k4, kfb', section: 'finishing' },
        { step: 269, sts: 8, instruction: 'k5, k2tog, k2', section: 'finishing' },
        { step: 270, sts: 8, instruction: 'k2, k2tog, k3, kfb', section: 'finishing' },
        { step: 271, sts: 7, instruction: 'k4, k2tog, k2', section: 'finishing' },
        { step: 272, sts: 7, instruction: 'k2, k2tog, k2, kfb', section: 'finishing' },
        { step: 273, sts: 6, instruction: 'k3, k2tog, k2', section: 'finishing' },
        { step: 274, sts: 6, instruction: 'k2, k2tog, k1, kfb', section: 'finishing' },
        { step: 275, sts: 5, instruction: 'k2, k2tog, k2', section: 'finishing' },
        { step: 276, sts: 5, instruction: 'k2, k2tog, kfb', section: 'finishing' },
        { step: 277, sts: 4, instruction: 'k1, k2tog, k2', section: 'finishing' },
        { step: 278, sts: 3, instruction: 'k1, k2tog, k1', section: 'finishing' },
        { step: 279, sts: 3, instruction: 'k1, k2tog, kfb', section: 'finishing' },
        { step: 280, sts: 3, instruction: 'k1, k2tog, k1', section: 'finishing' }
    ];

    // Convert to proper step format with all required fields
    allRows.forEach(row => {
        steps.push({
            step: row.step,
            section: row.section,
            side: row.step % 2 === 1 ? 'rs' : 'ws',
            startingStitchCount: row.step === 1 ? 3 : row.sts, // Simplified - could be calculated
            endingStitchCount: row.sts,
            instruction: row.instruction,
            type: 'row'
        });
    });
    
    // Add final instruction
    steps.push({
        step: 281,
        type: 'specialInstruction',
        description: 'Bind off remaining 3 stitches. Weave in ends. Block to desired measurements.',
        section: 'finishing'
    });
    
    return steps;
}

// Main function to create the pattern
export async function createSeaWitchPattern() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Please sign in first');
        }
        
        console.log('🧙‍♀️ Creating Sea Witch Tentacle Scarf pattern...');
        
        const patternRef = doc(collection(db, 'patterns'));
        const patternId = patternRef.id;
        
        const allSteps = generateSeaWitchSteps();
        
        const patternData = {
            id: patternId,
            ...seaWitchPattern,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            visibility: 'private',
            steps: allSteps,
            shareCount: 0,
            viewCount: 0,
            forkCount: 0,
            tags: ['scarf', 'bobbles', 'intermediate', 'tentacle', 'spiral', 'sea-witch'],
            exportCount: 0
        };
        
        await setDoc(patternRef, patternData);
        
        console.log('✅ Sea Witch pattern created successfully!');
        console.log('📋 Pattern ID:', patternId);
        console.log('🎯 Total rows implemented:', allSteps.length - 2); // -2 for cast on and bind off instructions
        console.log('🔍 Pattern structure:');
        console.log('  - Cast on instruction');
        console.log('  - 280 knitting rows');
        console.log('  - Bind off instruction');
        console.log('📊 Schema established with complete pattern data');
        
        return patternId;
        
    } catch (error) {
        console.error('❌ Error creating Sea Witch pattern:', error);
        throw error;
    }
}

// Make function available globally for console use
window.createSeaWitchPattern = createSeaWitchPattern;

console.log('🧙‍♀️ Sea Witch pattern script loaded. Run createSeaWitchPattern() to create the pattern.');