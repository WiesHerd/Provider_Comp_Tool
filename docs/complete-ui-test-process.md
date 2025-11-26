# Complete UI Test Process for Provider Compensation Tool

## Test Environment Setup

### Prerequisites
- Browser: Chrome, Firefox, Safari, Edge (test on all)
- Device: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667, 414x896)
- Clear localStorage before each test session: Open DevTools → Application → Local Storage → Clear All
- Test in both light and dark mode (if dark mode toggle exists)
- Dev server running: `npm run dev`
- Base URL: http://localhost:3002

### Test Execution Guidelines
1. **Test Order**: Follow the numbered sequence for systematic coverage
2. **Documentation**: Document any bugs found with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable
3. **Regression**: Re-test fixed bugs to ensure resolution
4. **Priority**: Focus on critical path (save/load scenarios, calculations) first
5. **Time Estimate**: Full test suite should take 4-6 hours for thorough execution

---

## 1. Home Page (`/`)

### Navigation & Layout
- [ ] Navigate to http://localhost:3002
- [ ] All 5 tool cards are visible and clickable:
  - [ ] wRVU & Incentive Modeler
  - [ ] FMV Calculator
  - [ ] Call Pay Modeler
  - [ ] Provider Schedule & wRVU Forecaster
  - [ ] (Note: Scenarios accessed via navigation, not card)
- [ ] Tool cards display correct icons and descriptions
- [ ] Cards have hover effects on desktop (shadow/scale)
- [ ] Navigation tabs work correctly:
  - [ ] Mobile: Bottom navigation visible with 5 tabs
  - [ ] Desktop: Top navigation visible (if enabled)
- [ ] Header displays correctly with app title/logo
- [ ] Footer/disclaimer text is visible: "For education and planning only. Not legal or FMV advice."

### Recent Scenarios Section
- [ ] Create at least one scenario from any tool
- [ ] Return to home page
- [ ] "Recent Scenarios" section appears when scenarios exist
- [ ] Maximum 3 recent scenarios displayed
- [ ] Scenarios sorted by most recent (updatedAt/createdAt)
- [ ] "View All" button navigates to `/scenarios`
- [ ] Recent scenario cards are clickable and navigate correctly
- [ ] Click scenario card → navigates to appropriate tool with scenario loaded
- [ ] Dismiss functionality works on recent scenario cards (X button)
- [ ] Dismissed scenarios don't reappear in recent list
- [ ] Empty state shows when no scenarios exist: "No scenarios saved yet..."

### Responsive Design
- [ ] Resize browser to mobile width (< 640px)
  - [ ] Layout adapts correctly
  - [ ] Bottom navigation visible
  - [ ] Cards stack vertically
- [ ] Resize to tablet (640px - 1024px)
  - [ ] Layout adapts correctly
  - [ ] Cards may show 2 columns
- [ ] Resize to desktop (> 1024px)
  - [ ] Layout adapts correctly
  - [ ] Cards show 3 columns
- [ ] Touch targets are at least 44x44px (check with DevTools)

---

## 2. wRVU Modeler (`/wrvu-modeler`)

### Step 1: Provider Information
- [ ] Navigate to `/wrvu-modeler`
- [ ] Page loads without errors
- [ ] Step indicator shows 4 steps
- [ ] Provider name input accepts text
- [ ] Enter provider name: "Dr. Test"
- [ ] Specialty dropdown displays all options
- [ ] Click specialty dropdown
- [ ] Specialty groups are properly organized:
  - [ ] Primary Care / Hospital Medicine
  - [ ] Procedural / Surgical
  - [ ] Medical Subspecialties
  - [ ] Other
- [ ] Select "Other" specialty
- [ ] Custom specialty input appears
- [ ] Enter custom specialty: "Custom Specialty"
- [ ] Select different specialty
- [ ] Custom specialty input disappears correctly
- [ ] Scenario loader dropdown appears at top of form
- [ ] Click scenario loader dropdown
- [ ] Can see saved scenarios (if any exist)
- [ ] "Continue" button is always enabled (step 1 is optional)
- [ ] Click info icon (ℹ️) next to title
- [ ] Screen info modal opens and displays help text
- [ ] Close modal

### Step 2: FTE & Projected wRVUs
- [ ] Click "Continue to FTE & wRVUs"
- [ ] Step 2 displays
- [ ] FTE input accepts values 0.1 to 1.0
- [ ] FTE slider works correctly (drag slider)
- [ ] FTE number input accepts manual entry
- [ ] Enter FTE: 0.75
- [ ] Set annual wRVUs: 5000
- [ ] Change FTE to 0.5
- [ ] Verify: Annual wRVUs scales proportionally (should be ~3333.33)
- [ ] Annual wRVU input accepts numeric values
- [ ] Enter annual wRVUs: 6000
- [ ] Switch to "Monthly Average" tab
- [ ] Enter monthly average: 500
- [ ] Verify: Annual calculates correctly (500 × 12 = 6000)
- [ ] Switch to "By Month" tab
- [ ] Monthly breakdown shows 12 months
- [ ] Enter values for each month individually
- [ ] Verify: Annual total updates correctly
- [ ] Switch back to "Annual" tab
- [ ] Verify: Annual value reflects monthly breakdown total
- [ ] Clear annual wRVUs (set to 0)
- [ ] Validation: Warning message appears: "Please enter projected wRVUs to continue"
- [ ] "Continue" button disabled when validation fails
- [ ] Enter annual wRVUs: 5000
- [ ] Warning disappears
- [ ] "Continue" button enabled

### Step 3: Conversion Factor
- [ ] Click "Continue to CF"
- [ ] Step 3 displays
- [ ] Conversion factor input accepts decimal values
- [ ] Default value (45.52) is pre-filled
- [ ] Currency formatting displays correctly ($45.52)
- [ ] Enter conversion factor: 50.00
- [ ] Clear conversion factor (set to 0)
- [ ] Validation: Warning message appears: "Please enter a conversion factor to continue"
- [ ] "Continue" button disabled when validation fails
- [ ] Enter conversion factor: 50.00
- [ ] Warning disappears
- [ ] "Continue" button enabled

