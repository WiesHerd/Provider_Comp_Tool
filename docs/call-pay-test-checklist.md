# Call Pay Modeler - Manual Test Checklist

## Pre-Testing Setup
- [ ] Dev server is running (`npm run dev`)
- [ ] Navigate to http://localhost:3000/call-pay-modeler
- [ ] Page loads without errors
- [ ] All 5 tiers (C1-C5) are visible in segmented control

## Test Scenario 1: Basic Daily Rate Model (Cardiology)

### Setup:
1. Context Card:
   - Specialty: Cardiology
   - Providers on Call: 8
   - Rotation Ratio: 4 (1-in-4)
   - Service Line: Cardiac Surgery

2. Tier C1:
   - Enable: ON
   - Coverage Type: In-house
   - Payment Method: Daily / shift rate
   - Weekday Rate: $500
   - Weekend Rate: $600
   - Holiday Rate: $800
   - Weekday Calls/Month: 15
   - Weekend Calls/Month: 4
   - Holidays/Year: 8
   - Avg Callbacks/24h: 2.5

### Expected Results:
- **Monthly Pay Calculation:**
  - Weekday: 15 × $500 = $7,500
  - Weekend: 4 × $600 = $2,400
  - Holiday: (8/12) × $800 = $533.33
  - Total Monthly: $10,433.33

- **Per Provider (with 1-in-4 rotation):**
  - Monthly: $10,433.33 ÷ 4 = $2,608.33
  - Annual: $2,608.33 × 12 = **$31,300**

- **Group Budget:**
  - $31,300 × 8 providers = **$250,400**

### Verify:
- [ ] Impact Summary shows "Annual Pay per Provider: $31,300"
- [ ] Impact Summary shows "Annual Budget for Group: $250,400"
- [ ] Total Annual Call Budget shows $250,400
- [ ] Effective $/24h is calculated (should be ~$132.63)
- [ ] Effective $/call is calculated (should be ~$53.05)

## Test Scenario 2: Annual Stipend Model (Anesthesiology)

### Setup:
1. Context:
   - Specialty: Anesthesiology
   - Providers: 12
   - Rotation: 6 (1-in-6)

2. Tier C1:
   - Payment Method: Annual stipend
   - Annual Stipend: $60,000 (enter in Weekday Rate field)
   - All other fields: 0

### Expected Results:
- **Per Provider:** $60,000 ÷ 6 = **$10,000**
- **Group Budget:** $10,000 × 12 = **$120,000**

### Verify:
- [ ] Annual Pay per Provider: $10,000
- [ ] Total Annual Call Budget: $120,000

## Test Scenario 3: Multi-Tier Model (General Surgery)

### Setup:
1. Context:
   - Specialty: General Surgery
   - Providers: 10
   - Rotation: 5 (1-in-5)

2. Tier C1 (Trauma):
   - Enable: ON
   - Payment: Daily / shift rate
   - Weekday: $800, Weekend: $1,000
   - Weekday: 10/month, Weekend: 3/month
   - Trauma Uplift: 15% (toggle ON, enter 15)

3. Tier C2 (General):
   - Enable: ON
   - Payment: Daily / shift rate
   - Weekday: $400, Weekend: $500
   - Weekday: 12/month, Weekend: 4/month

### Expected Results:
**C1 Calculation:**
- Monthly: (10×$800 + 3×$1,000) × 1.15 = $13,340
- Per provider: $13,340 ÷ 5 = $2,668/month
- Annual: $2,668 × 12 = **$32,016**
- Group: $32,016 × 10 = **$320,160**

**C2 Calculation:**
- Monthly: (12×$400 + 4×$500) = $6,800
- Per provider: $6,800 ÷ 5 = $1,360/month
- Annual: $1,360 × 12 = **$16,320**
- Group: $16,320 × 10 = **$163,200**

**Combined:**
- Total Budget: $320,160 + $163,200 = **$483,360**

### Verify:
- [ ] Both tiers show in Impact Summary
- [ ] C1 shows $32,016 per provider, $320,160 group
- [ ] C2 shows $16,320 per provider, $163,200 group
- [ ] Total Annual Call Budget: $483,360

