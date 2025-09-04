import { Card as FSRSCard, State, fsrs, Rating, createEmptyCard } from 'ts-fsrs'
import { App, TFile } from 'obsidian'

import { Card, ValidationResult, ValidationError, ValidationErrorType } from '../types'


// TODO: LATER This file is too long
export class CardStorage {
    private static f = fsrs()
    
    constructor(private app: App) {}

    // MARK: Get

	/**
	 * Extract FSRS Card from frontmatter data with strict validation
	 */
	static fromFrontmatter(srData?: string[]): FSRSCard | ValidationError[] {
		const result = this.validateAndParseFrontmatter(srData)

		if (result.errors.length !== 0)
			// For validation errors, log the issue and return new card
			return result.errors
		
		return result.card || createEmptyCard()
	}

    // Only public for tests
	/**
	 * Validate and parse frontmatter data with comprehensive error checking
	 */
	static validateAndParseFrontmatter(srData?: string[]): ValidationResult {
		const errors: ValidationError[] = []

		// Start with default card
		const defaultCard = createEmptyCard()

		// If no data provided, that's fine - new card
		if (!srData || !Array.isArray(srData) || srData.length === 0)
			return {
				errors: [],
				card: defaultCard
			}

		// Parse array format: ["due=2025-08-26T15:30:00.000Z", "stability=1.5", ...]
		const parsed: Record<string, string> = {}
		const validFields = new Set(['due', 'last_review', 'stability', 'difficulty', 'state', 'reps', 'lapses', 'scheduled_days', 'learning_steps'])
		
		for (const item of srData) {
			if (typeof item !== 'string') {
				errors.push({
					type: ValidationErrorType.NON_STRING_FIELD_TYPE,
					value: item,
					message: `The field type is: ${typeof item}`,
					suggestion: 'Remove invalid entry'
				})
				continue
			}

			if (!item.includes('=')) {
				errors.push({
					type: ValidationErrorType.MALFORMED_ENTRY,
					value: item,
					suggestion: 'Should be in format key=value'
				})
				continue
			}

			const [key, value] = item.split('=', 2)
			const trimmedKey = key.trim()
			const trimmedValue = value.trim()

			if (!validFields.has(trimmedKey)) {
				errors.push({
					type: ValidationErrorType.UNKNOWN_FIELD,
					field: trimmedKey,
					value: trimmedValue,
					suggestion: 'Remove unknown entry or check for typos'
				})
				continue
			}

			parsed[trimmedKey] = trimmedValue
		}

		// Validate and parse dates
		this.validateAndParseDate(parsed, 'due', defaultCard, errors, true) // Due date is required for proper scheduling
		this.validateAndParseDate(parsed, 'last_review', defaultCard, errors, false) // Only optional field

		// Validate and parse numeric fields - all required for FSRS algorithm integrity
		this.validateAndParseNumber(parsed, 'stability', defaultCard, errors, (n) => n >= 0, true, true)
		this.validateAndParseNumber(parsed, 'difficulty', defaultCard, errors, (n) => n >= 0 && n <= 10, true, true)
		this.validateAndParseNumber(parsed, 'reps', defaultCard, errors, (n) => n >= 0, false, true)
		this.validateAndParseNumber(parsed, 'lapses', defaultCard, errors, (n) => n >= 0, false, true)
		this.validateAndParseNumber(parsed, 'scheduled_days', defaultCard, errors, (n) => n >= 0, true, true)
		this.validateAndParseNumber(parsed, 'learning_steps', defaultCard, errors, (n) => n >= 0, false, true)

		// Validate and parse state
		this.validateAndParseState(parsed, defaultCard, errors)

		// Determine overall validity - any errors means invalid
		const isValid = errors.length === 0

		return {
			errors,
			card: isValid ? defaultCard : undefined
		}
	}

