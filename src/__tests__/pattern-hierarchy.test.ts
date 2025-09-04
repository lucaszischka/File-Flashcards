import { Deck } from '../types';
import { hierarchyTestCases, expectedHierarchies, type HierarchyTestCase } from './test-data';

/**
 * Test suite for deck hierarchy validation
 * Tests the isChildOf method and related hierarchy logic
 */
describe('PatternHierarchy', () => {
    
    describe('isChildOf method', () => {
        // Test each case from our test data
        hierarchyTestCases.forEach((testCase: HierarchyTestCase) => {
            it(`${testCase.name}: ${testCase.description}`, () => {
                // Create mock deck instances with just the pattern
                const childDeck = new Deck(testCase.childPattern, [])
                const parentDeck = new Deck(testCase.parentPattern, [])
                
                const result = childDeck.isChildOf(parentDeck)
                
                expect(result).toBe(testCase.expected)
            })
        })
    })

    describe('should build correct hierarchy for example', () => {
        const { patterns, expectedTopLevel, expectedStructure } = expectedHierarchies.basicWorkflow
        const decks = patterns.map(pattern => new Deck(pattern, []))
        
        // Test expected parent-child relationships
        Object.entries(expectedStructure).forEach(([parentPattern, childPatterns]) => {
            const parentDeck = decks.find(d => d.pattern === parentPattern)
            expect(parentDeck).toBeDefined()
            
            childPatterns.forEach(childPattern => {
                const childDeck = decks.find(d => d.pattern === childPattern)
                expect(childDeck).toBeDefined()
                expect(childDeck?.isChildOf(parentDeck as Deck)).toBe(true)
            });
        });
        
        // Test that expected top-level decks are not children of others
        expectedTopLevel.forEach(topLevelPattern => {
            const topLevelDeck = decks.find(d => d.pattern === topLevelPattern)
            const otherDecks = decks.filter(d => d.pattern !== topLevelPattern)
            
            otherDecks.forEach(otherDeck => {
                expect(topLevelDeck?.isChildOf(otherDeck)).toBe(false)
            })
        })
    })
})
