# BD App - Style Guide

A comprehensive visual and UI/UX reference for developers building or replicating the BD (Bid / No-Bid) web application.

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| React | React 18 | 18.x |
| CSS | Tailwind CSS | 3.x |
| Component Library | **shadcn/ui** (default style, neutral base) | via Radix UI primitives |
| Icons | **lucide-react** | 0.563+ |
| Charts | Recharts | 2.x |
| Forms | React Hook Form + Zod validation | 7.x / 4.x |
| Date Handling | date-fns | 3.x |
| Animation | tailwindcss-animate | 1.x |
| Auth | NextAuth.js v4 (Azure AD SSO + local login) | 4.x |

### Utility Function

All conditional class merging uses a `cn()` helper (standard shadcn pattern):

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### shadcn/ui Configuration

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

---

## 2. Color System

### Primary Brand Color: Purple

The brand identity is built around a **deep purple** (`#700ce9` / HSL `270 93% 48%`). This is used for:
- Primary action buttons (`bg-brand hover:bg-brand/90`)
- Active sidebar navigation items
- Focus rings
- Avatar fallback backgrounds
- Links and accent highlights

#### Brand Palette (Tailwind extended colors)

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-50` | `#f5f0ff` | Lightest tint backgrounds |
| `brand-100` | `#ede5ff` | Light hover states |
| `brand-200` | `#dcceff` | Light accents |
| `brand-300` | `#c4a7ff` | Medium light |
| `brand-400` | `#a873ff` | Medium |
| `brand-500` | `#8f3fff` | Mid-range |
| `brand` / `brand-600` | `#700ce9` | **Primary brand (default)** |
| `brand-700` | `#6b0fd6` | Hover/pressed states |
| `brand-800` | `#5a10af` | Dark accent |
| `brand-900` | `#4a128c` | Very dark |
| `brand-950` | `#2d0660` | Deepest shade |

### CSS Theme Variables (HSL values)

Defined in `globals.css` and consumed via `hsl(var(--token))`:

| Token | Light Mode | Dark Mode | Description |
|-------|-----------|-----------|-------------|
| `--background` | `0 0% 100%` | `0 0% 3.9%` | Page background (white / near-black) |
| `--foreground` | `0 0% 3.9%` | `0 0% 98%` | Primary text |
| `--card` | `0 0% 100%` | `0 0% 3.9%` | Card backgrounds |
| `--card-foreground` | `0 0% 3.9%` | `0 0% 98%` | Card text |
| `--popover` | `0 0% 100%` | `0 0% 3.9%` | Popover/dropdown backgrounds |
| `--primary` | `270 93% 48%` | `270 93% 48%` | **Purple** (same both modes) |
| `--primary-foreground` | `0 0% 98%` | `0 0% 98%` | White text on primary |
| `--secondary` | `0 0% 96.1%` | `0 0% 14.9%` | Secondary backgrounds |
| `--muted` | `0 0% 96.1%` | `0 0% 14.9%` | Muted backgrounds |
| `--muted-foreground` | `0 0% 45.1%` | `0 0% 63.9%` | Secondary/helper text |
| `--accent` | `270 93% 48%` | `270 93% 48%` | Accent = purple |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Error/destructive red |
| `--border` | `0 0% 89.8%` | `0 0% 14.9%` | Default borders |
| `--input` | `0 0% 89.8%` | `0 0% 14.9%` | Input borders |
| `--ring` | `270 93% 48%` | `270 93% 48%` | Focus ring = purple |
| `--radius` | `0.5rem` | `0.5rem` | Base border radius |

Dark mode is enabled via `darkMode: ['class']` in Tailwind config (toggle `.dark` class on `<html>`).

### Status Colors (Semantic)

Used consistently for bid decision status badges:

| Status | Classes | Visual |
|--------|---------|--------|
| DRAFT | `bg-gray-100 text-gray-800` | Gray |
| PENDING | `bg-yellow-100 text-yellow-800` | Yellow |
| IN_REVIEW | `bg-blue-100 text-blue-800` | Blue |
| APPROVED_BID | `bg-green-100 text-green-800` | Green |
| NO_BID | `bg-red-100 text-red-800` | Red |
| REVIEW_REQUIRED | `bg-orange-100 text-orange-800` | Orange |
| DECIDED | `bg-green-100 text-green-800` | Green |
| CLOSED | `bg-gray-100 text-gray-600` | Gray (muted) |
| APPROVED_DELTEK | `bg-emerald-100 text-emerald-800` | Emerald |
| NO_BID_CONCLUDED | `bg-slate-100 text-slate-800` | Slate |