	private static validateAndParseDate(
		parsed: Record<string, string>, 
		field: string, 
		card: FSRSCard, 
		errors: ValidationError[], 
		required: boolean
	): void {
		if (!(field in parsed)) {
			if (required) {
				errors.push({
					type: ValidationErrorType.MISSING_REQUIRED_FIELD,
					field,
					suggestion: 'Provide valid date in ISO format'
				})
			}
			return
		}

		const dateValue = parsed[field]
		const date = new Date(dateValue)
		
		if (isNaN(date.getTime())) {
			errors.push({
				type: ValidationErrorType.INVALID_DATE_FORMAT,
				field,
				value: dateValue,
				suggestion: 'Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
			})
			return
		}

		// Set the date on the card
		if (field === 'due') {
			card.due = date
		} else if (field === 'last_review') {
			card.last_review = date
		}
	}

	private static validateAndParseNumber(
		parsed: Record<string, string>,
		field: string,
		card: FSRSCard,
		errors: ValidationError[],
		validator: (n: number) => boolean,
		allowFloat: boolean,
		required: boolean
	): void {
		if (!(field in parsed)) {
			if (required) {
				errors.push({
					type: ValidationErrorType.MISSING_REQUIRED_FIELD,
					field,
					suggestion: 'Provide valid numeric value'
				})
			}
			return
		}

		const value = parsed[field]
		const numericValue = Number(value)
		
		if (isNaN(numericValue)) {
			errors.push({
				type: ValidationErrorType.NON_NUMERIC_VALUE,
				field,
				value,
				suggestion: 'Provide valid number'
			})
			return
		}

		if (!validator(numericValue)) {
			errors.push({
				type: ValidationErrorType.INVALID_VALUE_BOUNDS,
				field,
				value,
				suggestion: this.getValidationSuggestion(field)
			})
			return
		}

		// Apply value to card
		const finalValue = allowFloat ? numericValue : Math.floor(numericValue)
		if (!allowFloat && finalValue !== numericValue) {
			errors.push({
				type: ValidationErrorType.FLOAT_VALUE_NOT_ALLOWED,
				field,
				value,
				suggestion: 'Use integer values for count fields'
			})
		}

		// Set the field value on the card
		switch (field) {
			case 'stability': card.stability = finalValue; break
			case 'difficulty': card.difficulty = finalValue; break
			case 'reps': card.reps = finalValue; break
			case 'lapses': card.lapses = finalValue; break
			case 'scheduled_days': card.scheduled_days = finalValue; break
			case 'learning_steps': card.learning_steps = finalValue; break
		}
	}

	private static validateAndParseState(
		parsed: Record<string, string>,
		card: FSRSCard,
		errors: ValidationError[]
	): void {
		if (!('state' in parsed)) {
			// State is required for proper FSRS algorithm operation
			errors.push({
				type: ValidationErrorType.MISSING_REQUIRED_FIELD,
				field: 'state',
				suggestion: 'Use 0=New, 1=Learning, 2=Review, 3=Relearning'
			})
			return
		}

		const stateValue = parsed.state
		const stateNum = Number(stateValue)
		
		if (isNaN(stateNum) || stateNum < 0 || stateNum > 3 || !Number.isInteger(stateNum)) {
			errors.push({
				type: ValidationErrorType.INVALID_STATE_VALUE,
				field: 'state',
				value: stateValue,
				suggestion: 'Use 0=New, 1=Learning, 2=Review, 3=Relearning'
			})
			return
		}

		switch (stateNum) {
			case 0: card.state = State.New; break
			case 1: card.state = State.Learning; break
			case 2: card.state = State.Review; break
			case 3: card.state = State.Relearning; break
		}
	}

	private static getValidationSuggestion(field: string): string {
		switch (field) {
			case 'stability': return 'Must be ≥ 0'
			case 'difficulty': return 'Must be between 0 and 10'
			case 'reps': return 'Must be ≥ 0'
			case 'lapses': return 'Must be ≥ 0'
			case 'scheduled_days': return 'Must be ≥ 0'
			case 'learning_steps': return 'Must be ≥ 0'
			default: return 'Check value format and range'
		}
	}

    // MARK: Update

