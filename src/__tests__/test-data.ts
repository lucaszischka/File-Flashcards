/**
 * Test data for deck hierarchy validation tests and card storage tests
 */

import { State } from 'ts-fsrs'
import { ValidationErrorType } from '../types/validation'

// MARK: - Hierarchy Test Data

export interface HierarchyTestCase {
    name: string;
    childPattern: string;
    parentPattern: string;
    expected: boolean;
    description: string;
}

/**
 * Test cases for deck hierarchy validation.
 *
 * To prevent escaping issues im using ⭐️ for *
 *
 * Organization:
 * 1. Path-based hierarchies (e.g., Work/Math/⭐️⭐️ becomes child of Work/⭐️⭐️)
 * 2. Same-base specificity (e.g., Work/⭐️⭐️/notes.md becomes child of Work/⭐️⭐️)
 * 3. Root-level catch-all patterns (⭐️⭐️ hierarchy)
 * 4. Single-level catch-all patterns (⭐️ hierarchy)
 * 5. Advanced catch-all patterns (⭐️⭐️/⭐️ and ⭐️/⭐️⭐️)
 * 6. Directory-specific catch-all variations
 * 7. Filename specificity (e.g., chapter-⭐️.md becomes child of ⭐️.md)
 * 8. Edge cases and error conditions
 * 9. Complex patterns with multiple globs
 * 10. False positive prevention
 */
