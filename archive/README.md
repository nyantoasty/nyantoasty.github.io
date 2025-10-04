# Archive Directory

This directory contains files that were part of the development process but are no longer needed for the current semantic token system.

## Structure

### `/pwa-components/`

- `manifest.json` - PWA manifest (not currently implemented)
- `sw.js` - Service worker for offline support (not currently implemented)

### `/sample-data/`

- `FairyKissShawl.json` - Sample pattern for testing
- `Sea Witch Tentacle Scarf.txt` - Raw pattern text sample
- `testFiles/` - OCR test images and PDFs

### `/development-docs/`

- `INTEGRATION_ANALYSIS.md` - Development analysis document
- `OCR-SETUP.md` - OCR service setup instructions

### `/legacy-docs/`

- `LogicGuide.md` - Original logic guide (replaced by LogicGuide-Enhanced.md)
- `PATTERN_SCHEMA.md` - Old pattern schema (replaced by FIRESTORE_SCHEMA.md)
- `PROGRESS_SCHEMA.md` - Old progress schema (replaced by ENHANCED_PROGRESS_SCHEMA.md)

### `/migration-tools/`

- `fresh-start-migration.html` - Tool for migrating to enhanced schema
- `migration-tool.html` - Database migration utility
- `scripts/` - Various migration and setup scripts

### `/experimental/`

- `Generator.html` - Standalone AI pattern generator tool (not integrated with main app)
- `pattern-processor.html` - Experimental pattern processing interface
- `firebase-functions-legacy/` - Legacy Node.js Firebase Functions (replaced by Cloud Run Python service for security)

## Restoration

If any of these files are needed, they can be moved back to the root directory. However, the current semantic token system should handle all requirements without these legacy components.

## Date Archived

October 4, 2025 - During semantic token system implementation and project cleanup
