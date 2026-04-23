# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### SwiftInvoice (artifacts/swift-invoice)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Purpose**: Offline-first invoice generator MVP for freelancers and small businesses
- **Features**:
  - Create invoices with client details and line items
  - Auto-calculate totals in real-time
  - Local persistence via AsyncStorage (no backend)
  - PDF generation via expo-print
  - Share invoices via native share sheet (expo-sharing)
  - Freemium model: free tier includes watermark, Pro tier removes it
  - GDPR-compliant: all data local, "Delete All Data" option in settings
  - Currency selector (10 currencies)
  - Paywall screen with simulated Pro upgrade
- **Key files**:
  - `app/index.tsx` — Home screen (invoice list)
  - `app/create.tsx` — Create/edit invoice form
  - `app/preview.tsx` — Preview invoice + share/print
  - `app/settings.tsx` — Settings (currency, data, upgrade)
  - `app/paywall.tsx` — Pro upgrade screen
  - `context/InvoiceContext.tsx` — Global state + AsyncStorage
  - `utils/pdfGenerator.ts` — HTML template for PDF generation
  - `constants/colors.ts` — Design tokens (blue primary palette)