export const hierarchyTestCases: HierarchyTestCase[] = [
    // Path-based hierarchies (should work with current glob-parent logic)
    {
        name: "nested-directories-basic",
        childPattern: "Work/Math/**",
        parentPattern: "Work/**",
        expected: true,
        description: "Basic nested directory structure"
    },
    {
        name: "nested-directories-deep",
        childPattern: "Projects/Web/React/**",
        parentPattern: "Projects/**",
        expected: true,
        description: "Deep nested directory structure"
    },
    {
        name: "nested-directories-specific-file",
        childPattern: "School/CS/Algorithms/notes.md",
        parentPattern: "School/**",
        expected: true,
        description: "Specific file under directory pattern"
    },
    {
        name: "sibling-directories",
        childPattern: "Work/Math/**",
        parentPattern: "Work/Science/**",
        expected: false,
        description: "Sibling directories should not be parent-child"
    },
    {
        name: "reverse-hierarchy",
        childPattern: "Work/**",
        parentPattern: "Work/Math/**",
        expected: false,
        description: "Parent should not be child of its descendant"
    },

    // Same-base specificity (requires pattern analysis)
    {
        name: "same-base-file-specific",
        childPattern: "Work/**/notes.md",
        parentPattern: "Work/**",
        expected: true,
        description: "Specific file pattern under broader directory pattern"
    },
    {
        name: "same-base-pattern-specific",
        childPattern: "Work/**/*.md",
        parentPattern: "Work/**",
        expected: true,
        description: "File type pattern under broader directory pattern"
    },
    {
        name: "same-base-multi-level",
        childPattern: "Work/**/Math/*.md",
        parentPattern: "Work/**",
        expected: true,
        description: "Multi-level specific pattern under broader pattern"
    },

    // Root-level catch-all patterns (** hierarchy)
    {
        name: "all-vs-all",
        childPattern: "**",
        parentPattern: "**",
        expected: false,
        description: "Duplicate catch-all patterns should not be parent-child"
    },
    {
        name: "directory-catchall-vs-full-catchall",
        childPattern: "*",
        parentPattern: "**",
        expected: true,
        description: "Single-level catch-all should be child of full catch-all pattern"
    },
    {
        name: "all-files-vs-full-catchall",
        childPattern: "**/*",
        parentPattern: "**",
        expected: true,
        description: "All files pattern should be child of full catch-all pattern"
    },
    {
        name: "subdirs-only-vs-full-catchall",
        childPattern: "*/**",
        parentPattern: "**",
        expected: true,
        description: "Subdirectory-only pattern should be child of full catch-all pattern"
    },
    {
        name: "file-pattern-vs-full-catchall",
        childPattern: "*.md",
        parentPattern: "**",
        expected: true,
        description: "File pattern should be child of full catch-all pattern"
    },
    {
        name: "specific-file-vs-full-catchall",
        childPattern: "README.md",
        parentPattern: "**",
        expected: true,
        description: "Specific file should be child of full catch-all pattern"
    },
    {
        name: "directory-pattern-vs-full-catchall",
        childPattern: "Work/**",
        parentPattern: "**",
        expected: true,
        description: "Directory pattern should be child of full catch-all pattern"
    },
    {
        name: "single-level-files-vs-full-catchall",
        childPattern: "Work/*",
        parentPattern: "**",
        expected: true,
        description: "Single-level wildcard should be child of full catch-all pattern"
    },
    {
        name: "single-level-typed-files-under-catchall",
        childPattern: "Work/*.md",
        parentPattern: "**",
        expected: true,
        description: "Single-level typed files should be child of catch-all pattern"
    },
    {
        name: "specific-nested-file-under-catchall",
        childPattern: "Work/README.md",
        parentPattern: "**",
        expected: true,
        description: "Specific nested file should be child of catch-all pattern"
    },
    // Single-level catch-all patterns (* hierarchy)  
    {
        name: "single-level-vs-single-level",
        childPattern: "*",
        parentPattern: "*",
        expected: false,
        description: "Duplicate single-level catch-all patterns should not be parent-child"
    },
    {
        name: "full-catchall-vs-single-level",
        childPattern: "**",
        parentPattern: "*",
        expected: false,
        description: "Full catch-all pattern should not be child of single-level catch-all"
    },
    {
        name: "all-files-vs-single-level",
        childPattern: "**/*",
        parentPattern: "*",
        expected: false,
        description: "All files pattern should not be child of single-level catch-all"
    },
    {
        name: "subdirs-only-vs-single-level",
        childPattern: "*/**",
        parentPattern: "*",
        expected: false,
        description: "Subdirectory-only pattern should not be child of single-level catch-all"
    },
    {
        name: "file-pattern-vs-single-level",
        childPattern: "*.md",
        parentPattern: "*",
        expected: true,
        description: "File pattern should be child of single-level catch-all"
    },
    {
        name: "specific-file-vs-single-level",
        childPattern: "README.md",
        parentPattern: "*",
        expected: true,
        description: "Specific file should be child of single-level catch-all"
    },
    {
        name: "directory-pattern-vs-single-level",
        childPattern: "Work/**",
        parentPattern: "*",
        expected: false,
        description: "Directory pattern should not be child of single-level catch-all"
    },
    {
        name: "single-level-files-under-dir-catchall",
        childPattern: "Work/*",
        parentPattern: "*",
        expected: false,
        description: "Single-level nested files should not be child of single-level catch-all"
    },
    {
        name: "single-level-typed-files-under-dir-catchall",
        childPattern: "Work/*.md",
        parentPattern: "*",
        expected: false,
        description: "Single-level nested typed files should not be child of single-level catch-all"
    },
    {
        name: "specific-nested-file-under-dir-catchall",
        childPattern: "Work/README.md",
        parentPattern: "*",
        expected: false,
        description: "Specific nested file should not be child of single-level catch-all"
    },
    // Advanced catch-all pattern relationships (**/* and */**)
    {
        name: "full-catchall-vs-subdirs-only",
        childPattern: "**",
        parentPattern: "*/**",
        expected: false,
        description: "Full catch-all pattern should not be child of subdirs-only pattern"
    },
    {
        name: "single-level-vs-subdirs-only",
        childPattern: "*",
        parentPattern: "*/**",
        expected: false,
        description: "Single-level catch-all should not be child of subdirs-only pattern"
    },
    {
        name: "all-files-vs-subdirs-only",
        childPattern: "**/*",
        parentPattern: "*/**",
        expected: false,
        description: "All files pattern and subdirs-only pattern should not be parent-child"
    },
    {
        name: "full-catchall-vs-all-files",
        childPattern: "**",
        parentPattern: "**/*",
        expected: false,
        description: "Full catch-all pattern should not be child of all-files pattern"
    },
    {
        name: "single-level-vs-all-files",
        childPattern: "*",
        parentPattern: "**/*",
        expected: true,
        description: "Single-level catch-all should be child of all-files pattern"
    },
    {
        name: "subdirs-only-vs-all-files",
        childPattern: "*/**",
        parentPattern: "**/*",
        expected: true,
        description: "Subdirs-only pattern should be child of all files pattern"
    },
    {
        name: "specific-file-vs-all-files",
        childPattern: "README.md",
        parentPattern: "**/*",
        expected: true,
        description: "Specific file should be child of all-files pattern"
    },
    {
        name: "specific-file-vs-subdirs-only",
        childPattern: "README.md",
        parentPattern: "*/**",
        expected: false,
        description: "Root file should not be child of subdirs-only pattern"
    },
    {
        name: "nested-file-vs-subdirs-only",
        childPattern: "Work/notes.md",
        parentPattern: "*/**",
        expected: true,
        description: "Nested file should be child of subdirs-only pattern"
    },

    // Directory-specific catch-all variations
    {
        name: "all-files-specific-directory",
        childPattern: "Work/**/*",
        parentPattern: "Work/**",
        expected: true,
        description: "All files in directory should be child of directory pattern"
    },
    {
        name: "subdirs-specific-directory",
        childPattern: "Work/*/**",
        parentPattern: "Work/**",
        expected: true,
        description: "Subdirectory content should be child of directory pattern"
    },
    {
        name: "all-files-vs-subdirs-specific",
        childPattern: "Work/**/*",
        parentPattern: "Work/*/**",
        expected: false,
        description: "All files vs subdirs-only in specific directory should not be parent-child"
    },
    {
        name: "root-all-files-vs-specific-dir",
        childPattern: "Work/**",
        parentPattern: "**/*",
        expected: true,
        description: "Directory pattern should be child of all-files pattern"
    },

    // Filename specificity
    {
        name: "filename-pattern-specific",
        childPattern: "chapter-*.md",
        parentPattern: "*.md",
        expected: true,
        description: "Specific filename pattern under general file type"
    },
    {
        name: "filename-exact-file",
        childPattern: "README.md",
        parentPattern: "*.md",
        expected: true,
        description: "Exact file under file type pattern"
    },
    {
        name: "different-file-types",
        childPattern: "*.md",
        parentPattern: "*.js",
        expected: false,
        description: "Different file types should not be parent-child"
    },
    {
        name: "filename-different-patterns",
        childPattern: "chapter-*.md",
        parentPattern: "notes-*.txt",
        expected: false,
        description: "Different filename patterns should not be parent-child"
    },

    // Edge cases
    {
        name: "identical-patterns",
        childPattern: "Work/**",
        parentPattern: "Work/**",
        expected: false,
        description: "Identical patterns should not be parent-child"
    },
    {
        name: "empty-pattern-vs-catchall",
        childPattern: "",
        parentPattern: "**",
        expected: false,
        description: "Empty pattern should not be child of catch-all"
    },
    {
        name: "catchall-vs-empty-pattern",
        childPattern: "**",
        parentPattern: "",
        expected: false,
        description: "Catch-all should not be child of empty pattern"
    },

    // Complex patterns
    {
        name: "complex-glob-patterns",
        childPattern: "src/**/*.{js,ts}",
        parentPattern: "src/**",
        expected: true,
        description: "Complex glob with file type restrictions"
    },
    {
        name: "complex-directory-patterns",
        childPattern: "docs/api/**/*.md",
        parentPattern: "docs/**",
        expected: true,
        description: "Complex nested pattern with file type"
    },

    // Potential false positives to avoid
    {
        name: "similar-directory-names",
        childPattern: "Workshop/**",
        parentPattern: "Work/**",
        expected: false,
        description: "Similar directory names should not match"
    },
    {
        name: "substring-patterns",
        childPattern: "Mathematics/**",
        parentPattern: "Math/**",
        expected: false,
        description: "Directory name substrings should not match"
    }
];