    async updateScheduling(
        file: TFile,
        card: Card,
        rating: Rating
    ): Promise<SchedulingResult> {
		const result: SchedulingResult = {
			parsingError: false,
			generationError: false,
			errors: []
		}

        // Get current frontmatter for validation
        const cache = this.app.metadataCache.getFileCache(file)
		// TODO: LATER We could extract the namespace to change it to
		// (1) be more uncommon
		// (2) enable multi user learning
        const currentFrontmatter = cache?.frontmatter?.['spaced-repetition']
        
        if (currentFrontmatter) {
            const validationResult = CardStorage.validateAndParseFrontmatter(currentFrontmatter)
            
            // If current data has errors, create backup before overwriting
            if (validationResult.errors.length !== 0) {
                // Add validation errors to our error collection
				result.parsingError = true
                result.errors.push(...validationResult.errors)
                try {
                    await this.createDataBackup(file, validationResult.errors)
                } catch (error) {
                    result.errors.push({
						filePath: file.path,
                        type: ValidationErrorType.FILE_SYSTEM_ERROR,
                        message: `Failed to create backup: ${error}`,
                        suggestion: 'Check file permissions and disk space'
                    })
                }
            }
        }

        // Update scheduling
        try {
            if (rating) {
                const schedulingCards = CardStorage.f.repeat(card.sr, new Date())
                card.sr = schedulingCards[rating].card
            }
        } catch (error) {
            result.errors.push({
				filePath: file.path,
                type: ValidationErrorType.ALGORITHM_ERROR,
                message: `Scheduling algorithm failed: ${error}`,
                suggestion: 'This may be a plugin bug - please report it'
            })
            return result
        }

        // Write to frontmatter
        try {
            await this.app.fileManager.processFrontMatter(file, async (frontmatter) => {
                const srData = this.formatSRData(card.sr)
                
                // Validate the data we're about to write
                const validation = CardStorage.validateAndParseFrontmatter(srData)
                if (validation.errors.length !== 0) {
                    result.errors.push(...validation.errors)
					result.generationError = true
                    await this.createGenerationErrorReport(file, card.sr, srData, validation.errors)
                    return // Don't write invalid data
                }
                
                frontmatter['spaced-repetition'] = srData
            })
        } catch (error) {
            result.errors.push({
				filePath: file.path,
                type: ValidationErrorType.FILE_SYSTEM_ERROR,
                message: `Failed to write updated frontmatter: ${error}`,
                suggestion: 'Check if file is writable and not locked by another application'
            })
        }

        return result
    }

    /**
     * Format FSRS Card as array of strings for frontmatter
     */
    private formatSRData(card: FSRSCard): string[] {
        const data: string[] = []

        // Core scheduling fields
        data.push(`due=${card.due.toISOString()}`)
        if (card.last_review)
            data.push(`last_review=${card.last_review.toISOString()}`)
        
        // FSRS algorithm fields
        data.push(`stability=${card.stability}`)
        data.push(`difficulty=${card.difficulty}`)
        
        // State and progression tracking  
        data.push(`state=${card.state}`)
        data.push(`reps=${card.reps}`)
        data.push(`lapses=${card.lapses}`)
        
        // Scheduling metadata
        data.push(`scheduled_days=${card.scheduled_days}`)
        data.push(`learning_steps=${card.learning_steps}`)

        return data
    }

    /**
     * Create backup of corrupted data before overwriting
     * Errors are caught higher up in the call stack
     */
    private async createDataBackup(file: TFile, errors: ValidationError[]): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = `${file.path}.backup-${timestamp}.txt`
        
        const content = await this.app.vault.read(file)
        // Create backup file with original content
        await this.app.vault.create(backupPath, content)
        
        // Create error report
        const errorReport = this.generateErrorReport(file.path, errors, timestamp)
        const reportPath = `${file.path}.errors-${timestamp}.md`
        await this.app.vault.create(reportPath, errorReport)
        
