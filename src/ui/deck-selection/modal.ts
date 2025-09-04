import { App, Modal } from 'obsidian'

import FileFlashcardsPlugin from '../../../main'
import { Deck } from '../../types'

import { UIComponents } from '../components'
import { DeckSelectionStates } from './states'
import { ReviewModal } from '../review/modal'

export class DeckSelectionModal extends Modal {
    private selectedDeck: Deck | null = null
    
    private components: UIComponents
    private states: DeckSelectionStates

    constructor(
        app: App,
        private plugin: FileFlashcardsPlugin
    ) {
        super(app)
        this.components = new UIComponents(app, plugin, this.contentEl)
        this.states = new DeckSelectionStates(this.plugin, this.contentEl, this.components)
        
        // Set up callbacks for the UI states
        this.states.setCallbacks({
            closeModal: () => this.close(),
            selectDeck: (deck: Deck, deckEl: HTMLElement) => this.selectDeck(deck, deckEl),
            startReview: () => this.startReview()
        })

        // Setup fullscreen modal layout
        this.components.setupFullscreenModal(this.modalEl, this.titleEl, this.contentEl)
    }

    onOpen() {
        this.setupKeyboardHandlers()
        this.states.showDeckSelection(this.selectedDeck)
    }

    // MARK: Actions

    private selectDeck(deck: Deck, deckEl: HTMLElement) {
        // If we are re-selecting the same deck, start the review
        if (this.selectedDeck === deck) {
            this.startReview()
            return
        }

        // Remove previous selection 
        if (this.selectedDeck)
            this.states.clearPreviousSelection()

        // Set new selection
        this.selectedDeck = deck
        this.states.updateDeckSelection(deckEl)

        // Enable start button
        this.states.enableStartButton()
    }

    private startReview() {
        if (this.selectedDeck) {
            this.close()
            new ReviewModal(this.app, this.plugin, this.selectedDeck).open()
        }
    }

    // MARK: Key Events

    private setupKeyboardHandlers() {
        // Enter to start review with selected deck
        this.scope.register([], 'Enter', () => {
            this.startReview()
        })
    }
}
