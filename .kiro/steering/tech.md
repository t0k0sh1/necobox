# Tech Stack & Build System

**言語**: このプロジェクトに関するすべての回答、ドキュメント、spec は日本語で出力してください。

## Core Framework & Runtime

- **Next.js 16.0.1**: React framework with App Router (file-based routing)
- **React 19.2.0**: UI library
- **TypeScript 5**: Strict mode enabled for type safety
- **Node.js**: Runtime (ES2017 target)

## Styling & UI

- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Headless component library (checkbox, dropdown, label, radio, slider)
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Utility functions for className handling
- **lucide-react**: Icon library
- **next-themes**: Dark mode support

## Development Tools

- **ESLint 9**: Code linting (with Next.js config)
- **pnpm**: Package manager (workspace configured)

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
```

## Key Configuration

- **Path aliases**: `@/*` maps to project root for clean imports
- **Strict TypeScript**: All strict compiler options enabled
- **Module resolution**: Bundler mode for modern module handling
- **JSX**: React 17+ automatic JSX transform
