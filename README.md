# 🧠 Flashcards from MarkDown files

An Obsidian plugin for file-centric spaced repetition where each Markdown file becomes a flashcard. Uses the FSRS (Free Spaced Repetition Scheduler) algorithm with scheduling metadata stored in YAML frontmatter.

## 🚀 Features

- **File-based Cards**: Each Markdown file = one flashcard
- **FSRS Algorithm**: Modern Free Spaced Repetition Scheduler for optimal review scheduling  
- **Deck Organization**: Automatic deck creation from include patterns with hierarchical organization
- **Frontmatter Storage**: All scheduling data stored in file frontmatter (`spaced-repetition:` namespace)
- **Custom Questions**: Override default file title with `flashcard-question` frontmatter
- **Smart Filtering**: Configure include/exclude patterns for file selection with glob pattern support
- **Daily Limits**: Control how many cards to review per day
- **Ribbon Badge**: Visual indicator showing cards due for review today (can be disabled)
- **Error Handling**: Graceful error recovery with user-friendly messages and data backup

## ⚡ Quick Start

1. **Install** the plugin from Community Plugins
2. **Configure** include patterns in Settings → Flashcards from MarkDown files
   - Example: `Flashcards/` to include all files in a Flashcards folder
   - Example: `Study/**` to include all files in Study folder and subfolders
3. **Start reviewing** by clicking the ribbon icon (shows card count badge)
4. **Select a deck** if multiple include patterns create different decks
5. **Review cards** using the FSRS rating system (Again, Hard, Good, Easy)

## ⚙️ Settings

### 📝 File Selection
- **Include Patterns**: Folders/patterns to include (e.g., `Flashcards/`, `Study/**`)
  - Each pattern creates a separate deck for review
  - Supports glob patterns with wildcards (`*`, `**`)
  - Hierarchical deck organization based on pattern specificity
- **Exclude Patterns**: Files/patterns to exclude (e.g., `Templates/`, `*.template.md`)

### 🎯 Review Behavior  
- **Max Cards Per Day**: Limit daily reviews (0 = unlimited)
  - Applies to total cards across all decks
  - Resets daily at midnight
  - When limit is reached, option to continue with all cards or batch size
- **Show Badge**: Display count of due cards on ribbon icon

## 📁 File Patterns & Decks

The plugin creates **decks** from your include patterns, allowing organized review sessions:

### 📋 Pattern Examples
- `Flashcards/` - Include entire folder and subfolders (creates "Flashcards" deck)
- `Study/**` - Include all files in Study folder recursively (creates "Study" deck)  
- `Work/Project-A/*.md` - Include specific markdown files (creates "Project-A" deck)
- `*` - Include all files in vault (creates "All" deck)

### 🌳 Deck Hierarchy
- More specific patterns become child decks of general ones
- Example: `Work/Math/**` becomes a child of `Work/**`
- Hierarchical display with indentation
- Single deck: Review starts immediately
- Multiple decks: Deck selection modal appears first

### 🚫 Exclusion Patterns
- `Templates/` - Exclude Templates folder  
- `**.template.md` - Exclude template files
- Supports same glob patterns as include patterns

## ⌨️ Keyboard Shortcuts

During review sessions:
- **Space/Enter**: Reveal answer
- **1**: Again
- **2**: Hard
- **3**: Good
- **4**: Easy
- **Escape**: Close review modal

In deck selection:
- **Enter**: Start review with selected deck
- **Escape**: Close deck selection modal

## 🛠️ Technical Implementation

Uses the **FSRS (Free Spaced Repetition Scheduler)** algorithm, which is more sophisticated and research-backed compared to traditional SM-2 (e.g. used by Anki). The algorithm automatically optimizes review timing based on your historical performance, making it more efficient than fixed interval systems.

See [DEVELOPMENT.md](DEVELOPMENT.md) for development setup and implementation details.

## 📄 License

GNU GPLv3 License - see [LICENSE](LICENSE) file for details.