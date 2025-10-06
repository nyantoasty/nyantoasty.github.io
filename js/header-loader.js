/**
 * Unified Header Loader
 * Provides easy integration of the unified header into any HTML page
 */

/**
 * Load and inject the unified header into the current page
 * Call this function in the <head> or early in <body> of each HTML file
 */
async function loadUnifiedHeader() {
    try {
        // Fetch the header component
        const response = await fetch('/components/unified-header.html');
        if (!response.ok) {
            throw new Error(`Failed to load header: ${response.status}`);
        }
        
        const headerHTML = await response.text();
        
        // Inject at the beginning of body or after a specific element
        const targetElement = document.getElementById('header-insert-point') || document.body;
        
        if (document.getElementById('header-insert-point')) {
            // If there's a specific insertion point, replace it
            targetElement.outerHTML = headerHTML;
        } else {
            // Otherwise, prepend to body
            targetElement.insertAdjacentHTML('afterbegin', headerHTML);
        }
        
        // Initialize the header functionality
        if (typeof initUnifiedHeader === 'function') {
            initUnifiedHeader();
        } else {
            // Fallback: import and initialize the header script
            const script = document.createElement('script');
            script.src = '/js/unified-header.js';
            script.type = 'module';
            document.head.appendChild(script);
        }
        
        console.log('✅ Unified header loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load unified header:', error);
        
        // Fallback: create a minimal header
        createFallbackHeader();
    }
}

/**
 * Create a minimal fallback header if the main header fails to load
 */
function createFallbackHeader() {
    const fallbackHeader = `
        <header class="bg-gray-900 text-white p-4">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-xl font-bold">Pattern Hub</h1>
                <nav class="space-x-4">
                    <a href="/index.html" class="hover:text-gray-300">Viewer</a>
                    <a href="/Generator.html" class="hover:text-gray-300">Generator</a>
                    <a href="/pattern-upload.html" class="hover:text-gray-300">Upload</a>
                    <a href="/pattern-manager.html" class="hover:text-gray-300">Manager</a>
                    <a href="/Stitch_Glossary.html" class="hover:text-gray-300">Glossary</a>
                </nav>
            </div>
        </header>
        <div class="h-16"></div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
    console.log('⚠️ Fallback header created');
}

/**
 * Alternative: Include header via HTML import (for static generation)
 * Add this script tag to HTML files:
 * <script>
 *   fetch('/components/unified-header.html')
 *     .then(r => r.text())
 *     .then(html => {
 *       document.getElementById('header-placeholder').outerHTML = html;
 *       loadUnifiedHeaderScript();
 *     });
 * </script>
 */

/**
 * Load the unified header script after HTML is injected
 */
function loadUnifiedHeaderScript() {
    if (!document.querySelector('script[src="/js/unified-header.js"]')) {
        const script = document.createElement('script');
        script.src = '/js/unified-header.js';
        script.type = 'module';
        document.head.appendChild(script);
    }
}

// Auto-load if this script is included directly
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    loadUnifiedHeader();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', loadUnifiedHeader);
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadUnifiedHeader, createFallbackHeader, loadUnifiedHeaderScript };
}