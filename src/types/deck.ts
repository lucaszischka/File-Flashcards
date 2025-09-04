import { MetadataCache, TFile } from 'obsidian'
import { State } from 'ts-fsrs'
import { Card } from './card'
import { FileFlashcardsSettings } from './settings'
import { ValidationError } from './validation'
import { minimatch } from 'minimatch'
import { PatternHierarchy } from '../managers/pattern-hierarchy'

export class Deck {

    // MARK: Factory

    static buildDecks(
        allFiles: TFile[],
        settings: FileFlashcardsSettings,
        metadataCache: MetadataCache
    ): Set<Deck> | ValidationError[] {
        const decks: Set<Deck> = new Set()
        const allErrors: ValidationError[] = []
        const errorProcessedFiles = new Set<string>() // Track files that have already had errors collected

        // Build decks from included patterns
        for (const pattern of settings.include) {
            const cards: Card[] = []
            
            const filteredFiles = Deck.filterFiles(allFiles, [pattern], settings.exclude)
            filteredFiles.forEach(file => {
                // Skip files that we've already processed and found to have errors
                if (errorProcessedFiles.has(file.path))
                    return
                
                const cache = metadataCache.getFileCache(file)
                const frontmatter = cache?.frontmatter

                // Use error-aware card creation
                const result = Card.init(file, frontmatter)
                if (Array.isArray(result)) {
                    errorProcessedFiles.add(file.path)
                    // Collect errors with file context
                    allErrors.push(...result)
                } else {
                    // Valid cards should be added to all matching decks
                    cards.push(result)
                }
            })
            
            const deck = new Deck(pattern, cards)
            decks.add(deck)
        }

        // Update the hierarchy
        Deck.buildDeckHierarchy(decks)
        
        if (allErrors.length === 0) {
            return decks
        } else {
            return allErrors
        }
    }

    private static filterFiles(allFiles: TFile[], includePatterns: string[], excludePatterns: string[]): TFile[] {
        // If no include patterns, nothing to include
        if (includePatterns.length === 0)
            return []

        return allFiles.filter(file => {
            // Must be markdown
            if (file.extension !== 'md')
                return false
            
            const path = file.path

            // Check include patterns - at least one must match
            const included = includePatterns.some(pattern => {
                const matches = minimatch(path, pattern)
                return matches
            })
            
            if (!included)
                return false

            // TODO: LATER We could exclude our own errors **.errors-*-*T*-*-*-*.md and **.generation-error-*-*T*-*-*-*.md
            // Check exclude patterns - none should match
            const excluded = excludePatterns.some(pattern => {
                const matches = minimatch(path, pattern)
                return matches
            })
            
            return !excluded
        })
    }
    private static buildDeckHierarchy(decks: Set<Deck>) {
        const toRemove = new Set<Deck>()
        
        for (const deck of decks) {
            // Build hierarchy based on pattern specificity and card relationships
            for (const other of decks) {
                if (deck === other)
                    continue
                if (deck.isChildOf(other)) {
                    other.addChild(deck)
                    toRemove.add(deck)
                }
            }
        }
        
        // Safe removal: Remove child decks from the top level after iteration
        for (const deck of toRemove) {
            decks.delete(deck)
        }
    }

     constructor(
        public pattern: string,
        public cards: Card[]
    ) {}

    private children: Set<Deck> = new Set()

    // MARK: Name

    getName(): string {
        // Handle wildcard-only patterns
        if (this.pattern === '*' || this.pattern === '**' || this.pattern === '**/*' || this.pattern === '*/**') {
            return 'All'
        }
        
        // Handle glob patterns with wildcards
        if (this.pattern.includes('*')) {
            // For patterns like "Work/**" or "Work/*", extract the base directory
            const withoutWildcards = this.pattern.replace(/\/?\*+.*$/, '')
            if (withoutWildcards && !withoutWildcards.match(/^\*+$/)) {
                const parts = withoutWildcards.split('/').filter(part => part.length > 0)
                if (parts.length > 0) {
                    return parts[parts.length - 1]
                }
            }
            return 'All'
        }
        
        // Handle file paths - extract the last meaningful part
        if (this.pattern.includes('/')) {
            const parts = this.pattern.split('/').filter(part => part.length > 0)
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1]
                // Remove file extensions if present
                return lastPart.replace(/\.[^.]*$/, '')
            }
        }
        
        // For simple patterns, return as-is (removing any file extension)
        return this.pattern.replace(/\.[^.]*$/, '')
    }

    // MARK: Due

    getDueCards(): Card[] {
        return Deck.getDueCards(this.cards)
    }

    static getDueCards(cards: Card[]): Card[] {
        const now = new Date() // Use current time for precise scheduling
        
        // Get cards that are due (including new cards with state=0)
        const dueCards = cards.filter(card => {
            // New cards (state=0) are always due
            if (card.sr.state === State.New)
                return true
            
            // Other cards are due if their due date has passed
            if (card.sr.due)
                return card.sr.due <= now
            
            return false
        })
    
        // Sort cards: new cards first, then by due date
        dueCards.sort((a, b) => {
            // New cards first
            if (a.sr.state === State.New && b.sr.state !== State.New) return -1
            if (a.sr.state !== State.New && b.sr.state === State.New) return 1
            
            // Then by due date
            if (!a.sr.due || !b.sr.due) return 0
            return a.sr.due.getTime() - b.sr.due.getTime()
        })
        
        return dueCards
    }

    // MARK: Child

    // public for testing
    isChildOf(other: Deck): boolean {
        // A deck with more cards can not be a subset of a deck with less cards
        if (this.cards.length > other.cards.length)
            return false

        // If both decks have cards, use card-based validation
        if (this.cards.length > 0 && other.cards.length > 0) {
            // Test if all cards are in the other deck by comparing file paths
            const thisCardPaths = new Set(this.cards.map(card => card.path))
            const otherCardPaths = new Set(other.cards.map(card => card.path))
            const result = Array.from(thisCardPaths).every(path => otherCardPaths.has(path))
            
            // If cards are identical, fall back to pattern-based hierarchy to avoid circular references
            if (result && this.cards.length === other.cards.length)
                return PatternHierarchy.isSubset(this.pattern, other.pattern)
            
            return result
        }

        // For empty decks, use pattern-based validation
        return PatternHierarchy.isSubset(this.pattern, other.pattern)
    }

    private addChild(child: Deck) {
        // Check if already added
        if (this.children.has(child))
            return

        let added = false
        // Check if this child should be nested under an existing child
        for (const existing of this.children) {
            if (child.isChildOf(existing)) {
                existing.addChild(child)
                added = true
            }
        }

        if (!added) {
            // Check if existing children should become children of the new child
            const toRemove = new Set<Deck>()
            for (const existing of this.children) {
                if (existing.isChildOf(child)) {
                    // Mark for removal and add as child's child
                    toRemove.add(existing)
                    child.addChild(existing)
                }
            }
            // Remove marked children
            for (const deck of toRemove) {
                this.children.delete(deck)
            }
            // Add the child at this level
            this.children.add(child)
        }
    }

    getChildren(): Set<Deck> {
        return this.children
    }
}