import FileFlashcardsPlugin from '../../../main'
import { Deck } from '../../types'
import { UIComponents } from '../components'

interface DeckSelectionCallbacks {
    closeModal: () => void
    selectDeck: (deck: Deck, deckEl: HTMLElement) => void
    startReview: () => void
}

export class DeckSelectionStates {
    constructor(
        private plugin: FileFlashcardsPlugin,
        private contentEl: HTMLElement,
        private components: UIComponents
    ) {}

    // MARK: Main State

    showDeckSelection(selectedDeck: Deck | null): void {
        this.contentEl.empty()
        this.contentEl.createEl('h1', { text: 'Select a deck to review' })

        this.components.addSpacer(this.contentEl)

        // Create scrollable deck list container
        const outerEl = this.components.createScrollViewContainer()
        const innerEl = this.components.createScrollView(outerEl)
        innerEl.style.padding = '1em'
        this.renderDecks(innerEl, this.plugin.decks, 0, selectedDeck)

        this.components.addSpacer(this.contentEl)

        // Add buttons
        const buttonContainer = this.components.showButtonContainer()
        this.components.showButton('Cancel', () => this.closeModal(), buttonContainer)
        const startButton = this.components.showAccentButton(
            'Start Review', 
            () => this.startReview(), 
            buttonContainer
        )
        startButton.disabled = true
        startButton.style.cursor = 'default'
        startButton.id = 'start-review-button'
    }

    // MARK: Deck Rendering

    private renderDecks(container: HTMLElement, decks: Set<Deck>, depth: number, selectedDeck: Deck | null) {
        const sortedDecks = Array.from(decks).sort((a, b) => a.getName().localeCompare(b.getName()))
        
        for (const deck of sortedDecks) {
            const deckEl = this.createDeckElement(deck, depth, selectedDeck)
            container.appendChild(deckEl)

            // Render children if any
            if (deck.getChildren().size > 0) {
                this.renderDecks(container, deck.getChildren(), depth + 1, selectedDeck)
            }
        }
    }

    // MARK: Deck Element Creation

    private createDeckElement(deck: Deck, depth: number, selectedDeck: Deck | null): HTMLElement {
        const dueCards = deck.getDueCards().length
        const totalCards = deck.cards.length
        const isSelected = selectedDeck === deck

        const deckEl = this.createDeckContainer(depth, dueCards, isSelected)
        
        // Create main content areas
        this.createNameAndPathSection(deckEl, deck, dueCards, isSelected)
        this.createCountsSection(deckEl, dueCards, totalCards, isSelected)

        // Add interactivity for clickable decks
        if (dueCards !== 0)
            this.addDeckInteractivity(deckEl, deck)

        return deckEl
    }

    private createDeckContainer(depth: number, dueCards: number, isSelected: boolean): HTMLElement {
        const deckEl = document.createElement('div')
        deckEl.style.display = 'flex'
        deckEl.style.padding = '0.8em'
        deckEl.style.borderRadius = '10px'
        deckEl.style.marginBottom = '5px'
        deckEl.style.border = '1px solid var(--background-modifier-border)'
        
        // Add left margin for indentation
        deckEl.style.marginLeft = `${depth * 20}px`
        deckEl.style.borderLeft = `${(depth + 1) * 5}px solid var(--background-modifier-border-hover)`

        // Set background color based on state
        if (isSelected) {
            deckEl.addClass('deck-selected')
            deckEl.style.backgroundColor = 'var(--interactive-accent)'
        } else if (dueCards !== 0) {
            deckEl.style.cursor = 'pointer'
            deckEl.style.backgroundColor = 'var(--interactive-normal)'
        } else {
            deckEl.style.backgroundColor = 'var(--background-secondary)'
        }

        return deckEl
    }

    private createNameAndPathSection(deckEl: HTMLElement, deck: Deck, dueCards: number, isSelected: boolean): HTMLElement {
        const nameAndPathEl = this.components.createVStack(deckEl)
        nameAndPathEl.style.flex = '1'
        nameAndPathEl.style.minWidth = '0'
        
        // Create name element
        const nameEl = nameAndPathEl.createDiv()
        nameEl.setText(deck.getName())
        nameEl.style.fontWeight = 'bold'
        nameEl.addClass('deck-name')
        
        // Set name color based on state
        if (dueCards === 0) {
            nameEl.style.color = 'var(--text-faint)'
        } else if (isSelected) {
            nameEl.style.color = 'var(--text-on-accent)'
        }

        this.components.addSpacer(nameAndPathEl)
        
        // Create path element
        const pathEl = nameAndPathEl.createDiv()
        pathEl.setText(deck.pattern)
        pathEl.style.fontSize = '0.6em'
        pathEl.style.color = 'var(--text-faint)'
        pathEl.style.overflow = 'hidden'
        pathEl.style.textOverflow = 'ellipsis'
        pathEl.style.whiteSpace = 'nowrap'
        pathEl.style.width = '100%'
        pathEl.style.paddingRight = '10px'
        pathEl.addClass('deck-path')
        
        if (isSelected) {
            pathEl.style.color = 'var(--text-on-accent)'
            pathEl.style.opacity = '0.6'
        }
        
        this.components.addSpacer(nameAndPathEl)

        return nameAndPathEl
    }