### Stat Card Icon Colors

Each dashboard stat card has a colored icon background pill:

| Category | Icon Background | Icon Color |
|----------|----------------|------------|
| Total / Info | `bg-blue-50` | `text-blue-600` |
| Pending / Warning | `bg-amber-50` | `text-amber-600` |
| Success / Bid | `bg-green-50` | `text-green-600` |
| Error / No-Bid | `bg-red-50` | `text-red-600` |
| Rate / Metrics | `bg-purple-50` | `text-purple-600` |
| Summary / Neutral | `bg-slate-100` | `text-slate-600` |

---

## 3. Typography

### Font Family

**Inter** (Google Fonts) - applied globally via Next.js font optimization on `<body>`.

```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
// Applied as: <body className={inter.className}>
```

### Type Scale

| Element | Tailwind Classes | Usage |
|---------|-----------------|-------|
| Page title (header bar) | `text-lg font-semibold md:text-xl` | Top header breadcrumb |
| Section heading (h2) | `text-2xl font-bold tracking-tight` | Main page headings |
| Sub-heading (h3) | `text-lg font-semibold` | Section sub-titles |
| Card title | `text-sm font-medium text-muted-foreground` | Stat card labels |
| Stat value | `text-3xl font-bold` | Large numeric KPIs |
| Body text | `text-sm` | Default content text |
| Small text / description | `text-xs text-muted-foreground` | Helper text, metadata, timestamps |
| Tiny text | `text-[10px]` or `text-[11px]` | Badge labels, notification timestamps |
| Monospace reference | `font-mono text-sm font-medium text-brand` | Reference numbers (e.g., BID-0042) |
| Form label | `text-sm font-medium` | Input field labels |
| Button text | `text-sm font-medium` | All button sizes |

### Text Colors

| Purpose | Class |
|---------|-------|
| Primary text | `text-foreground` (default, inherited) |
| Secondary/helper text | `text-muted-foreground` |
| Brand accent text | `text-brand` |
| Error text | `text-destructive` |
| Success text | `text-green-600` |
| Warning text | `text-yellow-800` |
| On-brand background | `text-white` |

---

## 4. Layout Structure

### Overall App Shell

```
+------------------------------------------------------------------+
| SIDEBAR (fixed left)     |  HEADER (sticky top)                  |
| w-64 (256px)             |  h-16 (64px), border-b                |
| hidden on mobile         |  +-----------------------------------+|
| visible md+ breakpoint   |  | Hamburger | System \ Page Title | Bell |
|                          |  +-----------------------------------+|
| [Logo]  h-16 border-b   |                                        |
| [Nav Items]              |  MAIN CONTENT                         |
|   - Dashboard            |  p-4 md:p-6                           |
|   - Bid Decisions        |  space-y-6                            |
|   - New Bid Decision     |                                        |
|   - Reports              |  [Page heading + action button]       |
|   - Settings             |  [Stats cards grid]                   |
|                          |  [Data tables / content]              |
| [Help & Support]         |                                        |
| ─────────────────        |                                        |
| [User Avatar + Name]     |                                        |
| [Role] [Logout]          |                                        |
+--------------------------+----------------------------------------+
```

### Sidebar Details

- **Width**: `w-64` (256px), fixed position (`md:fixed md:top-0 md:bottom-0 md:left-0`)
- **Visibility**: `hidden md:flex md:flex-col` (hidden on mobile)
- **Background**: `bg-background` with `border-r`
- **Z-index**: `z-50`
- **Logo area**: `h-16` with `border-b`, `px-4`, logo image `h-14 w-auto`
- **Nav section**: `flex-1 overflow-y-auto py-4`, items in `ul` with `space-y-1 px-3`
- **User section**: Bottom of sidebar, `border-t p-4 mb-6`

