# Screen Improvement Analysis

This document analyzes each screen against the gold standard (Schedule-Based Productivity Calculator) and identifies specific improvements needed.

## Gold Standard Reference
**Screen**: `app/wrvu-forecaster/page.tsx`  
**Key Features**:
- Consistent typography hierarchy
- Proper section spacing and borders
- Stat items pattern for metrics
- Progressive form with clear navigation
- Responsive grid layouts
- Touch-friendly targets

---

## 1. Call Pay Modeler (`app/call-pay-modeler/page.tsx`)

### Current Issues
1. **Container**: Uses `py-4 sm:py-6 md:py-8` instead of `pb-4 sm:pb-6 md:pb-8` (inconsistent padding)
2. **Section Headings**: Missing consistent heading hierarchy
3. **Stat Items**: Impact summary doesn't follow the stat item pattern
4. **Typography**: Inconsistent text sizing for labels and values
5. **Borders**: Missing consistent section separators (`border-t-2` pattern)
6. **Spacing**: Uses `space-y-6 sm:space-y-8` instead of standard `space-y-6`

### Improvements Needed
- [ ] Standardize container padding to match gold standard
- [ ] Add section headings with `text-lg font-semibold` pattern
- [ ] Refactor `ImpactSummary` to use stat items pattern
- [ ] Standardize typography sizes (labels, values, helper text)
- [ ] Add section separators with `border-t-2` pattern
- [ ] Standardize spacing to `space-y-6`
- [ ] Ensure all interactive elements have `min-h-[44px] touch-target`

### Priority: High
The impact summary is a key results screen and should match the productivity summary pattern.

---

## 2. FMV Calculator - TCC (`app/fmv-calculator/tcc/page.tsx`)

### Current Issues
1. **Container**: Uses `min-h-screen bg-gray-50` wrapper (inconsistent with gold standard)
2. **Page Headings**: Uses `text-2xl font-bold` instead of section heading pattern
3. **Section Structure**: Missing clear section separators
4. **Results Display**: `PercentileBreakdown` doesn't follow stat items pattern
5. **Typography**: Inconsistent label sizing
6. **Spacing**: Mixed spacing patterns

