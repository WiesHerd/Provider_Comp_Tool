# Design System Patterns - Gold Standard Reference

This document defines the design patterns established by the **Schedule-Based Productivity Calculator** (`app/wrvu-forecaster/page.tsx`) as the gold standard for all screens in the application.

## Container & Layout

### Main Container
```tsx
className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-4 sm:pb-6 md:pb-8"
```
- Full width with responsive horizontal padding
- Max width of 4xl (896px) on large screens
- Centered with auto margins
- Responsive bottom padding

### Section Spacing
- Primary sections: `space-y-6`
- Secondary sections: `space-y-4`
- Nested content: `space-y-3`

## Typography Hierarchy

### Main Section Headings
```tsx
className="text-lg font-semibold text-gray-900 dark:text-white"
```
- Used for primary section titles (e.g., "Work Schedule", "Forecast Results")

### Secondary Section Headings
```tsx
className="text-sm font-semibold text-gray-700 dark:text-gray-300"
```
- Used for subsection titles (e.g., "Compensation", "Time", "Productivity")

### Input Labels
```tsx
className="text-base font-semibold mb-2 block"
// OR
className="text-sm font-semibold mb-3 block"
```
- Base size for standard labels
- Small size for compact labels

### Helper Text
```tsx
className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
```
- Small, muted text for descriptions and hints

### Large Value Display
```tsx
className="text-2xl sm:text-3xl lg:text-4xl font-bold"
```
- For prominent numeric values (statistics, totals)
- Responsive sizing across breakpoints

### Input Text
```tsx
className="text-sm sm:text-base"
```
- Standard input field text size

## Borders & Separators

### Major Section Separator
```tsx
className="border-t-2 border-gray-200 dark:border-gray-800"
className="pt-4" // or pt-6 for more spacing
```
- 2px border for major section breaks
- Used with padding-top for spacing

### Minor Separator
```tsx
className="border-t border-gray-200 dark:border-gray-700"
className="pt-2" // or pt-3
```
- 1px border for minor divisions within sections

## Cards & Panels

### Standard Card
```tsx
className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900"
```
- Responsive padding (smaller on mobile)
- Subtle border and rounded corners
- Standard background

### Muted Card Background
```tsx
className="bg-gray-50 dark:bg-gray-800/50"
```
- For secondary content areas
- Slightly transparent in dark mode

### Card Hover States
```tsx
className="hover:shadow-sm" // subtle
className="hover:shadow-md hover:border-primary/50" // interactive cards
```

## Grid Layouts

### Responsive Grid Pattern
```tsx
className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
```
- Single column on mobile
- Two columns on small screens and up
- Consistent gap spacing

### Multi-Column Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
```
- Progressive column expansion
- Used for stat items and metrics

## Stat Items Pattern

The stat item pattern from `ProductivitySummary` is the standard for displaying metrics:

### Structure
```tsx
<div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
  {/* Icon and label row */}
  <div className="flex items-start gap-2 mb-3 sm:mb-4">
    <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
      {label}
    </span>
  </div>
  
  {/* Value row */}
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
      {value}
    </span>
    {/* Optional difference badge */}
  </div>
</div>
```

### Key Features
- Icon + label in compact row
- Large, bold value display
- Responsive text sizing
- Optional tooltips for context
- Optional difference badges (green pills)

## Form Elements

### Input Fields
- Standard padding: `p-3 sm:p-4`
- Border: `border-2 border-gray-300 dark:border-gray-600`
- Rounded: `rounded-xl`
- Touch targets: `min-h-[44px] touch-target`

### Buttons
- Primary: Standard button component
- Secondary: `variant="outline"`
- Touch targets: `min-h-[44px] touch-target`
- Full width on mobile: `w-full sm:w-auto`

## Progressive Form Pattern

The wrvu-forecaster uses `ProgressiveForm` with:
- Step validation
- Navigation between steps
- Back button pattern: `BackButton` component with text label
- Consistent step naming

## Color Usage

### Primary Actions
- `text-primary` for icons and accents
- `bg-primary` for primary buttons

### Text Colors
- Primary text: `text-gray-900 dark:text-white`
- Secondary text: `text-gray-700 dark:text-gray-300`
- Muted text: `text-gray-600 dark:text-gray-400`
- Helper text: `text-gray-500 dark:text-gray-400`

### Status Colors
- Positive: `text-green-600 dark:text-green-400`
- Negative: `text-red-600 dark:text-red-400`
- Warning: `text-amber-600 dark:text-amber-400`
- Info: `text-blue-600 dark:text-blue-400`

## Responsive Breakpoints

- Mobile: Default (no prefix)
- Small: `sm:` (640px+)
- Large: `lg:` (1024px+)
- Medium: `md:` (768px+) - used sparingly

## Spacing Scale

- `space-y-2`: Tight spacing
- `space-y-3`: Standard spacing
- `space-y-4`: Section spacing
- `space-y-6`: Major section spacing
- `gap-3 sm:gap-4`: Grid gaps

## Touch Targets

All interactive elements should have:
```tsx
className="min-h-[44px] touch-target"
```
- Minimum 44px height for mobile accessibility
- `touch-target` class for proper touch handling

