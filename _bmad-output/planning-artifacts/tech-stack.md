# FlowDesk — Technology Stack Reference

> Use this document to understand every technology component in the FlowDesk application, what it does, its version, and how it relates to other components in the stack.

---

## 1. Database

### PostgreSQL 15
- **Version:** 15 (Alpine-based Docker image for local dev; Azure Flexible Server in production)
- **What it does:** Relational database that stores all application data — users, work items, projects, clients, inbox items, notes, attachments metadata, mailbox configurations, and audit logs. Supports JSON fields for flexible schema storage (e.g. project tech stack metadata).
- **Dependencies:** None (foundational layer).
- **Depended on by:** Prisma ORM, and transitively every API route and data-fetching hook in the application.

---

## 2. ORM & Data Access

### Prisma 6.19.2
- **Version:** 6.19.2 (`@prisma/client` + `prisma` CLI)
- **What it does:** Type-safe ORM that maps the PostgreSQL database to TypeScript models. Provides schema-driven migrations (`prisma db push`), a query builder, enum support, and a generated client with full autocompletion. The schema is defined in `prisma/schema.prisma`.
- **Dependencies:** PostgreSQL (as the datasource).
- **Depended on by:** All API route handlers (`src/app/api/`), seed scripts, and any server-side data logic. The `@auth/prisma-adapter` bridges Prisma with the authentication layer.

### @auth/prisma-adapter 2.11.1
- **Version:** 2.11.1
- **What it does:** Adapter that connects Auth.js (NextAuth) to Prisma so that user sessions, accounts, and tokens are stored in the PostgreSQL database via Prisma models.
- **Dependencies:** Prisma, Auth.js (next-auth).
- **Depended on by:** Auth.js configuration.

---

## 3. Application Framework

### Next.js 15.5.12
- **Version:** 15.5.12
- **What it does:** Full-stack React framework providing server-side rendering, API routes (Route Handlers), file-system routing via the App Router, middleware, and static optimization. Uses Turbopack for fast dev server builds. Production builds output a standalone Node.js server.
- **Dependencies:** React, React DOM.
- **Depended on by:** Every page, API route, middleware, and component in the application. The Docker production image runs the Next.js standalone server (`node server.js`).

### React 19.1.0
- **Version:** 19.1.0
- **What it does:** UI rendering library. Provides the component model, hooks, concurrent features, and the virtual DOM used across all frontend pages and components.
- **Dependencies:** React DOM (for browser rendering).
- **Depended on by:** Every UI component, page, and client-side hook. All component libraries (shadcn/ui, Radix, recharts, dnd-kit, etc.) depend on React.

### React DOM 19.1.0
- **Version:** 19.1.0
- **What it does:** React's rendering package for web browsers. Handles mounting components to the DOM and hydrating server-rendered HTML.
- **Dependencies:** React.
- **Depended on by:** Next.js (for page rendering).

### TypeScript 5.9.3
- **Version:** 5.9.3
- **What it does:** Typed superset of JavaScript used across the entire codebase. Provides compile-time type safety, IDE autocompletion, and catches errors before runtime. All source files (`.ts`, `.tsx`) are TypeScript.
- **Dependencies:** None.
- **Depended on by:** Every source file. Prisma generates TypeScript types. Zod schemas infer TypeScript types.

---

## 4. Authentication & Authorization

### Auth.js (next-auth) 5.0.0-beta.30
- **Version:** 5.0.0-beta.30 (Auth.js v5)
- **What it does:** Authentication framework supporting multiple providers. Configured with two providers: **Azure Entra ID** (SSO for team members) and **Credentials** (local username/password for dev and production fallback). Manages sessions, JWT tokens, and role-based access. Middleware uses `getToken()` for Edge Runtime compatibility (not `auth()`).
- **Dependencies:** @auth/prisma-adapter (for database-backed sessions), @azure/msal-node (for Azure Entra ID).
- **Depended on by:** All protected pages and API routes. Role checks (`ADMIN`, `MANAGER`, `DEVELOPER`) gate UI elements and API endpoints.

### @azure/msal-node 5.0.6
- **Version:** 5.0.6
- **What it does:** Microsoft Authentication Library for Node.js. Handles the OAuth 2.0 / OpenID Connect flow with Azure Entra ID (formerly Azure AD) for single sign-on.
- **Dependencies:** Azure Entra ID tenant configuration (external).
- **Depended on by:** Auth.js Azure Entra ID provider configuration.

---

## 5. UI Component Library & Styling

