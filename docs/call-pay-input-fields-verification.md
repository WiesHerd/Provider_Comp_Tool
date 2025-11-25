# Call Pay Input Fields Comprehensive Verification

## Test Date: Current
## Purpose: Verify all 24 combinations (4 Coverage Types × 6 Payment Methods) have required input fields

---

## Summary of Findings

### ✅ PASSING: 5 Payment Methods
1. Annual Stipend - ✅ Complete
2. Daily / Shift Rate - ✅ Complete  
3. Hourly Rate - ✅ Complete
4. Monthly Retainer - ✅ Complete
5. Per Procedure - ✅ Complete

### ⚠️ NEEDS CLARIFICATION: 1 Payment Method
6. Per wRVU - ⚠️ Field labeling ambiguity

---

## Detailed Analysis by Payment Method

### 1. Annual Stipend

**Coverage Types Tested:** All 4 (In-house, Restricted home, Unrestricted home, Backup only)

**UI Fields Shown:**
- ✅ Annual Stipend input (uses `rates.weekday`)
- ❌ No burden fields (correct - not needed)

**Calculation Logic Requirements:**
- `rates.weekday` only

**Status:** ✅ **PASS** - All required fields present, calculation works

**Verification:**
```typescript
// Calculation uses only rates.weekday
monthlyPay = rates.weekday / 12;
```

---

### 2. Daily / Shift Rate

**Coverage Types Tested:** All 4

**UI Fields Shown:**
- ✅ Weekday Rate (Base Rate)
- ✅ Weekend Rate (manual or percentage-based)
- ✅ Holiday Rate (manual or percentage-based)
- ✅ Optional: Trauma uplift toggle
- ✅ Weekday Calls per Month
- ✅ Weekend Calls per Month
- ✅ Holidays Covered per Year

**Calculation Logic Requirements:**
- `rates.weekday`
- `rates.weekend`
- `rates.holiday`
- `burden.weekdayCallsPerMonth`
- `burden.weekendCallsPerMonth`
- `burden.holidaysPerYear`

**Status:** ✅ **PASS** - All required fields present, calculation works

**Verification:**
```typescript
const weekdayMonthly = burden.weekdayCallsPerMonth * rates.weekday;
const weekendMonthly = burden.weekendCallsPerMonth * rates.weekend;
const holidayMonthly = (burden.holidaysPerYear / 12) * rates.holiday;
monthlyPay = weekdayMonthly + weekendMonthly + holidayMonthly;
```

---

### 3. Hourly Rate

**Coverage Types Tested:** All 4

**UI Fields Shown:**
- ✅ Weekday Rate (Base Rate)
- ✅ Weekend Rate (manual or percentage-based)
- ✅ Holiday Rate (manual or percentage-based)
- ✅ Optional: Trauma uplift toggle
- ✅ Weekday Calls per Month
- ✅ Weekend Calls per Month
- ✅ Holidays Covered per Year

**Calculation Logic Requirements:**
- `rates.weekday`
- `rates.weekend`
- `rates.holiday`
- `burden.weekdayCallsPerMonth`
- `burden.weekendCallsPerMonth`
- `burden.holidaysPerYear`

**Status:** ✅ **PASS** - All required fields present, calculation works

**Verification:**
```typescript
const weekdayHours = burden.weekdayCallsPerMonth * 24 * rates.weekday;
const weekendHours = burden.weekendCallsPerMonth * 24 * rates.weekend;
const holidayHours = (burden.holidaysPerYear / 12) * 24 * rates.holiday;
monthlyPay = weekdayHours + weekendHours + holidayHours;
```

---

### 4. Monthly Retainer

**Coverage Types Tested:** All 4

**UI Fields Shown:**
- ✅ Monthly Retainer input (uses `rates.weekday`)
- ❌ No burden fields (correct - not needed)

**Calculation Logic Requirements:**
- `rates.weekday` only

**Status:** ✅ **PASS** - All required fields present, calculation works

**Verification:**
```typescript
monthlyPay = rates.weekday; // Base monthly retainer
```

---

### 5. Per Procedure

**Coverage Types Tested:** All 4

**UI Fields Shown:**
- ✅ Rate per Procedure (Base Rate) - uses `rates.weekday`
- ✅ Optional: Weekend Rate (if differentiated rates enabled)
- ✅ Optional: Holiday Rate (if differentiated rates enabled)
- ✅ Weekday Calls per Month
- ✅ Weekend Calls per Month
- ✅ Holidays Covered per Year
- ✅ Avg Callbacks per 24h
- ✅ Avg Cases per 24h (for procedural specialties)

**Calculation Logic Requirements:**
- `rates.weekday` (required)
- `rates.weekend` (optional, falls back to weekday)
- `rates.holiday` (optional, falls back to weekday)
- `burden.weekdayCallsPerMonth`
- `burden.weekendCallsPerMonth`
- `burden.holidaysPerYear`
- `burden.avgCasesPer24h` OR `burden.avgCallbacksPer24h` (at least one required)

**Status:** ✅ **PASS** - All required fields present, optional fields work correctly