        console.log(`CardStorage: Backup created at ${backupPath}`)
        console.log(`CardStorage: Error report created at ${reportPath}`)
    }

    /**
     * Generate human-readable error report
     */
    private generateErrorReport(filePath: string, errors: ValidationError[], timestamp: string): string {
        let report = `# Frontmatter Validation Error Report\n\n`
        report += `**File:** ${filePath}\n`
        report += `**Timestamp:** ${timestamp}\n`
        report += `**Plugin:** File Flashcards\n\n`

        report += `The spaced repetition data in this file failed validation checks. `
        report += `This could be due to manual editing, external plugin or tool modifications, or data corruption. `
        report += `The card has been treated as new to prevent algorithm corruption.\n\n`
        
        report += `## Issues Found\n\n`
        
        errors.forEach((error, index) => {
            report += `### ${index + 1}. ${error.type.replace(/_/g, ' ')}\n`
            if (error.field) report += `- **Field:** ${error.field}\n`
            if (error.value !== undefined) report += `- **Value:** \`${error.value}\`\n`
            if (error.message) report += `- **Message:** ${error.message}\n`
            if (error.suggestion) report += `- **Suggestion:** ${error.suggestion}\n`
            report += '\n'
        })
        
        const backupPath = `${filePath}.backup-${timestamp}.txt`
        report += `## Recovery Options\n\n`
        report += `1. **Manual repair:** Restore the frontmatter from the [[${backupPath}|Backup]] and fix the issues above\n`
        report += `2. **Contact support:** If this appears to be a plugin bug\n\n`
        
        return report
    }

    /**
     * Create error report for plugin generation failures
     * Errors are caught higher up in the call stack
     */
    private async createGenerationErrorReport(file: TFile, card: FSRSCard, srData: string[], errors: ValidationError[]): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const reportPath = `${file.path}.generation-error-${timestamp}.md`
        
        const report = this.generateGenerationErrorReport(file.path, card, srData, errors, timestamp)
        await this.app.vault.create(reportPath, report)
        console.log(`CardStorage: Generation error report created at ${reportPath}`)
    }

    /**
     * Generate human-readable generation error report
     */
    private generateGenerationErrorReport(filePath: string, card: FSRSCard, srData: string[], errors: ValidationError[], timestamp: string): string {
        let report = `# Card Generation Error Report\n\n`
        report += `**File:** ${filePath}\n`
        report += `**Timestamp:** ${timestamp}\n`
        report += `**Plugin:** File Flashcards\n`
        
        report += `This is a plugin bug, not a user data issue. The original file was not modified.\n\n`
        report += `The plugin generated spaced repetition frontmatter data that failed its own validation. `
        report += `This suggests a bug in the formatting logic. The write operation was aborted `
        report += `to prevent file corruption.\n\n`

        report += `## Generated Card Data\n\n`
        report += `### FSRS Card Object\n`
        report += `\`\`\`yaml\n`
        report += `spaced-repetition:\n`
        report += `  - due=${card.due.toISOString()}\n`
        if (card.last_review) report += `  - last_review=${card.last_review.toISOString()}\n`
        report += `  - stability=${card.stability}\n`
        report += `  - difficulty=${card.difficulty}\n`
        report += `  - state=${card.state}\n`
        report += `  - reps=${card.reps}\n`
        report += `  - lapses=${card.lapses}\n`
        report += `  - scheduled_days=${card.scheduled_days}\n`
        report += `  - learning_steps=${card.learning_steps}\n`
        report += `\`\`\`\n\n`
        
        report += `### Generated Frontmatter (Failed Validation)\n`
        report += `\`\`\`yaml\n`
        report += `spaced-repetition:\n`
        srData.forEach(entry => {
            report += `  - ${entry}\n`
        })
        report += `\`\`\`\n\n`
        
        report += `## Issues found\n\n`
        
        errors.forEach((error, index) => {
            report += `### ${index + 1}. ${error.type.replace(/_/g, ' ')}\n`
            if (error.field) report += `- **Field:** ${error.field}\n`
            if (error.value !== undefined) report += `- **Value:** \`${error.value}\`\n`
            report += `- **Message:** ${error.message}\n`
            if (error.suggestion) report += `- **Suggestion:** ${error.suggestion}\n`
            report += '\n'
        })
        
        report += `## Next Steps\n\n`
        report += `1. **File is safe:** Your original file was not modified\n`
        report += `2. **Report bug:** This appears to be a plugin issue that should be reported\n`
        
        return report
    }
}

interface SchedulingResult {
	parsingError: boolean,
	generationError: boolean,
	errors: ValidationError[]
}