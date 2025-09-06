import { App, Modal } from 'obsidian'

import FileFlashcardsPlugin from '../../main'
import { ValidationError } from '../types'
import { UIComponents } from './components'

export class ErrorModal extends Modal {
    private components: UIComponents

    constructor(
        app: App,
        plugin: FileFlashcardsPlugin,
        private errors: ValidationError[],
        private title: string,
        private message?: string,
    ) {
        super(app)
        this.components = new UIComponents(app, plugin, this.contentEl)

        // Setup fullscreen modal layout
        this.components.setupFullscreenModal(this.modalEl, this.titleEl, this.contentEl)
    }

    onOpen() {
        this.renderErrorContent()
    }

    private renderErrorContent(): void {
        this.contentEl.empty()
        
        // Error title
        const titleEl = this.contentEl.createEl('h1')
        titleEl.setText(this.title)
        titleEl.addClass('ff-error-title')

        this.components.addSpacer(this.contentEl)

        // Main error message
        if (this.message) {
            const messageEl = this.contentEl.createEl('h2')
            messageEl.setText(this.message)
        }

        // Validation errors if provided
        this.renderValidationErrors()
        
        this.components.addSpacer(this.contentEl)

        // Close button
        const buttonContainer = this.components.showButtonContainer()
        this.components.showAccentButton('Close', () => this.close(), buttonContainer)
    }

    private renderValidationErrors(): void {
        if (this.errors && this.errors.length > 0) {
            // Create scrollable container for errors only
            const scrollContainer = this.components.createScrollViewContainer()
            const scrollView = this.components.createScrollView(scrollContainer)
            scrollView.addClass('ff-error-scroll-padding')

            this.errors.forEach(error => {
                const errorItem = this.createValidationErrorItem(error)
                scrollView.appendChild(errorItem)
            })
        }
    }

    createValidationErrorItem(error: ValidationError): HTMLElement {
        const itemEl = document.createElement('div')
        itemEl.addClass('ff-error-item')

        // File path
        if (error.filePath) {
            const fileEl = itemEl.createEl('div')
            fileEl.setText(`📄 ${error.filePath}`)
            fileEl.addClass('ff-error-file')
        }
        
        // Error type
        let headerText = error.type.replace(/_/g, ' ').toLowerCase()
        headerText = headerText.charAt(0).toUpperCase() + headerText.slice(1)
        const headerEl = itemEl.createEl('strong')
        headerEl.setText(`⚠️ ${headerText}`)
        headerEl.addClass('ff-error-header')
        
        // Message
        if (error.message) {
            const messageEl = itemEl.createEl('div')
            messageEl.setText(error.message)
            messageEl.addClass('ff-error-message')
        }

        // Field
        if (error.field) {
            const fieldEl = itemEl.createEl('div')
            fieldEl.addClass('ff-error-field')
            fieldEl.setText(`Field: ${error.field}`)
        }

        // Value 
        if (error.value !== undefined) {
            const valueEl = itemEl.createEl('div')
            valueEl.addClass('ff-error-value')
            valueEl.setText(`Value: ${JSON.stringify(error.value)}`)
        }

        // Suggestion
        if (error.suggestion) {
            const suggestionEl = itemEl.createEl('div')
            suggestionEl.addClass('ff-error-suggestion')
            suggestionEl.setText(`💡 ${error.suggestion}`)
        }

        return itemEl
    }
}
