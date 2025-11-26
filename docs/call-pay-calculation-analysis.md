# Call Pay Calculation Analysis - Consultant Review

## How It Should Work (Industry Standard)

### Key Concepts:
1. **Burden Assumptions**: Represent TOTAL calls/shifts needed per month for the service
2. **Rotation Ratio (1-in-N)**: Distributes the burden among N providers
3. **Annual Budget**: Total cost to cover all call needs for the year

### Example Scenario:
**Cardiology Service:**
- Needs 15 weekday calls/month + 4 weekend calls/month
- 8 providers on call roster
- 1-in-4 rotation (each provider covers 1/4 of calls)
- Daily rate: $500 weekday, $600 weekend

**Calculation:**
- Monthly burden: 15 weekday + 4 weekend = 19 total calls/month
- Per provider (with 1-in-4): 19/4 = 4.75 calls/month
- Monthly pay per provider: (15/4 × $500) + (4/4 × $600) = $1,875 + $600 = $2,475
- Annual per provider: $2,475 × 12 = $29,700
- **Total Annual Budget**: $29,700 × 8 providers = $237,600

## Current Implementation Issues:

1. ✅ Rotation ratio logic appears correct (divides annual by ratio)
2. ❌ **CRITICAL**: Group budget calculation multiplies per-provider pay by total providers, but should account for rotation
3. ❌ Missing validation for impossible scenarios
4. ❌ Trauma uplift timing - should apply before or after rotation?
5. ❌ Holiday calculation spreads evenly, but holidays aren't evenly distributed

## Recommended Fixes:

1. **Group Budget**: Should be: `annualPayPerProvider × providersOnCall` (current is correct)
2. **Add validation**: Max weekday calls ≤ 22 (business days), weekend ≤ 8-9
3. **Clarify burden**: Add tooltip explaining burden = total service needs
4. **Holiday distribution**: Consider per-holiday rate vs. monthly average









