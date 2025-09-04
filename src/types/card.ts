import { TFile, FrontMatterCache } from 'obsidian'
import { Card as FSRSCard } from 'ts-fsrs'
import { CardStorage } from '../managers/card-storage'
import { ValidationError } from './validation'

export class Card {
    private constructor(
        public path: string,        // File path relative to vault
        public question: string,    // Title or flashcard-question override
        public sr: FSRSCard
    ) {}

    /**
     * Static factory method that returns both card and validation errors
     * Use this in contexts where you need error handling (like deck building)
     */
    static init(file: TFile, frontmatter?: FrontMatterCache): Card | ValidationError[] {
        const path = file.path
        // Get question: use flashcard-question override or file title
        const question = frontmatter?.['flashcard-question'] || file.basename
        const result = CardStorage.fromFrontmatter(frontmatter?.['spaced-repetition'])
        if (Array.isArray(result))
            return result.map(err => ({ ...err, filePath: path })) // Add file path to each error

        return new Card(path, question, result)
    }
}