    private createCountsSection(deckEl: HTMLElement, dueCards: number, totalCards: number, isSelected: boolean): HTMLElement {
        const countsEl = this.components.createVStack(deckEl)
        countsEl.style.textAlign = 'right'
        
        // Create due count element if there are due cards
        if (dueCards > 0) {
            const dueEl = countsEl.createDiv()
            dueEl.setText(`${dueCards} due`)
            dueEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-accent)'
            dueEl.style.fontWeight = 'bold'
            dueEl.addClass('deck-due')
        }
        
        this.components.addSpacer(countsEl)
        
        // Create total count element
        const totalEl = countsEl.createDiv()
        totalEl.setText(`${totalCards} ${totalCards === 1 ? 'card' : 'cards'}`)
        totalEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-muted)'
        if (isSelected) {
            totalEl.style.opacity = '0.8'
        }
        totalEl.addClass('deck-total')

        this.components.addSpacer(countsEl)

        return countsEl
    }

    private addDeckInteractivity(deckEl: HTMLElement, deck: Deck): void {
        // Add click handler
        deckEl.onclick = () => this.selectDeck(deck, deckEl)

        // Add hover effects
        deckEl.onmouseenter = () => {
            // Check current selection state instead of using captured value
            const currentlySelected = deckEl.hasClass('deck-selected')
            if (currentlySelected) {
                deckEl.style.backgroundColor = 'var(--interactive-accent-hover)'
            } else {
                deckEl.style.backgroundColor = 'var(--interactive-hover)'
            }
        }
        
        deckEl.onmouseleave = () => {
            // Check current selection state instead of using captured value
            const currentlySelected = deckEl.hasClass('deck-selected')
            if (currentlySelected) {
                deckEl.style.backgroundColor = 'var(--interactive-accent)'
            } else {
                deckEl.style.backgroundColor = 'var(--interactive-normal)'
            }
        }
    }

    // MARK: Selection Management

    enableStartButton(): void {
        const startButton = this.contentEl.querySelector('#start-review-button') as HTMLButtonElement
        if (startButton) {
            startButton.style.cursor = 'pointer'
            startButton.disabled = false
        }
    }

    clearPreviousSelection(): void {
        const previousSelected = this.contentEl.querySelector('.deck-selected') as HTMLElement
        if (previousSelected) {
            previousSelected.removeClass('deck-selected')
            previousSelected.style.backgroundColor = 'var(--interactive-normal)'
            
            // Reset child element colors
            this.resetDeckElementColors(previousSelected)
        }
    }

    updateDeckSelection(deckEl: HTMLElement): void {
        deckEl.addClass('deck-selected')
        deckEl.style.backgroundColor = 'var(--interactive-accent)'

        // Update child element colors for better visibility on accent background
        this.updateDeckElementColors(deckEl, true)
    }

    private resetDeckElementColors(deckEl: HTMLElement): void {
        this.updateDeckElementColors(deckEl, false)
    }

    private updateDeckElementColors(deckEl: HTMLElement, isSelected: boolean): void {
        const nameEl = deckEl.querySelector('.deck-name') as HTMLElement
        const pathEl = deckEl.querySelector('.deck-path') as HTMLElement
        const dueEl = deckEl.querySelector('.deck-due') as HTMLElement
        const totalEl = deckEl.querySelector('.deck-total') as HTMLElement
        
        if (nameEl) {
            nameEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-normal)'
        }
        if (pathEl) {
            pathEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-faint)'
            pathEl.style.opacity = isSelected ? '0.6' : ''
        }
        if (dueEl) {
            dueEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-accent)'
        }
        if (totalEl) {
            totalEl.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-muted)'
            totalEl.style.opacity = isSelected ? '0.8' : ''
        }
    }

    // MARK: Callbacks

    // Callback methods - these will be set by the modal
    private closeModal: () => void = () => {}
    private selectDeck: (deck: Deck, deckEl: HTMLElement) => void = () => {}
    private startReview: () => void = () => {}

    setCallbacks(callbacks: DeckSelectionCallbacks): void {
        this.closeModal = callbacks.closeModal
        this.selectDeck = callbacks.selectDeck
        this.startReview = callbacks.startReview
    }
}