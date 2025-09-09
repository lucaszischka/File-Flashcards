import { Plugin, Notice } from 'obsidian'

import { FileFlashcardsSettings, DEFAULT_SETTINGS, Deck, Card } from './src/types'
import { DailyLimit } from './src/managers/daily-limit'

import { FileFlashcardsSettingTab } from './src/ui/settings-tab'
import { ReviewModal } from './src/ui/review/modal'
import { DeckSelectionModal } from './src/ui/deck-selection/modal'
import { ErrorModal } from 'src/ui/error-modal'


export default class FileFlashcardsPlugin extends Plugin {
	decks: Set<Deck> = new Set()
	settings: FileFlashcardsSettings
	dailyLimitManager: DailyLimit
	private ribbonIconEl: HTMLElement
	private badgeUpdateTimeout: number | null = null

	async onload() {
		await this.loadSettings()
		this.dailyLimitManager = new DailyLimit(this)
		await this.dailyLimitManager.init()

		// Add command for starting review session
		this.addCommand({
			id: 'start-spaced-repetition',
			name: 'Start Spaced Repetition',
			callback: () => this.openModal()
		})

		// Add ribbon icon for starting review session
		this.ribbonIconEl = this.addRibbonIcon(
			'gallery-vertical-end',
			'Start Spaced Repetition',
			() => this.openModal()
		)
		this.ribbonIconEl.addClass('ff-ribbon-icon')

		// Generate the decks
		this.updateDecks()
		// Add badge to ribbon icon
		this.updateRibbon()

		// Listen for file changes to update badge (debounced)
		this.registerEvent(
			this.app.vault.on('create', () => this.debouncedFullUpdate())
		)
		this.registerEvent(
			this.app.vault.on('delete', () => this.debouncedFullUpdate())
		)
		// It is not worth to update the badge as it would mean recalculating everything on every file change
		// The decks might get outdated too, but they are always rebuilt on modal open
		// this.registerEvent(
		// 	this.app.vault.on('modify', () => this.debouncedFullUpdate())
		// )

		// Add settings tab
		this.addSettingTab(new FileFlashcardsSettingTab(this.app, this))
	}

	private openModal() {
		// Check if any include patterns are configured
		if (this.settings.include.length === 0) {
			this.showWarningNotice('Please configure include patterns in Flashcards Plugin settings first.')
			return
		}

		// Hopefully already up to date but just in case
		this.updateDecks()
		this.updateRibbon()

		if (this.decks.size === 0) {
			this.showErrorNotice('Could not create Decks from include patterns.')
			return
		}
		
		const singleDeck = this.asSingleDeck()
		if (singleDeck) {
			// Show review modal directly if only one deck is available
			new ReviewModal(this.app, this, singleDeck).open()
			return
		}

		// Default: Show deck selection modal
		new DeckSelectionModal(this.app, this).open()
	}

	// MARK: Notices

    showErrorNotice(message: string, duration?: number): void {
        new Notice(`❌ ${message}`, duration || 5000)
    }

    showWarningNotice(message: string, duration?: number): void {
        new Notice(`⚠️ ${message}`, duration || 4000)
    }

	// MARK: Update

	private debouncedFullUpdate() {
		if (this.badgeUpdateTimeout)
			window.clearTimeout(this.badgeUpdateTimeout);
		
		this.badgeUpdateTimeout = window.setTimeout(() => {
			this.updateDecks()
			this.updateRibbon()
		}, 300) // 300ms debounce
	}

	private updateDecks() {
		try {
			const allFiles = this.app.vault.getFiles()
			const result = Deck.buildDecks(allFiles, this.settings, this.app.metadataCache)
			
			// Show error modal if there were validation issues during deck building
			if (Array.isArray(result)) {
				console.warn('FileFlashcards: Validation errors during deck building:', result)
				this.decks = new Set() // empty the decks
				new ErrorModal(
					this.app,
					this,
					result,
					'Deck Building Errors',
					'Some cards could not be loaded due to validation errors in their frontmatter:'
				).open()
			} else {
				this.decks = result
			}
		} catch (error) {
			console.error('FileFlashcards: Failed to get files:', error)
			this.decks = new Set() // empty the decks
			this.showErrorNotice('Failed to scan vault files for flashcards.')
		}
	}

	updateRibbon() {
		if (!this.ribbonIconEl) return

		// Remove existing badge if any
		const existingBadge = this.ribbonIconEl.querySelector('.ff-ribbon-badge')
		if (existingBadge)
			existingBadge.remove()

		// Check if badge should be shown
		if (!this.settings.showBadge) {
			this.ribbonIconEl.setAttribute('aria-label', 'Start Spaced Repetition')
		} else {
			// Check if include patterns are configured
			if (this.settings.include.length !== 0 && this.decks.size !== 0) {
				const { dueCount, todayCount } = this.getStats()

				if (todayCount > 0) {
					// Create badge element
					const badge = document.createElement('span')
					badge.textContent = todayCount.toString()
					badge.addClass('ff-ribbon-badge')

					// Enable ribbon icon
					this.ribbonIconEl.removeClass('ff-ribbon-disabled')
					this.ribbonIconEl.addClass('ff-ribbon-enabled')

					// Position badge relative to ribbon icon
					this.ribbonIconEl.appendChild(badge)

					// Update tooltip to include count
					this.ribbonIconEl.setAttribute('aria-label', `Start Spaced Repetition (${todayCount} cards today)`)
				} else if (dueCount > 0) {
					this.ribbonIconEl.setAttribute('aria-label', `Start Spaced Repetition (${dueCount} cards due)`)
				} else {
					this.ribbonIconEl.setAttribute('aria-label', 'Start Spaced Repetition')
				}
			} else {
				// Disable ribbon icon if no include patterns or decks are available
				this.ribbonIconEl.removeClass('ff-ribbon-enabled')
				this.ribbonIconEl.addClass('ff-ribbon-disabled')
			}
		}
	}

	// MARK: Decks helper

	getStats(): { totalCount: number, dueCount: number, todayCount: number } {
		let totalCount = 0
		const dueCards: Card[] = []
		this.decks.forEach(deck => {
			totalCount += deck.cards.length
			dueCards.push(...deck.getDueCards())
		})
		const todayCount = this.dailyLimitManager.applyTo(dueCards).length

		return { totalCount, dueCount: dueCards.length, todayCount }
	}

	/**
	 * Checks if there is only one deck without children and if so returns it
	 */
	asSingleDeck(): Deck | null {
		if (this.decks.size !== 1)
			return null
		const firstDeck = this.decks.values().next().value
		return firstDeck.children.size === 0 ? firstDeck : null
	}

	// MARK Settings

	async loadSettings() {
		try {
			const loadedSettings = await this.loadData()
			this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings)
		} catch (error) {
			console.error('FileFlashcards: Failed to load settings data, using defaults:', error)
			this.settings = Object.assign({}, DEFAULT_SETTINGS)
			this.showWarningNotice('Failed to load plugin settings, using defaults.')
		}
	}

	async saveSettings(regenerateDecks = false) {
		try {
			await this.saveData(this.settings)
		} catch (error) {
			console.error('FileFlashcards: Failed to save settings:', error)
			this.showErrorNotice('Failed to save plugin settings.')
		}
		// Update badge when settings change
		if (regenerateDecks) {
			this.debouncedFullUpdate()
		} else {
			this.updateRibbon()
		}
	}
}