import { App, Modal, TFile } from 'obsidian'

import FileFlashcardsPlugin from '../../../main'
import { Card, Deck, Rating, ExtendedApp } from '../../types'
import { CardStorage } from '../../managers/card-storage'

import { UIComponents } from '../components'
import { ReviewStates } from './states'
import { DeckSelectionModal } from '../deck-selection/modal'
import { ErrorModal } from '../error-modal'

export class ReviewModal extends Modal {
    private queue: Card[] = []
    private currentIndex = 0
    private answerRevealed = false
    
    private frontmatterManager: CardStorage

    private components: UIComponents
    private states: ReviewStates

    constructor(
        app: App,
        private plugin: FileFlashcardsPlugin,
        private deck: Deck
    ) {
        super(app)
        this.frontmatterManager = new CardStorage(app)
        this.components = new UIComponents(app, plugin, this.contentEl)
        this.states = new ReviewStates(this.plugin, this.contentEl, this.components, this.deck)
        
        // Set up callbacks for the UI states
        this.states.setCallbacks({
            openSettings: () => this.openSettings(),
            closeModal: () => this.close(),
            selectDeck: () => this.selectDeck(),
            loadMoreDue: (batch: number) => this.loadMoreDue(batch)
        })

        // Setup fullscreen modal layout
        this.components.setupFullscreenModal(this.modalEl, this.titleEl, this.contentEl)
    }

    onOpen() {
        this.setupKeyboardHandlers()

        // This should only appear if there is only a single deck with no cards
        // The Deck selection shouldn't allow opening a deck that is empty
        if (this.deck.cards.length === 0) {
            this.states.noCards()
            return
        }

        const due = this.deck.getDueCards()
        const dueCount = due.length
        if (dueCount === 0) {
            this.states.noDueCards()
            return
        }
        
        // You ask why we are not already showing this before picking decks?
        // Because we need to have this at least in case when there is only a single deck
        // And we ask the user if they want to continue with all or only 20 remaining due cards
        // This is important for user experience and difficult to implement in the decks picker
        if (this.plugin.dailyLimitManager.isReached()) {
            this.states.dailyLimitReached(dueCount)
            return
        }
        
        // Load the due cards into the queue for normal review
        this.queue = this.plugin.dailyLimitManager.applyTo(due)
        
        this.renderCurrentCard()
    }

    // MARK: Renderer

    private async renderCurrentCard() {
        if (this.currentIndex < this.queue.length) {
            const card = this.queue[this.currentIndex]

            this.contentEl.empty()
            // Question
            this.contentEl.createEl('h1', { text: card.question })

            // Answer Section
            if (this.answerRevealed) {
                try {
                    const file = this.app.vault.getAbstractFileByPath(card.path)
                    if (!(file instanceof TFile))
                        throw new Error('File not found or not an instance of TFile')
                    const content = await this.app.vault.read(file)

                    await this.components.showAnswer(
                        content,
                        card.path, 
                        (rating: Rating) => this.rateCard(card, rating, file), 
                        this.currentIndex,
                        this.queue.length
                    )
                } catch (error) {
                    console.error('Error reading card file:', error)
                    this.components.showCardError(
                        error as Error,
                        card.path,
                        () => this.renderCurrentCard(), // Retry - re-render the current card
                        () => this.navigateToNextCard(), // Skip - move to next card
                        this.currentIndex,
                        this.queue.length
                    )
                }
            } else {
                this.components.showAnswerButton(
                    () => this.revealAnswer(),
                    this.currentIndex,
                    this.queue.length
                )
            }
        } else {
            this.states.sessionComplete(this.currentIndex)
        }
    }

    // MARK: Actions

    private async rateCard(card: Card, rating: Rating, file?: TFile) {
        try {
            if (!file) {
                const fileByPath = this.app.vault.getAbstractFileByPath(card.path)
                if (!(fileByPath instanceof TFile))
                    throw new Error('File not found or not an instance of TFile')
                file = fileByPath
            }

            // Schedule and update frontmatter in one call (card.sr is updated automatically)
            const result = await this.frontmatterManager.updateScheduling(file, card, rating)

            // Check for errors
            if (result.errors.length > 0) {
                console.error('Error updating card scheduling:', result)

                new ErrorModal(
                    this.app,
                    this.plugin,
                    result.errors,
                    'Card Update Error',
                    result.parsingError ?
                        'Encountered validation errors with existing frontmatter while updating card scheduling (continued normally after backup):'
                        : ( result.generationError ?
                            'Encountered errors while generating new frontmatter (terminated with report):'
                            : 'Encountered unknown errors while updating card scheduling:'
                        )
                    
                ).open()
                
                // Only return (stop) if we have generation errors or unknown errors
                // Continue if we only have parsing errors (data was backed up)
                if (result.generationError || !result.parsingError)
                    return
            }

            // Update today's served count
            this.plugin.dailyLimitManager.recordCardReviewed(this.plugin.settings)
            // Update badge to reflect remaining count
            this.plugin.updateRibbon()

            this.navigateToNextCard()
        } catch (error) {
            console.error('Error reading card file:', error)
            this.plugin.showErrorNotice('Failed to save card rating. Please try again.')
        }
    }

    private navigateToNextCard() {
        this.answerRevealed = false
        this.currentIndex++
        this.renderCurrentCard()
    }

    private revealAnswer() {
        this.answerRevealed = true
        this.renderCurrentCard()
    }

    // MARK: Callbacks

    private openSettings() {
        // Close the review modal first
        this.close()
        
        // Use Obsidian's settings API to open the plugin's settings tab
        // Cast app to ExtendedApp to access the settings methods
        const app = this.app as ExtendedApp
        if (app.setting?.open && app.setting?.openTabById) {
            app.setting.open()
            app.setting.openTabById(this.plugin.manifest.id)
        } else {
            // Fallback: just open settings if the API isn't available
            console.warn('Settings API not available, opening general settings')
            const commands = app.commands
            if (commands?.executeCommandById) {
                commands.executeCommandById('app:open-settings')
            }
        }
    }

    private selectDeck() {
        this.close()
        new DeckSelectionModal(this.app, this.plugin).open()
    }
    
    private loadMoreDue(batch: number) {
        const due = this.deck.getDueCards()
        this.queue = due.slice(0, batch)
        
        this.currentIndex = 0
        this.answerRevealed = false

        this.renderCurrentCard()
    }

    // MARK: Key Events

    private setupKeyboardHandlers() {
        this.scope.register([], ' ', () => {
            if (!this.answerRevealed && this.queue.length > 0)
                this.revealAnswer()
        })
        this.scope.register([], 'Enter', () => {
            if (!this.answerRevealed && this.queue.length > 0)
                this.revealAnswer()
        })
        
        this.scope.register([], '1', () => {
            const card = this.queue[this.currentIndex]
            if (card && this.answerRevealed && this.queue.length > 0)
                this.rateCard(card, Rating.Again)
        })
        this.scope.register([], '2', () => {
            const card = this.queue[this.currentIndex]
            if (card && this.answerRevealed && this.queue.length > 0)
                this.rateCard(card, Rating.Hard)
        })
        this.scope.register([], '3', () => {
            const card = this.queue[this.currentIndex]
            if (card && this.answerRevealed && this.queue.length > 0)
                this.rateCard(card, Rating.Good)
        })
        this.scope.register([], '4', () => {
            const card = this.queue[this.currentIndex]
            if (card && this.answerRevealed && this.queue.length > 0)
                this.rateCard(card, Rating.Easy)
        })
    }
}
