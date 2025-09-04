export interface FileFlashcardsSettings {
    include: string[]           // Patterns to include (ribbon disabled if empty)
    exclude: string[]           // Patterns to exclude
    maxPerDay: number           // 0 = unlimited
    showBadge: boolean          // Show badge on ribbon icon with due count
}

export const DEFAULT_SETTINGS: FileFlashcardsSettings = {
    include: [],
    exclude: [],
    maxPerDay: 0,
    showBadge: true
}