## Test Scenario 4: Per Procedure Model (Surgical Specialty)

### Setup:
1. Tier C1:
   - Payment Method: Per procedure
   - Rate: $500 (enter in Weekday Rate)
   - Weekday Calls: 10/month
   - Weekend Calls: 3/month
   - Avg Cases per 24h: 2.5

### Expected Results:
- Cases per month: 2.5 × (10 + 3) = 32.5 cases
- Monthly: 32.5 × $500 = $16,250
- Per provider (1-in-4): $16,250 ÷ 4 = $4,062.50
- Annual: $4,062.50 × 12 = **$48,750**

### Verify:
- [ ] Annual Pay per Provider: $48,750
- [ ] "Avg Cases per 24h" field is visible (procedural specialty)

## Test Scenario 5: Input Validation & Edge Cases

### Test Input Ease:
- [ ] Can easily type "500" in currency fields (no formatting interference)
- [ ] Can type "150000" for TCC benchmarks
- [ ] Can type "40.00" for CF benchmarks
- [ ] Numbers format correctly on blur (commas, decimals)

### Test Edge Cases:
- [ ] Disable a tier → Impact Summary updates (removes that tier)
- [ ] Set all rates to 0 → Shows $0 budget
- [ ] Set burden to 0 → Shows $0 pay
- [ ] Change rotation ratio → Recalculates immediately
- [ ] Add 6th tier → "Add Tier" button still works
- [ ] Remove tier when only 1 left → Button disabled or prevents removal

## Test Scenario 6: FMV Benchmark Panel

### Setup:
1. Enable C1 with rates: Weekday $500, Weekend $600, Holiday $800
2. Expand FMV Benchmark Analysis panel
3. Enter benchmarks:
   - Weekday: 25th=$400, 50th=$500, 75th=$600, 90th=$700
   - Weekend: 25th=$500, 50th=$600, 75th=$700, 90th=$800

### Verify:
- [ ] Percentile chips show correct percentiles
- [ ] Weekday $500 → ~50th percentile (green)
- [ ] Weekend $600 → ~50th percentile (green)
- [ ] Color coding: Green (25-75), Yellow (75-90), Red (>90)

## Test Scenario 7: Mobile Responsiveness

### Test on Mobile Viewport:
- [ ] All inputs are easily tappable (min 44px height)
- [ ] Tier segmented control scrolls horizontally
- [ ] Impact summary cards scroll horizontally
- [ ] No horizontal scrolling on main page
- [ ] Text is readable without zooming
- [ ] Buttons are large enough for thumb taps

## Test Scenario 8: Add to TCC Integration

### Setup:
1. Configure a tier with values
2. Click "Add to TCC Components" button

### Verify:
- [ ] Navigates to FMV Calculator
- [ ] Call Pay amount is pre-filled in URL or state
- [ ] Can see call pay in TCC components list

## Critical Issues to Watch For:

1. **Rotation Ratio Logic:**
   - Verify: With 1-in-4 rotation, provider pay should be 1/4 of full burden pay
   - Common mistake: Dividing group budget by rotation (WRONG)

2. **Group Budget:**
   - Formula: Annual per provider × Number of providers
   - This is the TOTAL budget needed

3. **Trauma Uplift:**
   - Should apply AFTER calculating base monthly pay
   - Should only show for Daily/Shift and Hourly rates

4. **Multi-Tier:**
   - Total budget = Sum of all enabled tier group budgets
   - Average per provider = Average of all tier per-provider amounts

## Expected Behavior Summary:

✅ **What Works:**
- Real-time calculation updates
- Multiple payment methods
- Multi-tier support
- Rotation ratio adjustments
- Trauma uplifts
- FMV percentile analysis

❌ **Potential Issues to Fix:**
- Input formatting might interfere with typing
- Need validation for impossible scenarios
- Holiday calculation spreads evenly (may not match reality)
- Need better tooltips explaining burden assumptions











