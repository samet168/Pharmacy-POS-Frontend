# Dark Mode Styling Guide

## KPI Card Dark Mode Usage

For KPI cards in dark mode, use the tinted background colors:

```tsx
// Sales Card (Emerald)
<div className="bg-bento-lime dark:bg-bento-lime-dark border-bento-lime-text dark:border-emerald-800/50">
  <div className="text-bento-lime-text dark:text-emerald-400">Today's Sales</div>
</div>

// Categories Card (Teal)
<div className="bg-bento-mint dark:bg-bento-mint-dark border-bento-mint-text dark:border-teal-800/50">
  <div className="text-bento-mint-text dark:text-teal-400">Total Categories</div>
</div>

// Expiring Card (Rose/Pink)
<div className="bg-bento-pink dark:bg-bento-pink-dark border-bento-pink-text dark:border-rose-800/50">
  <div className="text-bento-pink-text dark:text-rose-400">Expiring Soon</div>
</div>

// Customers Card (Lavender)
<div className="bg-bento-lavender dark:bg-bento-lavender-dark border-bento-lavender-text dark:border-purple-800/50">
  <div className="text-bento-lavender-text dark:text-purple-400">Total Customers</div>
</div>
```

## Typography Colors in Dark Mode

```tsx
// Primary text (headings, large numbers)
<div className="text-slate-900 dark:text-bento-text-primary-dark">Primary Text</div>

// Secondary text (sub-labels, descriptions)
<div className="text-slate-600 dark:text-bento-text-secondary-dark">Secondary Text</div>

// Muted text (metadata, timestamps)
<div className="text-slate-400 dark:text-bento-text-muted-dark">Muted Text</div>

// Menu labels
<div className="text-slate-700 dark:text-bento-text-menu-dark">Menu Labels</div>
```

## Background Layers

```tsx
// Root background
<div className="bg-bento-bg dark:bg-bento-bg-dark">Main Content</div>

// Card surfaces
<div className="bg-bento-white dark:bg-bento-card-dark border-bento-gray dark:border-bento-border-dark">
  Card Content
</div>

// Sidebar
<div className="bg-bento-white dark:bg-bento-sidebar-dark border-bento-gray dark:border-bento-border-dark">
  Sidebar Content
</div>
```

## Original Light Mode Colors Preserved

All original light mode colors are preserved:
- `bento-bg`: `#F3F7F5` (original page background)
- `bento-primary`: `#062D2D` (original Deep Forest Teal)
- `bento-lime`: `#D7F3B0` (original Soft Lime Green)
- `bento-mint`: `#A2E8DD` (original Soft Mint Cyan)
- `bento-pink`: `#FBC0C0` (original Soft Pastel Pink)
- `bento-lavender`: `#CDC9FF` (original Soft Lavender)

Dark mode additions use `-dark` suffix to avoid affecting light mode.
