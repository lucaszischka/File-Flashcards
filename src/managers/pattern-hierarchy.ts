export class PatternHierarchy {
    static isSubset(child: string, parent: string): boolean {
        // Identical patterns are not parent-child
        if (child === parent) 
            return false
        
        // Empty patterns
        if (!child || !parent) 
            return false

        // Simple directory hierarchy check
        if (this.isDirectoryChild(child, parent)) 
            return true

        // Quick incompatibility checks
        if (this.areIncompatible(child, parent)) 
            return false

        // Pattern specificity check  
        return this.isMoreSpecific(child, parent)
    }

    private static isDirectoryChild(child: string, parent: string): boolean {
        // Simple path prefix check for patterns like Work/Math/** vs Work/**
        if (child.includes('/') && parent.includes('/')) {
            const childDir = child.split('/**')[0]
            const parentDir = parent.split('/**')[0]
            
            return childDir.startsWith(parentDir + '/') && childDir !== parentDir
        }
        
        return false
    }

    private static areIncompatible(child: string, parent: string): boolean {
        // Different file extensions like *.md vs *.js
        const childExt = child.match(/\*\.(\w+)$/)
        const parentExt = parent.match(/\*\.(\w+)$/)
        if (childExt && parentExt && childExt[1] !== parentExt[1]) 
            return true

        // Different filename prefixes like chapter-* vs notes-*
        const childPrefix = child.match(/^(\w+)-\*/)
        const parentPrefix = parent.match(/^(\w+)-\*/)
        if (childPrefix && parentPrefix && childPrefix[1] !== parentPrefix[1]) 
            return true

        // Check for directory name conflicts (Workshop vs Work, Mathematics vs Math)
        const childParts = child.split('/')
        const parentParts = parent.split('/')
        
        for (let i = 0; i < Math.min(childParts.length, parentParts.length); i++) {
            const childPart = childParts[i]
            const parentPart = parentParts[i]
            
            if (!childPart.includes('*') && !parentPart.includes('*')) {
                if (childPart !== parentPart) {
                    // Reject substring matches like "Workshop" vs "Work"
                    if (childPart.includes(parentPart) || parentPart.includes(childPart))
                        return true
                    
                    return true // Different literal parts
                }
            }
        }
        
        return false
    }

    private static isMoreSpecific(child: string, parent: string): boolean {
        // Handle common wildcard patterns with built-in logic
        if (parent === '**') 
            return child !== '**'

        if (parent === '*') 
            return !child.includes('/') && child !== '*' && !child.includes('**')

        if (parent === '**/*') {
            if (child === '**') 
                return false

            return child !== '*/**' ? true : true // */** is child of **/*
        }

        if (parent === '*/**') 
            return child.includes('/') && child !== '*' && child !== '**' && child !== '**/*'

        // Handle filename patterns (e.g., *.md, chapter-*.md, README.md)
        if (this.isFilenamePattern(child, parent)) 
            return true

        // Directory-specific patterns like Work/** should contain Work/**/*
        if (parent.endsWith('/**') && child.startsWith(parent.replace('/**', '/'))) 
            return true

        return false
    }

    private static isFilenamePattern(child: string, parent: string): boolean {
        // Handle patterns like **.md vs *.md
        const parentGlobalMatch = parent.match(/^\*\*\.(\w+)$/)
        if (parentGlobalMatch) {
            const parentExt = parentGlobalMatch[1]
            
            // Child could be *.ext (root level files) 
            const childRootMatch = child.match(/^\*\.(\w+)$/)
            if (childRootMatch && childRootMatch[1] === parentExt) {
                return true
            }
            
            // Child could be specific file like README.ext
            const childExactMatch = child.match(/^([^/]+)\.(\w+)$/)
            if (childExactMatch && !child.includes('*') && childExactMatch[2] === parentExt) {
                return true
            }
            
            // Child could be in a subdirectory like Work/README.ext
            const childSubdirMatch = child.match(/^.+\/([^/]+)\.(\w+)$/)
            if (childSubdirMatch && !child.includes('*') && childSubdirMatch[2] === parentExt) {
                return true
            }
        }

        // Both patterns should be at root level (no directory separators) for remaining logic
        if (child.includes('/') || parent.includes('/')) 
            return false

        // Parent should be a general file pattern like *.md
        const parentMatch = parent.match(/^\*\.(\w+)$/)
        if (!parentMatch) 
            return false

        const parentExt = parentMatch[1]

        // Case 1: Child is specific filename pattern like chapter-*.md
        const childPatternMatch = child.match(/^(.+)-\*\.(\w+)$/)
        if (childPatternMatch) {
            const childExt = childPatternMatch[2]
            return childExt === parentExt
        }

        // Case 2: Child is exact filename like README.md  
        const childExactMatch = child.match(/^(.+)\.(\w+)$/)
        if (childExactMatch && !child.includes('*')) {
            const childExt = childExactMatch[2]
            return childExt === parentExt
        }

        return false
    }
}