### Header Bar

- **Position**: `sticky top-0 z-40 border-b bg-background`
- **Height**: `h-16` (64px)
- **Content**: `flex items-center gap-4 px-4 md:px-6`
- **Left**: Mobile hamburger menu (`md:hidden`), then page title
- **Right**: `ml-auto` notification bell
- **Title format**: `"BD (Bid / No-Bid)"` in `text-muted-foreground`, then `" \ "` separator, then page-specific title

### Main Content Area

- **Offset**: `md:pl-64` to account for sidebar
- **Padding**: `p-4 md:p-6`
- **Spacing**: `space-y-6` between sections
- **Min height**: `min-h-screen`

### Mobile Responsive

- Sidebar hidden, replaced by `Sheet` (slide-from-left panel) triggered by hamburger `Menu` icon
- Sheet width: `w-64`, `side="left"`, `p-0`
- Content fills full width (no `pl-64` offset)

---

## 5. Navigation

### Sidebar Nav Items

Each nav link follows this pattern:

```tsx
<Link
  href={item.href}
  className={cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-brand text-white'                                    // Active: purple bg, white text
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'  // Inactive: gray, hover highlight
  )}
>
  <item.icon className="h-4 w-4" />
  {item.title}
</Link>
```

### Navigation Items (role-gated)

| Label | Route | Icon | Visible To |
|-------|-------|------|------------|
| Dashboard | `/dashboard` | `LayoutDashboard` | All roles |
| Bid Decisions | `/opportunities` | `FileText` | All roles |
| New Bid Decision | `/opportunities/new` | `PlusCircle` | BD_TEAM, ADMIN |
| Reports | `/reports` | `BarChart3` | BD_TEAM, ADMIN, MANAGER |
| Settings | `/admin/settings` | `Settings` | ADMIN only |
| Help & Support | `/help` | `HelpCircle` | All (separate section, bottom) |

### Admin Sub-navigation

Uses **Tabs** component (not nested sidebar):
- Top level: Users | Configuration | Data | Monitoring | System
- System tab has nested tabs: Monitor | Version Control | Audit

---

## 6. User Profile & Avatar

### Sidebar User Section (bottom)

```
┌────────────────────────────┐
│ ─── border-t ───           │
│ [Avatar]  User Name        │
│  h-9 w-9  Role (lowercase) │  [Logout icon]
└────────────────────────────┘
```

- **Avatar**: `h-9 w-9`, pulls user photo from `/api/users/{id}/photo`
- **Fallback**: Initials (first letter of each name part), `bg-brand text-white text-xs`
- **Name**: `text-sm font-medium truncate`
- **Role**: `text-xs text-muted-foreground capitalize`
- **Logout**: `LogOut` icon, ghost button style

### UserAvatar Component

Custom component that wraps shadcn `Avatar`:
- Tries to load user photo via API endpoint
- Falls back to initials on error (2 chars max, uppercase)
- Fallback background: `bg-brand text-white`

### Notification Bell (header, top-right)

- `Bell` icon (`h-5 w-5`), ghost button
- Unread count badge: `bg-red-500 text-white text-[10px] font-bold rounded-full`, positioned `absolute -top-1 -right-1`
- Opens a `Popover` (380px wide) with scrollable notification list
- Unread indicator: small `bg-blue-500` dot (h-2 w-2)
- Notification items: title (`text-sm`, bold if unread), message (`text-xs text-muted-foreground line-clamp-2`), timestamp (`text-[11px] text-muted-foreground/70`)

---

## 7. Component Patterns

### shadcn/ui Components Used

The app uses these shadcn/ui components (all at `src/components/ui/`):

