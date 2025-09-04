import { State, Card as FSRSCard } from 'ts-fsrs'
import { CardStorage } from '../managers/card-storage'
import { ValidationErrorType, ValidationError } from '../types/validation'
import { cardStorageTestData } from './test-data'

/**
 * Test suite for CardStorage frontmatter handling
 * Critical component for data integrity - comprehensive testing required
 */
describe('CardStorage', () => {
    
    // MARK: - Helpers
    
    // Helper function to extract card from result or fail test
    const expectCard = (result: FSRSCard | ValidationError[]): FSRSCard => {
        expect(Array.isArray(result)).toBe(false)
        return result as FSRSCard
    }

    // Helper function to extract errors from result or fail test
    const expectErrors = (result: FSRSCard | ValidationError[]): ValidationError[] => {
        expect(Array.isArray(result)).toBe(true)
        return result as ValidationError[]
    }

    // MARK: - New Cards
    
    describe('new cards (no frontmatter)', () => {
        it('should create default new card when no data provided', () => {
            const result = CardStorage.fromFrontmatter()
            const card = expectCard(result)
            
            expect(card.state).toBe(State.New)
            expect(card.stability).toBe(0)
            expect(card.difficulty).toBe(0)
            expect(card.reps).toBe(0)
            expect(card.lapses).toBe(0)
            expect(card.scheduled_days).toBe(0)
            expect(card.learning_steps).toBe(0)
            expect(card.elapsed_days).toBe(0)
            expect(card.last_review).toBeUndefined()
            expect(card.due).toBeInstanceOf(Date)
        })
        
        it('should create default new card when empty array provided', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.validFrontmatter.newCard)
            const card = expectCard(result)
            
            expect(card.state).toBe(State.New)
            expect(card.reps).toBe(0)
        })
        
        it('should create consistent new cards across different inputs', () => {
            const result1 = CardStorage.fromFrontmatter()
            const result2 = CardStorage.fromFrontmatter([])
            const result3 = CardStorage.fromFrontmatter(undefined)
            
            const card1 = expectCard(result1)
            const card2 = expectCard(result2)
            const card3 = expectCard(result3)
            
            // All should create equivalent new cards
            expect(card1.state).toBe(State.New)
            expect(card2.state).toBe(State.New)
            expect(card3.state).toBe(State.New)
            
            expect(card1.reps).toBe(0)
            expect(card2.reps).toBe(0)
            expect(card3.reps).toBe(0)
            
            expect(card1.stability).toBe(0)
            expect(card2.stability).toBe(0)
            expect(card3.stability).toBe(0)
            
            // Due dates should be close to current time (within 1 second)
            const now = new Date()
            expect(Math.abs(card1.due.getTime() - now.getTime())).toBeLessThan(1000)
            expect(Math.abs(card2.due.getTime() - now.getTime())).toBeLessThan(1000)
            expect(Math.abs(card3.due.getTime() - now.getTime())).toBeLessThan(1000)
        })
    })
    
    // MARK: - Parsing
    
    describe('fromFrontmatter parsing', () => {
        
        // Date Parsing
        describe('date parsing', () => {
            it('should parse valid ISO date strings correctly', () => {
                const testData = cardStorageTestData.validFrontmatter.complete
                const result = CardStorage.fromFrontmatter(testData)
                const card = expectCard(result)
                
                expect(card.due.toISOString()).toBe('2025-08-26T15:30:00.000Z')
                expect(card.last_review?.toISOString()).toBe('2025-08-25T10:00:00.000Z')
            })
            
            it.each(cardStorageTestData.dateFormats.filter(d => d.isValid))(
                'should handle valid date format: $description',
                ({ format }) => {
                    const result = CardStorage.fromFrontmatter(cardStorageTestData.createValidFrontmatter({
                        due: format
                    }))
                    const card = expectCard(result)
                    expect(card.due).toBeInstanceOf(Date)
                    expect(isNaN(card.due.getTime())).toBe(false)
                }
            )
            
            it.each(cardStorageTestData.dateFormats.filter(d => !d.isValid))(
                'should return errors for invalid date format: $description',
                ({ format }) => {
                    const result = CardStorage.fromFrontmatter([`due=${format}`])
                    const errors = expectErrors(result)
                    
                    expect(errors.length).toBeGreaterThan(0)
                    expect(errors.some(e => e.type === ValidationErrorType.INVALID_DATE_FORMAT && e.field === 'due')).toBe(true)
                }
            )
        })
        
        // Numeric Parsing
        describe('numeric parsing', () => {
            it('should parse all numeric fields correctly', () => {
                const testData = cardStorageTestData.createValidFrontmatter({
                    stability: '2.5',
                    difficulty: '7.8',
                    reps: '5',
                    lapses: '2',
                    scheduled_days: '10.5',
                    learning_steps: '3'
                })
                const result = CardStorage.fromFrontmatter(testData)
                const card = expectCard(result)
                
                expect(card.stability).toBe(2.5)
                expect(card.difficulty).toBe(7.8)
                expect(card.reps).toBe(5)
                expect(card.lapses).toBe(2)
                expect(card.scheduled_days).toBe(10.5)
                expect(card.learning_steps).toBe(3)
            })
            
            it.each(cardStorageTestData.numericTestCases.filter(tc => !tc.shouldError))(
                'should parse valid $field value correctly',
                ({ field, value, expectedNumber }) => {
                    const result = CardStorage.fromFrontmatter(cardStorageTestData.createValidFrontmatter({
                        [field]: value
                    }))
                    const card = expectCard(result)
                    expect(card[field as keyof FSRSCard]).toBe(expectedNumber)
                }
            )
            
            it.each(cardStorageTestData.numericTestCases.filter(tc => tc.shouldError))(
                'should return errors for invalid $field value',
                ({ field, value, expectedErrorType }) => {
                    const result = CardStorage.fromFrontmatter([`${field}=${value}`])
                    const errors = expectErrors(result)
                    
                    expect(errors.length).toBeGreaterThan(0)
                    if (expectedErrorType) {
                        expect(errors.some(e => e.type === expectedErrorType)).toBe(true)
                    }
                }
            )
        })
        
        // State Parsing
        describe('state parsing', () => {
            it.each(cardStorageTestData.stateTestCases)(
                'should parse state $state as $description',
                ({ state, expected }) => {
                    const result = CardStorage.fromFrontmatter(cardStorageTestData.createValidFrontmatter({
                        state: state
                    }))
                    const card = expectCard(result)
                    expect(card.state).toBe(expected)
                }
            )
            
            it('should return errors for invalid state values', () => {
                const result = CardStorage.fromFrontmatter(['state=invalid_state'])
                const errors = expectErrors(result)
                
                expect(errors.length).toBeGreaterThan(0)
                expect(errors.some(e => e.type === ValidationErrorType.INVALID_STATE_VALUE && e.field === 'state')).toBe(true)
            })
        })
        
        it('should parse complete valid frontmatter', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.validFrontmatter.reviewCard)
            const card = expectCard(result)
            
            expect(card.state).toBe(State.Review)
            expect(card.stability).toBe(15.7)
            expect(card.difficulty).toBe(6.2)
            expect(card.reps).toBe(3)
            expect(card.lapses).toBe(1)
            expect(card.due.toISOString()).toBe('2025-09-15T10:00:00.000Z')
            expect(card.last_review?.toISOString()).toBe('2025-08-26T15:30:00.000Z')
            expect(card.scheduled_days).toBe(20)
            expect(card.learning_steps).toBe(0)
        })
    })
    
    // MARK: - Validation
    
    describe('validation errors', () => {
        it('should return errors for malformed entries', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.invalidFrontmatter.malformed)
            const errors = expectErrors(result)
            
            expect(errors.length).toBeGreaterThan(0)
            expect(errors.some(e => e.type === ValidationErrorType.MALFORMED_ENTRY)).toBe(true)
        })
        
        it('should return errors for invalid field types', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.invalidFrontmatter.nonNumeric)
            const errors = expectErrors(result)
            
            expect(errors.length).toBeGreaterThan(0)
            expect(errors.some(e => e.type === ValidationErrorType.NON_NUMERIC_VALUE)).toBe(true)
        })
        
        it('should return errors for unknown fields', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.invalidFrontmatter.unknownFields)
            const errors = expectErrors(result)
            
            expect(errors.length).toBeGreaterThan(0)
            expect(errors.some(e => e.type === ValidationErrorType.UNKNOWN_FIELD)).toBe(true)
        })
        
        it.each(cardStorageTestData.validationTestCases)(
            'should detect $name',
            ({ input, expectedErrorTypes, description }) => {
                const result = CardStorage.fromFrontmatter(input)
                const errors = expectErrors(result)
                
                expect(errors.length).toBeGreaterThan(0)
                for (const errorType of expectedErrorTypes) {
                    expect(errors.some(e => e.type === errorType)).toBe(true)
                }
            }
        )
    })
    
    // MARK: - Edge Cases
    
    describe('edge cases and malformed data', () => {
        it.each([
            ...cardStorageTestData.edgeCases.testCases,
            { 
                input: cardStorageTestData.edgeCases.extraEqualsContent, 
                shouldError: false,
                description: 'extra content after equals gets parsed as value'
            }
        ])(
            'should handle $description correctly',
            ({ input, shouldError }) => {
                const result = CardStorage.fromFrontmatter(input)
                
                if (shouldError) {
                    const errors = expectErrors(result)
                    expect(errors.length).toBeGreaterThan(0)
                    expect(errors.some(e => 
                        e.type === ValidationErrorType.MALFORMED_ENTRY || 
                        e.type === ValidationErrorType.UNKNOWN_FIELD ||
                        e.type === ValidationErrorType.NON_NUMERIC_VALUE ||
                        e.type === ValidationErrorType.INVALID_DATE_FORMAT
                    )).toBe(true)
                } else {
                    const card = expectCard(result)
                    expect(card).toBeDefined()
                }
            }
        )
        
        it('should handle whitespace in entries correctly', () => {
            const result = CardStorage.fromFrontmatter(cardStorageTestData.edgeCases.whitespaceEntries)
            const card = expectCard(result)
            
            expect(card.due.toISOString()).toBe('2025-08-26T15:30:00.000Z')
            expect(card.stability).toBe(2.5)
            expect(card.difficulty).toBe(6.0)
            expect(card.state).toBe(State.Learning)
            expect(card.reps).toBe(1)
        })
    })

    // MARK: - Integration
    
    describe('roundtrip consistency', () => {
        it('should maintain data integrity through parse and format cycles', () => {
            const originalData = cardStorageTestData.validFrontmatter.reviewCard
            
            // Parse the original data
            const result = CardStorage.fromFrontmatter(originalData)
            const card = expectCard(result)
            
            // Verify all fields were parsed correctly
            expect(card.due.toISOString()).toBe('2025-09-15T10:00:00.000Z')
            expect(card.last_review?.toISOString()).toBe('2025-08-26T15:30:00.000Z')
            expect(card.stability).toBe(15.7)
            expect(card.difficulty).toBe(6.2)
            expect(card.state).toBe(State.Review)
            expect(card.reps).toBe(3)
            expect(card.lapses).toBe(1)
            expect(card.scheduled_days).toBe(20)
            expect(card.learning_steps).toBe(0)
        })
    })
    
    // MARK: - Public API
    
    describe('validateAndParseFrontmatter', () => {
        it('should provide detailed validation results', () => {
            const result = CardStorage.validateAndParseFrontmatter(cardStorageTestData.validationTestCases[2].input)
            
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.card).toBeUndefined()
            
            const errorTypes = result.errors.map(e => e.type)
            expect(errorTypes).toContain(ValidationErrorType.MALFORMED_ENTRY)
            expect(errorTypes).toContain(ValidationErrorType.UNKNOWN_FIELD)
            expect(errorTypes).toContain(ValidationErrorType.NON_NUMERIC_VALUE)
        })
        
        it('should provide valid card when data is correct', () => {
            const result = CardStorage.validateAndParseFrontmatter(cardStorageTestData.validFrontmatter.minimal)
            
            expect(result.errors.length).toBe(0)
            expect(result.card).toBeDefined()
            expect(result.card?.state).toBe(State.Learning)
            expect(result.card?.stability).toBe(2.5)
        })
    })
})
