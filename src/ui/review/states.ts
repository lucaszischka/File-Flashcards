import FileFlashcardsPlugin from 'main'
import { Deck } from '../../types'
import { UIComponents } from '../components'
import confetti from 'canvas-confetti'


interface ReviewCallbacks {
    openSettings: () => void
    closeModal: () => void
    selectDeck: () => void
    loadMoreDue: (batch: number) => void
}

export class ReviewStates {
    constructor(
        private plugin: FileFlashcardsPlugin,
        private contentEl: HTMLElement,
        private components: UIComponents,
        private deck: Deck
    ) {}

    private getNameSection(): string {
        if (this.plugin.asSingleDeck())
            return ""
        return ` in "${this.deck.getName()}"`
    }

    noCards(): void {
        this.contentEl.empty()
        this.contentEl.createEl('h1', { text: `No cards found${this.getNameSection()}` })

        this.components.addSpacer(this.contentEl)
        this.contentEl.createEl('p', { text: `Please review your include and exclude patterns in the plugin settings or add your first MarkDown file to:` })
        this.contentEl.createEl('i', { text: `${this.deck.pattern}` })
        this.components.addSpacer(this.contentEl)

        // Add buttons with consistent sizing
        const buttonContainer = this.components.showButtonContainer()
        this.components.showAccentButton('Open Settings', () => this.openSettings(), buttonContainer)
        if (this.plugin.asSingleDeck()) {
            this.components.showButton('Close', () => this.closeModal(), buttonContainer)
        } else {
            this.components.showButton('Back to Deck Selection', () => this.selectDeck(), buttonContainer)
        }
    }

    noDueCards(): void {
        this.contentEl.empty()
        this.contentEl.createEl('h1', { text: '✨ No cards due! ✨' })

        this.components.addSpacer(this.contentEl)
        this.contentEl.createEl('h3', { text: `All cards${this.getNameSection()} are scheduled for later.` })
        this.components.addSpacer(this.contentEl)

        // Add buttons with consistent styling
        if (this.plugin.asSingleDeck()) {
            this.components.showAccentButton('Close', () => this.closeModal())
        } else {
            this.components.showAccentButton('Back to Deck Selection', () => this.selectDeck())
        }
    }

    dailyLimitReached(remaining: number): void {
        this.contentEl.empty()
        this.contentEl.createEl('h1', { text: '✨ You\'re done for today! ✨' })

        this.components.addSpacer(this.contentEl)
        this.contentEl.createEl('h3', { text: 'You reached your daily goal. Congratulations!' })
        this.contentEl.createEl('i', { text: 'You can adjust your daily limit in the plugin settings.' })
        this.components.addSpacer(this.contentEl)
        
        const buttonContainer1 = this.components.showButtonContainer()
        const buttonContainer2 = this.components.showButtonContainer()
        if (remaining > 10)
            this.components.showAccentButton('Continue with 10 more', () => this.loadMoreDue(10), buttonContainer1)
        this.components.showButton('Open Settings', () => this.openSettings(), buttonContainer2)
        this.components.showAccentButton(`Continue with remaining ${remaining}`, () => this.loadMoreDue(remaining), remaining > 10 ? buttonContainer1 : buttonContainer2)
        if (!this.plugin.asSingleDeck())
            this.components.showButton('Back to Deck Selection', () => this.selectDeck(), buttonContainer2)
        this.components.showButton('Close', () => this.closeModal(), buttonContainer2)
    }

    sessionComplete(reviewedCount: number): void {
        this.contentEl.empty()
        this.triggerConfettiEffect()

        this.contentEl.createEl('h1', { text: 'Session Complete!' })

        this.components.addSpacer(this.contentEl)
        this.components.showTrophyIcon()
        this.contentEl.createEl('h3', { text: `You reviewed ${reviewedCount} ${reviewedCount === 1 ? 'card' : 'cards'}.` })
        this.components.addSpacer(this.contentEl)

        const buttonContainer = this.components.showButtonContainer()
        if (!this.plugin.asSingleDeck())
            this.components.showButton('Back to Deck Selection', () => this.selectDeck(), buttonContainer)
        this.components.showAccentButton('Close', () => this.closeModal(), buttonContainer)
    }

    private triggerConfettiEffect(): void {
        // Top left
        confetti({
            particleCount: 50,
            angle: -45,
            spread: 90,
            origin: { x: 0, y: 0 },
            disableForReducedMotion: true
        })
        // Top right
        confetti({
            particleCount: 50,
            angle: 225,
            spread: 90,
            origin: { x: 1, y: 0 },
            disableForReducedMotion: true
        })
        // Top center
        confetti({
            particleCount: 200,
            angle: 270,
            spread: 180,
            origin: { x: 0.5, y: 0 },
            disableForReducedMotion: true
        })
    }

    // Callback methods - these will be set by the modal
    private openSettings: () => void = () => {}
    private closeModal: () => void = () => {}
    private selectDeck: () => void = () => {}
    private loadMoreDue: (batch: number) => void = () => {}

    setCallbacks(callbacks: ReviewCallbacks): void {
        this.openSettings = callbacks.openSettings
        this.closeModal = callbacks.closeModal
        this.selectDeck = callbacks.selectDeck
        this.loadMoreDue = callbacks.loadMoreDue
    }
}
