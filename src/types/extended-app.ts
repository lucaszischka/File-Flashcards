import { App } from 'obsidian'

// Extend App interface to include settings API
export interface ExtendedApp extends App {
    setting?: {
        open(): void
        openTabById(id: string): unknown
    }
    commands?: {
        executeCommandById(id: string): void
    }
}