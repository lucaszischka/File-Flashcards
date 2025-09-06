import { App, MarkdownRenderer, Platform } from 'obsidian'

import FileFlashcardsPlugin from '../../main'
import { Rating } from '../types'


export class UIComponents {
    constructor(
        private app: App,
        private plugin: FileFlashcardsPlugin,
        private contentEl: HTMLElement
    ) {}

    // MARK: Modal Setup

    setupFullscreenModal(modalEl: HTMLElement, titleEl: HTMLElement, contentEl: HTMLElement): void {
        // Make modal fill screen
        modalEl.addClass('ff-fullscreen-modal')

        // We don't set a title, but the element is still there and has a margin
        // We need to remove it as it messes with size calculations
        const header = titleEl.parentElement
        if (header)
            header.addClass('ff-modal-header')

        // Place the content in a flex container for proper sizing and alignment
        contentEl.addClass('ff-modal-content')
    }

    // MARK: UI Utilities

    addSpacer(contentEl: HTMLElement) {
        const spacerEl = contentEl.createEl('div')
        spacerEl.addClass('ff-spacer')
    }

    showTrophyIcon(): void {
        // Trophy SVG icon
        const trophyEl = this.contentEl.createEl('div')
        const svg = trophyEl.createSvg('svg', {
            attr: {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '50',
                height: '50',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                class: 'lucide lucide-trophy-icon lucide-trophy'
            }
        })
        svg.createSvg('path', { attr: { d: 'M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978' } })
        svg.createSvg('path', { attr: { d: 'M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978' } })
        svg.createSvg('path', { attr: { d: 'M18 9h1.5a1 1 0 0 0 0-5H18' } })
        svg.createSvg('path', { attr: { d: 'M4 22h16' } })
        svg.createSvg('path', { attr: { d: 'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z' } })
        svg.createSvg('path', { attr: { d: 'M6 9H4.5a1 1 0 0 1 0-5H6' } })
        
        svg.style.width = '50px'
        svg.style.height = '50px'
        svg.style.color = 'gold'
    }

    createVStack(contentEl: HTMLElement): HTMLElement {
        const vStack = contentEl.createDiv()
        vStack.addClass('ff-vstack')
        return vStack
    }

    // MARK: Buttons

    showAccentButton(
        text: string,
        onClick: () => void,
        container?: HTMLElement
    ): HTMLButtonElement {
        const button = this.showButton(text, onClick, container)
        button.addClass('mod-cta') // Obsidian's call-to-action button class
        return button
    }

    showButton(
        text: string,
        onClick: () => void,
        container?: HTMLElement
    ): HTMLButtonElement {
        const parent = container || this.showButtonContainer()
        const button = parent.createEl('button', { text })
        button.addClass('ff-button')
        button.addEventListener('click', onClick)
        return button
    }

    // Applied to all buttons for consistent styling
    showButtonContainer(): HTMLElement {
        const container = this.contentEl.createEl('div')
        container.addClass('ff-button-container')
        return container
    }

    // MARK: Scroll View

    createScrollViewContainer(): HTMLElement {
        // Container with rounded corners, background and border
        const outerEl = this.contentEl.createEl('div')
        outerEl.addClass('ff-scroll-container')
        return outerEl
    }

    createScrollView(containerEl: HTMLElement): HTMLElement {
        const innerEl = containerEl.createEl('div')
        innerEl.addClass('ff-scroll-view')
        return innerEl
    }

    // MARK: Error Display

    createErrorIcon(size = '48px', color = 'var(--text-error)'): HTMLElement {
        const errorIconEl = document.createElement('div')
        const svg = errorIconEl.createSvg('svg', {
            attr: {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '24',
                height: '24',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                class: 'lucide lucide-octagon-alert-icon lucide-octagon-alert'
            }
        })
        svg.createSvg('path', { attr: { d: 'M12 16h.01' } })
        svg.createSvg('path', { attr: { d: 'M12 8v4' } })
        svg.createSvg('path', { attr: { d: 'M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z' } })
        
        svg.style.height = size
        svg.style.width = size
        svg.style.color = color
        
        return errorIconEl
    }