### Improvements Needed
- [ ] Remove `min-h-screen bg-gray-50` wrapper (gold standard doesn't use it)
- [ ] Change page headings to section heading pattern (`text-lg font-semibold`)
- [ ] Add section separators with `border-t-2` pattern
- [ ] Refactor results to use stat items pattern where appropriate
- [ ] Standardize typography hierarchy
- [ ] Ensure consistent spacing (`space-y-6` for sections)

### Priority: High
This is a results screen that should match the productivity summary visual style.

---

## 3. FMV Calculator - wRVU (`app/fmv-calculator/wrvu/page.tsx`)

### Current Issues
1. **Container**: Same as TCC - uses `min-h-screen bg-gray-50` wrapper
2. **Page Headings**: Uses `text-2xl font-bold` instead of section heading pattern
3. **Section Structure**: Missing clear section separators
4. **Results Display**: Same percentile breakdown issues as TCC
5. **Typography**: Inconsistent with gold standard

### Improvements Needed
- [ ] Remove `min-h-screen bg-gray-50` wrapper
- [ ] Change page headings to section heading pattern
- [ ] Add section separators
- [ ] Standardize typography and spacing
- [ ] Match results display pattern

### Priority: High
Same issues as TCC calculator.

---

## 4. FMV Calculator - CF (`app/fmv-calculator/cf/page.tsx`)

### Current Issues
1. **Container**: Same wrapper issue as other FMV calculators
2. **Page Headings**: Uses `text-2xl font-bold`
3. **Section Structure**: Missing section separators
4. **Input Section**: Could use better visual hierarchy
5. **Results Display**: Same percentile breakdown issues

### Improvements Needed
- [ ] Remove `min-h-screen bg-gray-50` wrapper
- [ ] Change page headings to section heading pattern
- [ ] Add section separators between input and market data sections
- [ ] Improve input section visual hierarchy
- [ ] Standardize typography and spacing

### Priority: High
Consistency across all FMV calculators is important.

---

## 5. wRVU Modeler (`app/wrvu-modeler/page.tsx`)

### Current Issues
1. **Container**: Already uses correct pattern ✅
2. **Progressive Form**: Uses correct pattern ✅
3. **Section Headings**: Uses `text-lg font-semibold` ✅
4. **Results Section**: Uses different pattern than gold standard
5. **KPI Chips**: Uses custom `KPIChip` component instead of stat items pattern
6. **Typography**: Some inconsistencies in results display

### Improvements Needed
- [ ] Refactor results section to use stat items pattern
- [ ] Replace or update `KPIChip` to match stat items pattern
- [ ] Standardize typography in results section
- [ ] Add section separators in results if needed
- [ ] Ensure consistent spacing

### Priority: Medium
The screen structure is good, but results display should match the productivity summary pattern.

---

## 6. Provider wRVU Tracking (`app/provider-wrvu-tracking/page.tsx`)

### Current Issues
1. **Container**: Uses `px-3 sm:px-6` instead of `px-4 sm:px-6`
2. **Max Width**: Uses `lg:max-w-6xl` instead of `lg:max-w-4xl`
3. **Card Usage**: Uses `Card` component extensively (not in gold standard)
4. **Typography**: Card titles use different sizing (`text-xl sm:text-2xl`)
5. **Section Headings**: Inconsistent with gold standard pattern

### Improvements Needed
- [ ] Standardize container padding to `px-4 sm:px-6`
- [ ] Consider if `max-w-6xl` is necessary or should be `max-w-4xl`
- [ ] Evaluate if `Card` components should be replaced with simpler divs
- [ ] Standardize typography hierarchy to match gold standard
- [ ] Ensure section headings use `text-lg font-semibold` pattern
- [ ] Standardize spacing patterns

### Priority: Medium
This screen has a different purpose (tracking vs. calculation), but should still follow typography and spacing patterns.

---

## Common Improvements Across All Screens

### Typography
- [ ] Standardize all section headings to `text-lg font-semibold text-gray-900 dark:text-white`
- [ ] Standardize subsection headings to `text-sm font-semibold text-gray-700 dark:text-gray-300`
- [ ] Ensure helper text uses `text-xs sm:text-sm text-gray-600 dark:text-gray-400`
- [ ] Standardize large value displays to `text-2xl sm:text-3xl lg:text-4xl font-bold`

### Spacing
- [ ] Use `space-y-6` for major sections
- [ ] Use `space-y-4` for subsections
- [ ] Use `gap-3 sm:gap-4` for grids

### Borders
- [ ] Use `border-t-2 border-gray-200 dark:border-gray-800` for major separators
- [ ] Use `border-t border-gray-200 dark:border-gray-700` for minor separators
- [ ] Add `pt-4` or `pt-6` with border separators

### Touch Targets
- [ ] Ensure all buttons and interactive elements have `min-h-[44px] touch-target`

### Container Consistency
- [ ] Remove `min-h-screen bg-gray-50` wrappers where not needed
- [ ] Standardize to `w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-4 sm:pb-6 md:pb-8`

---

## Implementation Priority

### Phase 1: High Priority (Results Screens)
1. Call Pay Modeler - Impact Summary
2. FMV Calculator - TCC
3. FMV Calculator - wRVU
4. FMV Calculator - CF

### Phase 2: Medium Priority (Input Screens)
5. wRVU Modeler - Results section
6. Provider wRVU Tracking - Typography and spacing

### Phase 3: Polish
7. Final consistency check across all screens
8. Touch target verification
9. Responsive breakpoint testing

---

## Notes

- The gold standard uses `ProgressiveForm` for multi-step flows, which is already implemented in wrvu-forecaster and wrvu-modeler
- Stat items pattern is the most important visual pattern to replicate
- Typography hierarchy is the foundation for visual consistency
- Spacing and borders create visual rhythm and section clarity