| Component | Key Usage |
|-----------|-----------|
| `Button` | All actions - 6 variants (default/destructive/outline/secondary/ghost/link), 4 sizes (default/sm/lg/icon) |
| `Card` | Stat cards, content sections, forms, login page |
| `Badge` | Status indicators, role labels (rounded-full pills) |
| `Table` | Data tables with sorting, pagination, row actions |
| `Dialog` | Confirmation dialogs, forms, detail views |
| `Sheet` | Mobile sidebar slide-out |
| `Popover` | Notifications, date pickers |
| `Select` | Filter dropdowns, form fields |
| `Input` | Text inputs (h-10, rounded-md) |
| `Textarea` | Multi-line inputs |
| `Label` | Form field labels |
| `Tabs` | Admin settings navigation, report views |
| `Avatar` | User photos with initials fallback |
| `Checkbox` | Multi-select, settings toggles |
| `Switch` | Boolean settings |
| `Calendar` / `DatePicker` | Date selection |
| `DropdownMenu` | Row action menus ("..." buttons) |
| `Separator` | Visual dividers |
| `ScrollArea` | Scrollable notification list |
| `Tooltip` | Hover info on avatars, icons |
| `Toast` | Success/error notifications (bottom-right on desktop) |
| `Progress` | Progress bars |
| `Form` | React Hook Form integration with validation |
| `AlertDialog` | Destructive action confirmation |

### Button Variants

```tsx
// Primary action (most common for CTAs)
<Button className="bg-brand hover:bg-brand/90">Create New</Button>

// Default (uses --primary = purple)
<Button>Submit</Button>

// Outline (secondary actions)
<Button variant="outline">Cancel</Button>

// Ghost (subtle actions, sidebar, icon buttons)
<Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>

// Destructive (delete, remove)
<Button variant="destructive">Delete</Button>

// Link style
<Button variant="link">View all</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

### Stat Cards

```tsx
<Card className="flex flex-col">
  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Card Label
    </CardTitle>
    <div className="p-2 rounded-md bg-blue-50">
      <Icon className="h-5 w-5 text-blue-600" />
    </div>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col justify-center">
    <div className="text-3xl font-bold">42</div>
    <p className="text-xs text-muted-foreground mt-1">Description</p>
  </CardContent>
</Card>
```

Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`

### Data Tables

- Container: `<div className="border rounded-lg">`
- Search: `Input` with `Search` icon (absolute positioned left)
- Filters: `Select` dropdowns for status, portfolio, etc.
- Sort indicators: `ArrowUpDown` (unsorted), `ArrowUp` / `ArrowDown` (sorted)
- Pagination: 10 rows per page, Previous/Next with `ChevronLeft`/`ChevronRight`
- Row actions: `DropdownMenu` triggered by `MoreHorizontal` icon button
- Results count: `text-sm text-muted-foreground`

### Forms

- Organized into `Card` sections
- Field layout: `Label` + input with `space-y-2` gap between label and input
- Required fields marked with `*`
- Error messages: `text-sm text-destructive`
- Error banners: `bg-destructive/10 text-destructive rounded-md p-3 text-sm`
- Submit: `bg-brand hover:bg-brand/90` with `Loader2` spinner when loading
- Cancel: `variant="outline"`
- Field groups: `space-y-4` or `space-y-6`

### Dialogs / Modals

- Overlay: `bg-black/80`
- Max width: `max-w-lg` (default)
- Structure: `DialogHeader` (title + description) -> content -> `DialogFooter`
- Footer buttons: Cancel (outline) on left, Submit (brand) on right
- Mobile: footer uses `flex-col-reverse` (submit on top)

### Empty States

```tsx
<div className="border rounded-lg p-8 text-center">
  <Icon className="mx-auto h-12 w-12 text-muted-foreground/50" />
  <h3 className="mt-4 text-lg font-semibold">No items found</h3>
  <p className="mt-2 text-sm text-muted-foreground">Description text here.</p>
  <Button className="mt-4">Optional CTA</Button>
</div>
```

### Toast Notifications

- Position: top on mobile, bottom-right on desktop (`sm:bottom-0 sm:right-0`)
- Two variants: `default` (neutral) and `destructive` (red)
- Used for success confirmations, error alerts, and copy-to-clipboard feedback

### Badges

Rounded-full pill shape with 4 base variants:
- `default`: purple bg
- `secondary`: gray bg
- `destructive`: red bg
- `outline`: border only

Status badges override colors with custom classes (see Status Colors section).

---

## 8. Page Layout Patterns

### Standard Dashboard Page