### Step 4: Results
- [ ] Click "Results" (or Continue)
- [ ] Step 4 displays
- [ ] All KPI chips display correct values:
  - [ ] Annual wRVUs: 5000
  - [ ] Productivity Incentive: $250,000 (5000 × 50)
  - [ ] Productivity $ per wRVU: $50.00
- [ ] Verify calculations:
  - [ ] Productivity Pay = annualWrvus × conversionFactor (5000 × 50 = 250000)
  - [ ] Productivity $ per wRVU = productivityPay / annualWrvus (250000 / 5000 = 50)
  - [ ] Normalized wRVUs = annualWrvus / fte (5000 / 0.75 = 6666.67)
  - [ ] Normalized Productivity Pay = productivityPay / fte (250000 / 0.75 = 333333.33)
- [ ] If monthly breakdown data exists:
  - [ ] Monthly breakdown chart displays
  - [ ] Chart shows 12 bars
- [ ] If no monthly breakdown data:
  - [ ] Chart is hidden
- [ ] "Save Scenario" button appears
- [ ] Click "Save Scenario"
- [ ] Scenario saves successfully
- [ ] "Start Over" button appears
- [ ] Click "Start Over"
- [ ] All fields reset to defaults
- [ ] Navigates back to step 1
- [ ] Step indicator shows step 4 as completed

