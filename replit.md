# Terminal Simulator

## Overview

Terminal Simulator is a Windows-like desktop environment simulation built as a web application. It provides a functional desktop experience with multiple applications including a terminal emulator, code editor (VS.Mock), file manager, notepad, task manager, and web browser. The application simulates a complete windowing system with draggable, resizable windows and a taskbar interface inspired by Windows 11 Fluent Design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for UI components
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management

**UI Component System:**
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Design system based on Windows 11 Fluent Design and VS Code patterns
- Custom CSS variables for theming (light/dark mode support)
- Segoe UI font stack for UI, Cascadia Code/Consolas for monospace

**State Management:**
- React hooks for local component state
- TanStack Query for API data fetching and caching
- Custom hooks (`useWindows`, `useFileSystem`) wrapping API operations

**Key Design Decisions:**
- Component-based architecture with reusable UI primitives
- Window management system with drag, resize, minimize, maximize functionality
- In-memory process tracking for simulated system monitoring
- Separate app components for each desktop application (Terminal, VS.Mock, Files, etc.)

### Backend Architecture

**Server Framework:**
- Express.js as the HTTP server
- TypeScript for type safety across the stack
- ESM module system

**API Design:**
- RESTful API endpoints for file system and window state management
- Routes organized in `/api/filesystem` and `/api/windows` namespaces
- Validation using Zod schemas from shared types

**Data Layer:**
- In-memory storage implementation (`MemStorage`) for development
- Interface-based storage design (`IStorage`) allows easy swap to database
- Drizzle ORM configured for PostgreSQL (ready for production database)
- Shared schema definitions between client and server using Zod

**Development Features:**
- Vite middleware integration for HMR in development
- Request logging with timing and response capture
- Raw body capture for request verification

**Key Design Decisions:**
- Monorepo structure with shared types between client and server
- Storage abstraction layer allows switching from in-memory to persistent storage
- Default file system initialization on startup
- Window state and file system state managed separately

### Data Models

**File System:**
- Hierarchical structure with `parentId` references
- Support for files and folders
- Metadata includes creation/modification timestamps
- Optional content and language fields for code files

**Window State:**
- Tracks position, size, z-index for window management
- Supports multiple application types
- Stores minimize/maximize states
- App-specific data field for extensibility

**Process Management:**
- Client-side process simulation for task manager
- Tracked metrics: CPU usage, memory consumption
- Linked to window instances

## External Dependencies

### Third-Party Services

**Database (Configured):**
- Neon serverless PostgreSQL configured via Drizzle
- Connection via `@neondatabase/serverless` adapter
- Environment variable: `DATABASE_URL`

### Key Libraries

**Frontend:**
- `@radix-ui/*` - Accessible UI component primitives
- `@tanstack/react-query` - Server state management
- `tailwindcss` - Utility-first CSS framework
- `wouter` - Lightweight routing
- `react-hook-form` with `@hookform/resolvers` - Form management
- `zod` - Schema validation
- `date-fns` - Date manipulation
- `embla-carousel-react` - Carousel functionality
- `cmdk` - Command palette component

**Backend:**
- `drizzle-orm` - TypeScript ORM for database operations
- `drizzle-zod` - Zod schema generation from Drizzle schemas
- `connect-pg-simple` - PostgreSQL session store (configured)

**Development:**
- `@replit/vite-plugin-*` - Replit-specific development tools
- `tsx` - TypeScript execution for development
- `esbuild` - Production bundling for server code

### Design System

**Typography:**
- UI: Segoe UI with system fallbacks
- Code: Cascadia Code, Consolas, Monaco

**Color System:**
- CSS custom properties for theming
- Separate tokens for light/dark modes
- Windows 11-inspired color palette
- HSL color format for easy manipulation

**Spacing & Layout:**
- Tailwind spacing scale (units of 2, 3, 4, 6)
- 48px taskbar height
- 32px window title bar height
- Minimum window dimensions: 400px × 300px