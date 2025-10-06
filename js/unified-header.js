// unified-header.js - Unified header navigation and theme toggle functionality
// Version: v2025-10-06

/**
 * Unified Header Manager
 * Handles navigation, theme toggle, mobile menu, and active page highlighting
 */
class UnifiedHeader {
    constructor() {
        this.currentPage = null;
        this.mobileNavOpen = false;
        this.init();
    }

    init() {
        this.detectCurrentPage();
        this.initializeThemeToggle();
        this.initializeMobileMenu();
        this.initializeNavigation();
        this.initializeUserControls();
        this.highlightCurrentPage();
        
        console.log('🎯 Unified header initialized');
    }

    /**
     * Detect current page based on URL
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().toLowerCase();
        
        // Map filenames to page identifiers
        const pageMap = {
            'index.html': 'viewer',
            '': 'viewer', // Root also goes to viewer
            'generator.html': 'generator',
            'pattern-upload.html': 'upload',
            'pattern-manager.html': 'manager',
            'stitch_glossary.html': 'glossary'
        };
        
        this.currentPage = pageMap[filename] || pageMap[filename.replace('.html', '')] || 'viewer';
        console.log(`📍 Current page detected: ${this.currentPage}`);
    }

    /**
     * Initialize theme toggle functionality
     * Integrates with existing theme system from app-main.js
     */
    initializeThemeToggle() {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Apply current theme on load
        this.updateThemeDisplay();
    }

