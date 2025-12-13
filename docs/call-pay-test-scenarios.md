# Call Pay & Coverage Modeler - Test Scenarios

## Consultant Perspective: Gallagher/SullivanCotter Testing

### Scenario 1: Cardiology - Daily/Shift Rate Model
**Context:**
- Specialty: Cardiology
- Providers: 8
- Rotation: 1-in-4
- Service Line: Cardiac Surgery

**Tier C1 (Primary Call):**
- Coverage: In-house
- Payment: Daily/shift rate
- Weekday: $500/shift
- Weekend: $600/shift  
- Holiday: $800/shift
- Weekday calls/month: 15
- Weekend calls/month: 4
- Holidays/year: 8
- Avg callbacks/24h: 2.5

**Expected Calculation:**
- Monthly: (15 × $500) + (4 × $600) + (8/12 × $800) = $7,500 + $2,400 + $533 = $10,433
- Annual per provider (before rotation): $10,433 × 12 = $125,196
- With 1-in-4 rotation: $125,196 / 4 = $31,299 per provider
- Total group budget: $31,299 × 8 = $250,392

### Scenario 2: Anesthesiology - Annual Stipend
**Context:**
- Specialty: Anesthesiology
- Providers: 12
- Rotation: 1-in-6

**Tier C1:**
- Payment: Annual stipend
- Stipend: $60,000/year
- With 1-in-6 rotation: $60,000 / 6 = $10,000 per provider
- Total group budget: $10,000 × 12 = $120,000

### Scenario 3: Multi-Tier Model (General Surgery)
**Context:**
- Specialty: General Surgery
- Providers: 10
- Rotation: 1-in-5

**Tier C1 (Trauma):**
- Daily rate: $800/weekday, $1,000/weekend
- Weekday: 10/month, Weekend: 3/month
- Trauma uplift: 15%

**Tier C2 (General):**
- Daily rate: $400/weekday, $500/weekend
- Weekday: 12/month, Weekend: 4/month

**Expected:**
- C1 monthly: (10×$800 + 3×$1,000) × 1.15 = $12,650/month
- C1 annual: $12,650 × 12 / 5 = $30,360 per provider
- C2 monthly: (12×$400 + 4×$500) = $6,800/month
- C2 annual: $6,800 × 12 / 5 = $16,320 per provider
- Total per provider: $46,680
- Total group: $466,800

## Critical Issues Found:

1. **Rotation Ratio Logic**: Current implementation divides annual pay by rotation ratio, which may not be correct for all payment methods
2. **Group Budget**: Need to verify totalAnnualCallSpend calculation
3. **Trauma Uplift**: Should apply to base rates before calculating monthly totals
4. **Validation**: Missing validation for impossible scenarios (e.g., >31 weekday calls/month)




























