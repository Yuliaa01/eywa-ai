

## Plan: Show only icons (no text labels) on mobile tabs

### What changes
**File: `src/pages/Dashboard.tsx`**

Wrap each tab's text label in a `<span className="hidden md:inline">` so it's hidden on mobile but visible on desktop. Remove the `mr-2` margin from icons on mobile (since there's no text next to them) by changing it to `md:mr-2`.

Each TabsTrigger changes from:
```tsx
<Sparkles className="w-4 h-4 mr-2" />
Priorities
```
To:
```tsx
<Sparkles className="w-4 h-4 md:mr-2" />
<span className="hidden md:inline">Priorities</span>
```

This applies to all 5 tabs (Priorities, Nutrition, Activities, Health Care, Discover). The icons already exist -- they just need the text hidden at mobile breakpoint.