    /**
     * Toggle between light and dark themes
     * Uses existing theme system logic
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save to localStorage
        localStorage.setItem('preferred-theme', newTheme);
        
        // Update visual indicators
        this.updateThemeDisplay();
        
        console.log(`🎨 Theme toggled to: ${newTheme}`);
        
        // Dispatch custom event for other components that might need to know
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme } 
        }));
    }

    /**
     * Update theme toggle button display
     */
    updateThemeDisplay() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        
        // The CSS classes will handle showing/hiding the appropriate icons
        // based on the dark: utility classes in the HTML
    }

    /**
     * Initialize mobile hamburger menu
     */
    initializeMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (hamburgerBtn && mobileNav) {
            hamburgerBtn.addEventListener('click', () => {
                this.toggleMobileNav();
            });

            // Close mobile nav when clicking outside
            document.addEventListener('click', (e) => {
                if (this.mobileNavOpen && 
                    !hamburgerBtn.contains(e.target) && 
                    !mobileNav.contains(e.target)) {
                    this.closeMobileNav();
                }
            });

            // Close mobile nav on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.mobileNavOpen) {
                    this.closeMobileNav();
                }
            });

            // Close mobile nav when window is resized to larger screen
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 768 && this.mobileNavOpen) { // md breakpoint
                    this.closeMobileNav();
                }
            });
        }
    }

    /**
     * Toggle mobile navigation menu
     */
    toggleMobileNav() {
        const mobileNav = document.getElementById('mobile-nav');
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        
        if (mobileNav) {
            this.mobileNavOpen = !this.mobileNavOpen;
            
            if (this.mobileNavOpen) {
                mobileNav.classList.remove('hidden');
                hamburgerBtn?.setAttribute('aria-expanded', 'true');
                
                // Animate hamburger to X
                this.animateHamburgerToX(hamburgerBtn);
            } else {
                mobileNav.classList.add('hidden');
                hamburgerBtn?.setAttribute('aria-expanded', 'false');
                
                // Animate X back to hamburger
                this.animateXToHamburger(hamburgerBtn);
            }
        }
    }

    /**
     * Close mobile navigation menu
     */
    closeMobileNav() {
        if (this.mobileNavOpen) {
            this.mobileNavOpen = false;
            const mobileNav = document.getElementById('mobile-nav');
            const hamburgerBtn = document.getElementById('hamburger-menu-btn');
            
            if (mobileNav) {
                mobileNav.classList.add('hidden');
                hamburgerBtn?.setAttribute('aria-expanded', 'false');
                this.animateXToHamburger(hamburgerBtn);
            }
        }
    }

    /**
     * Animate hamburger menu icon to X shape
     */
    animateHamburgerToX(button) {
        const svg = button?.querySelector('svg');
        if (svg) {
            svg.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            `;
        }
    }

    /**
     * Animate X shape back to hamburger menu icon
     */
    animateXToHamburger(button) {
        const svg = button?.querySelector('svg');
        if (svg) {
            svg.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            `;
        }
    }

    /**
     * Initialize navigation link functionality
     */
    initializeNavigation() {
        // Add click handlers for smooth navigation
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Close mobile nav when a link is clicked
                this.closeMobileNav();
                
                // Optional: Add loading state or navigation feedback
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#')) {
                    // Add subtle loading indicator
                    link.style.opacity = '0.6';
                    setTimeout(() => {
                        if (link) link.style.opacity = '1';
                    }, 200);
                }
            });
        });
    }

    /**
     * Highlight the current page in navigation
     */
    highlightCurrentPage() {
        // Remove existing active states
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('bg-accent', 'text-accent-foreground');
            link.classList.add('text-secondary');
        });

        // Add active state to current page links
        const currentPageLinks = document.querySelectorAll(`[data-page="${this.currentPage}"]`);
        currentPageLinks.forEach(link => {
            link.classList.remove('text-secondary');
            link.classList.add('bg-accent', 'text-accent-foreground');
        });
    }

    /**
     * Initialize user controls (sign in/out)
     * Integrates with existing Firebase auth if available
     */
    initializeUserControls() {
        const signOutBtn = document.getElementById('sign-out-btn');
        const mobileSignOutBtn = document.getElementById('mobile-sign-out-btn');
        
        // Check if user is signed in
        this.updateUserDisplay();
        
        // Add sign out handlers
        [signOutBtn, mobileSignOutBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.handleSignOut();
                });
            }
        });

        // Listen for auth state changes if Firebase is available
        if (window.firebase && window.firebase.auth) {
            window.firebase.auth().onAuthStateChanged((user) => {
                this.updateUserDisplay(user);
            });
        }
    }

    /**
     * Update user display in header
     */
    updateUserDisplay(user = null) {
        const userDisplay = document.getElementById('user-display');
        const mobileUserDisplay = document.getElementById('mobile-user-display');
        const signOutBtn = document.getElementById('sign-out-btn');
        const mobileSignOutBtn = document.getElementById('mobile-sign-out-btn');

        if (user) {
            // User is signed in
            const displayName = user.displayName || user.email || 'User';
            
            [userDisplay, mobileUserDisplay].forEach(el => {
                if (el) {
                    el.textContent = `Welcome, ${displayName}`;
                    el.classList.remove('hidden');
                }
            });

            [signOutBtn, mobileSignOutBtn].forEach(btn => {
                if (btn) btn.classList.remove('hidden');
            });
        } else {
            // User is not signed in
            [userDisplay, mobileUserDisplay].forEach(el => {
                if (el) el.classList.add('hidden');
            });

            [signOutBtn, mobileSignOutBtn].forEach(btn => {
                if (btn) btn.classList.add('hidden');
            });
        }
    }

    /**
     * Handle user sign out
     */
    async handleSignOut() {
        try {
            if (window.firebase && window.firebase.auth) {
                await window.firebase.auth().signOut();
                console.log('👋 User signed out');
                
                // Redirect to home page or reload current page
                window.location.reload();
            }
        } catch (error) {
            console.error('❌ Sign out failed:', error);
        }
    }

    /**
     * Public method to update current page (for SPA navigation)
     */
    setCurrentPage(pageId) {
        this.currentPage = pageId;
        this.highlightCurrentPage();
    }
}

// Initialize unified header when DOM is loaded
let unifiedHeader = null;

function initUnifiedHeader() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            unifiedHeader = new UnifiedHeader();
        });
    } else {
        unifiedHeader = new UnifiedHeader();
    }
}

// Auto-initialize if this script is loaded
if (typeof window !== 'undefined') {
    initUnifiedHeader();
}

// Export for manual initialization or external access
export { UnifiedHeader, initUnifiedHeader };

// Also make available globally for legacy compatibility
if (typeof window !== 'undefined') {
    window.UnifiedHeader = UnifiedHeader;
    window.initUnifiedHeader = initUnifiedHeader;
    window.unifiedHeader = unifiedHeader;
}