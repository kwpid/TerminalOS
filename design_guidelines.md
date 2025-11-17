# Terminal Simulator Design Guidelines

## Design Approach

**Selected Approach:** Design System (Fluent Design + VS Code Interface Patterns)

**Justification:** This is a utility-focused productivity application requiring consistency, efficiency, and familiarity. Drawing from Windows 11 Fluent Design and VS Code's interface patterns ensures users feel at home while maintaining professional aesthetics.

**Key Principles:**
- Clarity and functionality over decoration
- Familiar Windows patterns for immediate usability
- Dense information display with clear hierarchy
- Consistent window chrome across all applications

## Typography

**Font Stack:** 
- UI Text: `'Segoe UI', system-ui, -apple-system, sans-serif`
- Terminal/Code: `'Cascadia Code', 'Consolas', 'Monaco', monospace`

**Hierarchy:**
- Window Titles: 13px, medium weight
- Taskbar Items: 12px, regular weight
- Terminal Text: 14px monospace, regular weight
- Code Editor: 14px monospace, regular weight
- Button Labels: 12px, medium weight
- Menu Items: 13px, regular weight
- Tab Labels: 12px, regular weight

## Layout System

**Spacing Units:** Use Tailwind classes with units of **2, 3, 4, and 6** (e.g., p-2, m-4, gap-3, h-6)

**Desktop Structure:**
- Full viewport height (h-screen)
- Taskbar: Fixed height of 48px at bottom
- Desktop area: Remaining space (calc(100vh - 48px))
- Windows: Minimum 400px width, 300px height

**Window Chrome:**
- Title bar: 32px height with app icon, title, and controls
- Content area: Flexible, fills remaining window space
- All windows have 1px border with subtle shadow

## Component Library

### Core Window System

**Window Container:**
- Rounded corners (rounded-lg)
- Drop shadow (shadow-2xl)
- Draggable title bar with grab cursor
- Resize handles on all edges (8px hit areas)
- Z-index management for focus states

**Title Bar:**
- Height: 32px
- Left: App icon (16x16) + title text (pl-3)
- Right: Minimize, maximize/restore, close buttons (32px each)
- Drag area: Entire bar except buttons

### Taskbar

**Main Bar:**
- Fixed bottom position, full width
- Height: 48px
- Left section: Start menu button (48px square)
- Center section: Running app buttons with labels
- Right section: System tray (clock, status icons)

**App Buttons:**
- Height: 36px, variable width with padding
- Show app icon + truncated window title
- Active state: subtle highlight
- Click to focus/minimize toggle

### Terminal Application

**Layout:**
- Command output area (flex-1, overflow-auto)
- Input line at bottom (h-8, fixed)
- Prompt indicator: `>` or `$` symbol
- Autocomplete dropdown: Absolute positioned, max 6 suggestions

**Autocomplete UI:**
- Float above input line with 4px offset
- Each suggestion: 32px height
- Format: `command [parameter_type]` in lighter text
- Keyboard navigation with highlight state

### VS.Mock Code Editor

**Three-Column Layout:**
- File tree sidebar: 240px width, collapsible
- Editor pane: Flex-1, multiple tabs support
- Optional properties panel: 280px width

**File Tree:**
- Nested indentation: 16px per level
- Folder/file icons (16x16) with labels
- Expand/collapse chevrons for folders
- Context menu on right-click

**Editor Pane:**
- Line numbers gutter: 48px width
- Tab bar: 32px height with close buttons
- Content area: Monospace text with syntax highlighting
- Scrollbar always visible

### Files Application

**Toolbar:**
- Height: 40px
- Back/forward buttons, path breadcrumb, view options
- Search box on right (200px width)

**Content Area:**
- Grid view: 4-6 columns of icons with labels
- List view: Single column with columns (Name, Modified, Size)
- Icon size: 48x48 for grid, 24x24 for list

### Notepad

**Simple Layout:**
- Menu bar: 32px height (File, Edit, Format)
- Text area: Full remaining space
- Status bar: 24px height (line/column info)

### TaskManager

**Tabbed Interface:**
- Tab bar: 40px height (Processes, Performance, Apps)
- Table view with sortable columns
- Process name, CPU%, Memory%, PID columns
- End task button in toolbar

### WebBrowser

**Navigation Bar:**
- Height: 48px
- Back/forward/reload buttons (32px each)
- URL bar: Flex-1 with rounded input
- Bookmark star, menu buttons (32px each)

**Content Frame:**
- Full remaining space with iframe or simulated content
- Loading indicator overlay when navigating

## Interactions

**Window Behavior:**
- Click title bar to focus (bring to front)
- Double-click title bar to maximize/restore
- Minimize animates to taskbar button position
- Close has confirmation for unsaved work

**Drag & Drop:**
- Files between folders in Files app
- Tabs between VS.Mock editor instances
- Windows snap to screen edges (half/quarter positions)

**Keyboard Shortcuts:**
- Alt+Tab: Window switcher
- Ctrl+W: Close current window/tab
- Ctrl+N: New window/file (context-dependent)
- F11: Toggle fullscreen

## Animation Guidelines

**Minimal Animation Usage:**
- Window open/close: 200ms ease-out scale/fade
- Minimize to taskbar: 250ms position transition
- Menu dropdowns: 150ms ease-out
- Autocomplete appearance: 100ms fade-in
- NO animations on typing, scrolling, or hover states

## Accessibility

- All windows and dialogs keyboard navigable
- Tab order follows visual layout
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for window state changes

**Consistent Implementation:**
- All text inputs have visible focus rings
- Command autocomplete navigable with arrow keys
- Taskbar items accessible via keyboard shortcuts
- Modal dialogs trap focus until dismissed