**Verification:**
```typescript
const avgCasesPerCall = burden.avgCasesPer24h || burden.avgCallbacksPer24h;
const weekdayCasesPerMonth = avgCasesPerCall * burden.weekdayCallsPerMonth;
const weekdayProcedurePay = weekdayCasesPerMonth * rates.weekday;
// Weekend and holiday use optional rates or fall back to weekday
```

**Note:** Calculation correctly handles optional weekend/holiday rates with fallback logic.

---

### 6. Per wRVU ⚠️

**Coverage Types Tested:** All 4

**UI Fields Shown:**
- ✅ Rate per wRVU (Base Rate) - uses `rates.weekday`
- ✅ Optional: Weekend Rate (if differentiated rates enabled)
- ✅ Optional: Holiday Rate (if differentiated rates enabled)
- ✅ Weekday Calls per Month
- ✅ Weekend Calls per Month
- ✅ Holidays Covered per Year
- ✅ Avg Callbacks per 24h
- ✅ Avg Cases per 24h (for procedural specialties)

**Calculation Logic Requirements:**
- `rates.weekday` (required)
- `rates.weekend` (optional, falls back to weekday)
- `rates.holiday` (optional, falls back to weekday)
- `burden.weekdayCallsPerMonth`
- `burden.weekendCallsPerMonth`
- `burden.holidaysPerYear`
- `burden.avgCasesPer24h` OR `burden.avgCallbacksPer24h` (used as wRVU proxy)

**Status:** ⚠️ **NEEDS CLARIFICATION** - Fields present but labeling is ambiguous

**Issue Identified:**
The calculation uses `avgCasesPer24h` or `avgCallbacksPer24h` as a direct proxy for wRVUs:
```typescript
const avgWrvusPerCall = burden.avgCasesPer24h || burden.avgCallbacksPer24h;
```

**Questions:**
1. Should the field be labeled "Avg wRVUs per 24h" instead of "Avg Cases per 24h"?
2. Or should there be a separate field for "Average wRVUs per case/callback"?
3. Is the current approach acceptable (user enters wRVU value in the cases field)?

**Current Behavior:**
- System treats `avgCasesPer24h` or `avgCallbacksPer24h` as if it represents wRVUs directly
- Assumes: 1 case/callback = 1 wRVU (or user enters wRVU value in cases field)
- This may be confusing for hospital administrators

**Recommendation:**
- Option A: Rename field to "Avg wRVUs per 24h" for Per wRVU payment method
- Option B: Add separate field "Avg wRVUs per case/callback" and multiply
- Option C: Add tooltip clarifying that user should enter wRVU value in cases field

---

## Coverage Type Impact Analysis

**Finding:** Coverage type does NOT affect calculations.

**Current Implementation:**
- Coverage type is stored in `tier.coverageType`
- Coverage type is NOT used in any calculation logic
- All calculations are identical regardless of coverage type selection

**Question:** Is this intentional?
- If coverage type should affect rates/burden, business logic needs to be defined
- If coverage type is purely informational, current implementation is correct

**Recommendation:** Document that coverage type is informational only, or define business rules if it should affect calculations.

---

## Edge Cases Verified

### Zero Values
- ✅ All payment methods handle zero values correctly
- ✅ Calculations don't break with zero inputs

### Missing Optional Fields
- ✅ Per Procedure: Falls back to weekday rate if weekend/holiday rates not provided
- ✅ Per wRVU: Falls back to weekday rate if weekend/holiday rates not provided
- ✅ All optional fields have proper fallback logic

### Empty Burden Fields
- ✅ Calculation logic handles empty/zero burden fields
- ✅ Results are zero when appropriate

---

## Test Results Summary

| Payment Method | Coverage Types | Required Fields | Optional Fields | Calculation | Status |
|---------------|----------------|-----------------|-----------------|-------------|--------|
| Annual Stipend | All 4 | ✅ 1 rate | ❌ None | ✅ Works | ✅ PASS |
| Daily/Shift Rate | All 4 | ✅ 3 rates, 3 burden | ✅ Trauma uplift | ✅ Works | ✅ PASS |
| Hourly Rate | All 4 | ✅ 3 rates, 3 burden | ✅ Trauma uplift | ✅ Works | ✅ PASS |
| Monthly Retainer | All 4 | ✅ 1 rate | ❌ None | ✅ Works | ✅ PASS |
| Per Procedure | All 4 | ✅ 1 rate, 4 burden | ✅ 2 rates, 1 burden | ✅ Works | ✅ PASS |
| Per wRVU | All 4 | ✅ 1 rate, 4 burden | ✅ 2 rates, 1 burden | ✅ Works | ⚠️ CLARIFY |

---

## Recommendations

1. **Immediate:** Clarify Per wRVU field labeling or add separate wRVU field
2. **Documentation:** Add tooltip/help text explaining wRVU calculation method
3. **Coverage Type:** Document whether coverage type should affect calculations
4. **Validation:** Consider adding validation to ensure required burden fields are > 0 for methods that need them

---

## Conclusion

**Overall Status:** ✅ **5 of 6 payment methods are complete and verified**

**Remaining Work:**
- Clarify Per wRVU field labeling/calculation method
- Document coverage type purpose (informational vs. calculation impact)

**All 24 combinations (4 coverage types × 6 payment methods) can calculate annual call budget, with the exception of potential confusion around Per wRVU field labeling.**

