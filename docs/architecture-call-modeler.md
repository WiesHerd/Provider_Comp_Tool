# Call Pay Modeler Architecture

## Overview

The Call Pay Modeler is a comprehensive system for modeling physician call pay compensation. It supports two modes: **Quick Budget** (fast assumptions-based calculations) and **Advanced Mode** (roster + schedule context with burden/fairness analysis).

---

## Table of Contents

1. [Routes & Screens](#routes--screens)
2. [Core Data Types](#core-data-types)
3. [State Management](#state-management)
4. [Main User Flows](#main-user-flows)
5. [Key Utilities & Engines](#key-utilities--engines)
6. [Happy Path Walkthrough](#happy-path-walkthrough)

---

## Routes & Screens

### 1. Program Catalog (`/call-programs`)

**File:** `app/call-programs/page.tsx`

**Components:**
- `CallProgramList` - Lists all call programs with create/edit/delete
- `ShiftTypeList` - Lists all shift types with create/edit/delete

**Features:**
- Tabbed interface for Programs and Shift Types
- Set active program (stored in user preferences)
- Soft delete support (isDeleted flag)

**State:** Managed by `useProgramCatalogStore` (Zustand)

**Storage:** `localStorage` via `storageClient.ts`

---

### 2. Call Pay Modeler (`/call-pay-modeler`)

**File:** `app/call-pay-modeler/page.tsx`

**Mode Selector:**
- **Quick Budget Mode** - Fast assumptions-based modeling
  - Simple inputs for provider count/FTE and assumptions
  - Uses `calculateCallBudget` engine
  - Shows budget summary and FMV overlay
  - No roster or schedule required

- **Advanced Mode** - Full roster + schedule context
  - Requires active Call Program
  - Shows Provider Roster
  - Uses schedule generation & templates
  - Shows burden/fairness analysis
  - Shows FMV panel with risk & narrative
  - Exposes scenario save/load/compare

**Key Components:**
- `ContextCard` - Program/specialty context inputs
- `TierCard` - Call tier configuration (rates, burden)
- `ImpactSummary` - Budget results display
- `ProviderRoster` - Provider management (Advanced mode)
- `BurdenFairnessPanel` - Burden analysis (Advanced mode)
- `FMVPanel` - FMV evaluation display
- `ScenarioComparisonTable` - Compare multiple scenarios
- `ProgramSelector` - Select/switch active program

**State Management:**
- Local component state for context, tiers, roster
- `useUserPreferencesStore` for activeProgramId and modelingMode
- `useCallPayScenariosStore` for scenarios
- `useProgramCatalogStore` for program catalog

**Auto-save:** Draft state saved to localStorage (debounced)

---

### 3. Scenarios (`/scenarios`)

**File:** `app/scenarios/page.tsx`

**Features:**
- Lists all saved scenarios (both ProviderScenario and CallScenario formats)
- Scenario cards with metadata
- Load scenario into modeler
- Delete scenarios

**Note:** This is a general scenarios page. Call Pay scenarios are also accessible from the modeler page.

---

## Core Data Types

### Engine Types (`types/call-pay-engine.ts`)

**CallProgram** (Engine-level)
```typescript
{
  modelYear: number;
  specialty: string;
  serviceLine?: string;
  providersOnCall: number;
  rotationRatio?: string; // "1-in-4"
}
```

**CallProvider**
```typescript
{
  id: string;
  name?: string;
  fte: number;
  tierId: string;
  eligibleForCall: boolean;
  startMonth?: number;
  endMonth?: number;
}
```

**CallTier**
```typescript
{
  id: string; // "C1", "C2", etc.
  coverageType: "In-house" | "Home-call" | string;
  paymentMethod: "Daily" | "Shift" | "Per call" | string;
  baseRate: number;
  weekendUpliftPct?: number;
  holidayUpliftPct?: number;
  traumaUpliftPct?: number;
  enabled?: boolean;
}
```

**CallAssumptions**
```typescript
{
  weekdayCallsPerMonth: number; // group-level
  weekendCallsPerMonth: number;
  holidaysPerYear: number;
  benefitLoadPct?: number;
}
```

**BudgetResult**
```typescript
{
  totalAnnualCallBudget: number;
  avgCallPayPerProvider: number;
  callPayPerFTE: number;
  effectivePer24h: number;
  effectivePerCall: number;
  debug?: any;
}
```

---

### Catalog Types (`types/call-program.ts`)

**CallProgram** (Catalog-level)
```typescript
{
  id: string;
  name: string;
  specialty: string;
  serviceLine?: string;
  site?: string;
  modelYear: number;
  coverageType: CoverageType;
  shiftTypeIds: string[];
  defaultAssumptions: CallAssumptions;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}
```

**ShiftType**
```typescript
{
  id: string;
  name: string;
  code: string;
  coverageType: CoverageType;
  startTime: string; // "17:00"
  endTime: string; // "07:00"
  isWeekendEligible: boolean;
  isHolidayEligible: boolean;
  countsTowardBurden: boolean;
  isBackupShift?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}
```

---

### UI Types (`types/call-pay.ts`)

**CallPayContext**
```typescript
{
  specialty: Specialty | string;
  serviceLine: string;
  providersOnCall: number;
  rotationRatio: number; // 1-in-N format (number)
  modelYear: number;
  complianceMetadata?: ComplianceMetadata;
}
```

**CallTier** (UI version - extends engine CallTier with UI-specific fields)
```typescript
{
  id: string;
  name: string;
  coverageType: CoverageType;
  paymentMethod: PaymentMethod;
  rates: CallTierRate;
  burden: CallTierBurden;
  enabled: boolean;
  riskAdjustment?: RiskAdjustmentFactors;
}
```

**ModelingMode**
```typescript
type ModelingMode = "quick" | "advanced";
```

---

### Scenario Types (`types/call-scenarios.ts`)

**CallScenario**
```typescript
{
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Snapshotted inputs
  program: CallProgram; // engine version
  providers: CallProvider[];
  tiers: EngineCallTier[];
  assumptions: CallAssumptions;
  
  // UI state (for restoration)
  context: CallPayContext;
  uiTiers: UICallTier[];
  
  // Cached outputs
  budgetResult: BudgetResult;
  burdenSummary?: FairnessSummary;
  fmvSummary?: {
    riskLevel: FMVRiskLevel;
    percentileEstimate?: number;
    effectiveRatePer24h: number;
  };
}
```

**ScenarioComparison**
```typescript
{
  id: string;
  name: string;
  totalCallBudget: number;
  callPayPerFTE: number;
  fairnessScore: number;
  fmvRiskLevel: FMVRiskLevel | 'N/A';
  effectiveRatePer24h: number;
  updatedAt: string;
}
```

---

### Schedule Types (`types/call-schedule.ts`)

**CallSchedule**
```typescript
{
  year: number;
  assignments: CallDayAssignment[]; // one per day of year
}
```

**CallDayAssignment**
```typescript
{
  date: Date;
  type: "weekday" | "weekend" | "holiday";
  tierAssignments: TierAssignment[];
}
```

**TierAssignment**
```typescript
{
  providerId: string;
  tierId: string;
}
```

**Note:** MonthlyScheduleTemplate is not explicitly defined as a separate type, but schedule generation supports month-based views through `CallSchedule.assignments` filtered by month.

---

### FMV Types (`types/fmv.ts`)

**FMVBenchmark**
```typescript
{
  id: string;
  specialty: string;
  coverageType: string;
  source: FMVSource; // "SC" | "MGMA" | "ECG" | "Gallagher" | "Other"
  surveyYear: number;
  medianRatePer24h: number;
  p25RatePer24h?: number;
  p75RatePer24h?: number;
  p90RatePer24h?: number;
}
```

**FMVEvaluationResult**
```typescript
{
  benchmark?: FMVBenchmark;
  percentileEstimate?: number; // 0-100
  riskLevel: FMVRiskLevel; // "LOW" | "MODERATE" | "HIGH"
  notes: string[];
  narrativeSummary: string;
}
```

---

## State Management

### Program Catalog Store (`lib/store/program-catalog-store.ts`)

**State:**
- `programs: CallProgram[]`
- `shiftTypes: ShiftType[]`

**Actions:**
- `loadInitialData()` - Load from storage
- `addProgram`, `updateProgram`, `deleteProgram`, `getProgram`
- `addShiftType`, `updateShiftType`, `deleteShiftType`, `getShiftType`

**Storage:** `localStorage` via `storageClient.loadProgramCatalog()`

---

### User Preferences Store (`lib/store/user-preferences-store.ts`)

**State:**
- `activeProgramId: string | null`
- `modelingMode: ModelingMode` ("quick" | "advanced")

**Actions:**
- `setActiveProgram(programId)`
- `setModelingMode(mode)`
- `loadPreferences()` - Load from storage

**Storage:** `localStorage` via `storageClient.loadUserPrefs()`

---

### Call Pay Scenarios Store (`lib/store/call-pay-scenarios-store.ts`)

**State:**
- `scenarios: CallScenario[]`
- `activeScenarioId: string | null`

**Actions:**
- `loadScenarios()` - Load from storage
- `saveScenario(scenario)` - Save/update scenario
- `updateScenario(id, updates)`
- `deleteScenario(id)`
- `setActiveScenario(id)`
- `getScenario(id)`
- `getComparisonData()` - Generate comparison metrics

**Storage:** `localStorage` via `storageClient.loadCallPayScenarios()`

**Note:** Also maintains compatibility with ProviderScenario format for backward compatibility.

---

## Main User Flows

### Flow 1: Quick Budget Mode

1. User navigates to `/call-pay-modeler`
2. Mode defaults to "quick" (or loads from preferences)
3. User optionally selects a Call Program (via ProgramSelector)
   - If selected, program context pre-populates (specialty, assumptions)
4. User configures:
   - Context: specialty, service line, providers on call, rotation ratio
   - Tiers: rates (weekday/weekend/holiday), burden assumptions
5. Engine calculates budget (`calculateCallBudget`)
6. Results displayed in `ImpactSummary`:
   - Total annual call budget
   - Call pay per FTE
   - Effective $/24h
7. FMV evaluation runs automatically:
   - `evaluateFMV` finds matching benchmark
   - Calculates percentile estimate
   - Determines risk level (LOW/MODERATE/HIGH)
   - Generates narrative summary
8. User can save as scenario (optional)

**Key Functions:**
- `mapCallPayStateToEngineInputs` - Converts UI state to engine inputs
- `calculateCallBudget` - Core calculation engine
- `evaluateFMV` - FMV evaluation

---

### Flow 2: Advanced Mode

1. User navigates to `/call-pay-modeler`
2. User must have an active Call Program (or switch to Quick Mode)
3. User switches to "Advanced Mode"
4. System loads active program context:
   - `mapCatalogProgramToContext` - Maps program to UI context
   - `getDefaultAssumptionsFromProgram` - Loads assumptions
   - Assumptions applied to tiers if burden is empty
5. User configures Provider Roster:
   - Auto-generated based on `providersOnCall`
   - Can edit FTE, tier assignment, eligibility
6. User can generate schedule:
   - `generateCallSchedule` - Creates year-long schedule
   - FTE-weighted round-robin assignment
   - Evenly distributes calls across weekday/weekend/holiday
7. Burden analysis:
   - `calculateExpectedBurden` - Expected calls per provider (FTE-weighted)
   - `calculateFairnessMetrics` - Group fairness score
   - `calculateBurdenFromSchedule` - Actual burden from schedule (if schedule exists)
8. FMV evaluation (same as Quick Mode)
9. User can save scenario with full state snapshot

**Key Functions:**
- `generateCallSchedule` - Schedule generation
- `calculateExpectedBurden` - Expected burden calculation
- `calculateFairnessMetrics` - Fairness scoring
- `calculateBurdenFromSchedule` - Schedule-based burden

---

### Flow 3: Scenario Management

1. User saves current model as scenario:
   - `createScenarioFromCurrentState` - Creates snapshot
   - Calculates budget, burden, FMV at save time
   - Stores in `useCallPayScenariosStore`
2. User loads scenario:
   - `hydrateStateFromScenario` - Restores UI state
   - Sets scenarioLoaded flag (prevents draft overwrite)
3. User compares scenarios:
   - `getComparisonData()` - Generates comparison metrics
   - `ScenarioComparisonTable` displays side-by-side
4. User can export comparison report (if implemented)

**Key Functions:**
- `createScenarioFromCurrentState` - Scenario creation
- `hydrateStateFromScenario` - Scenario restoration
- `getComparisonData` - Comparison metrics

---

### Flow 4: Program Catalog Management

1. User navigates to `/call-programs`
2. User creates/edits Call Programs:
   - Sets name, specialty, site, model year
   - Selects coverage type
   - Links shift types
   - Sets default assumptions
3. User creates/edits Shift Types:
   - Defines shift patterns (start/end time)
   - Sets eligibility flags (weekend/holiday)
   - Sets burden flags
4. User sets active program:
   - Stored in `useUserPreferencesStore`
   - Used by modeler to pre-populate context

---

## Key Utilities & Engines

### Calculation Engine (`lib/utils/call-pay-engine.ts`)

**`calculateCallBudget(program, providers, tiers, assumptions): BudgetResult`**
- Pure function for call budget calculation
- Handles tier uplifts (weekend, holiday, trauma)
- Distributes calls across providers
- Returns comprehensive budget metrics

**Phase 1 Implementation:**
- Single active tier (first enabled tier)
- Simple call distribution
- Basic rate calculations

**Future Phases:**
- Multi-tier support
- Sophisticated call distribution
- Provider-specific FTE weighting

---

### Adapter Layer (`lib/utils/call-pay-adapter.ts`)

**`mapCallPayStateToEngineInputs(context, tiers, providers): EngineInputs`**
- Converts UI state to engine inputs
- Maps UI CallTier to engine CallTier
- Extracts assumptions from tier burden
- Builds engine CallProgram from context

**`mapCatalogProgramToContext(catalogProgram, providersOnCall, rotationRatio): CallPayContext`**
- Maps catalog CallProgram to UI context
- Used when loading active program

**`getDefaultAssumptionsFromProgram(catalogProgram): CallAssumptions`**
- Extracts default assumptions from catalog program

---

### Burden Calculations (`lib/utils/burden-calculations.ts`)

**`calculateExpectedBurden(providers, assumptions): ProviderBurdenResult[]`**
- Calculates expected call burden per provider
- FTE-weighted distribution
- Returns per-provider expected calls

**`calculateFairnessMetrics(burdenResults): FairnessSummary`**
- Calculates group-level fairness metrics
- Standard deviation, coefficient of variation
- Fairness score (0-100)

---

### Schedule Generation (`lib/utils/call-schedule-generator.ts`)

**`generateCallSchedule(options): CallSchedule`**
- Generates year-long call schedule
- FTE-weighted round-robin assignment
- Evenly distributes calls across day types

**`calculateBurdenFromSchedule(schedule, providers): { results, summary }`**
- Calculates actual burden from schedule
- Compares to expected burden
- Returns schedule-based fairness metrics

**`generateBaseCalendar(year, holidays): CallDayAssignment[]`**
- Creates base calendar with day types
- Marks holidays, weekends, weekdays

---

### FMV Evaluation (`lib/utils/fmv-evaluator.ts`)

**`evaluateFMV(input): FMVEvaluationResult`**
- Finds matching benchmark by specialty/coverage type
- Estimates percentile position
- Determines risk level
- Generates narrative summary

**`findBestMatchingBenchmark(specialty, coverageType): FMVBenchmark | undefined`**
- Searches benchmark data
- Returns best match

**`buildFMVNarrative(result, input): string`**
- Generates 2-5 sentence justification paragraph
- Includes benchmark context and risk assessment

---

### Scenario Utilities (`lib/utils/call-pay-scenario-utils.ts`)

**`createScenarioFromCurrentState(name, context, tiers, providers, existingId?): CallScenario`**
- Creates complete scenario snapshot
- Calculates budget, burden, FMV at save time
- Stores both engine and UI state

**`hydrateStateFromScenario(scenario): { context, tiers, providers }`**
- Restores UI state from scenario
- Used when loading scenario into modeler

---

## Happy Path Walkthrough

### Example: Creating a Pediatric Cardiology Call Program

1. **Create Program**
   - Navigate to `/call-programs`
   - Click "Create Program"
   - Enter:
     - Name: "Pediatric Cardiology Call 2026"
     - Specialty: "Cardiology"
     - Site: "Main Hospital"
     - Model Year: 2026
     - Coverage Type: "In-house"
   - Set default assumptions:
     - Weekday calls/month: 15
     - Weekend calls/month: 4
     - Holidays/year: 10
   - Save program

2. **Set Active Program**
   - Click "Set as Active" on the program
   - Program ID stored in user preferences

3. **Open Modeler**
   - Navigate to `/call-pay-modeler`
   - Program context pre-populates:
     - Specialty: "Cardiology"
     - Assumptions applied to first tier

4. **Quick Mode - Initial Budget**
   - Mode: Quick Budget (default)
   - Configure tier:
     - Weekday rate: $500
     - Weekend rate: $600 (or 20% uplift)
     - Holiday rate: $700 (or 40% uplift)
   - View results:
     - Total annual budget: ~$237,600
     - Call pay per FTE: ~$29,700
     - Effective $/24h: ~$500
   - View FMV:
     - Risk: LOW
     - Percentile: ~50th
     - Narrative: "Rates align with market..."

5. **Switch to Advanced Mode**
   - Click "Advanced Mode" button
   - System validates active program exists ✓
   - Provider Roster appears:
     - 8 providers (from providersOnCall)
     - All 1.0 FTE, eligible
   - Configure roster:
     - Adjust FTE for part-time providers
     - Assign tier assignments

6. **Generate Schedule**
   - Click "Generate Schedule"
   - System generates year-long schedule:
     - FTE-weighted assignments
     - Evenly distributed calls
   - View schedule in calendar view

7. **Burden Analysis**
   - View Burden/Fairness Panel:
     - Expected calls per provider
     - Fairness score: 95/100
     - Standard deviation: 2.3 calls
   - Compare expected vs actual (if schedule exists)

8. **Save Scenario**
   - Click "Save Scenario"
   - Enter name: "Current 2026"
   - Scenario saved with:
     - Full state snapshot
     - Cached budget, burden, FMV results

9. **Create Alternative Scenario**
   - Adjust tier rates: +10%
   - Save as: "Proposed +10%"
   - System calculates new budget

10. **Compare Scenarios**
    - View Scenario Comparison Table:
      - Current 2026: $237,600
      - Proposed +10%: $261,360
      - Fairness scores, FMV risk levels
    - Export comparison report (if implemented)

---

## Architecture Notes

### Type System

The system uses **two versions** of `CallProgram`:
- **Catalog version** (`types/call-program.ts`) - Full program definition with metadata
- **Engine version** (`types/call-pay-engine.ts`) - Minimal program data for calculations

**Adapter functions** bridge between these:
- `mapCatalogProgramToEngineProgram` - Catalog → Engine
- `mapCatalogProgramToContext` - Catalog → UI Context

### Mode Separation

**Quick Mode:**
- No roster required
- Simple assumptions-based calculation
- FMV evaluation only

**Advanced Mode:**
- Requires active program
- Full roster management
- Schedule generation
- Burden/fairness analysis
- Full FMV evaluation

### Storage Strategy

- **localStorage** for all persistence (no external APIs)
- **Debounced auto-save** for draft state
- **Scenario snapshots** include computed results (no recalculation on load)
- **Backward compatibility** maintained with ProviderScenario format

### Future Work

1. **Schedule Template View** - Dedicated monthly schedule template editor
2. **Program Detail Editor** - Tabbed program editor with schedule config
3. **Multi-tier Support** - Phase 2 engine enhancements
4. **Report Export** - PDF/DOCX export for scenarios and comparisons
5. **External API Integration** - Replace localStorage with backend

---

## Testing

Key test files:
- `lib/utils/__tests__/call-pay-engine.test.ts` - Engine calculation tests
- `lib/utils/__tests__/burden-calculations.test.ts` - Burden calculation tests
- `lib/utils/__tests__/fmv-evaluator.test.ts` - FMV evaluation tests
- `lib/utils/__tests__/call-pay-adapter.test.ts` - Adapter tests
- `lib/utils/__tests__/call-schedule-generator.test.ts` - Schedule generation tests

All pure functions should have unit tests. Integration tests cover end-to-end flows.

