'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { loadDraftState, saveDraftState, DRAFT_SCREEN_IDS } from '@/lib/utils/draft-state-storage';
import { logger } from '@/lib/utils/logger';
import { useSearchParams } from 'next/navigation';
import { ProductivitySummary } from '@/components/wrvu-forecaster/productivity-summary';
import { ScenarioManager } from '@/components/wrvu-forecaster/scenario-manager';
import { PrintView } from '@/components/wrvu-forecaster/print-view';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario } from '@/types';
import { providerScenarioToWRVUForecasterScenario } from '@/lib/utils/wrvu-forecaster-converters';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  WRVUForecasterInputs,
  ProductivityMetrics,
  ShiftType,
  WRVUForecasterScenario,
  perWeekToDaysOfWeek,
} from '@/types/wrvu-forecaster';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FTEInput } from '@/components/wrvu/fte-input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, User, Stethoscope, ChevronDown, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientCalendarView } from '@/components/wrvu-forecaster/patient-calendar-view';
import {
  formatDateString,
  syncCalendarToNumbers,
  calculateTotalPatientsFromCalendar,
  replicateWeekTemplate,
  analyzeCalendarDataCoverage,
} from '@/lib/utils/calendar-helpers';
import { format } from 'date-fns';
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';

const STORAGE_KEY = 'wrvuForecasterState';
const SCREEN_ID = DRAFT_SCREEN_IDS.WRVU_FORECASTER;

// Always return default state to ensure consistent server/client rendering
// localStorage will be loaded after mount to avoid hydration mismatches
const getInitialState = (): WRVUForecasterInputs => {
  return getDefaultState();
};

// Load state from Firebase or localStorage after mount
const loadStateFromStorage = async (): Promise<WRVUForecasterInputs | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
        const savedState = await loadDraftState<any>(SCREEN_ID, STORAGE_KEY) as WRVUForecasterInputs | null;
    if (savedState) {
      // Ensure shifts have IDs
      if (savedState.shifts && savedState.shifts.length > 0 && !savedState.shifts[0].id) {
        savedState.shifts = savedState.shifts.map((shift: ShiftType, index: number) => ({
          ...shift,
          id: shift.id || `shift-${index}`,
        }));
      }
      // Migrate shifts without daysOfWeek to include daysOfWeek
      if (savedState.shifts && savedState.shifts.length > 0) {
        savedState.shifts = savedState.shifts.map((shift: ShiftType) => {
          if (!shift.daysOfWeek && shift.perWeek !== undefined) {
            return {
              ...shift,
              daysOfWeek: perWeekToDaysOfWeek(shift.perWeek),
            };
          }
          return shift;
        });
      }
      // Ensure calendar fields exist
      if (!savedState.dailyPatientCounts) savedState.dailyPatientCounts = {};
      if (!savedState.dailyHours) savedState.dailyHours = {};
      if (!savedState.vacationDates) savedState.vacationDates = [];
      if (!savedState.cmeDates) savedState.cmeDates = [];
      if (!savedState.statutoryHolidayDates) savedState.statutoryHolidayDates = [];
      // Normalize empty specialty to undefined for consistent Select rendering
      if (savedState.specialty === '') savedState.specialty = undefined;
      // Ensure FTE exists (default to 1.0)
      if (savedState.fte === undefined || savedState.fte === null) savedState.fte = 1.0;
      return savedState;
    }
  } catch (error) {
    logger.error('Error loading saved state:', error);
  }

  return null;
};

const SPECIALTIES = [
  // Primary Care / Hospital Medicine
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  // Procedural / Surgical
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  // Medical Subspecialties
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  // Other
  'Psychiatry',
  'Pathology',
  'Other',
];

// Results content component
function ResultsContent({
  inputs,
  metrics,
  onLoadScenario,
  onEmailReport,
  onPrint,
  onResetInputs,
  onGoToSetup,
}: {
  inputs: WRVUForecasterInputs;
  metrics: ProductivityMetrics;
  onLoadScenario: (scenario: WRVUForecasterScenario) => void;
  onEmailReport: () => void;
  onPrint: () => void;
  onResetInputs: () => void;
  onGoToSetup: () => void;
}) {
  const handleStartOver = () => {
    onResetInputs();
    onGoToSetup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-32 sm:pb-6">
      <div data-tour="forecaster-productivity">
        <ProductivitySummary metrics={metrics} inputs={inputs} />
      </div>

      <ScenarioManager
        inputs={inputs}
        metrics={metrics}
        onLoadScenario={onLoadScenario}
        onEmailReport={onEmailReport}
        onPrint={onPrint}
        onStartOver={handleStartOver}
      />
    </div>
  );
}

const getDefaultState = (): WRVUForecasterInputs => ({
  providerName: '',
  specialty: undefined,
  customSpecialty: '',
  fte: 1.0,
  vacationWeeks: 4,
  statutoryHolidays: 10,
  cmeDays: 5,
  shifts: [
    { id: 'shift-0', name: 'Regular Clinic', hours: 8, perWeek: 4, daysOfWeek: [1, 2, 3, 4] }, // Mon-Thu
    { id: 'shift-1', name: 'Extended Hours', hours: 10, perWeek: 1, daysOfWeek: [5] }, // Friday
  ],
  patientsPerHour: 2,
  patientsPerDay: 16,
  avgWRVUPerEncounter: 1.5,
  adjustedWRVUPerEncounter: 1.5,
  baseSalary: 150000,
  wrvuConversionFactor: 45.52,
  isPerHour: true,
  // Calendar fields
  dailyPatientCounts: {},
  dailyHours: {},
  vacationDates: [],
  cmeDates: [],
  statutoryHolidayDates: [],
});

function WRVUForecasterPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [inputs, setInputs] = useState<WRVUForecasterInputs>(getInitialState);
  const [isMounted, setIsMounted] = useState(false);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'input' | 'results'>('setup');
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    weeksWorkedPerYear: 0,
    annualClinicDays: 0,
    annualClinicalHours: 0,
    encountersPerWeek: 0,
    annualPatientEncounters: 0,
    estimatedAnnualWRVUs: 0,
    estimatedTotalCompensation: 0,
    wrvuCompensation: 0,
  });

  // Define handleLoadScenario before useEffects that use it
  const handleLoadScenario = useCallback((scenario: WRVUForecasterScenario | ProviderScenario) => {
    let forecasterScenario: WRVUForecasterScenario;
    
    // Check if it's a ProviderScenario from global store
    if ('wrvuForecasterData' in scenario || ('scenarioType' in scenario && scenario.scenarioType === 'wrvu-forecaster')) {
      const converted = providerScenarioToWRVUForecasterScenario(scenario as ProviderScenario);
      if (!converted) {
        logger.error('Failed to convert ProviderScenario to WRVUForecasterScenario');
        return;
      }
      forecasterScenario = converted;
    } else {
      // It's already a WRVUForecasterScenario
      forecasterScenario = scenario as WRVUForecasterScenario;
    }
    
    setInputs({
      ...forecasterScenario.inputs,
      providerName: forecasterScenario.providerName || forecasterScenario.inputs.providerName,
      specialty: forecasterScenario.specialty ? (SPECIALTIES.includes(forecasterScenario.specialty) ? forecasterScenario.specialty : 'Other') : forecasterScenario.inputs.specialty,
      customSpecialty: forecasterScenario.specialty && !SPECIALTIES.includes(forecasterScenario.specialty) ? forecasterScenario.specialty : forecasterScenario.inputs.customSpecialty,
      fte: forecasterScenario.inputs.fte ?? 1.0, // Ensure FTE defaults to 1.0 if missing
    });
    // Metrics will be recalculated automatically via useEffect
    setScenarioLoaded(true);
  }, []);

  // Ensure component is mounted before rendering Select to avoid hydration issues
  // Also load state from localStorage after mount to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true);
    // Load state from Firebase/localStorage after mount (only if no scenario is being loaded via URL)
    if (!scenarioLoaded) {
      const loadState = async () => {
        const savedState = await loadStateFromStorage();
        if (savedState) {
          setInputs(savedState);
        }
      };
      void loadState();
    }
  }, [scenarioLoaded]);

  // Save to Firebase/localStorage whenever inputs change (debounced, skip when scenario is loaded)
  useEffect(() => {
    if (scenarioLoaded || !inputs) return;
    
    const timeoutId = setTimeout(() => {
      void saveDraftState(SCREEN_ID, STORAGE_KEY, inputs as any);
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [inputs, scenarioLoaded]);
  
  // Also save to localStorage as immediate backup
  useDebouncedLocalStorage(STORAGE_KEY, scenarioLoaded ? null : inputs);

  // Auto-load scenario from query parameter
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    if (scenarioId && !scenarioLoaded) {
      const scenario = getScenario(scenarioId);
      if (scenario && scenario.scenarioType === 'wrvu-forecaster') {
        handleLoadScenario(scenario);
      }
    }
  }, [searchParams, scenarioLoaded, getScenario, handleLoadScenario]);

  // Auto-recalculate patients when patientsPerHour or isPerHour changes
  useEffect(() => {
    if (!inputs.isPerHour || inputs.patientsPerHour <= 0) return;
    if (!inputs.dailyHours || Object.keys(inputs.dailyHours).length === 0) return;

    setInputs((prev) => {
      const updatedPatientCounts = { ...prev.dailyPatientCounts };

      // Recalculate patients for all days with hours
      Object.keys(prev.dailyHours || {}).forEach((dateStr) => {
        const hours = prev.dailyHours?.[dateStr] || 0;
        
        // Skip if hours is 0 or negative
        if (hours <= 0) return;

        // Skip vacation/CME/holiday dates
        const isVacation = prev.vacationDates?.includes(dateStr);
        const isCME = prev.cmeDates?.includes(dateStr);
        const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
        if (isVacation || isCME || isHoliday) return;

        // Recalculate patients based on hours and patientsPerHour
        const calculatedPatients = Math.round(hours * prev.patientsPerHour);
        updatedPatientCounts[dateStr] = calculatedPatients;
      });

      return {
        ...prev,
        dailyPatientCounts: updatedPatientCounts,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.patientsPerHour, inputs.isPerHour]); // Only recalculate when calculation parameters change, not when dailyHours changes

  // Calculate metrics whenever inputs change
  useEffect(() => {
    let weeksWorkedPerYear: number;
    let annualClinicDays: number;
    let annualClinicalHours: number;
    let encountersPerWeek: number;
    let annualPatientEncounters: number;

    // Always use calendar-based calculations if we have calendar data
    if (inputs.dailyPatientCounts && Object.keys(inputs.dailyPatientCounts).length > 0) {
      // Calendar-based calculations
      const calendarData = calculateTotalPatientsFromCalendar(
        inputs.dailyPatientCounts,
        inputs.vacationDates,
        inputs.cmeDates,
        inputs.statutoryHolidayDates
      );

      // Sync calendar dates to number inputs for display
      const syncedNumbers = syncCalendarToNumbers(
        inputs.vacationDates,
        inputs.cmeDates,
        inputs.statutoryHolidayDates
      );

      // Calculate clinical weeks (weeks where patients were actually seen)
      // This is the actual number of weeks patients were seen, excluding vacation, CME, and holidays
      // Prefer direct number inputs (from Week Pattern mode) over synced calendar dates
      const vacationWeeks = inputs.vacationWeeks ?? syncedNumbers.vacationWeeks;
      const cmeDays = inputs.cmeDays ?? syncedNumbers.cmeDays;
      const statutoryHolidays = inputs.statutoryHolidays ?? syncedNumbers.statutoryHolidays;
      
      const totalWeeksOff =
        vacationWeeks +
        (cmeDays + statutoryHolidays) / 7;
      weeksWorkedPerYear = Math.max(0, 52 - totalWeeksOff);

      // Calculate days per week and hours per week from calendar data
      // Get all days with data (patients or hours)
      const allDaysWithData = new Set([
        ...Object.keys(inputs.dailyPatientCounts || {}),
        ...Object.keys(inputs.dailyHours || {}),
      ]);
      
      // Filter out vacation/CME/holiday dates
      const workingDaysWithData = Array.from(allDaysWithData).filter(
        (dateStr) =>
          !inputs.vacationDates?.includes(dateStr) &&
          !inputs.cmeDates?.includes(dateStr) &&
          !inputs.statutoryHolidayDates?.includes(dateStr)
      );

      // Calculate average hours per day from calendar
      const hoursValues = workingDaysWithData
        .map((dateStr) => inputs.dailyHours?.[dateStr] || 0)
        .filter((h) => h > 0);
      const avgHoursPerDay =
        hoursValues.length > 0
          ? hoursValues.reduce((sum, h) => sum + h, 0) / hoursValues.length
          : 0;

      // Calculate days per week from calendar pattern
      // Count unique days of week that have data
      const daysOfWeekWithData = new Set<number>();
      workingDaysWithData.forEach((dateStr) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
        daysOfWeekWithData.add(dayOfWeek);
      });
      const totalDaysPerWeek = daysOfWeekWithData.size || 0;

      // Calculate total hours per week from calendar data
      let totalHoursPerWeek = 0;
      if (avgHoursPerDay > 0 && totalDaysPerWeek > 0) {
        totalHoursPerWeek = avgHoursPerDay * totalDaysPerWeek;
      }

      // Calculate annual clinic days properly accounting for non-working days
      // If we have template data (isFromTemplate), the template replication already excluded
      // non-working days, so we need to count actual working days that match the template pattern
      if (inputs.isFromTemplate && totalDaysPerWeek > 0) {
        // For template mode: count actual working days in the year that match the template pattern
        // Get the year
        const year = new Date().getFullYear();
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        // Count working days that match the days of week in the template
        let actualWorkingDays = 0;
        const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
        allDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          
          // Check if this day of week is in the template pattern
          if (daysOfWeekWithData.has(dayOfWeek)) {
            // Check if it's a working day (not weekend, not vacation/CME/holiday)
            const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
            const isNonWorking = 
              inputs.vacationDates?.includes(dateStr) ||
              inputs.cmeDates?.includes(dateStr) ||
              inputs.statutoryHolidayDates?.includes(dateStr);
            
            if (!isWeekendDay && !isNonWorking) {
              actualWorkingDays++;
            }
          }
        });
        
        annualClinicDays = actualWorkingDays;
      } else {
        // For manual calendar entry: use the pattern-based calculation
        // Use direct inputs if available, otherwise fall back to synced numbers
        const cmeDaysForCalc = inputs.cmeDays ?? syncedNumbers.cmeDays;
        const statutoryHolidaysForCalc = inputs.statutoryHolidays ?? syncedNumbers.statutoryHolidays;
        annualClinicDays =
          totalDaysPerWeek * weeksWorkedPerYear -
          statutoryHolidaysForCalc -
          cmeDaysForCalc;
      }
      annualClinicalHours = totalHoursPerWeek * weeksWorkedPerYear;

      // Annualize calendar data
      // If we have substantial data (full year or close), use average and annualize
      // Otherwise, use the average pattern from available data
      const avgPatientsPerDay = calendarData.averagePerDay;
      const coverage = calendarData.coverage;

      if (coverage.isFullYear && coverage.totalDaysWithData > 0) {
        // We have a full year of data - use it directly
        annualPatientEncounters = calendarData.totalPatients;
      } else if (coverage.totalDaysWithData > 0) {
        // We have partial data - annualize using average pattern
        // Calculate average patients per working day from calendar
        // Then multiply by annual working days
        annualPatientEncounters = avgPatientsPerDay * annualClinicDays;
      } else {
        // No calendar data yet - fallback to zero
        annualPatientEncounters = 0;
      }

      encountersPerWeek = (annualPatientEncounters / 52) * weeksWorkedPerYear;
    } else {
      // No calendar data yet - use direct number inputs to calculate clinical weeks
      const vacationWeeks = inputs.vacationWeeks ?? 0;
      const cmeDays = inputs.cmeDays ?? 0;
      const statutoryHolidays = inputs.statutoryHolidays ?? 0;
      
      const totalWeeksOff = vacationWeeks + (cmeDays + statutoryHolidays) / 7;
      weeksWorkedPerYear = Math.max(0, 52 - totalWeeksOff);
      
      // Without calendar data, we can't calculate other metrics
      annualClinicDays = 0;
      annualClinicalHours = 0;
      encountersPerWeek = 0;
      annualPatientEncounters = 0;
    }

    // Calculate wRVUs and compensation
    const estimatedAnnualWRVUs =
      annualPatientEncounters * inputs.avgWRVUPerEncounter;
    const wrvuCompensation = estimatedAnnualWRVUs * inputs.wrvuConversionFactor;
    const estimatedTotalCompensation = Math.max(
      inputs.baseSalary,
      wrvuCompensation
    );

    // Update metrics
    setMetrics({
      weeksWorkedPerYear,
      annualClinicDays,
      annualClinicalHours,
      encountersPerWeek,
      annualPatientEncounters,
      estimatedAnnualWRVUs,
      estimatedTotalCompensation,
      wrvuCompensation,
    });
  }, [inputs]);

  const handleInputChange = (
    field: keyof WRVUForecasterInputs,
    value: number | boolean
  ) => {
    setInputs((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      // Ensure calendar fields are initialized
      if (!updated.dailyPatientCounts) updated.dailyPatientCounts = {};
      if (!updated.dailyHours) updated.dailyHours = {};
      if (!updated.vacationDates) updated.vacationDates = [];
      if (!updated.cmeDates) updated.cmeDates = [];
      if (!updated.statutoryHolidayDates) updated.statutoryHolidayDates = [];
      return updated;
    });
  };


  // Calendar handlers
  const handlePatientCountChange = (date: Date, count: number) => {
    const dateStr = formatDateString(date);
    setInputs((prev) => ({
      ...prev,
      dailyPatientCounts: {
        ...prev.dailyPatientCounts,
        [dateStr]: count,
      },
    }));
  };

  const handleHoursChange = (date: Date, hours: number) => {
    const dateStr = formatDateString(date);
    setInputs((prev) => {
      const updated = {
        ...prev,
        dailyHours: {
          ...prev.dailyHours,
          [dateStr]: hours,
        },
      };

      // Auto-calculate patients if patientsPerHour is set and current patient count is 0
      if (prev.patientsPerHour > 0 && hours > 0) {
        const currentPatientCount = prev.dailyPatientCounts?.[dateStr] || 0;
        // Only auto-calculate if patient count is 0 (don't overwrite manual entries)
        if (currentPatientCount === 0) {
          const calculatedPatients = Math.round(hours * prev.patientsPerHour);
          updated.dailyPatientCounts = {
            ...prev.dailyPatientCounts,
            [dateStr]: calculatedPatients,
          };
        }
      }

      return updated;
    });
  };

  const handleDateTypeChange = (
    date: Date,
    type: 'vacation' | 'cme' | 'holiday' | null
  ) => {
    const dateStr = formatDateString(date);
    setInputs((prev) => {
      const newInputs = { ...prev };

      // Remove from all arrays first
      newInputs.vacationDates = (newInputs.vacationDates || []).filter(
        (d) => d !== dateStr
      );
      newInputs.cmeDates = (newInputs.cmeDates || []).filter(
        (d) => d !== dateStr
      );
      newInputs.statutoryHolidayDates = (
        newInputs.statutoryHolidayDates || []
      ).filter((d) => d !== dateStr);

      // Add to appropriate array
      if (type === 'vacation') {
        newInputs.vacationDates = [...(newInputs.vacationDates || []), dateStr];
      } else if (type === 'cme') {
        newInputs.cmeDates = [...(newInputs.cmeDates || []), dateStr];
      } else if (type === 'holiday') {
        newInputs.statutoryHolidayDates = [
          ...(newInputs.statutoryHolidayDates || []),
          dateStr,
        ];
      }

      // Sync calendar dates to number inputs
      const synced = syncCalendarToNumbers(
        newInputs.vacationDates,
        newInputs.cmeDates,
        newInputs.statutoryHolidayDates
      );
      newInputs.vacationWeeks = synced.vacationWeeks;
      newInputs.cmeDays = synced.cmeDays;
      newInputs.statutoryHolidays = synced.statutoryHolidays;

      return newInputs;
    });
  };

  const handleClearCalendar = () => {
    setInputs((prev) => ({
      ...prev,
      dailyPatientCounts: {},
      dailyHours: {},
      vacationDates: [],
      cmeDates: [],
      statutoryHolidayDates: [],
      // Reset number inputs to defaults
      vacationWeeks: 4,
      cmeDays: 5,
      statutoryHolidays: 10,
    }));
  };

  // Bulk calculation: Calculate patients from hours for all days
  const handleCalculatePatientsFromHours = () => {
    if (inputs.patientsPerHour <= 0) return;

    setInputs((prev) => {
      const updatedPatientCounts = { ...prev.dailyPatientCounts };

      // Iterate through all days with hours
      Object.keys(prev.dailyHours || {}).forEach((dateStr) => {
        const hours = prev.dailyHours?.[dateStr] || 0;
        
        // Skip if hours is 0 or negative
        if (hours <= 0) return;

        // Skip vacation/CME/holiday dates
        const isVacation = prev.vacationDates?.includes(dateStr);
        const isCME = prev.cmeDates?.includes(dateStr);
        const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
        if (isVacation || isCME || isHoliday) return;

        // Recalculate patients for all days with hours (overwrites existing values)
        const calculatedPatients = Math.round(hours * prev.patientsPerHour);
        updatedPatientCounts[dateStr] = calculatedPatients;
      });

      return {
        ...prev,
        dailyPatientCounts: updatedPatientCounts,
      };
    });
  };

  // Bulk calculation: Apply patients per day to all working days
  const handleCalculatePatientsFromDay = () => {
    if (inputs.patientsPerDay <= 0) return;

    setInputs((prev) => {
      const updatedPatientCounts = { ...prev.dailyPatientCounts };
      const updatedHours = { ...prev.dailyHours };

      // Get the current year to find all days
      const year = new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

      // Apply patients per day to all working days
      allDays.forEach((date) => {
        const dateStr = formatDateString(date);
        const dayOfWeek = date.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        // Skip vacation/CME/holiday dates
        const isVacation = prev.vacationDates?.includes(dateStr);
        const isCME = prev.cmeDates?.includes(dateStr);
        const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
        if (isVacation || isCME || isHoliday) return;

        // Set patients per day for this working day
        updatedPatientCounts[dateStr] = prev.patientsPerDay;
        
        // If hours exist, keep them; otherwise calculate from patients per hour if available
        if (!updatedHours[dateStr] && prev.patientsPerHour > 0) {
          updatedHours[dateStr] = prev.patientsPerDay / prev.patientsPerHour;
        }
      });

      return {
        ...prev,
        dailyPatientCounts: updatedPatientCounts,
        dailyHours: updatedHours,
      };
    });
  };

  // Apply predefined work week template
  const handleApplyWorkWeekTemplate = (totalHours: number, dayToReduce?: number) => {
    // Get current week (Monday to Friday)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekDays = eachDayOfInterval({ 
      start: weekStart, 
      end: addDays(weekStart, 4) // Monday to Friday
    });

    // Calculate hours distribution
    const baseHoursPerDay = 8;
    const monThuHours = baseHoursPerDay * 4; // 32 hours
    
    setInputs((prev) => {
      const updatedHours = { ...prev.dailyHours };
      const updatedPatients = { ...prev.dailyPatientCounts };

      // 40h: full week (8h × 5 days), no day to reduce
      if (totalHours >= 40) {
        weekDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          const isVacation = prev.vacationDates?.includes(dateStr);
          const isCME = prev.cmeDates?.includes(dateStr);
          const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
          if (isVacation || isCME || isHoliday) return;
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            updatedHours[dateStr] = baseHoursPerDay;
            if (prev.isPerHour && prev.patientsPerHour > 0) {
              updatedPatients[dateStr] = Math.round(baseHoursPerDay * prev.patientsPerHour);
            } else if (!prev.isPerHour && prev.patientsPerDay > 0) {
              updatedPatients[dateStr] = Math.round(prev.patientsPerDay);
            }
          }
        });
      } else if (totalHours <= monThuHours) {
        // 32h: four-day week — one weekday off (dayToReduce gets 0h, others 8h)
        const dayOff = dayToReduce ?? 5; // Default Friday off
        weekDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          const isVacation = prev.vacationDates?.includes(dateStr);
          const isCME = prev.cmeDates?.includes(dateStr);
          const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
          if (isVacation || isCME || isHoliday) return;
          const hours = dayOfWeek === dayOff ? 0 : baseHoursPerDay;
          if (hours > 0) {
            updatedHours[dateStr] = hours;
            if (prev.isPerHour && prev.patientsPerHour > 0) {
              updatedPatients[dateStr] = Math.round(hours * prev.patientsPerHour);
            } else if (!prev.isPerHour && prev.patientsPerDay > 0) {
              updatedPatients[dateStr] = Math.round((hours / baseHoursPerDay) * prev.patientsPerDay);
            }
          } else {
            if (updatedHours[dateStr] !== undefined) delete updatedHours[dateStr];
            if (updatedPatients[dateStr] !== undefined) delete updatedPatients[dateStr];
          }
        });
      } else {
        // 36h: one short day — "reduce hours on" this day (4h), others 8h
        const targetDay = dayToReduce ?? 5;
        const hoursToReduce = totalHours - monThuHours;
        const reducedDayHours = Math.max(0, baseHoursPerDay - hoursToReduce);
        const otherDaysHours = baseHoursPerDay;

        weekDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          const isVacation = prev.vacationDates?.includes(dateStr);
          const isCME = prev.cmeDates?.includes(dateStr);
          const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
          if (isVacation || isCME || isHoliday) return;

          let hours = 0;
          if (dayOfWeek === targetDay) hours = reducedDayHours;
          else if (dayOfWeek >= 1 && dayOfWeek <= 4) hours = otherDaysHours;
          else if (dayOfWeek === 5 && targetDay !== 5) hours = otherDaysHours;

          if (hours > 0) {
            updatedHours[dateStr] = hours;
            if (prev.isPerHour && prev.patientsPerHour > 0) {
              updatedPatients[dateStr] = Math.round(hours * prev.patientsPerHour);
            } else if (!prev.isPerHour && prev.patientsPerDay > 0) {
              updatedPatients[dateStr] = Math.round((hours / baseHoursPerDay) * prev.patientsPerDay);
            }
          } else {
            if (updatedHours[dateStr] !== undefined) delete updatedHours[dateStr];
            if (updatedPatients[dateStr] !== undefined) delete updatedPatients[dateStr];
          }
        });
      }

      return {
        ...prev,
        dailyHours: updatedHours,
        dailyPatientCounts: updatedPatients,
      };
    });
  };

  // Template replication handler
  const handleApplyTemplate = () => {
    // Get the current week's data as template
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Extract template week data
    const templateWeek = {
      dailyPatientCounts: {} as Record<string, number>,
      dailyHours: {} as Record<string, number>,
    };
    
    weekDays.forEach((date) => {
      const dateStr = formatDateString(date);
      templateWeek.dailyPatientCounts[dateStr] = inputs.dailyPatientCounts?.[dateStr] || 0;
      templateWeek.dailyHours[dateStr] = inputs.dailyHours?.[dateStr] || 0;
    });

    const year = new Date().getFullYear();
    const { dailyPatientCounts: newPatientCounts, dailyHours: newHours } = replicateWeekTemplate(
      templateWeek,
      year,
      inputs.vacationDates,
      inputs.cmeDates,
      inputs.statutoryHolidayDates
    );

    setInputs((prev) => ({
      ...prev,
      dailyPatientCounts: {
        ...prev.dailyPatientCounts,
        ...newPatientCounts,
      },
      dailyHours: {
        ...prev.dailyHours,
        ...newHours,
      },
      isFromTemplate: true, // Mark that data came from template
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReport = () => {
    // Calculate adjusted metrics
    const adjustedAnnualWRVUs = metrics.annualPatientEncounters * inputs.adjustedWRVUPerEncounter;
    const adjustedWRVUCompensation = adjustedAnnualWRVUs * inputs.wrvuConversionFactor;
    const currentIncentive = metrics.wrvuCompensation - inputs.baseSalary;
    const adjustedIncentive = adjustedWRVUCompensation - inputs.baseSalary;

    const formatNumber = (value: number) =>
      new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

    const targetAnnualWRVUs =
      inputs.wrvuConversionFactor > 0
        ? inputs.baseSalary / inputs.wrvuConversionFactor
        : 0;

    // Get provider information
    const providerName = inputs.providerName?.trim() || 'Provider';
    const specialty = inputs.specialty === 'Other' ? inputs.customSpecialty?.trim() : inputs.specialty?.trim() || 'Not specified';
    const fte = inputs.fte ?? 1.0;

    // Analyze calendar data coverage
    const calendarCoverage = inputs.dailyPatientCounts && Object.keys(inputs.dailyPatientCounts).length > 0
      ? analyzeCalendarDataCoverage(
          inputs.dailyPatientCounts,
          inputs.vacationDates,
          inputs.cmeDates,
          inputs.statutoryHolidayDates
        )
      : null;

    // Format days of week for shifts
    const formatDaysOfWeek = (daysOfWeek: number[]) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return daysOfWeek.map(d => dayNames[d]).join(', ');
    };

    // Build email subject with provider name if available
    const subjectText = providerName && providerName !== 'Provider' 
      ? `${providerName} - Schedule & wRVU Forecast Report`
      : 'Provider Schedule & wRVU Forecast Report';
    const subject = encodeURIComponent(subjectText);

    // Build comprehensive email body
    let emailBody = `${subjectText}
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

═══════════════════════════════════════════════════════
PROVIDER INFORMATION
═══════════════════════════════════════════════════════

Provider Name: ${providerName}
Specialty: ${specialty}
FTE: ${fte.toFixed(2)} (${(fte * 100).toFixed(0)}% full-time equivalent)

═══════════════════════════════════════════════════════
SUMMARY METRICS
═══════════════════════════════════════════════════════

Total Compensation: ${formatCurrency(metrics.estimatedTotalCompensation)}
  • Base Salary: ${formatCurrency(inputs.baseSalary)}
  • wRVU Compensation: ${formatCurrency(metrics.wrvuCompensation)}
  • Selected: ${formatCurrency(metrics.estimatedTotalCompensation)} (max of base salary or wRVU compensation)

Incentive Payment: ${currentIncentive >= 0 ? '+' : ''}${formatCurrency(currentIncentive)}${adjustedIncentive > currentIncentive ? ` (Potential with adjusted wRVU: ${formatCurrency(adjustedIncentive)})` : ''}
  • Calculation: (${formatCurrency(inputs.wrvuConversionFactor)} × ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs) - ${formatCurrency(inputs.baseSalary)} = ${formatCurrency(currentIncentive)}

Estimated Annual wRVUs: ${formatNumber(metrics.estimatedAnnualWRVUs)}${adjustedAnnualWRVUs > metrics.estimatedAnnualWRVUs ? ` (Potential: ${formatNumber(adjustedAnnualWRVUs)})` : ''}
  • Calculation: ${formatNumber(metrics.annualPatientEncounters)} encounters × ${inputs.avgWRVUPerEncounter.toFixed(2)} wRVU/encounter = ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs

Target Annual wRVUs: ${formatNumber(targetAnnualWRVUs)}
  • Calculation: ${formatCurrency(inputs.baseSalary)} ÷ ${formatCurrency(inputs.wrvuConversionFactor)}/wRVU = ${formatNumber(targetAnnualWRVUs)} wRVUs

═══════════════════════════════════════════════════════
WORK SCHEDULE
═══════════════════════════════════════════════════════

Total Weeks in Year: 52 weeks
Weeks Worked Per Year: ${formatNumber(metrics.weeksWorkedPerYear)} weeks
  • Vacation Weeks Excluded: ${inputs.vacationWeeks} weeks
  • CME Days Excluded: ${inputs.cmeDays} days (${(inputs.cmeDays / 7).toFixed(1)} weeks)
  • Statutory Holidays Excluded: ${inputs.statutoryHolidays} days (${(inputs.statutoryHolidays / 7).toFixed(1)} weeks)

Shift Types:
${inputs.shifts.map((shift, i) => {
  const daysOfWeekStr = shift.daysOfWeek && shift.daysOfWeek.length > 0 
    ? ` (${formatDaysOfWeek(shift.daysOfWeek)})`
    : '';
  return `  ${i + 1}. ${shift.name}: ${shift.hours} hours × ${shift.perWeek} per week${daysOfWeekStr}`;
}).join('\n')}

Annual Clinic Days: ${formatNumber(metrics.annualClinicDays)} days
Annual Clinical Hours: ${formatNumber(metrics.annualClinicalHours)} hours
  • Average Hours per Week: ${metrics.weeksWorkedPerYear > 0 ? formatNumber(metrics.annualClinicalHours / metrics.weeksWorkedPerYear) : '0'} hours
  • Average Hours per Day: ${metrics.annualClinicDays > 0 ? (metrics.annualClinicalHours / metrics.annualClinicDays).toFixed(1) : '0'} hours

═══════════════════════════════════════════════════════
PATIENT ENCOUNTERS
═══════════════════════════════════════════════════════

Calculation Method: ${inputs.isPerHour ? 'Patients Per Hour' : 'Patients Per Day'}
${inputs.isPerHour 
  ? `Patients Per Hour: ${inputs.patientsPerHour} patients/hour`
  : `Patients Per Day: ${inputs.patientsPerDay} patients/day`}

Encounters per Week: ${formatNumber(metrics.encountersPerWeek)} encounters
Annual Patient Encounters: ${formatNumber(metrics.annualPatientEncounters)} encounters
  • Average Encounters per Day: ${metrics.annualClinicDays > 0 ? (metrics.annualPatientEncounters / metrics.annualClinicDays).toFixed(1) : '0'} encounters

Average wRVU Per Encounter: ${inputs.avgWRVUPerEncounter.toFixed(2)} wRVU/encounter
Adjusted wRVU Per Encounter: ${inputs.adjustedWRVUPerEncounter.toFixed(2)} wRVU/encounter${inputs.adjustedWRVUPerEncounter !== inputs.avgWRVUPerEncounter ? ` (${inputs.adjustedWRVUPerEncounter > inputs.avgWRVUPerEncounter ? '+' : ''}${(inputs.adjustedWRVUPerEncounter - inputs.avgWRVUPerEncounter).toFixed(2)} difference)` : ''}

${calendarCoverage ? `\nCalendar Data Source:
  • ${calendarCoverage.isFullYear ? 'Full Year Data' : 'Partial Data (Annualized)'}
  • ${calendarCoverage.monthsCovered} month${calendarCoverage.monthsCovered !== 1 ? 's' : ''} of data (${calendarCoverage.totalDaysWithData} working days)
  • ${Math.round(calendarCoverage.coveragePercentage)}% of year covered${calendarCoverage.dateRange.start && calendarCoverage.dateRange.end ? `\n  • Date Range: ${format(calendarCoverage.dateRange.start, 'MMM d, yyyy')} - ${format(calendarCoverage.dateRange.end, 'MMM d, yyyy')}` : ''}
  • ${calendarCoverage.isFullYear ? 'Projections based on actual calendar entries' : 'Projections annualized from average daily pattern'}` : ''}

${inputs.isFromTemplate ? '\nNote: Forecast built from weekly template replicated across matching days of the year.' : ''}

═══════════════════════════════════════════════════════
COMPENSATION DETAILS
═══════════════════════════════════════════════════════

Base Salary: ${formatCurrency(inputs.baseSalary)}
wRVU Conversion Factor: ${formatCurrency(inputs.wrvuConversionFactor)}/wRVU

Compensation Calculation:
  • wRVU Compensation = ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs × ${formatCurrency(inputs.wrvuConversionFactor)}/wRVU = ${formatCurrency(metrics.wrvuCompensation)}
  • Total Compensation = Max(${formatCurrency(inputs.baseSalary)}, ${formatCurrency(metrics.wrvuCompensation)}) = ${formatCurrency(metrics.estimatedTotalCompensation)}

${adjustedIncentive > currentIncentive ? `\n⚠️ POTENTIAL INCREASE WITH ADJUSTED wRVU:
   Current Annual wRVUs: ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs
   Adjusted Annual wRVUs: ${formatNumber(adjustedAnnualWRVUs)} wRVUs
   Additional wRVUs: +${formatNumber(adjustedAnnualWRVUs - metrics.estimatedAnnualWRVUs)} wRVUs
   
   Current Incentive: ${formatCurrency(currentIncentive)}
   Adjusted Incentive: ${formatCurrency(adjustedIncentive)}
   Additional Incentive: +${formatCurrency(adjustedIncentive - currentIncentive)}
   
   This potential increase assumes improved billing practices that increase average wRVU per encounter from ${inputs.avgWRVUPerEncounter.toFixed(2)} to ${inputs.adjustedWRVUPerEncounter.toFixed(2)} wRVU/encounter.\n` : ''}

═══════════════════════════════════════════════════════
Generated by CompLens™ Provider Compensation Intelligence
═══════════════════════════════════════════════════════`;

    const emailBodyEncoded = encodeURIComponent(emailBody);

    // Open email client
    window.location.href = `mailto:?subject=${subject}&body=${emailBodyEncoded}`;
  };

  const targetAnnualWRVUs =
    inputs.wrvuConversionFactor > 0
      ? inputs.baseSalary / inputs.wrvuConversionFactor
      : 0;

  // Validation functions for Results tab
  const canViewResults = () => {
    // Check if we have at least some patient data in calendar
    const hasPatientData =
      inputs.dailyPatientCounts &&
      Object.keys(inputs.dailyPatientCounts).length > 0 &&
      Object.values(inputs.dailyPatientCounts).some((count) => count > 0);
    return hasPatientData && inputs.avgWRVUPerEncounter > 0 && inputs.baseSalary > 0 && inputs.wrvuConversionFactor > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center gap-2 no-print">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Schedule-Based Productivity Calculator
        </h1>
        <Tooltip 
          content="See how your schedule translates to pay. Enter shifts and patient visits to forecast annual compensation."
          side="right"
        >
          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
        </Tooltip>
      </div>

      {/* Print View - Hidden except when printing */}
      <PrintView metrics={metrics} inputs={inputs} />

      {/* Normal View */}
      <div className="no-print">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'input' | 'results')} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="setup" className="text-sm font-medium">
              Provider
            </TabsTrigger>
            <TabsTrigger value="input" className="text-sm font-medium">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm font-medium" disabled={!canViewResults()}>
              Results
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab - Provider Information */}
          <TabsContent value="setup" className="space-y-6 mt-0">
            <Card className="border-2" data-tour="forecaster-schedule">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Provider Information</CardTitle>
                  <ScenarioLoader
                    scenarioType="wrvu-forecaster"
                    onLoad={handleLoadScenario}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Provider Name and Specialty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <Input
                      value={inputs.providerName || ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, providerName: e.target.value }))}
                      placeholder="Enter provider name"
                      className="w-full text-sm sm:text-base"
                      icon={<User className="w-5 h-5" />}
                    />
                    <div className="space-y-2">
                      {isMounted ? (
                        <Select
                          value={inputs.specialty || undefined}
                          onValueChange={(value) => {
                            setInputs((prev) => ({
                              ...prev,
                              specialty: value,
                              customSpecialty: value !== 'Other' ? '' : prev.customSpecialty,
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select specialty" />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                            {SPECIALTIES.slice(0, 4).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Procedural / Surgical</SelectLabel>
                            {SPECIALTIES.slice(4, 15).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Medical Subspecialties</SelectLabel>
                            {SPECIALTIES.slice(15, 23).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Other</SelectLabel>
                            {SPECIALTIES.slice(23).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-12 w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500">Select specialty</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </div>
                      )}
                      {inputs.specialty === 'Other' && (
                        <Input
                          value={inputs.customSpecialty || ''}
                          onChange={(e) => setInputs((prev) => ({ ...prev, customSpecialty: e.target.value }))}
                          placeholder="Enter specialty name"
                          className="w-full text-sm sm:text-base"
                          icon={<Stethoscope className="w-5 h-5" />}
                        />
                      )}
                    </div>
                  </div>
                  {/* FTE Input */}
                  <div className="max-w-xs">
                    <FTEInput
                      value={inputs.fte ?? 1.0}
                      onChange={(value) => setInputs((prev) => ({ ...prev, fte: value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Input Tab - Schedule and Patient Encounters */}
          <TabsContent value="input" className="space-y-6 mt-0">
            <div className="space-y-4" data-tour="forecaster-encounters">
              <PatientCalendarView
                dailyPatientCounts={inputs.dailyPatientCounts}
                dailyHours={inputs.dailyHours}
                vacationDates={inputs.vacationDates}
                cmeDates={inputs.cmeDates}
                holidayDates={inputs.statutoryHolidayDates}
                onPatientCountChange={handlePatientCountChange}
                onHoursChange={handleHoursChange}
                onDateTypeChange={handleDateTypeChange}
                onClearCalendar={handleClearCalendar}
                avgWRVUPerEncounter={inputs.avgWRVUPerEncounter}
                adjustedWRVUPerEncounter={inputs.adjustedWRVUPerEncounter}
                vacationWeeks={inputs.vacationWeeks}
                statutoryHolidays={inputs.statutoryHolidays}
                cmeDays={inputs.cmeDays}
                onInputChange={(field, value) => {
                  handleInputChange(field, value);
                }}
                onApplyTemplate={handleApplyTemplate}
                patientsPerHour={inputs.patientsPerHour}
                onPatientsPerHourChange={(value) => handleInputChange('patientsPerHour', value)}
                patientsPerDay={inputs.patientsPerDay}
                onPatientsPerDayChange={(value) => handleInputChange('patientsPerDay', value)}
                isPerHour={inputs.isPerHour}
                onIsPerHourChange={(value) => handleInputChange('isPerHour', value)}
                onCalculatePatientsFromHours={handleCalculatePatientsFromHours}
                onCalculatePatientsFromDay={handleCalculatePatientsFromDay}
                onApplyWorkWeekTemplate={handleApplyWorkWeekTemplate}
                onAvgWRVUChange={(value) => handleInputChange('avgWRVUPerEncounter', value)}
                onAdjustedWRVUChange={(value) => handleInputChange('adjustedWRVUPerEncounter', value)}
              />
            </div>

            {/* Compensation Inputs */}
            <div className="space-y-4 pt-6 border-t-2 border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compensation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Base Salary</Label>
                  <CurrencyInput
                    value={inputs.baseSalary}
                    onChange={(value) => handleInputChange('baseSalary', value)}
                    placeholder="150000"
                    showDecimals={false}
                  />
                </div>

                <div>
                  <NumberInputWithButtons
                    label="wRVU Conversion Factor"
                    value={inputs.wrvuConversionFactor}
                    onChange={(value) => handleInputChange('wrvuConversionFactor', value)}
                    icon={<DollarSign className="w-5 h-5" />}
                    min={0}
                    step={0.01}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-1">/ wRVU</p>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Target Annual wRVUs</Label>
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {targetAnnualWRVUs > 0
                      ? targetAnnualWRVUs.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : '0'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Base Salary ÷ Conversion Factor
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Full FTE (1.0)</Label>
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    {metrics.annualClinicalHours > 0
                      ? metrics.annualClinicalHours.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : '—'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {metrics.annualClinicalHours > 0
                      ? 'Annual patient contact hours'
                      : 'Build schedule above to see hours'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0">
            <ResultsContent
              inputs={inputs}
              metrics={metrics}
              onLoadScenario={handleLoadScenario}
              onEmailReport={handleEmailReport}
              onPrint={handlePrint}
              onResetInputs={() => setInputs(getDefaultState())}
              onGoToSetup={() => setActiveTab('setup')}
            />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}

export default function WRVUForecasterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
        <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <WRVUForecasterPageContent />
    </Suspense>
  );
}