```tsx
<>
  <Header title="Page Title" />
  <div className="p-4 md:p-6 space-y-6">
    {/* Page heading row */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Section Title</h2>
        <p className="text-muted-foreground">Optional description text</p>
      </div>
      <Button className="bg-brand hover:bg-brand/90">
        <PlusCircle className="mr-2 h-4 w-4" />
        Primary Action
      </Button>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Stat cards */}
    </div>

    {/* Data table or content area */}
    <div className="border rounded-lg">
      {/* Table with filters, sort, pagination */}
    </div>
  </div>
</>
```

### Detail Page (2/3 + 1/3 split)

```tsx
<div className="grid gap-6 md:grid-cols-3">
  {/* Main content - 2 columns */}
  <div className="md:col-span-2 space-y-6">
    <Card>{/* Primary information */}</Card>
    <Card>{/* Additional sections */}</Card>
  </div>

  {/* Sidebar - 1 column */}
  <div className="space-y-6">
    <Card>{/* Actions / status */}</Card>
    <Card>{/* Related info */}</Card>
  </div>
</div>
```

### Login Page

- Centered card: `min-h-screen flex items-center justify-center bg-background`
- Card: `max-w-md`, centered logo, title `text-2xl`, description below
- Primary CTA: `bg-brand hover:bg-brand/90 w-full size="lg"`
- Separator between login methods
- Error banner: `bg-destructive/10 text-destructive rounded-md p-3 text-sm`

---

## 9. Responsive Design

### Breakpoint Strategy

Mobile-first with `md:` (768px) as the primary breakpoint.

| Breakpoint | Behavior |
|-----------|----------|
| Default (mobile) | Sidebar hidden, hamburger menu, single column, `p-4` |
| `md` (768px+) | Sidebar visible, content offset `pl-64`, `p-6`, multi-column grids |
| `lg` (1024px+) | Wider grids (5-6 columns for stat cards) |

### Responsive Grid Patterns

| Context | Mobile | Tablet (`md`) | Desktop (`lg`) |
|---------|--------|---------------|----------------|
| Stat cards | `grid-cols-2` | `grid-cols-3` | `grid-cols-5` or `grid-cols-6` |
| Two-column layout | `grid-cols-1` | `grid-cols-2` | `grid-cols-2` |
| Detail page | `grid-cols-1` | `grid-cols-3` | `grid-cols-3` |
| Admin stats | `grid-cols-1` | `grid-cols-4` | `grid-cols-4` |
| Filters row | `flex-col` | `flex-row` (`sm:flex-row`) | `flex-row` |

### Mobile-specific Patterns

- Sidebar -> Sheet slide-out from left
- Dialog footer -> `flex-col-reverse` (primary button on top)
- Content padding -> `p-4` (reduced from `p-6`)
- Toast position -> top of screen (vs bottom-right on desktop)

---

## 10. Icon Usage

### Library: lucide-react

### Size Convention

| Context | Size Class |
|---------|-----------|
| Default (nav items, inline) | `h-4 w-4` |
| Medium (header actions) | `h-5 w-5` |
| Small (badges, inline) | `h-3 w-3` |
| Large (empty states) | `h-12 w-12` |
| Stat card icons | `h-5 w-5` (inside `p-2 rounded-md` pill) |

### Commonly Used Icons

| Icon | Import | Context |
|------|--------|---------|
| `LayoutDashboard` | Dashboard navigation |
| `FileText` | Bid decisions, documents |
| `PlusCircle` | Create new items |
| `Settings` | Admin settings |
| `BarChart3` | Reports, analytics |
| `LogOut` | Sign out |
| `HelpCircle` | Help & support |
| `Menu` | Mobile hamburger |
| `Bell` | Notifications |
| `Search` | Search inputs |
| `ArrowUpDown` | Table sort (unsorted) |
| `ArrowUp` / `ArrowDown` | Table sort (active) |
| `ChevronLeft` / `ChevronRight` | Pagination |
| `Eye` | View details |
| `Edit` | Edit action |
| `MoreHorizontal` | Row action menu trigger |
| `ArrowLeft` | Back navigation |
| `Check` / `CheckCircle` | Success, mark read |
| `X` / `XCircle` | Close, no-bid, errors |
| `Clock` | Pending, time-related |
| `Calendar` | Date displays |
| `Users` / `UserPlus` | People, add user |
| `ThumbsUp` / `ThumbsDown` | Bid / No-Bid response |
| `TrendingUp` | Response rate |
| `AlertTriangle` | Warnings, needs attention |
| `FileDown` | CSV export |
| `Loader2` | Loading spinner (with `animate-spin`) |
| `Trash2` | Delete / clear |
| `Share2` | Share link |
| `MessageCircle` | Comments |

