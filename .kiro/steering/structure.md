# Project Structure

## Organization Philosophy

Feature-organized Next.js App Router structure. Each tool gets dedicated page and API routes. Shared UI components live in `/components/ui/`.

## Directory Patterns

### App Router (`/app/`)
**Location**: `/app/`
**Purpose**: Pages, layouts, and API routes following Next.js conventions
**Pattern**:
- Tools: `/app/{tool-name}/page.tsx` (e.g., `/random`, `/show-gip`)
- APIs: `/app/api/v1/{tool-name}/route.ts`
- Shared: `layout.tsx`, `page.tsx` (home)

### UI Components (`/components/ui/`)
**Location**: `/components/ui/`
**Purpose**: Reusable, design-system aligned primitives
**Pattern**:
- Based on Radix UI + CVA
- Export component + types
- No business logic
- Examples: `button.tsx`, `input.tsx`, `slider.tsx`, `breadcrumbs.tsx`

### Theme Components (`/components/`)
**Location**: `/components/` (top-level)
**Purpose**: App-level providers and wrappers
**Example**: `theme-provider.tsx`

### Shared Utilities (`/lib/`)
**Location**: `/lib/`
**Purpose**: Framework-agnostic utility functions
**Pattern**:
- `/lib/utils.ts` - Core helpers (e.g., `cn()` for className merging)
- `/lib/utils/` - Domain utilities (e.g., `generate.ts` for password generation)

### Static Assets (`/public/`)
**Location**: `/public/`
**Purpose**: Static files served at root

## Naming Conventions

- **Files**: kebab-case (e.g., `show-gip`, `mode-toggle`)
- **Components**: PascalCase exports (e.g., `Button`, `Header`)
- **Functions**: camelCase (e.g., `generatePassword`)

## Import Organization

```typescript
// Absolute imports (preferred)
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Relative imports (same directory)
import { generatePassword } from "./generate"
```

**Path Aliases**:
- `@/*` → Project root (configured in `tsconfig.json`)

## Code Organization Principles

- **API Versioning**: All public APIs under `/api/v1/`
- **Component Isolation**: UI components are stateless; business logic in pages/routes
- **Utility Separation**: Framework utilities (`lib/utils.ts`) vs domain utilities (`lib/utils/*`)
- **Layout Hierarchy**: Root layout provides theme, header, footer; pages focus on content

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