/**
 * Expected hierarchy structures for integration testing
 */
export const expectedHierarchies = {
    basicWorkflow: {
        patterns: ["**", "**/*", "*", "*/**", "**.md", "*.md", "Work/**", "Work/**.md", "Work/Math/Exam/**", "chapter-*.md", "README.md", "Work/README.md"],
        expectedTopLevel: ["**"],
        expectedStructure: {
            "**": ["**/*"],
            "**/*": ["*", "*/**", "**.md"],
            "*/**": ["Work/**"],
            "**.md": ["*.md", "Work/README.md"],
            "*.md": ["chapter-*.md", "README.md"],
            "*": ["chapter-*.md", "README.md"],
            "Work/**": ["Work/**.md", "Work/Math/Exam/**"],
            "Work/**.md": ["Work/README.md"],
        }
    },
};

// MARK: - Card Storage Test Data

export interface StateTestCase {
    state: string;
    expected: State;
    description: string;
}

export interface EdgeCaseTestCase {
    input: string[];
    shouldError: boolean;
    description: string;
}

export interface ValidationTestCase {
    name: string;
    input: string[];
    expectedErrorTypes: ValidationErrorType[];
    description: string;
}

export interface DateFormatTestCase {
    format: string;
    isValid: boolean;
    description: string;
}