    showCardError(
        error: Error,
        cardPath: string,
        onRetry: () => void,
        onSkip: () => void,
        currentIndex: number,
        totalCards: number
    ): void {
        // Add spacer to push error content to center
        this.addSpacer(this.contentEl)

        // Error container with styling similar to answer container
        const outerEl = this.createScrollViewContainer()
        outerEl.addClass('ff-error-container')
        
        const innerEl = this.createScrollView(outerEl)
        innerEl.addClass('ff-error-content')

        // Error icon and title
        const errorIconEl = this.createErrorIcon()
        innerEl.appendChild(errorIconEl)

        const titleEl = innerEl.createEl('h2')
        titleEl.setText('Unable to Load Card')
        titleEl.addClass('ff-error-display-title')

        // Error message
        const messageEl = innerEl.createEl('p')
        messageEl.setText(`Failed to read the card file content.`)
        messageEl.addClass('ff-error-display-message')

        // File path
        const pathEl = innerEl.createEl('div')
        pathEl.setText(cardPath)
        pathEl.addClass('ff-error-display-path')

        // Error details (collapsed by default)
        const detailsEl = innerEl.createEl('details')
        detailsEl.addClass('ff-error-details')
        
        const summaryEl = detailsEl.createEl('summary')
        summaryEl.setText('Error Details')
        summaryEl.addClass('ff-error-details-summary')

        const errorContentEl = detailsEl.createEl('pre')
        errorContentEl.addClass('ff-error-content-details')
        errorContentEl.setText(error.stack || error.message)

        // Add spacer and buttons
        this.addSpacer(this.contentEl)
        const buttonContainer = this.showButtonContainer()
        this.showButton('Retry', onRetry, buttonContainer)
        this.showAccentButton('Skip Card', onSkip, buttonContainer)
        this.showProgressIndicator(currentIndex, totalCards)
    }

    // MARK: Answer Section

    showAnswerButton(
        onRevealAnswer: () => void,
        currentIndex: number,
        totalCards: number
    ): void {
        // Add spacer to push button towards bottom
        this.addSpacer(this.contentEl)
        this.showAccentButton('Show Answer', onRevealAnswer)
        this.showProgressIndicator(currentIndex, totalCards)
    }

    async showAnswer(
        content: string,
        cardPath: string,
        onRateCard: (rating: Rating) => void,
        currentIndex: number,
        totalCards: number
    ): Promise<void> {
        this.addSpacer(this.contentEl)

        const outerEl = this.createScrollViewContainer()
        const innerEl = this.createScrollView(outerEl)
        innerEl.addClass('ff-stacktrace-padding')
        this.renderMarkdownContent(content, cardPath, innerEl)
        if (Platform.isDesktopApp)
            this.addEditButton(outerEl, cardPath)

        // Add spacer and buttons
        this.addSpacer(this.contentEl)
        this.showRatingButtons(onRateCard)
        this.showProgressIndicator(currentIndex, totalCards)
    }

    private renderMarkdownContent(
        content: string,
        cardPath: string,
        innerEl: HTMLElement
    ): void {
        // Scrollable markdown renderer
        MarkdownRenderer.render(
            this.app,
            content,
            innerEl,
            cardPath,
            this.plugin,
        )
    }

    private addEditButton(
        containerEl: HTMLElement,
        cardPath: string
    ): void {
        // Add icon in bottom right
        const iconEl = containerEl.createEl('button')
        iconEl.addClass('ff-clickable-icon')
        iconEl.title = 'Open Editor in new window'
        // SVG Icon
        const svg = iconEl.createSvg('svg', {
            attr: {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '24',
                height: '24',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                class: 'lucide lucide-pencil-icon lucide-pencil'
            }
        })
        svg.createSvg('path', { attr: { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' } })
        svg.createSvg('path', { attr: { d: 'm15 5 4 4' } })
        iconEl.addEventListener('click', () => this.app.workspace.openLinkText(cardPath, '', 'window'))
        iconEl.addClass('ff-edit-button')
    }

    private showRatingButtons(
        onRateCard: (rating: Rating) => void
    ): HTMLElement {
        // Create a horizontal container for the rating buttons
        const buttonContainer = this.showButtonContainer()
        this.showButton('Again', () => onRateCard(Rating.Again), buttonContainer)
        this.showButton('Hard', () => onRateCard(Rating.Hard), buttonContainer)
        this.showButton('Good', () => onRateCard(Rating.Good), buttonContainer)
        this.showButton('Easy', () => onRateCard(Rating.Easy), buttonContainer)
        return buttonContainer
    }

    private showProgressIndicator(
        currentIndex: number,
        totalCards: number
    ): HTMLElement {
        // Bottom progress indicator
        const progressEl = this.contentEl.createEl('div', { 
            text: `Card ${currentIndex + 1} of ${totalCards}`
        })
        progressEl.addClass('ff-progress-indicator')
        return progressEl
    }
}
