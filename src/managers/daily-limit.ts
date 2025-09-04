import FileFlashcardsPlugin from 'main'
import { Card, FileFlashcardsSettings } from '../types'


interface DailyState {
    lastDate: string
    served: number
}

// Daily limit and review state management
export class DailyLimit {
    private dailyState: DailyState | null = null
    private saveTimer: number | null = null

    constructor(
        private plugin: FileFlashcardsPlugin
    ) {}

    async init() {
        try {
            this.dailyState = (await this.plugin.loadData())?.__dailyState || { lastDate: '', served: 0 }
        } catch (error) {
            console.info('DailyLimit: Failed to load data, using defaults:', error)
            this.dailyState = { lastDate: '', served: 0 }
        }
    }

    isReached(): boolean {
        if (this.plugin.settings.maxPerDay <= 0)
            return false // unlimited
        if (!this.dailyState)
            return false // not initialized yet (shouldn't happen if init awaited)

        // New day?
        const today = new Date().toISOString().split('T')[0]
        if (this.dailyState.lastDate !== today) {
            this.dailyState.served = 0
            this.dailyState.lastDate = today
            this.markDirty()
            return false
        }

        return this.dailyState.served >= this.plugin.settings.maxPerDay
    }

    applyTo(dueCards: Card[]): Card[] {
        const settings = this.plugin.settings

        if(this.isReached())
            return []

        if (!this.dailyState || this.plugin.settings.maxPerDay <= 0) 
            return dueCards

        // Take remaining slots
        const remaining = settings.maxPerDay - this.dailyState.served
        return dueCards.slice(0, remaining)
    }

    /**
     * Record that a single card has been reviewed by the user (after rating).
     * Safe to call extra times; will cap at maxPerDay implicitly via caller logic.
     */
    recordCardReviewed(settings: FileFlashcardsSettings) {
        if (settings.maxPerDay <= 0)
            return // unlimited mode: we don't track
        if (!this.dailyState)
            return // not initialized yet (shouldn't happen if init awaited)
        this.dailyState.served += 1
        this.markDirty()
    }

    /**
     * Needs to be called when dailyState is updated to save it.
     * Waits between consecutive saves 1 second.
     */
    private markDirty() {
        if (!this.dailyState)
            return
        if (this.saveTimer !== null)
            window.clearTimeout(this.saveTimer)
        // Debounce save (1s)
        this.saveTimer = window.setTimeout(async () => {
            if (!this.dailyState)
                return
            try {
				// Merge into settings save blob without overwriting user settings shape
				const existing = await this.plugin.loadData() || {}
				existing.__dailyState = this.dailyState
				await this.plugin.saveData(existing)
            } catch (error) {
                console.error('DailyLimit: Failed to save daily state:', error)
                this.plugin.showErrorNotice('Failed to save daily review progress.')
            }
        }, 1000)
    }
}
