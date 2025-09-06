# Development Guide

## Quick Start

### Prerequisites
- Node.js v16+ (`node --version`)
- npm or yarn package manager
- Optional: ESLint (`npm install -g eslint`)

### Key Dependencies
- `ts-fsrs` - FSRS algorithm implementation for optimal spaced repetition scheduling
- `minimatch` - Glob pattern matching for file inclusion/exclusion patterns  
- `canvas-confetti` - Success animations for completed review sessions

### Setup
```bash
npm install         # Install dependencies
npm run dev         # Start development with watch mode, or
npm run build       # Build for production
```

### Development Commands
- `npm run dev` - Development with watch mode compilation
- `npm run build` - Production build
- `npm run test` - Run all tests
- `npm run test:watch` - Continuous testing during development
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Code quality checks with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run type-check` - TypeScript type checking

## API References

- [Obsidian API](https://github.com/obsidianmd/obsidian-api)  
- [FSRS Algorithm Documentation](https://github.com/open-spaced-repetition/ts-fsrs)
- [Minimatch Documentation](https://isaacs.github.io/minimatch/)
- [Canvas Confetti Documentation](https://www.kirilv.com/canvas-confetti/)

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Jest tests for core logic components
- Documentation updates for user-facing changes

## Architecture Overview

The plugin creates file-based flashcards where each Markdown file becomes a flashcard, using the FSRS algorithm for optimal spaced repetition scheduling. Users organize cards into decks using glob patterns, and scheduling metadata is stored in YAML frontmatter.

### Core Components

#### 1. Card Storage (`src/managers/card-storage.ts`)
- **File Processing**: Converts Markdown files to flashcard objects with validation
- **Frontmatter Management**: Reads and writes FSRS scheduling data to/from YAML frontmatter
- **FSRS Integration**: Creates, updates, and formats FSRS cards for spaced repetition
- **Error Handling**: Comprehensive validation with user-friendly error messages and data backup
- **Data Format**: Stores scheduling data as array format in `spaced-repetition:` frontmatter namespace

#### 2. Daily Limit Manager (`src/managers/daily-limit.ts`)
- **Review Limits**: Enforces daily card review limits across all decks (0 = unlimited)
- **Progress Tracking**: Tracks cards reviewed per day with automatic daily reset at midnight
- **State Persistence**: Saves daily progress to plugin data storage
- **Limit Enforcement**: Provides options to continue or respect limits when daily maximum is reached

#### 3. Pattern Hierarchy (`src/managers/pattern-hierarchy.ts`)
- **Deck Creation**: Analyzes include patterns to create logical deck hierarchies
- **Pattern Resolution**: Resolves overlapping patterns using specificity rules
- **Hierarchy Building**: Creates parent-child relationships between decks for organized review
- **Name Generation**: Converts file patterns to human-readable deck names

#### 4. Card and Deck Types (`src/types/`)
- **Card (`card.ts`)**: Wraps FSRS cards with file metadata (path, question override)
- **Deck (`deck.ts`)**: Groups cards by patterns with hierarchy support and due card filtering
- **Settings (`settings.ts`)**: Configuration interface for include/exclude patterns and limits
- **Validation (`validation.ts`)**: Error handling structures for data validation

#### 5. UI Components (`src/ui/`)
- **Settings Tab**: Configuration interface for patterns, daily limits, and badge display
- **Review Modal**: FSRS-based review interface with four-button rating system
- **Deck Selection Modal**: Hierarchical deck chooser for multiple deck scenarios
- **Error Modal**: User-friendly error reporting with recovery options and data backup info### File-Based Flashcard System

#### Frontmatter Schema

```yaml
---
spaced-repetition:
  - due=2025-08-15T10:30:00.000Z      # Next review date (ISO format)
  - last_review=2025-08-14T09:15:00.000Z  # Last review timestamp
  - stability=4.2                     # Memory stability (FSRS parameter)
  - difficulty=6.8                    # Card difficulty (1.0-10.0)
  - state=2                           # Card state (0=New, 1=Learning, 2=Review, 3=Relearning)
  - reps=3                            # Number of successful reviews
  - lapses=1                          # Number of failed reviews
  - scheduled_days=4                  # Days between last and current review
  - learning_steps=0                  # Current learning step
flashcard-question: "Custom question override"  # Optional
---

Your file content becomes the answer...
```

#### File Processing
- Each Markdown file becomes a single flashcard automatically
- File title serves as the default question (overridable with `flashcard-question` frontmatter)
- File content serves as the answer shown during review
- FSRS scheduling metadata stored in `spaced-repetition:` frontmatter namespace as array format

#### Pattern-Based Deck Organization
- Include patterns define which files become flashcards using glob syntax (`*`, `**`, folder paths)
- Exclude patterns filter out unwanted files (templates, drafts, etc.)
- Each pattern creates a separate deck
- Hierarchical deck structure based on pattern specificity (more specific patterns become children)

#### FSRS Scheduling Algorithm
- Modern Free Spaced Repetition Scheduler implementation via `ts-fsrs` library
- Four-button rating system: Again (1), Hard (2), Good (3), Easy (4)
- Adaptive scheduling based on performance history and card difficulty
- Stores: due date, stability, difficulty, reps, lapses, state, scheduled_days, learning_steps
- Review intervals automatically calculated and optimized for each individual card

### Core Workflows

#### Deck Building Flow
1. **File Scanning** → All vault files retrieved via Obsidian API
2. **Pattern Matching** → Files matched against include/exclude patterns using minimatch
3. **Card Creation** → Valid files converted to Card objects with frontmatter validation
4. **Deck Assignment** → Cards grouped into decks based on their matching patterns
5. **Hierarchy Building** → Deck parent-child relationships established based on pattern specificity
6. **Error Collection** → Validation errors collected and presented to user via Error Modal

#### Review Session Flow
1. **Deck Selection** → Single deck auto-starts, multiple decks show selection modal
2. **Due Cards Filtering** → Only cards due for review presented (new cards + overdue cards)
3. **Daily Limit Check** → Respects configured daily review limits with batch size options
4. **Card Presentation** → File title/question displayed with reveal answer functionality
5. **Rating Input** → User rates difficulty using FSRS four-button system or keyboard shortcuts
6. **FSRS Update** → Algorithm calculates next review date and updates card parameters
7. **Frontmatter Write** → Updated scheduling data saved to file frontmatter in array format
8. **Session Progress** → Continues until no more due cards or daily limit reached

## Project Goals

This plugin provides file-centric spaced repetition for Obsidian, where each Markdown file becomes a flashcard. It implements the modern FSRS algorithm for optimal learning efficiency and provides flexible deck organization through glob pattern matching.

## Release Process

### Version Management
1. Update `manifest.json` with new version (e.g., `1.0.1`)
2. Set minimum Obsidian version in `minAppVersion` 
3. Update `versions.json` with version compatibility mapping
4. Run `npm version [patch|minor|major]` to sync all version files

### GitHub Release
1. Create release with version number as tag (no `v` prefix)
2. Upload build artifacts: `manifest.json`, `main.js`, `styles.css`
3. Include release notes with feature changes and fixes
4. Publish to make available in Obsidian Community Plugins