### shadcn/ui 3.8.5
- **Version:** 3.8.5 (CLI tool)
- **What it does:** Component collection built on Radix UI primitives and Tailwind CSS. Components are copied into the project (not imported from a package), giving full control over customization. Provides Sheets, Dialogs, Buttons, Inputs, Tables, Cards, Selects, Tabs, Badges, and more.
- **Dependencies:** Radix UI, Tailwind CSS, class-variance-authority, clsx, tailwind-merge.
- **Depended on by:** All UI pages and components use shadcn/ui components as their foundation.

### Radix UI 1.4.3
- **Version:** 1.4.3 (unified `radix-ui` package)
- **What it does:** Headless, accessible UI primitives. Provides the underlying behavior for shadcn/ui components — dropdown menus, dialogs, sheets, selects, tooltips, popovers, etc. Handles keyboard navigation, focus management, and ARIA attributes.
- **Dependencies:** React.
- **Depended on by:** shadcn/ui components.

### Tailwind CSS 4.2.1
- **Version:** 4.2.1
- **What it does:** Utility-first CSS framework. All styling is done via utility classes directly in JSX (e.g. `className="flex gap-4 p-6"`). No separate CSS files needed for most components. Configured via `@tailwindcss/postcss` for build integration.
- **Dependencies:** PostCSS (via `@tailwindcss/postcss`).
- **Depended on by:** Every component and page for visual styling. shadcn/ui components are built with Tailwind classes.

### tailwindcss-animate 1.0.7
- **Version:** 1.0.7
- **What it does:** Tailwind CSS plugin that adds animation utility classes (fade-in, slide-in, etc.) used by shadcn/ui components for transitions and sheet/dialog animations.
- **Dependencies:** Tailwind CSS.
- **Depended on by:** shadcn/ui animation classes.

### tw-animate-css 1.4.0
- **Version:** 1.4.0
- **What it does:** Additional CSS animation utilities for Tailwind CSS v4 compatibility. Supplements tailwindcss-animate for the v4 plugin system.
- **Dependencies:** Tailwind CSS.
- **Depended on by:** UI animation effects.

### class-variance-authority (CVA) 0.7.1
- **Version:** 0.7.1
- **What it does:** Utility for creating variant-based component styles. Used by shadcn/ui to define component variants (e.g. button sizes, colors) in a type-safe way.
- **Dependencies:** None.
- **Depended on by:** shadcn/ui component variant definitions.

### clsx 2.1.1
- **Version:** 2.1.1
- **What it does:** Tiny utility for conditionally joining CSS class names. Used throughout components to toggle classes based on state.
- **Dependencies:** None.
- **Depended on by:** Component className logic, often paired with tailwind-merge.

### tailwind-merge 3.5.0
- **Version:** 3.5.0
- **What it does:** Intelligently merges Tailwind CSS classes, resolving conflicts (e.g. `p-4` + `p-6` → `p-6`). Used in the `cn()` utility function that combines clsx and tailwind-merge.
- **Dependencies:** None.
- **Depended on by:** The `cn()` utility used across all components.

### Lucide React 0.576.0
- **Version:** 0.576.0
- **What it does:** Icon library providing SVG icons as React components. Used for all iconography throughout the app — buttons, navigation, status indicators, action menus, etc.
- **Dependencies:** React.
- **Depended on by:** UI components across all pages.

---

## 6. Data Fetching & State

### SWR 2.4.1
- **Version:** 2.4.1
- **What it does:** React hooks library for data fetching with built-in caching, revalidation, focus tracking, and error handling. All client-side data fetching is done through custom SWR hooks in `src/hooks/` (e.g. `useWorkItems`, `useProjects`, `useClients`). Uses a shared `fetcher` function.
- **Dependencies:** React.
- **Depended on by:** All data-displaying pages and components.

---

## 7. Forms & Validation

### React Hook Form 7.71.2
- **Version:** 7.71.2
- **What it does:** Performant form library using uncontrolled components and refs. Manages form state, validation, submission, and error display with minimal re-renders.
- **Dependencies:** React.
- **Depended on by:** All form UIs (create/edit work items, projects, clients, mailboxes, settings).

### @hookform/resolvers 5.2.2
- **Version:** 5.2.2
- **What it does:** Bridges React Hook Form with validation libraries. Connects Zod schemas to React Hook Form for declarative, schema-based validation.
- **Dependencies:** React Hook Form, Zod.
- **Depended on by:** Form components that use Zod schemas for validation.

### Zod 4.3.6
- **Version:** 4.3.6
- **What it does:** TypeScript-first schema validation library. Defines validation schemas for all API request bodies and form inputs (in `src/lib/validations/`). Schemas are shared between client and server for consistent validation. Also infers TypeScript types from schemas.
- **Dependencies:** None.
- **Depended on by:** API route handlers (server-side validation), React Hook Form (client-side validation via resolvers).

