# Design System Guidelines

## Overview
This document establishes consistent design patterns to avoid reinventing styling for each new page.

## Unified Header Integration

### Required Setup for Every Page

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <!-- Standard meta tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Name - Pattern Hub</title>
    
    <!-- Unified CSS System -->
    <link rel="stylesheet" href="/css/main.css">
    
    <!-- Icon -->
    <link rel="icon" type="image/png" href="/assets/icons/yarn-ball-icon.png">
</head>
<body class="bg-primary text-primary antialiased has-unified-header">
    
    <!-- Unified Header Component (REQUIRED) -->
    <div id="header-placeholder"></div>
    
    <!-- Your page content here -->
    <main class="container mx-auto px-4 py-8">
        <!-- Content -->
    </main>
    
    <!-- Load unified header (REQUIRED) -->
    <script src="js/header-loader.js"></script>
    
    <!-- Your page scripts -->
    <script type="module">
        // Import shared Firebase (see FIREBASE_INTEGRATION.md)
        import { auth, db } from './js/firebase-config.js';
        
        // Your page logic
    </script>
</body>
</html>
```

## CSS Classes System

### Semantic Color Classes
- `bg-primary` - Main background color
- `bg-secondary` - Secondary background (cards, sidebars)
- `bg-tertiary` - Accent background (hover states)
- `text-primary` - Main text color
- `text-secondary` - Secondary text color
- `text-tertiary` - Muted text color
- `border-primary` - Main border color

### Component Classes
- `btn-primary` - Primary action buttons
- `btn-secondary` - Secondary action buttons  
- `btn-accent` - Accent/highlight buttons
- `btn-success` - Success state buttons
- `btn-warning` - Warning state buttons
- `btn-danger` - Danger/delete buttons

### Layout Classes
- `container mx-auto px-4` - Standard page container
- `has-unified-header` - Required body class for header spacing

## Theme Support

### CSS Custom Properties
All colors are defined as CSS custom properties that automatically switch between light and dark themes:

```css
:root {
    --color-primary: #f8fafc;    /* Light mode */
    --color-secondary: #64748b;  
}

[data-theme="dark"] {
    --color-primary: #1e293b;    /* Dark mode */
    --color-secondary: #475569;
}
```

### Theme Toggle
The unified header includes an automatic theme toggle. Pages don't need individual theme logic.

## Firebase Integration
See `FIREBASE_INTEGRATION.md` for proper Firebase usage patterns.

## Page Types

### Standard Content Page
```html
<body class="bg-primary text-primary has-unified-header">
    <div id="header-placeholder"></div>
    <main class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-primary mb-6">Page Title</h1>
        <!-- Content -->
    </main>
    <script src="js/header-loader.js"></script>
</body>
```

### App/Tool Page  
```html
<body class="bg-primary text-primary has-unified-header min-h-screen">
    <div id="header-placeholder"></div>
    <main class="flex-1 p-4">
        <!-- App interface -->
    </main>
    <script src="js/header-loader.js"></script>
</body>
```

### Modal/Overlay Page
```html
<body class="bg-primary text-primary has-unified-header">
    <div id="header-placeholder"></div>
    <main class="relative">
        <!-- Main content -->
        
        <!-- Modal overlay -->
        <div id="modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
            <div class="bg-secondary rounded-lg p-6 max-w-md mx-auto mt-20">
                <!-- Modal content -->
            </div>
        </div>
    </main>
    <script src="js/header-loader.js"></script>
</body>
```

## Navigation Integration

### Current Page Detection
The unified header automatically detects the current page and highlights it in navigation.

### Page Data Attributes
Add to navigation links:
```html
<a href="/my-page.html" data-page="my-page">My Page</a>
```

Update `js/unified-header.js` pageMap:
```javascript
const pageMap = {
    'my-page.html': 'my-page',
    // ... other pages
};
```

## Common Patterns

### Card Layout
```html
<div class="bg-secondary rounded-lg p-6 border border-primary">
    <h3 class="text-lg font-semibold text-primary mb-2">Card Title</h3>
    <p class="text-secondary">Card content...</p>
</div>
```

### Button Group
```html
<div class="flex space-x-2">
    <button class="btn-primary">Primary</button>
    <button class="btn-secondary">Secondary</button>
</div>
```

### Form Input
```html
<div class="mb-4">
    <label class="block text-sm font-medium text-secondary mb-2">Label</label>
    <input type="text" class="w-full p-3 bg-secondary border border-primary rounded-lg text-primary focus:ring-2 focus:ring-accent">
</div>
```

## Checklist for New Pages

- [ ] Uses unified header (`<div id="header-placeholder"></div>`)
- [ ] Includes header loader (`<script src="js/header-loader.js"></script>`)
- [ ] Uses semantic CSS classes (bg-primary, text-primary, etc.)
- [ ] Has proper `data-theme` support
- [ ] Uses shared Firebase config (if needed)
- [ ] Follows responsive design patterns
- [ ] Includes proper meta tags and favicon
- [ ] Body has `has-unified-header` class