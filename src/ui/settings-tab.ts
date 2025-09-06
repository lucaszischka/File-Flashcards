import { App, PluginSettingTab, Setting } from 'obsidian'

import FileFlashcardsPlugin from '../../main'


export class FileFlashcardsSettingTab extends PluginSettingTab {

    private previewEl: HTMLElement

	constructor(
		app: App,
		private plugin: FileFlashcardsPlugin
	) {
		super(app, plugin)
	}

	display(): void {
		this.containerEl.empty()

		this.containerEl.createEl('h2', { text: 'Flashcards Settings' })

		// Include patterns
		const includeSetting = new Setting(this.containerEl)
			.setName('Include patterns')
			.setDesc('')
			.addTextArea(text => {
				text
					.setPlaceholder('Flashcards/**\nUniversity/Software Engineering/**')
					.setValue(this.plugin.settings.include.join('\n'))
					.onChange(async (value) => {
						this.plugin.settings.include = value.split('\n').filter(line => line.trim().length > 0)
						// Save and Regenerate Decks
						await this.plugin.saveSettings(true)
						this.updatePreview()
					})
				text.inputEl.rows = 10
				text.inputEl.addClass('ff-settings-input-wide')
			})
		includeSetting.descEl.empty()
		includeSetting.descEl.appendText('Folders and patterns to include.')
		includeSetting.descEl.createEl('br')
		includeSetting.descEl.appendText('Only markdown files (.md) are processed regardless of pattern.')
		includeSetting.descEl.createEl('br')
		includeSetting.descEl.appendText('Use ')
		includeSetting.descEl.createEl('code', { text: '**' })
		includeSetting.descEl.appendText(' to include all files.')
		includeSetting.descEl.createEl('br')
		includeSetting.descEl.appendText('One per line.')

		// Exclude patterns
		const excludeSetting = new Setting(this.containerEl)
			.setName('Exclude patterns')
			.setDesc('')
			.addTextArea(text => {
				text
					.setPlaceholder('Journal/**\n**/README')
					.setValue(this.plugin.settings.exclude.join('\n'))
					.onChange(async (value) => {
						this.plugin.settings.exclude = value.split('\n').filter(line => line.trim().length > 0)
						// Save and Regenerate Decks
						await this.plugin.saveSettings(true)
						this.updatePreview()
					});
				text.inputEl.rows = 5
				text.inputEl.addClass('ff-settings-input-wide')
			})
		excludeSetting.descEl.empty()
		excludeSetting.descEl.appendText('Folders and patterns to exclude from review.')
		excludeSetting.descEl.createEl('br')
		excludeSetting.descEl.appendText('File extensions are ignored since only markdown files are processed.')
		excludeSetting.descEl.createEl('br')
		excludeSetting.descEl.appendText('One per line.')

		// Max per day
		const maxPerDaySetting = new Setting(this.containerEl)
			.setName('Maximum cards per day')
			.setDesc('')
			.addText(text => text
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.maxPerDay))
				.onChange(async (value) => {
					const num = parseInt(value) || 0
					this.plugin.settings.maxPerDay = Math.max(0, num)
					await this.plugin.saveSettings()
					this.updatePreview()
				}))
		maxPerDaySetting.descEl.empty()
		maxPerDaySetting.descEl.appendText('Limit the number of cards that should be reviewed each day.')
		maxPerDaySetting.descEl.createEl('br')
		maxPerDaySetting.descEl.appendText('Unlimited is represented by ')
		maxPerDaySetting.descEl.createEl('code', { text: '0' })
		maxPerDaySetting.descEl.appendText('.')

		// Show badge setting
		new Setting(this.containerEl)
			.setName('Show badge on ribbon icon')
			.setDesc('Display a badge on the ribbon icon showing the number of cards due for review')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showBadge)
				.onChange(async (value) => {
					this.plugin.settings.showBadge = value
					await this.plugin.saveSettings()
				}))

        // Store preview element for file count preview
		this.previewEl = this.containerEl.createEl('div')
		this.previewEl.addClass('ff-settings-preview')
		
		this.updatePreview()
	}

	private updatePreview(): void {
		const { totalCount, dueCount, todayCount } = this.plugin.getStats()
        this.previewEl.setText(`${todayCount} cards due for review today • ${dueCount} total cards due for review • ${totalCount} total matching files`)
    }
}