---

## 8. Charts & Data Visualization

### Recharts 2.15.4
- **Version:** 2.15.4
- **What it does:** Composable charting library built on D3 and React. Used for the dashboard analytics — bar charts, line charts, and other visualizations showing work item trends, status distributions, and team metrics.
- **Dependencies:** React, D3 (bundled internally).
- **Depended on by:** Dashboard page charts and analytics components.

---

## 9. Drag & Drop

### @dnd-kit/core 6.3.1
- **Version:** 6.3.1
- **What it does:** Lightweight, performant drag-and-drop toolkit for React. Provides the core drag-and-drop context, sensors (pointer, keyboard), and collision detection.
- **Dependencies:** React.
- **Depended on by:** Draggable table column reordering in work items table.

### @dnd-kit/sortable 10.0.0
- **Version:** 10.0.0
- **What it does:** Sortable preset for @dnd-kit that handles reorderable lists and grids. Provides the `useSortable` hook and sorting strategies.
- **Dependencies:** @dnd-kit/core.
- **Depended on by:** Table column drag-to-reorder functionality.

### @dnd-kit/utilities 3.2.2
- **Version:** 3.2.2
- **What it does:** Shared utilities for @dnd-kit (CSS transforms, etc.).
- **Dependencies:** @dnd-kit/core.
- **Depended on by:** @dnd-kit/sortable.

---

## 10. Date Handling

### date-fns 4.1.0
- **Version:** 4.1.0
- **What it does:** Modular date utility library. Used for formatting dates (en-ZA locale: `dd MMM yyyy`), calculating SLA durations, relative time displays, and date arithmetic. Utilities centralized in `src/lib/date-utils.ts`.
- **Dependencies:** None.
- **Depended on by:** Date formatting across all pages, SLA calculations, notification scheduling.

### react-day-picker 9.14.0
- **Version:** 9.14.0
- **What it does:** Date picker component for React. Provides the calendar UI used in date input fields (due dates, target dates on work items).
- **Dependencies:** React, date-fns.
- **Depended on by:** shadcn/ui DatePicker component.

---

## 11. Azure Cloud Services

### @azure/communication-email 1.1.0
- **Version:** 1.1.0
- **What it does:** Azure Communication Services SDK for sending transactional emails. Handles all outbound email — assignment notifications, @mention alerts, customer resolution notifications, customer notes, and weekly summary digests. Templates defined in `src/lib/email-templates.ts`.
- **Dependencies:** Azure Communication Services resource (external).
- **Depended on by:** Notification system (`src/lib/notifications.ts`), customer communication, resolution emails.

### @azure/storage-blob 12.31.0
- **Version:** 12.31.0
- **What it does:** Azure Blob Storage SDK for file operations. Handles upload, download, and deletion of file attachments on work items. Generates SAS (Shared Access Signature) URLs for secure, time-limited file access.
- **Dependencies:** Azure Storage account (external).
- **Depended on by:** File attachment upload/download/delete in work item detail sheets and standalone pages.

### Azure Container Apps (Infrastructure)
- **What it does:** Serverless container hosting platform that runs the production Docker container. Handles scaling, HTTPS/TLS termination, custom domain, and environment variable management.
- **Dependencies:** Azure Container Registry (for Docker images), the built Docker image.
- **Depended on by:** Production deployment — the running application.

### Azure Container Registry (ACR) (Infrastructure)
- **What it does:** Private Docker image registry. Stores built production Docker images pushed by the CI/CD pipeline. Container Apps pulls images from here.
- **Dependencies:** Docker images from CI/CD builds.
- **Depended on by:** Azure Container Apps (image source), GitHub Actions CI/CD (push target).

### Azure Entra ID (Infrastructure)
- **What it does:** Identity provider for SSO. Team members authenticate via their organizational Microsoft accounts. Provides OAuth 2.0 / OpenID Connect tokens.
- **Dependencies:** Azure tenant and app registration (external).
- **Depended on by:** Auth.js Azure Entra ID provider, @azure/msal-node.

### Azure Flexible Server PostgreSQL (Infrastructure)
- **What it does:** Managed PostgreSQL database service in Azure. Runs the production database with automated backups, high availability, and firewall rules.
- **Dependencies:** None (managed service).
- **Depended on by:** The application via Prisma (production `DATABASE_URL`).

---

## 12. Inbound Email

