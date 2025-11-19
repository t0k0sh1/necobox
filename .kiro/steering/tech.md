# Technology Stack

## Architecture

App Router-based Next.js application with server-side API routes and client-side utilities. Route handlers provide JSON APIs for tool functionality.

## Core Technologies

- **Language**: TypeScript (strict mode enabled)
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 20+
- **UI Library**: React 19.2

## Key Libraries

- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS v4 with design token system
- **Theme**: next-themes for dark/light mode
- **Icons**: lucide-react for consistent iconography
- **CSS Utilities**:
  - `clsx` + `tailwind-merge` for className composition
  - `class-variance-authority` for component variants

## Development Standards

### Type Safety
- TypeScript strict mode enforced
- Path aliases via `@/*` mapping to project root
- No implicit any types

### Code Quality
- ESLint with Next.js config
- Automatic code formatting expected

### Testing
- **Unit Testing**: Jest with jsdom environment
- **E2E Testing**: Playwright configured for browser testing
- Testing infrastructure in place but test coverage incomplete

## Development Environment

### Required Tools
- Node.js 20+
- npm/yarn/pnpm/bun

### Common Commands
```bash
# Dev: npm run dev (localhost:3000)
# Build: npm run build
# Lint: npm run lint
```

## Key Technical Decisions

- **Component Architecture**: Radix UI + CVA for variant-based component library
- **Styling Strategy**: Tailwind utility-first with custom design tokens
- **API Pattern**: Next.js Route Handlers for utility endpoints (`/api/v1/*`)
- **Theme System**: System-aware dark mode with persistent preference
- **Fonts**: Geist Sans + Geist Mono (Vercel's optimized fonts)

---
_Document standards and patterns, not every dependency_