### Progressive Form Navigation
- [ ] Start fresh on step 1
- [ ] Try to click step 3 directly
- [ ] Verify: Cannot skip steps (allowStepJump = false)
- [ ] Step indicator shows current step highlighted
- [ ] Complete step 1, move to step 2
- [ ] Completed steps are visually marked (checkmark or different color)
- [ ] Use back button in form
- [ ] Back navigation works correctly
- [ ] Form state persists during navigation (values don't reset)

### Scenario Loading
- [ ] Create and save a scenario from wRVU modeler
- [ ] Note the scenario ID from URL or scenarios page
- [ ] Navigate to `/wrvu-modeler?scenario=<scenario-id>`
- [ ] Verify: Scenario loads automatically
- [ ] All fields populate correctly:
  - [ ] Provider name
  - [ ] Specialty
  - [ ] FTE
  - [ ] Annual wRVUs
  - [ ] Conversion factor
- [ ] Load scenario from dropdown
- [ ] Select scenario from dropdown
- [ ] Verify: All fields populate correctly
- [ ] Load scenario with different FTE (e.g., 0.5)
- [ ] Verify: FTE scaling works correctly when loading different FTE scenario

---

## 3. wRVU Forecaster (`/wrvu-forecaster`)

### Step 1: Work Schedule
- [ ] Navigate to `/wrvu-forecaster`
- [ ] Page loads without errors
- [ ] Step indicator shows 4 steps
- [ ] Vacation weeks input accepts numeric values
- [ ] Enter vacation weeks: 4
- [ ] Statutory holidays input accepts numeric values
- [ ] Enter statutory holidays: 10
- [ ] CME days input accepts numeric values
- [ ] Enter CME days: 5
- [ ] Default shift types are pre-filled:
  - [ ] "Regular Clinic": 8 hours, 4 per week
  - [ ] "Extended Hours": 10 hours, 1 per week
- [ ] Can add new shift types
- [ ] Click "Add Shift" or similar button
- [ ] New shift appears with default values
- [ ] Can edit shift name, hours, and frequency
- [ ] Edit shift name: "Weekend Clinic"
- [ ] Edit hours: 6
- [ ] Edit frequency: 2
- [ ] Can delete shift types
- [ ] Click delete button on a shift
- [ ] Shift is removed
- [ ] Delete all shifts
- [ ] Validation: "Continue" button disabled
- [ ] Add at least one shift with perWeek > 0
- [ ] Validation passes
- [ ] "Continue" button enabled

### Step 2: Patient Encounters
- [ ] Click "Continue to Patient Encounters"
- [ ] Step 2 displays
- [ ] Toggle between "Per Hour" and "Per Day" modes
- [ ] Toggle is visible and clickable
- [ ] Click toggle to switch to "Per Day"
- [ ] Input label changes to "Patients Seen Per Day"
- [ ] Click toggle to switch back to "Per Hour"
- [ ] Input label changes to "Patients Seen Per Hour"
- [ ] Patients per hour/day input accepts numeric values
- [ ] Enter patients per hour: 2
- [ ] Average wRVU per encounter accepts decimal values
- [ ] Enter average wRVU: 1.5
- [ ] Adjusted wRVU per encounter accepts decimal values
- [ ] Enter adjusted wRVU: 1.8
- [ ] Clear patients per hour (set to 0)
- [ ] Validation: "Continue" button disabled
- [ ] Enter patients per hour: 2
- [ ] Clear average wRVU (set to 0)
- [ ] Validation: "Continue" button disabled
- [ ] Enter average wRVU: 1.5
- [ ] Validation passes
- [ ] "Continue" button enabled

### Step 3: Compensation
- [ ] Click "Continue to Compensation"
- [ ] Step 3 displays
- [ ] Base salary input accepts currency values
- [ ] Enter base salary: 150000
- [ ] wRVU conversion factor input accepts decimal values
- [ ] Enter conversion factor: 45.52
- [ ] Target annual wRVUs calculates automatically
- [ ] Verify: Target = baseSalary / conversionFactor (150000 / 45.52 = 3295.26)
- [ ] Target wRVUs displays correctly formatted (3,295)
- [ ] Clear base salary (set to 0)
- [ ] Validation: "Continue" button disabled
- [ ] Enter base salary: 150000
- [ ] Clear conversion factor (set to 0)
- [ ] Validation: "Continue" button disabled
- [ ] Enter conversion factor: 45.52
- [ ] Validation passes
- [ ] "Continue" button enabled

### Step 4: Results
- [ ] Click "Calculate Forecast"
- [ ] Step 4 displays
- [ ] Productivity summary displays all metrics:
  - [ ] Weeks worked per year
  - [ ] Annual clinic days
  - [ ] Annual clinical hours
  - [ ] Encounters per week
  - [ ] Annual patient encounters
  - [ ] Estimated annual wRVUs
  - [ ] Total compensation
- [ ] Verify calculations:
  - [ ] Weeks worked = 52 - (vacationWeeks + (cmeDays + holidays) / 7)
  - [ ] Annual clinic days = (daysPerWeek × weeksWorked) - holidays - cmeDays
  - [ ] Annual clinical hours = hoursPerWeek × weeksWorked
  - [ ] Encounters per week = hoursPerWeek × patientsPerHour (if per hour mode)
  - [ ] Annual encounters = encountersPerWeek × weeksWorked
  - [ ] Annual wRVUs = annualEncounters × avgWRVUPerEncounter
  - [ ] wRVU compensation = annualWRVUs × conversionFactor
  - [ ] Total compensation = max(baseSalary, wrvuCompensation)
- [ ] If adjustedWRVUPerEncounter differs from avgWRVUPerEncounter:
  - [ ] Adjusted wRVU scenario shows
  - [ ] Potential increase is displayed
- [ ] Scenario manager dropdown appears
- [ ] Click scenario manager
- [ ] Can save scenario
- [ ] Can load saved scenario
- [ ] Email report button visible
- [ ] Click email report button
- [ ] Email client opens with formatted report
- [ ] Print view button visible
- [ ] Click print button
- [ ] Print dialog opens
- [ ] Print view hides non-printable elements (check print preview)

### Data Persistence
- [ ] Enter data in forecaster form
- [ ] Refresh page
- [ ] Verify: Form state restores from localStorage
- [ ] All inputs retain their values
- [ ] Shift IDs are preserved correctly
- [ ] Add multiple shifts
- [ ] Refresh page
- [ ] Verify: All shifts restore with correct IDs

---

## 4. FMV Calculator Main Page (`/fmv-calculator`)

### Metric Selector
- [ ] Navigate to `/fmv-calculator`
- [ ] Page loads without errors
- [ ] Three metric cards display:
  - [ ] CF (Conversion Factor)
  - [ ] TCC (Total Cash Compensation)
  - [ ] wRVU
- [ ] Each card is clickable
- [ ] Click CF card
- [ ] Navigates to `/fmv-calculator/cf`
- [ ] Navigate back to `/fmv-calculator`
- [ ] Click TCC card
- [ ] Navigates to `/fmv-calculator/tcc`
- [ ] Navigate back to `/fmv-calculator`
- [ ] Click wRVU card
- [ ] Navigates to `/fmv-calculator/wrvu`
- [ ] Icons and descriptions are correct on each card
- [ ] Hover effects work on desktop (shadow/scale)

---

## 5. FMV CF Calculator (`/fmv-calculator/cf`)

### Step 1: Provider Input
- [ ] Navigate to `/fmv-calculator/cf`
- [ ] Page loads without errors
- [ ] Step indicator shows 3 steps
- [ ] Conversion factor input accepts decimal values
- [ ] Currency formatting displays correctly
- [ ] Enter CF: 50.00
- [ ] Scenario loader appears
- [ ] Click scenario loader dropdown
- [ ] Can see saved CF scenarios (if any exist)
- [ ] "Save Provider Input" button appears when CF > 0
- [ ] Click "Save Provider Input"
- [ ] Scenario saves successfully
- [ ] "Continue" button appears when CF > 0
- [ ] Clear CF (set to 0)
- [ ] "Continue" button hidden or disabled
- [ ] Enter CF: 50.00
- [ ] "Continue" button appears

### Step 2: Market Data
- [ ] Click "Continue to Market Data"
- [ ] Step 2 displays
- [ ] Specialty selector dropdown appears
- [ ] Click specialty dropdown
- [ ] Can select specialty from dropdown
- [ ] Select a specialty (e.g., "Cardiology")
- [ ] If market data exists for that specialty:
  - [ ] Saved market data loads automatically
  - [ ] Benchmark inputs populate
- [ ] Benchmark inputs for 25th, 50th, 75th, 90th percentiles
- [ ] Enter at least one benchmark (e.g., 50th: 45.00)
- [ ] "Save Market Data" button works
- [ ] Click "Save Market Data"
- [ ] Market data saves by specialty
- [ ] "Calculate Percentile" button appears
- [ ] Clear all benchmarks
- [ ] Button disabled if no market data
- [ ] Enter at least one benchmark
- [ ] Button enabled

### Step 3: Results
- [ ] Click "Calculate Percentile"
- [ ] Step 3 displays
- [ ] Percentile breakdown displays correctly
- [ ] Percentile value calculates correctly
- [ ] Verify: Percentile is between 0-100
- [ ] Benchmark values display in chart
- [ ] Chart shows percentile position
- [ ] FMV signal indicators display:
  - [ ] Standard Range (green)
  - [ ] Enhanced Scrutiny (yellow)
  - [ ] High Scrutiny (red)
- [ ] "Save Scenario" button works
- [ ] Click "Save Scenario"
- [ ] Scenario saves with all data
- [ ] "Start New Calculation" button resets form
- [ ] Click "Start New Calculation"
- [ ] All fields clear
- [ ] Navigates back to step 1
- [ ] Navigate away and back
- [ ] Results persist (if saved)

### Step Navigation
- [ ] Step indicator shows 3 steps
- [ ] Click step 1
- [ ] Can navigate back to step 1
- [ ] Click step 2
- [ ] Can navigate to step 2 if CF value exists
- [ ] Click step 3 without calculating
- [ ] Cannot proceed to step 3 without market data and calculation
- [ ] Complete calculation
- [ ] Click step 3
- [ ] Can navigate to results

---

## 6. FMV TCC Calculator (`/fmv-calculator/tcc`)

### Step 1: Provider Input
- [ ] Navigate to `/fmv-calculator/tcc`
- [ ] Page loads without errors
- [ ] FTE input works correctly
- [ ] Set FTE: 0.75
- [ ] TCC components grid displays
- [ ] Can add TCC components
- [ ] Click "Add Component" or similar
- [ ] Component types available:
  - [ ] Base Salary
  - [ ] Productivity Incentive
  - [ ] Retention Bonus
  - [ ] Long-Term Incentive
  - [ ] Other Compensation
- [ ] Add Base Salary component: $200,000
- [ ] Add Productivity Incentive component: $50,000
- [ ] Can edit component amounts
- [ ] Edit Base Salary to $220,000
- [ ] Can delete components
- [ ] Delete a component
- [ ] Total TCC calculates correctly (sum of all components)
- [ ] Verify: Total = $220,000 + $50,000 = $270,000
- [ ] Normalized TCC displays (totalTCC / fte)
- [ ] Verify: Normalized = $270,000 / 0.75 = $360,000
- [ ] "Save Provider Input" button works
- [ ] "Continue" button appears when totalTCC > 0
- [ ] Test call pay integration:
  - [ ] Navigate from call-pay-modeler with call pay amount
  - [ ] Or navigate to `/fmv-calculator/tcc?callPay=30000`
  - [ ] Verify: Call Pay component added automatically
  - [ ] Amount matches query parameter

### Step 2: Market Data
- [ ] Click "Continue to Market Data"
- [ ] Step 2 displays
- [ ] Specialty selector works
- [ ] Select specialty
- [ ] Market data loads by specialty (if saved)
- [ ] TCC benchmark inputs (25th, 50th, 75th, 90th)
- [ ] Enter benchmarks:
  - [ ] 25th: $300,000
  - [ ] 50th: $350,000
  - [ ] 75th: $400,000
  - [ ] 90th: $450,000
- [ ] At least one benchmark required
- [ ] "Save Market Data" button works
- [ ] "Calculate Percentile" button works
- [ ] Click "Calculate Percentile"

### Step 3: Results
- [ ] Step 3 displays
- [ ] Normalized TCC percentile calculates correctly
- [ ] Verify: Uses normalized TCC, not total TCC
- [ ] Percentile breakdown displays
- [ ] Chart shows benchmark comparison
- [ ] FMV signal indicators display
- [ ] "Save Scenario" button works
- [ ] Click "Save Scenario"
- [ ] Scenario saves with all TCC components
- [ ] Navigate to scenarios page
- [ ] Verify: Scenario includes all components

---

## 7. FMV wRVU Calculator (`/fmv-calculator/wrvu`)

### Step 1: Provider Input
- [ ] Navigate to `/fmv-calculator/wrvu`
- [ ] Page loads without errors
- [ ] FTE input works
- [ ] Set FTE: 0.8
- [ ] wRVU input supports annual, monthly, and monthly breakdown
- [ ] Enter annual wRVUs: 5000
- [ ] Normalized wRVUs displays (annualWrvus / fte)
- [ ] Verify: Normalized = 5000 / 0.8 = 6250
- [ ] "Save Provider Input" button works
- [ ] "Continue" button appears when normalizedWrvus > 0
- [ ] Test monthly input methods
- [ ] Switch to monthly average
- [ ] Enter monthly: 416.67
- [ ] Verify: Annual = 416.67 × 12 = 5000

### Step 2: Market Data
- [ ] Click "Continue to Market Data"
- [ ] Step 2 displays
- [ ] Specialty selector works
- [ ] Select specialty
- [ ] Market data loads by specialty (if saved)
- [ ] wRVU benchmark inputs (25th, 50th, 75th, 90th)
- [ ] Enter benchmarks:
  - [ ] 25th: 4000
  - [ ] 50th: 5000
  - [ ] 75th: 6000
  - [ ] 90th: 7000
- [ ] At least one benchmark required
- [ ] "Save Market Data" button works
- [ ] "Calculate Percentile" button works

### Step 3: Results
- [ ] Click "Calculate Percentile"
- [ ] Step 3 displays
- [ ] Normalized wRVU percentile calculates correctly
- [ ] Verify: Uses normalized wRVUs, not annual
- [ ] Percentile breakdown displays
- [ ] Chart shows benchmark comparison
- [ ] "Save Scenario" button works
- [ ] Scenario saves with wRVU data

---

## 8. Call Pay Modeler (`/call-pay-modeler`)

### Welcome Walkthrough
- [ ] Navigate to `/call-pay-modeler`
- [ ] Page loads without errors
- [ ] Welcome modal appears on first visit (if implemented)
- [ ] Can navigate through walkthrough steps
- [ ] Can dismiss walkthrough
- [ ] Walkthrough doesn't reappear after dismissal
- [ ] Refresh page
- [ ] Walkthrough doesn't reappear (check localStorage)

### Step 1: Set Context
- [ ] Step indicator shows 3 steps
- [ ] Specialty dropdown works
- [ ] Select specialty: "Cardiology"
- [ ] Service line input accepts text
- [ ] Enter service line: "Cardiac Surgery"
- [ ] Providers on call input accepts numeric values
- [ ] Enter providers: 8
- [ ] Rotation ratio input accepts numeric values
- [ ] Enter rotation ratio: 4
- [ ] Model year defaults to current year
- [ ] Clear specialty
- [ ] Validation: "Continue" button disabled
- [ ] Set specialty
- [ ] Set providers to 0
- [ ] Validation: "Continue" button disabled
- [ ] Set providers to 8
- [ ] Set rotation ratio to 0
- [ ] Validation: "Continue" button disabled
- [ ] Set rotation ratio to 4
- [ ] Validation passes
- [ ] "Continue" button enabled
- [ ] Scenario loader appears
- [ ] Can load saved call pay scenarios
- [ ] "Start Over" button resets form
- [ ] Click "Start Over"
- [ ] All fields clear

### Step 2: Configure Tiers
- [ ] Click "Continue to Configure Tiers"
- [ ] Step 2 displays
- [ ] Default tiers (C1-C5) are visible in segmented control
- [ ] Tier enable/disable toggle works
- [ ] Toggle C1 to enabled
- [ ] Verify: Label shows "Enabled"
- [ ] Toggle C1 to disabled
- [ ] Verify: Label shows "Disabled"
- [ ] Can add new tiers
- [ ] Click "Add Tier" or similar
- [ ] New tier appears
- [ ] Can edit tier name
- [ ] Edit tier name: "C6"
- [ ] Coverage type dropdown works
- [ ] Select coverage type: "In-house"
- [ ] Other options available:
  - [ ] Restricted home
  - [ ] Unrestricted home
  - [ ] Backup only
- [ ] Payment method dropdown works
- [ ] Select payment method: "Daily / shift rate"
- [ ] Other options available:
  - [ ] Hourly rate
  - [ ] Per procedure
  - [ ] Per wRVU
- [ ] Weekday, weekend, holiday rates accept currency values
- [ ] Enter weekday rate: $500
- [ ] Enter weekend rate: $600
- [ ] Enter holiday rate: $800
- [ ] Percentage-based calculation toggle works
- [ ] Enable percentage toggle
- [ ] Enter weekend uplift: 20%
- [ ] Enter holiday uplift: 30%
- [ ] Verify: Weekend rate = weekday × 1.20
- [ ] Verify: Holiday rate = weekday × 1.30
- [ ] Disable percentage toggle
- [ ] Rates become manually editable again
- [ ] Trauma/high-acuity uplift toggle works
- [ ] Enable trauma uplift toggle
- [ ] Enter uplift percentage: 15%
- [ ] Verify: All rates increase by 15%
- [ ] Call burden inputs accept numeric values
- [ ] Enter weekday calls/month: 15
- [ ] Enter weekend calls/month: 4
- [ ] Enter holidays/year: 8
- [ ] Enter avg callbacks/24h: 2.5
- [ ] Tier segmented control allows switching between tiers
- [ ] Click C2 in segmented control
- [ ] C2 tier card expands
- [ ] C1 tier card collapses
- [ ] Selected tier card expands
- [ ] Disable all tiers
- [ ] Validation: "Continue" button disabled
- [ ] Enable C1 tier
- [ ] Set rates to 0
- [ ] Validation: "Continue" button disabled
- [ ] Set weekday rate: $500
- [ ] Set burden to 0
- [ ] Validation: "Continue" button disabled
- [ ] Set weekday calls: 15
- [ ] Validation passes
- [ ] "Continue" button enabled

### Step 3: Review Budget
- [ ] Click "Continue to Review Budget"
- [ ] Step 3 displays
- [ ] Impact summary displays correctly
- [ ] Annual call pay per provider calculates correctly
- [ ] Verify calculation:
  - [ ] Monthly pay = (weekdayCalls × weekdayRate) + (weekendCalls × weekendRate) + (holidays/12 × holidayRate)
  - [ ] Per provider = monthlyPay / rotationRatio
  - [ ] Annual = perProvider × 12
- [ ] Total annual call pay calculates correctly
- [ ] Verify: Total = annualPerProvider × providersOnCall
- [ ] Per-provider breakdown shows for each tier
- [ ] Annual allowable budget input accepts currency values
- [ ] Enter budget: $250000
- [ ] Budget comparison shows if budget entered
- [ ] Verify: Shows difference (over/under budget)
- [ ] "Save Scenario" button works
- [ ] Click "Save Scenario"
- [ ] Scenario saves with all tier data
- [ ] "Start New Calculation" button resets form
- [ ] Click "Start New Calculation"
- [ ] All fields clear
- [ ] Navigates back to step 1
- [ ] Step indicator shows all 3 steps

### Calculations
- [ ] Test per-call model:
  - [ ] Set payment method: "Per call"
  - [ ] Enter rate: $100
  - [ ] Enter calls/month: 20
  - [ ] Verify: Annual = (20 × 12 × $100) / rotationRatio
- [ ] Test per-shift model:
  - [ ] Set payment method: "Daily / shift rate"
  - [ ] Enter weekday rate: $500
  - [ ] Enter weekday shifts/month: 15
  - [ ] Verify: Annual = (15 × 12 × $500) / rotationRatio
- [ ] Test tiered model:
  - [ ] Enable C1 and C2
  - [ ] Configure both with different rates
  - [ ] Verify: Total = sum of all enabled tiers
- [ ] Annualization works for all models
- [ ] Rotation ratio affects calculations correctly
- [ ] Change rotation ratio from 4 to 6
- [ ] Verify: Per-provider amount decreases proportionally

---

## 9. Scenarios List Page (`/scenarios`)

### Empty State
- [ ] Clear localStorage
- [ ] Navigate to `/scenarios`
- [ ] Empty state message displays: "No scenarios saved yet..."
- [ ] "Create Scenario" button navigates to FMV calculator
- [ ] Click "Create Scenario"
- [ ] Navigates to `/fmv-calculator`
- [ ] Navigate back to `/scenarios`
- [ ] "New Scenario" button in header works
- [ ] Click "New Scenario"
- [ ] Navigates to `/fmv-calculator`

### Scenario List
- [ ] Create scenarios from different tools:
  - [ ] wRVU modeler scenario
  - [ ] FMV CF scenario
  - [ ] FMV TCC scenario
  - [ ] Call pay scenario
- [ ] Navigate to `/scenarios`
- [ ] All saved scenarios display
- [ ] Scenarios sorted by most recent (newest first)
- [ ] Scenario cards show correct information:
  - [ ] Provider name (if available)
  - [ ] Specialty (if available)
  - [ ] Scenario type
  - [ ] Created/updated dates
- [ ] Scenario type badges display correctly
- [ ] Percentile indicators display if available
- [ ] Clicking scenario card navigates to detail page
- [ ] Click scenario card
- [ ] Navigates to `/scenarios/[id]`
- [ ] Navigate back
- [ ] Edit button navigates to detail page
- [ ] Click edit button
- [ ] Navigates to detail page
- [ ] Navigate back
- [ ] Delete button shows confirmation dialog
- [ ] Click delete button
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" in dialog
- [ ] Dialog closes, scenario not deleted
- [ ] Click delete button again
- [ ] Click "Delete" in dialog
- [ ] Delete confirmation works correctly
- [ ] Scenario removed from list
- [ ] Refresh page
- [ ] Scenarios persist after page reload

### Scenario Card Details
- [ ] Verify each scenario card shows:
  - [ ] Provider name displays if available
  - [ ] Specialty displays if available
  - [ ] Scenario type displays correctly:
    - [ ] wrvu-modeler
    - [ ] fmv-cf
    - [ ] fmv-tcc
    - [ ] fmv-wrvu
    - [ ] call-pay
  - [ ] Created/updated dates display
  - [ ] Percentile values display if calculated
  - [ ] Key metrics display (TCC, wRVUs, CF, etc.)

---

## 10. Scenario Detail Page (`/scenarios/[id]`)

### Navigation
- [ ] Navigate to a scenario detail page
- [ ] Page loads with correct scenario data
- [ ] All fields populate from scenario
- [ ] "Cancel" button navigates back to scenarios list
- [ ] Click "Cancel"
- [ ] Navigates to `/scenarios`
- [ ] Navigate back to detail page
- [ ] "Save Changes" button updates scenario
- [ ] Make changes to scenario
- [ ] Click "Save Changes"
- [ ] Scenario updates
- [ ] Navigates to scenarios list
- [ ] Verify: Changes persisted
- [ ] Navigate back to detail page
- [ ] "Save as New" creates duplicate scenario
- [ ] Click "Save as New"
- [ ] New scenario created
- [ ] Navigates to scenarios list
- [ ] Verify: Both original and new scenario exist
- [ ] Navigate back to detail page
- [ ] "Delete" button shows confirmation dialog
- [ ] Click "Delete"
- [ ] Confirmation dialog appears
- [ ] Delete confirmation works
- [ ] Scenario deleted
- [ ] Navigates to scenarios list

### Editing
- [ ] Scenario name input is editable
- [ ] Edit scenario name
- [ ] FTE input works
- [ ] Change FTE
- [ ] Annual wRVUs input works
- [ ] Change annual wRVUs
- [ ] TCC components grid is editable
- [ ] Add TCC component
- [ ] Edit TCC component amount
- [ ] Delete TCC component
- [ ] Market benchmarks are editable (TCC, CF, wRVU)
- [ ] Edit TCC benchmarks
- [ ] Edit CF benchmarks
- [ ] Edit wRVU benchmarks
- [ ] Make changes
- [ ] Click "Save Changes"
- [ ] Changes persist when saved
- [ ] Navigate back
- [ ] Verify: Changes saved
- [ ] Navigate to detail page again
- [ ] Make changes
- [ ] Click "Cancel"
- [ ] Changes don't persist if cancelled
- [ ] Navigate back
- [ ] Verify: Original values restored

### FMV Summary
- [ ] Summary tiles display all percentiles:
  - [ ] TCC percentile
  - [ ] wRVU percentile
  - [ ] CF percentile
- [ ] Percentile chart displays correctly
- [ ] Chart shows all three percentiles
- [ ] Calculations update when inputs change
- [ ] Change FTE
- [ ] Verify: Normalized values recalculate
- [ ] Verify: Percentiles recalculate
- [ ] Normalized values calculate correctly
- [ ] Effective CF calculates correctly
- [ ] Verify: Effective CF = normalizedTCC / normalizedWrvus

### Error Handling
- [ ] Navigate to `/scenarios/invalid-id`
- [ ] "Scenario not found" message displays
- [ ] Graceful handling of missing data
- [ ] Create scenario with partial data
- [ ] Navigate to detail page
- [ ] Missing fields handled gracefully (no crashes)
- [ ] Validation prevents invalid saves
- [ ] Try to save with invalid data
- [ ] Validation prevents save

---

## 11. Cross-Feature Testing

### Scenario Integration
- [ ] Create scenario from wRVU modeler
- [ ] Verify: Scenario appears in scenarios list
- [ ] Verify: Scenario type is "wrvu-modeler"
- [ ] Create scenario from FMV CF calculator
- [ ] Verify: Scenario appears in scenarios list
- [ ] Verify: Scenario type is "fmv-cf"
- [ ] Create scenario from FMV TCC calculator
- [ ] Verify: Scenario appears in scenarios list
- [ ] Verify: Scenario type is "fmv-tcc"
- [ ] Create scenario from call pay modeler
- [ ] Verify: Scenario appears in scenarios list
- [ ] Verify: Scenario type is "call-pay"
- [ ] Load wRVU modeler scenario in wRVU modeler
- [ ] Verify: All fields populate correctly
- [ ] Load FMV CF scenario in FMV CF calculator
- [ ] Verify: All fields populate correctly
- [ ] Scenario types are correctly identified
- [ ] Scenarios appear in recent scenarios on home page
- [ ] Navigate to home page
- [ ] Verify: Recent scenarios section shows saved scenarios
- [ ] Scenarios appear in scenarios list
- [ ] Scenario routing works (`getScenarioRoute`)
- [ ] Click scenario from home page
- [ ] Verify: Navigates to correct tool with scenario loaded

### Data Persistence
- [ ] Create multiple scenarios
- [ ] Refresh page
- [ ] All scenarios persist in localStorage
- [ ] Verify: All scenarios still visible
- [ ] Market data persists by specialty
- [ ] Save market data for "Cardiology" in FMV calculator
- [ ] Navigate away and back
- [ ] Select "Cardiology" specialty
- [ ] Verify: Market data loads automatically
- [ ] Form state persists (wrvu-forecaster)
- [ ] Enter data in forecaster
- [ ] Refresh page
- [ ] Verify: Form state restores
- [ ] Data survives browser refresh
- [ ] Close browser
- [ ] Reopen browser
- [ ] Navigate to app
- [ ] Verify: Data still exists
- [ ] Clear localStorage
- [ ] Verify: All data removed

### Navigation
- [ ] Test on mobile viewport
- [ ] Bottom navigation works on mobile
- [ ] All 5 tabs clickable
- [ ] Active tab highlights correctly
- [ ] Test on desktop viewport
- [ ] Top navigation works on desktop (if enabled)
- [ ] Active tab highlights correctly
- [ ] Navigation persists across page reloads
- [ ] Navigate to a page
- [ ] Refresh
- [ ] Verify: Same page loads
- [ ] Browser back/forward buttons work
- [ ] Navigate through multiple pages
- [ ] Click browser back button
- [ ] Verify: Previous page loads
- [ ] Click browser forward button
- [ ] Verify: Next page loads
- [ ] Direct URL navigation works
- [ ] Navigate directly to `/wrvu-modeler`
- [ ] Verify: Page loads correctly

### Responsive Design
- [ ] Test mobile layout (< 640px)
- [ ] Resize browser to 375px width
- [ ] Verify: Layout adapts correctly
- [ ] All elements visible and usable
- [ ] Test tablet layout (640px - 1024px)
- [ ] Resize browser to 768px width
- [ ] Verify: Layout adapts correctly
- [ ] Test desktop layout (> 1024px)
- [ ] Resize browser to 1920px width
- [ ] Verify: Layout adapts correctly
- [ ] Touch targets are adequate size (44x44px minimum)
- [ ] Check all buttons and clickable elements
- [ ] Text is readable on all screen sizes
- [ ] Forms are usable on mobile
- [ ] Test form inputs on mobile
- [ ] Verify: Inputs are easily tappable
- [ ] Charts/graphs display correctly on all sizes
- [ ] Resize browser while viewing charts
- [ ] Verify: Charts adapt to screen size

### Dark Mode
- [ ] Check if dark mode toggle exists
- [ ] If exists, test dark mode toggle
- [ ] Toggle dark mode on/off
- [ ] All screens display correctly in dark mode
- [ ] Navigate through all pages in dark mode
- [ ] Text contrast is adequate
- [ ] Charts/graphs are readable in dark mode
- [ ] Inputs are usable in dark mode

### Performance
- [ ] Measure page load times
- [ ] Navigate to each page
- [ ] Verify: Load times are acceptable (< 3 seconds)
- [ ] Form interactions are responsive
- [ ] Type in inputs
- [ ] Verify: No lag or delay
- [ ] Calculations complete quickly
- [ ] Enter data and trigger calculations
- [ ] Verify: Results appear immediately
- [ ] Open browser console
- [ ] Navigate through app
- [ ] Verify: No console errors
- [ ] Test for memory leaks
- [ ] Create and delete multiple scenarios
- [ ] Verify: No performance degradation

### Accessibility
- [ ] Keyboard navigation works
- [ ] Tab through all interactive elements
- [ ] Verify: All elements are focusable
- [ ] Focus indicators are visible
- [ ] Tab through elements
- [ ] Verify: Focus outline is visible
- [ ] Screen reader compatible (if applicable)
- [ ] Test with screen reader (if available)
- [ ] ARIA labels present where needed
- [ ] Check form inputs for labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Check text contrast ratios

### Error Scenarios
- [ ] Test invalid input handling
- [ ] Enter negative numbers in FTE field
- [ ] Verify: Rejected or handled gracefully
- [ ] Enter text in number fields
- [ ] Verify: Rejected or handled gracefully
- [ ] Missing required fields show validation messages
- [ ] Try to proceed without required fields
- [ ] Verify: Validation messages appear
- [ ] Division by zero handled
- [ ] Set conversion factor to 0
- [ ] Verify: Handled gracefully (no crashes)
- [ ] Empty state handling
- [ ] Clear all scenarios
- [ ] Verify: Empty state displays correctly
- [ ] localStorage quota exceeded handling
- [ ] Create many large scenarios
- [ ] Verify: Handled gracefully (error message or limit)

### Browser Compatibility
- [ ] Test in Chrome (latest)
- [ ] All features work correctly
- [ ] Test in Firefox (latest)
- [ ] All features work correctly
- [ ] Test in Safari (latest)
- [ ] All features work correctly
- [ ] Test in Edge (latest)
- [ ] All features work correctly
- [ ] Test in Mobile Safari (iOS)
- [ ] All features work correctly
- [ ] Test in Chrome Mobile (Android)
- [ ] All features work correctly

---

## 12. Calculation Verification

### wRVU Modeler Calculations
- [ ] Set FTE: 0.75
- [ ] Set annual wRVUs: 5000
- [ ] Set conversion factor: 50.00
- [ ] Verify: Productivity Pay = 5000 × 50 = 250,000
- [ ] Verify: Productivity $ per wRVU = 250,000 / 5000 = 50.00
- [ ] Verify: Normalized wRVUs = 5000 / 0.75 = 6666.67
- [ ] Verify: Normalized Productivity Pay = 250,000 / 0.75 = 333,333.33
- [ ] Test FTE scaling:
  - [ ] Set FTE: 1.0, annualWrvus: 6000
  - [ ] Change FTE to 0.5
  - [ ] Verify: newValue = 6000 × (0.5 / 1.0) = 3000

### wRVU Forecaster Calculations
- [ ] Set vacation weeks: 4
- [ ] Set statutory holidays: 10
- [ ] Set CME days: 5
- [ ] Set shift: 8 hours, 4 per week
- [ ] Verify: Weeks worked = 52 - (4 + (5 + 10) / 7) = 45.86
- [ ] Verify: Annual clinic days = (4 × 45.86) - 10 - 5 = 168.44
- [ ] Verify: Annual clinical hours = (8 × 4) × 45.86 = 1467.52
- [ ] Set patients per hour: 2
- [ ] Verify: Encounters per week = (8 × 4) × 2 = 64
- [ ] Verify: Annual encounters = 64 × 45.86 = 2935.04
- [ ] Set avg wRVU per encounter: 1.5
- [ ] Verify: Annual wRVUs = 2935.04 × 1.5 = 4402.56
- [ ] Set conversion factor: 45.52
- [ ] Verify: wRVU compensation = 4402.56 × 45.52 = 200,404.53
- [ ] Set base salary: 150,000
- [ ] Verify: Total compensation = max(150,000, 200,404.53) = 200,404.53

### FMV Percentile Calculations
- [ ] Test percentile interpolation:
  - [ ] Set value: 45 (between 25th=40 and 50th=50)
  - [ ] Verify: Percentile ≈ 35th (interpolated)
- [ ] TCC percentile uses normalized TCC
  - [ ] Set FTE: 0.75, totalTCC: 300,000
  - [ ] Verify: Uses normalizedTCC (400,000) for percentile
- [ ] wRVU percentile uses normalized wRVUs
  - [ ] Set FTE: 0.8, annualWrvus: 5000
  - [ ] Verify: Uses normalizedWrvus (6250) for percentile
- [ ] CF percentile uses effective CF
  - [ ] Set normalizedTCC: 400,000, normalizedWrvus: 8000
  - [ ] Verify: Uses effectiveCF (50.00) for percentile
- [ ] Percentile values are between 0-100
  - [ ] Test with values below 25th percentile
  - [ ] Verify: Percentile < 25
  - [ ] Test with values above 90th percentile
  - [ ] Verify: Percentile > 90
- [ ] Percentile calculation handles edge cases
  - [ ] Test with only 25th percentile benchmark
  - [ ] Test with only 90th percentile benchmark
  - [ ] Verify: Handles gracefully

### Call Pay Calculations
- [ ] Test per-call model:
  - [ ] Set rate: $100, calls/month: 20, rotation: 4
  - [ ] Verify: Annual = (20 × 12 × $100) / 4 = $6,000
- [ ] Test per-shift model:
  - [ ] Set rate: $500, shifts/month: 15, rotation: 4
  - [ ] Verify: Annual = (15 × 12 × $500) / 4 = $22,500
- [ ] Test tiered model:
  - [ ] Enable C1: $500/month, rotation 4
  - [ ] Enable C2: $300/month, rotation 4
  - [ ] Verify: Total = ($500 + $300) × 12 / 4 = $2,400
- [ ] Annualization works for all models
- [ ] Rotation ratio affects per-provider calculations
  - [ ] Set rotation: 4, verify per-provider amount
  - [ ] Change rotation to 6
  - [ ] Verify: Per-provider amount decreases proportionally

---

## 13. Edge Cases

### Input Validation
- [ ] FTE values: 0.1 to 1.0 only
  - [ ] Try to enter 0.05
  - [ ] Verify: Rejected or clamped to 0.1
  - [ ] Try to enter 1.5
  - [ ] Verify: Rejected or clamped to 1.0
- [ ] Negative numbers rejected where appropriate
  - [ ] Enter negative wRVUs
  - [ ] Verify: Rejected or set to 0
- [ ] Zero values handled correctly
  - [ ] Set conversion factor to 0
  - [ ] Verify: Validation prevents proceeding
- [ ] Very large numbers handled
  - [ ] Enter 1,000,000 for TCC
  - [ ] Verify: Handles correctly (no overflow)
- [ ] Decimal precision maintained
  - [ ] Enter currency: 123456.789
  - [ ] Verify: Displays as $123,456.79 (2 decimals)
- [ ] Text in number fields rejected or handled gracefully
  - [ ] Type "abc" in number field
  - [ ] Verify: Rejected or cleared

### Data Limits
- [ ] Maximum number of scenarios
  - [ ] Create 100+ scenarios
  - [ ] Verify: All save and load correctly
- [ ] Maximum number of TCC components
  - [ ] Add 20+ TCC components
  - [ ] Verify: All save and display correctly
- [ ] Maximum number of call pay tiers
  - [ ] Add 10+ tiers
  - [ ] Verify: All save and display correctly
- [ ] Maximum number of shifts in forecaster
  - [ ] Add 20+ shifts
  - [ ] Verify: All save and display correctly
- [ ] localStorage size limits
  - [ ] Create very large scenarios
  - [ ] Verify: Handled gracefully (error or limit message)

### State Management
- [ ] Form state doesn't interfere between tools
  - [ ] Enter data in wRVU modeler
  - [ ] Navigate to FMV calculator
  - [ ] Verify: FMV calculator doesn't have wRVU modeler data
- [ ] Scenario loading doesn't break existing form state
  - [ ] Enter data in form
  - [ ] Load scenario
  - [ ] Verify: Scenario data loads, other fields clear appropriately
- [ ] Multiple tabs/windows handle localStorage correctly
  - [ ] Open app in two tabs
  - [ ] Create scenario in tab 1
  - [ ] Refresh tab 2
  - [ ] Verify: Scenario appears in tab 2
- [ ] Concurrent edits don't cause data loss
  - [ ] Edit scenario in tab 1
  - [ ] Edit same scenario in tab 2
  - [ ] Save in both tabs
  - [ ] Verify: Last save wins (or conflict handled)

---

## 14. User Experience

### Loading States
- [ ] Loading indicators appear during async operations
  - [ ] Trigger save operation
  - [ ] Verify: Loading indicator appears
- [ ] Suspense boundaries work correctly
  - [ ] Navigate to page with Suspense
  - [ ] Verify: Fallback displays, then content loads
- [ ] No flash of unstyled content
  - [ ] Hard refresh page
  - [ ] Verify: No FOUC

### Feedback
- [ ] Success messages on save operations
  - [ ] Save scenario
  - [ ] Verify: Success message appears (toast, notification, etc.)
- [ ] Error messages are clear and actionable
  - [ ] Trigger error condition
  - [ ] Verify: Error message is clear
- [ ] Validation messages appear at appropriate times
  - [ ] Try to proceed without required fields
  - [ ] Verify: Validation messages appear
- [ ] Confirmation dialogs for destructive actions
  - [ ] Click delete button
  - [ ] Verify: Confirmation dialog appears

### Help & Guidance
- [ ] Screen info modals open and display correctly
  - [ ] Click info icon
  - [ ] Verify: Modal opens with help text
- [ ] Help text is accurate and helpful
  - [ ] Read help text
  - [ ] Verify: Makes sense and is helpful
- [ ] Tour/walkthrough works (if implemented)
  - [ ] Trigger tour
  - [ ] Verify: Tour steps through features
- [ ] Tooltips display correctly
  - [ ] Hover over elements with tooltips
  - [ ] Verify: Tooltips appear

---

## Test Execution Summary

### Test Results Template

For each test session, document:

**Date:** _______________
**Tester:** _______________
**Browser:** _______________
**Device/Viewport:** _______________

**Total Tests:** _______________
**Passed:** _______________
**Failed:** _______________
**Skipped:** _______________

### Bug Report Template

**Bug #:** _______________
**Severity:** [Critical / High / Medium / Low]
**Page/Feature:** _______________
**Steps to Reproduce:**
1. _______________
2. _______________
3. _______________

**Expected Behavior:** _______________

**Actual Behavior:** _______________

**Screenshots:** (attach if applicable)

**Browser/Device:** _______________

**Additional Notes:** _______________

---

## Notes

- This test process should be executed systematically, following the numbered sequence
- Document all findings, including both bugs and positive observations
- Re-test fixed bugs to ensure resolution
- Focus on critical path functionality first (save/load, calculations)
- Estimated time for complete test suite: 4-6 hours







