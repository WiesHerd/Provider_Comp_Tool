# Call Pay & Coverage Modeler - User Guide

## How It Works - Consultant Perspective

### Purpose
This tool helps compensation administrators and physician leaders model annual call pay budgets for different specialties and coverage structures. It calculates:
- **Per-provider annual call pay** (what each physician receives)
- **Total annual call budget** (what the organization needs to budget)
- **Effective rates** ($/24h, $/call) for benchmarking

### Key Concepts

#### 1. Burden Assumptions
These represent the **TOTAL** calls/shifts needed per month for the service line, NOT per provider.

**Example:**
- If your cardiology service needs 15 weekday calls covered per month
- Enter "15" in "Weekday Calls/Shifts per Month"
- This is the total service need, not per provider

#### 2. Rotation Ratio (1-in-N)
This distributes the burden among providers:
- **1-in-4** means each provider covers 1/4 of the total calls
- If burden is 15 calls/month and rotation is 1-in-4:
  - Each provider covers: 15 ÷ 4 = 3.75 calls/month
  - Each provider gets paid for 3.75 calls

#### 3. Annual Budget Calculation

**Step 1:** Calculate monthly pay per provider
- Based on payment method and burden
- Adjusted for rotation ratio

**Step 2:** Annualize
- Monthly pay × 12 = Annual pay per provider

**Step 3:** Total Group Budget
- Annual pay per provider × Number of providers on call roster
- This is your **Total Annual Call Budget**

### Example Scenarios

#### Scenario A: Cardiology - Daily Rate Model
**Setup:**
- Specialty: Cardiology
- Providers: 8
- Rotation: 1-in-4
- Tier C1: Daily/shift rate
  - Weekday: $500
  - Weekend: $600
  - Weekday calls/month: 15
  - Weekend calls/month: 4

**Calculation:**
- Monthly per provider: (15/4 × $500) + (4/4 × $600) = $1,875 + $600 = $2,475
- Annual per provider: $2,475 × 12 = $29,700
- **Total Annual Budget: $29,700 × 8 = $237,600**

#### Scenario B: Anesthesiology - Annual Stipend
**Setup:**
- Providers: 12
- Rotation: 1-in-6
- Tier C1: Annual stipend $60,000

**Calculation:**
- Annual per provider: $60,000 ÷ 6 = $10,000
- **Total Annual Budget: $10,000 × 12 = $120,000**

#### Scenario C: Multi-Tier Model
**Setup:**
- General Surgery with C1 (Trauma) and C2 (General)
- Each tier calculated separately
- **Total Budget = Sum of all tier budgets**

### Payment Methods Explained

1. **Daily/Shift Rate**: Pay per 24-hour call period
2. **Hourly Rate**: Pay per hour (assumes 24-hour shifts)
3. **Annual Stipend**: Fixed annual amount (already annualized)
4. **Monthly Retainer**: Fixed monthly amount
5. **Per Procedure**: Pay per procedure performed
6. **Per wRVU**: Pay per wRVU generated

### What Gets Calculated

For each enabled tier:
- **Annual Pay per Provider**: What each physician receives
- **Annual Pay for Group**: Budget needed for this tier
- **Effective $/24h**: Cost per 24-hour period
- **Effective $/call**: Cost per callback

Combined metrics:
- **Total Annual Call Spend**: Sum of all tier budgets (YOUR BUDGET NUMBER)
- **Average Call Pay per Provider**: Average across all tiers
- **Call Pay per 1.0 FTE**: Normalized for FTE comparison

### Best Practices

1. **Start with one tier** to understand the calculations
2. **Verify burden assumptions** match your actual call coverage needs
3. **Check rotation ratio** matches your call schedule
4. **Review Total Annual Call Spend** - this is your budget number
5. **Use FMV benchmarks** to validate rates are market-appropriate

### Common Mistakes to Avoid

1. ❌ Entering per-provider burden instead of total service burden
2. ❌ Forgetting to enable tiers before calculating
3. ❌ Mismatched rotation ratio (e.g., 1-in-4 but only 3 providers)
4. ❌ Not accounting for all coverage types (weekday + weekend + holiday)