---

## 11. Spacing & Sizing Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.5rem` (8px) | Base border radius |
| Border radius `lg` | `0.5rem` | Cards, containers |
| Border radius `md` | `calc(0.5rem - 2px)` | Buttons, inputs |
| Border radius `sm` | `calc(0.5rem - 4px)` | Small elements |
| Sidebar width | `w-64` (256px) | Fixed left sidebar |
| Header height | `h-16` (64px) | Top header bar |
| Content padding | `p-4 md:p-6` | Main area padding |
| Section spacing | `space-y-6` | Between page sections |
| Card gap | `gap-4` | Grid gaps |
| Form field gap | `space-y-2` | Label to input |
| Form section gap | `space-y-4` or `space-y-6` | Between fields |
| Button height (default) | `h-10` | Standard buttons |
| Button height (sm) | `h-9` | Compact buttons |
| Button height (lg) | `h-11` | Large CTAs |
| Input height | `h-10` | Text inputs |
| Avatar (sidebar) | `h-9 w-9` | User profile avatar |
| Avatar (table) | `h-7 w-7` or `h-8 w-8` | Stacked assignment avatars |
| Logo | `h-14 w-auto` | Sidebar and login page |

---

## 12. Locale & Formatting

- HTML lang: `en-ZA` (South African English)
- Dates: formatted via `date-fns` (patterns like `dd MMM yyyy`, `dd/MM/yyyy`)
- Currency: ZAR context (South African Rand)
- Relative time: Custom formatter ("Just now", "5m ago", "2h ago", "3d ago", then full date)

---

## 13. Animation & Transitions

| Element | Animation |
|---------|-----------|
| Nav hover | `transition-colors` |
| Loading spinner | `Loader2` icon + `animate-spin` |
| Skeleton loading | `animate-pulse text-muted-foreground` |
| Dialog open/close | Zoom in/out + fade in/out (via Radix) |
| Sheet slide | Slide from left (via Radix) |
| Toast enter/exit | Slide in + fade (via radix-ui/toast) |
| General UI | Powered by `tailwindcss-animate` plugin |

---

## 14. Login / Auth Screen

The login page is a centered card on a plain background:

- Centered: `min-h-screen flex items-center justify-center bg-background`
- Card: `w-full max-w-md`
- Logo centered at top, `h-14 w-auto`
- Title: `text-2xl` "Bid / No-Bid"
- Subtitle: "Bid Decision Management System"
- Primary SSO button: Microsoft icon + "Sign in with Microsoft", `bg-brand hover:bg-brand/90 w-full size="lg"`
- Secondary: "Request Access" outline button with `UserPlus` icon
- Tertiary: "Use Local Login" ghost link
- Separator between auth methods
- Error banner uses `bg-destructive/10 text-destructive rounded-md p-3 text-sm`
- Dev mode (non-production): yellow banner with test user list as outline buttons with role badges

---

## 15. Key Design Principles

1. **Clean & Professional**: Minimal decorative elements, plenty of whitespace, neutral base colors with purple accents
2. **Consistent Patterns**: Every page follows the same Header -> Content structure with standardized spacing
3. **Information Density**: Stat cards provide at-a-glance KPIs; tables handle detailed data with filtering/sorting/pagination
4. **Role-Aware UI**: Navigation items are conditionally shown based on user role (ADMIN, BD_TEAM, MANAGER, STAFF)
5. **Mobile-First Responsive**: Sidebar collapses to slide-out sheet; grids reduce columns; padding reduces
6. **Status-Driven Colors**: Consistent semantic color coding across all status representations (badges, cards, avatars)
7. **Accessibility**: Screen reader text (`sr-only`), focus rings, keyboard navigation via Radix primitives
8. **Dark Mode Ready**: Full dark mode support via CSS variables and `.dark` class toggle