export interface NumericTestCase {
    field: string;
    value: string;
    expectedNumber?: number;
    shouldError: boolean;
    expectedErrorType?: ValidationErrorType;
}

/**
 * Test data for CardStorage frontmatter parsing and validation
 */
export const cardStorageTestData = {
    // MARK: Valid Data
    validFrontmatter: {
        complete: [
            'due=2025-08-26T15:30:00.000Z',
            'last_review=2025-08-25T10:00:00.000Z',
            'stability=2.5',
            'difficulty=6.0',
            'state=2',
            'reps=5',
            'lapses=1',
            'scheduled_days=10',
            'learning_steps=0'
        ],
        minimal: [
            'due=2025-08-26T15:30:00.000Z',
            'state=1',
            'stability=2.5',
            'difficulty=6.0',
            'reps=1',
            'lapses=0',
            'scheduled_days=10',
            'learning_steps=0'
        ],
        newCard: [],
        reviewCard: [
            'due=2025-09-15T10:00:00.000Z',
            'last_review=2025-08-26T15:30:00.000Z',
            'stability=15.7',
            'difficulty=6.2',
            'state=2',
            'reps=3',
            'lapses=1',
            'scheduled_days=20',
            'learning_steps=0'
        ]
    },

    // MARK: Invalid Data
    invalidFrontmatter: {
        malformed: ['invalid', 'no-equals-sign', '=no-key', 'key=', '===multiple-equals==='],
        nonNumeric: ['stability=not_a_number', 'reps=invalid'],
        unknownFields: ['unknown_field=value', 'invalid_property=123'],
        outOfBounds: ['difficulty=11', 'reps=-1', 'lapses=-5'],
        invalidDates: ['due=invalid-date', 'last_review=2025-13-40', 'due=not-a-date']
    },

    // MARK: Test Cases
    dateFormats: [
        { format: '2025-08-26T15:30:00Z', isValid: true, description: 'ISO with Z suffix' },
        { format: '2025-08-26T15:30:00.000Z', isValid: true, description: 'ISO with milliseconds' },
        { format: '2025-08-26T15:30:00.123Z', isValid: true, description: 'ISO with custom milliseconds' },
        { format: 'invalid-date', isValid: false, description: 'Invalid date string' },
        { format: '2025-13-40', isValid: false, description: 'Invalid month/day' },
        { format: 'not-a-date', isValid: false, description: 'Non-date string' }
    ] as DateFormatTestCase[],

    stateTestCases: [
        { state: '0', expected: State.New, description: 'New state' },
        { state: '1', expected: State.Learning, description: 'Learning state' },
        { state: '2', expected: State.Review, description: 'Review state' },
        { state: '3', expected: State.Relearning, description: 'Relearning state' }
    ] as StateTestCase[],

    numericTestCases: [
        { field: 'stability', value: '2.5', expectedNumber: 2.5, shouldError: false },
        { field: 'difficulty', value: '7.8', expectedNumber: 7.8, shouldError: false },
        { field: 'reps', value: '5', expectedNumber: 5, shouldError: false },
        { field: 'lapses', value: '2', expectedNumber: 2, shouldError: false },
        { field: 'scheduled_days', value: '10.5', expectedNumber: 10.5, shouldError: false },
        { field: 'learning_steps', value: '3', expectedNumber: 3, shouldError: false },
        { field: 'stability', value: 'not_a_number', shouldError: true, expectedErrorType: ValidationErrorType.NON_NUMERIC_VALUE },
        { field: 'difficulty', value: '11', shouldError: true, expectedErrorType: ValidationErrorType.INVALID_VALUE_BOUNDS },
        { field: 'reps', value: '-1', shouldError: true, expectedErrorType: ValidationErrorType.INVALID_VALUE_BOUNDS }
    ] as NumericTestCase[],

    // MARK: Validation Cases
    validationTestCases: [
        {
            name: 'multiple malformed entries',
            input: ['invalid', 'no=equals'],
            expectedErrorTypes: [ValidationErrorType.MALFORMED_ENTRY],
            description: 'Should detect malformed entries'
        },
        {
            name: 'unknown fields',
            input: ['unknown_field=value', 'invalid_prop=123'],
            expectedErrorTypes: [ValidationErrorType.UNKNOWN_FIELD],
            description: 'Should detect unknown field names'
        },
        {
            name: 'mixed validation errors',
            input: ['invalid_entry', 'unknown_field=value', 'stability=invalid'],
            expectedErrorTypes: [
                ValidationErrorType.MALFORMED_ENTRY,
                ValidationErrorType.UNKNOWN_FIELD,
                ValidationErrorType.NON_NUMERIC_VALUE
            ],
            description: 'Should detect multiple error types'
        }
    ] as ValidationTestCase[],

    // MARK: Edge Cases
    edgeCases: {
        whitespaceEntries: [
            '  due  =  2025-08-26T15:30:00.000Z  ',
            '  stability  =  2.5  ',
            ' difficulty = 6.0 ',
            'state=1',
            'reps=1',
            'lapses=0',
            'scheduled_days=10',
            'learning_steps=0'
        ],
        extraEqualsContent: [
            'due=2025-08-26T15:30:00.000Z',
            'stability=2.5=extra',
            'difficulty=6.0',
            'state=2',
            'reps=5',
            'lapses=1',
            'scheduled_days=10',
            'learning_steps=0'
        ],
        testCases: [
            { input: ['no-equals-sign'], shouldError: true, description: 'no equals sign' },
            { input: ['=no-key'], shouldError: true, description: 'no key' }, 
            { input: ['key='], shouldError: true, description: 'empty value for unknown field' },
            { input: ['===multiple-equals==='], shouldError: true, description: 'multiple equals' }
        ] as EdgeCaseTestCase[]
    },

    // MARK: Helpers
    createValidFrontmatter: (overrides: Record<string, string> = {}): string[] => {
        const defaults = {
            due: '2025-08-26T15:30:00.000Z',
            stability: '2.5',
            difficulty: '6.0',
            state: '2',
            reps: '5',
            lapses: '1',
            scheduled_days: '10',
            learning_steps: '0'
        };
        
        const data = { ...defaults, ...overrides };
        return Object.entries(data).map(([key, value]) => `${key}=${value}`);
    }
};