### SendGrid Inbound Parse (External Service)
- **What it does:** Receives incoming emails at configured mailbox addresses and forwards them as HTTP POST webhooks (multipart/form-data) to the application's `/api/email/inbound/sendgrid` endpoint. Used for the support inbox — external users email requests that appear in the app's Inbox. Also handles reply matching via `[FD-XXXX]` subject prefix to thread customer replies back to existing work items.
- **Dependencies:** SendGrid account, domain authentication (CNAME + MX DNS records), webhook secret.
- **Depended on by:** Inbox feature (new item creation), customer reply threading.
- **Note:** No SendGrid SDK is used — all API calls are plain `fetch` in `src/lib/sendgrid-inbound.ts`.

---

## 13. Containerization

### Docker (Multi-stage Production Build)
- **Base image:** `node:20-alpine`
- **What it does:** Three-stage Dockerfile (`Dockerfile.prod`): (1) install dependencies, (2) build Next.js standalone output + Prisma generate, (3) minimal production image running `node server.js`. The resulting image is ~150MB and runs as a non-root `nextjs` user.
- **Dependencies:** Node.js 20, npm.
- **Depended on by:** Azure Container Apps (runs this image), GitHub Actions CI/CD (builds this image).

### Docker Compose (Local Development)
- **What it does:** Orchestrates the local development environment. Runs a PostgreSQL 15 Alpine container for the database. The app itself is typically run directly via `npm run dev` (not containerized in dev).
- **Dependencies:** Docker Desktop.
- **Depended on by:** Local development workflow.

---

## 14. CI/CD

### GitHub Actions
- **Workflow:** `.github/workflows/deploy.yml`
- **What it does:** Automated deployment pipeline triggered on push to `main`. Steps: checkout code → login to ACR → build & push Docker image (tagged with commit SHA + `latest`) → login to Azure → update Container App with new image. Uses `az containerapp update` for deployment.
- **Dependencies:** GitHub repository, Azure service principal, ACR credentials (stored as GitHub Secrets).
- **Depended on by:** Production deployment — every push to `main` auto-deploys.

---

## 15. Development Tools

### ESLint 9.x
- **Version:** 9.x (with `eslint-config-next` 15.5.12)
- **What it does:** JavaScript/TypeScript linter enforcing code quality and consistency rules. Uses Next.js recommended config.
- **Dependencies:** TypeScript, eslint-config-next.
- **Depended on by:** Development workflow (lint checks).

### tsx 4.21.0
- **Version:** 4.21.0
- **What it does:** TypeScript execution engine for Node.js. Used to run TypeScript scripts directly without compilation — primarily for database seed scripts (`prisma/seed.ts`, `prisma/seed-contact-backfill.ts`).
- **Dependencies:** TypeScript.
- **Depended on by:** Seed scripts, one-off migration scripts.

### PostCSS (via @tailwindcss/postcss 4.2.1)
- **Version:** 4.2.1
- **What it does:** CSS processing pipeline that Tailwind CSS v4 plugs into. Transforms Tailwind utility classes into production CSS during the build.
- **Dependencies:** Tailwind CSS.
- **Depended on by:** Next.js build process (CSS compilation).

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│                                                             │
│  React 19 + Next.js 15 App Router                          │
│  ├── shadcn/ui + Radix UI (components)                     │
│  ├── Tailwind CSS 4 (styling)                              │
│  ├── Lucide React (icons)                                  │
│  ├── SWR (data fetching & caching)                         │
│  ├── React Hook Form + Zod (forms & validation)            │
│  ├── recharts (dashboard charts)                           │
│  ├── @dnd-kit (drag & drop)                                │
│  ├── date-fns + react-day-picker (dates)                   │
│  └── Auth.js v5 (session management)                       │
├─────────────────────────────────────────────────────────────┤
│                    SERVER (Next.js API Routes)              │
│                                                             │
│  ├── Auth.js v5 + MSAL (authentication)                    │
│  ├── Prisma 6.x (ORM / database access)                    │
│  ├── Zod (request validation)                              │
│  ├── Azure Communication Services SDK (outbound email)     │
│  ├── Azure Blob Storage SDK (file attachments)             │
│  └── SendGrid Inbound Parse webhook (inbound email)        │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                           │
│                                                             │
│  ├── PostgreSQL 15 (Azure Flexible Server)                 │
│  ├── Azure Container Apps (hosting)                        │
│  ├── Azure Container Registry (image store)                │
│  ├── Azure Entra ID (SSO identity provider)                │
│  ├── Azure Blob Storage (file storage)                     │
│  ├── Azure Communication Services (outbound email)         │
│  ├── SendGrid (inbound email)                              │
│  ├── Docker (containerization)                             │
│  └── GitHub Actions (CI/CD)                                │
└─────────────────────────────────────────────────────────────┘
```
