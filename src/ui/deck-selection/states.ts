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
        innerEl.addClass('ff-scroll-padding')
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
        startButton.addClass('ff-button-disabled')
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
            deckEl.onclick = () => this.selectDeck(deck, deckEl)

        return deckEl
    }

    private createDeckContainer(depth: number, dueCards: number, isSelected: boolean): HTMLElement {
        const deckEl = document.createElement('div')
        deckEl.addClass('ff-deck-container')
        
        // Add left margin for indentation
        deckEl.style.marginLeft = `${depth * 20}px`
        deckEl.style.borderLeft = `${(depth + 1) * 5}px solid var(--background-modifier-border-hover)`

        // Set background color based on state
        if (isSelected) {
            deckEl.addClass('ff-selected')
        } else if (dueCards !== 0) {
            deckEl.addClass('ff-deck-clickable')
        } else {
            deckEl.addClass('ff-disabled')
        }

        return deckEl
    }

    private createNameAndPathSection(deckEl: HTMLElement, deck: Deck, dueCards: number, isSelected: boolean): HTMLElement {
        const nameAndPathEl = this.components.createVStack(deckEl)
        nameAndPathEl.addClass('ff-deck-name-path')
        
        // Create name element
        const nameEl = nameAndPathEl.createDiv()
        nameEl.setText(deck.getName())
        nameEl.addClass('ff-deck-name')
        
        this.components.addSpacer(nameAndPathEl)
        
        // Create path element
        const pathEl = nameAndPathEl.createDiv()
        pathEl.setText(deck.pattern)
        pathEl.addClass('ff-deck-path')
        
        this.components.addSpacer(nameAndPathEl)

        return nameAndPathEl
    }

    private createCountsSection(deckEl: HTMLElement, dueCards: number, totalCards: number, isSelected: boolean): HTMLElement {
        const countsEl = this.components.createVStack(deckEl)
        countsEl.addClass('ff-deck-counts')
        
        // Create due count element if there are due cards
        if (dueCards > 0) {
            const dueEl = countsEl.createDiv()
            dueEl.setText(`${dueCards} due`)
            dueEl.addClass('ff-deck-due')
        }
        
        this.components.addSpacer(countsEl)
        
        // Create total count element
        const totalEl = countsEl.createDiv()
        totalEl.setText(`${totalCards} ${totalCards === 1 ? 'card' : 'cards'}`)
        totalEl.addClass('ff-deck-total')

        this.components.addSpacer(countsEl)

        return countsEl
    }

    // MARK: Selection Management

    enableStartButton(): void {
        const startButton = this.contentEl.querySelector('#start-review-button') as HTMLButtonElement
        if (startButton) {
            startButton.removeClass('ff-button-disabled')
            startButton.disabled = false
        }
    }

    clearPreviousSelection(): void {
        const previousSelected = this.contentEl.querySelector('.ff-selected') as HTMLElement
        if (previousSelected) {
            previousSelected.removeClass('ff-selected')
            previousSelected.addClass('ff-deck-clickable')
        }
    }

    updateDeckSelection(deckEl: HTMLElement): void {
        deckEl.addClass('ff-selected')
        deckEl.removeClass('ff-deck-clickable')
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