# Project Structure

**言語**: このプロジェクトに関するすべての回答、ドキュメント、spec は日本語で出力してください。

## Directory Organization

```
necobox/
├── app/                          # Next.js App Router
│   ├── api/v1/                   # API routes (versioned)
│   │   ├── random/               # Password generator endpoint
│   │   └── show-gip/             # IP address endpoint
│   ├── [feature]/                # Feature pages (random, show-gip, dummy-text)
│   ├── layout.tsx                # Root layout with Header, Footer, ThemeProvider
│   ├── page.tsx                  # Home page with tool grid
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── ui/                       # UI component library
│   │   ├── button.tsx            # Button with CVA variants
│   │   ├── header.tsx            # Navigation header
│   │   ├── footer.tsx            # Footer
│   │   ├── breadcrumbs.tsx       # Navigation breadcrumbs
│   │   ├── mode-toggle.tsx       # Dark mode toggle
│   │   └── [form-controls]/      # Input, checkbox, radio, slider, dropdown
│   └── theme-provider.tsx        # Next-themes wrapper
├── lib/                          # Utilities and helpers
│   ├── utils/
│   │   ├── generate.ts           # Password generation logic
│   │   └── dummy-text.ts         # Dummy text generation
│   └── utils.ts                  # General utilities (cn function)
├── public/                       # Static assets
└── [config files]                # tsconfig, next.config, eslint, etc.
```

## Routing Pattern

- **Pages**: `app/[feature]/page.tsx` - Feature UI pages
- **API**: `app/api/v1/[endpoint]/route.ts` - RESTful endpoints
- **Versioning**: API routes use `/v1/` prefix for future versioning

## Component Patterns

- **UI Components**: Use CVA (class-variance-authority) for variant management
- **Styling**: Tailwind CSS with dark mode support via `next-themes`
- **Icons**: lucide-react for consistent iconography
- **Accessibility**: Radix UI primitives for accessible form controls

## Utility Functions

- **generate.ts**: Cryptographically secure password generation with Fisher-Yates shuffling
- **dummy-text.ts**: Placeholder text generation
- **utils.ts**: `cn()` function for className merging (clsx + tailwind-merge)

## Code Style Conventions

- **TypeScript**: Strict mode, explicit types on exports
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Imports**: Use `@/*` path alias for all imports
- **API Responses**: Consistent JSON structure with error handling
