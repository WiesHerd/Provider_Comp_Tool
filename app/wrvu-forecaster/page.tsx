'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from '@/lib/utils/logger';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductivitySummary } from '@/components/wrvu-forecaster/productivity-summary';
import { ScenarioManager } from '@/components/wrvu-forecaster/scenario-manager';
import { PrintView } from '@/components/wrvu-forecaster/print-view';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario } from '@/types';
import { providerScenarioToWRVUForecasterScenario } from '@/lib/utils/wrvu-forecaster-converters';
import {
  ProgressiveForm,
  ProgressiveFormStep,
  ProgressiveFormNavigation,
  useProgressiveForm,
} from '@/components/ui/progressive-form';
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
import { DollarSign, User, Stethoscope, ChevronDown, ChevronLeft } from 'lucide-react';
import { PatientCalendarView } from '@/components/wrvu-forecaster/patient-calendar-view';
import {
  formatDateString,
  syncCalendarToNumbers,
  calculateTotalPatientsFromCalendar,
  replicateWeekTemplate,
} from '@/lib/utils/calendar-helpers';
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';

const STORAGE_KEY = 'wrvuForecasterState';

// Always return default state to ensure consistent server/client rendering
// localStorage will be loaded after mount to avoid hydration mismatches
const getInitialState = (): WRVUForecasterInputs => {
  return getDefaultState();
};

// Load state from localStorage after mount
const loadStateFromStorage = (): WRVUForecasterInputs | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Ensure shifts have IDs
      if (parsed.shifts && parsed.shifts.length > 0 && !parsed.shifts[0].id) {
        parsed.shifts = parsed.shifts.map((shift: ShiftType, index: number) => ({
          ...shift,
          id: shift.id || `shift-${index}`,
        }));
      }
      // Migrate shifts without daysOfWeek to include daysOfWeek
      if (parsed.shifts && parsed.shifts.length > 0) {
        parsed.shifts = parsed.shifts.map((shift: ShiftType) => {
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
      if (!parsed.dailyPatientCounts) parsed.dailyPatientCounts = {};
      if (!parsed.dailyHours) parsed.dailyHours = {};
      if (!parsed.vacationDates) parsed.vacationDates = [];
      if (!parsed.cmeDates) parsed.cmeDates = [];
      if (!parsed.statutoryHolidayDates) parsed.statutoryHolidayDates = [];
      // Normalize empty specialty to undefined for consistent Select rendering
      if (parsed.specialty === '') parsed.specialty = undefined;
      // Ensure FTE exists (default to 1.0)
      if (parsed.fte === undefined || parsed.fte === null) parsed.fte = 1.0;
      return parsed;
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

// Results step content component that has access to ProgressiveForm context
function ResultsStepContent({
  inputs,
  metrics,
  onLoadScenario,
  onEmailReport,
  onPrint,
  onResetInputs,
}: {
  inputs: WRVUForecasterInputs;
  metrics: ProductivityMetrics;
  onLoadScenario: (scenario: WRVUForecasterScenario) => void;
  onEmailReport: () => void;
  onPrint: () => void;
  onResetInputs: () => void;
}) {
  const { goToStep, previousStep } = useProgressiveForm();

  const handleStartOver = () => {
    onResetInputs();
    goToStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    previousStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-32 sm:pb-6">
      {/* Back Button - Matches ProgressiveFormNavigation styling */}
      <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-10 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1 sm:flex-initial sm:min-w-[120px]"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

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
    // Load state from localStorage after mount (only if no scenario is being loaded via URL)
    if (!scenarioLoaded) {
      const savedState = loadStateFromStorage();
      if (savedState) {
        setInputs(savedState);
      }
    }
  }, [scenarioLoaded]);

  // Save to localStorage whenever inputs change (debounced, skip when scenario is loaded)
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

      // If totalHours <= 32, distribute evenly across Mon-Thu
      if (totalHours <= monThuHours) {
        const hoursPerDay = totalHours / 4;
        weekDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          
          // Skip if it's a vacation/CME/holiday date
          const isVacation = prev.vacationDates?.includes(dateStr);
          const isCME = prev.cmeDates?.includes(dateStr);
          const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
          if (isVacation || isCME || isHoliday) return;

          if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            updatedHours[dateStr] = hoursPerDay;
            // Calculate patients based on mode
            if (prev.isPerHour && prev.patientsPerHour > 0) {
              updatedPatients[dateStr] = Math.round(hoursPerDay * prev.patientsPerHour);
            } else if (!prev.isPerHour && prev.patientsPerDay > 0) {
              // Proportional: patients = (hours / 8) * patientsPerDay
              updatedPatients[dateStr] = Math.round((hoursPerDay / baseHoursPerDay) * prev.patientsPerDay);
            }
          } else if (dayOfWeek === 5) {
            // Friday gets 0 hours
            if (updatedHours[dateStr] !== undefined) delete updatedHours[dateStr];
            if (updatedPatients[dateStr] !== undefined) delete updatedPatients[dateStr];
          }
        });
      } else {
        // totalHours > 32: 8h Mon-Thu, remainder on specified day (or Friday by default)
        const targetDay = dayToReduce || 5; // Default to Friday
        const hoursToReduce = totalHours - monThuHours;
        const reducedDayHours = Math.max(0, baseHoursPerDay - hoursToReduce);
        const otherDaysHours = baseHoursPerDay;

        weekDays.forEach((date) => {
          const dateStr = formatDateString(date);
          const dayOfWeek = date.getDay();
          
          // Skip if it's a vacation/CME/holiday date
          const isVacation = prev.vacationDates?.includes(dateStr);
          const isCME = prev.cmeDates?.includes(dateStr);
          const isHoliday = prev.statutoryHolidayDates?.includes(dateStr);
          if (isVacation || isCME || isHoliday) return;

          let hours = 0;
          if (dayOfWeek === targetDay) {
            // The day to reduce
            hours = reducedDayHours;
          } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            // Other Mon-Thu days
            hours = otherDaysHours;
          } else if (dayOfWeek === 5 && targetDay !== 5) {
            // Friday when not the target day
            hours = otherDaysHours;
          }

          if (hours > 0) {
            updatedHours[dateStr] = hours;
            
            // Calculate patients based on current mode
            if (prev.isPerHour && prev.patientsPerHour > 0) {
              // Patients Per Hour mode: calculate from hours
              updatedPatients[dateStr] = Math.round(hours * prev.patientsPerHour);
            } else if (!prev.isPerHour && prev.patientsPerDay > 0) {
              // Patients Per Day mode: proportional to hours (patients = (hours / 8) * patientsPerDay)
              updatedPatients[dateStr] = Math.round((hours / baseHoursPerDay) * prev.patientsPerDay);
            }
          } else {
            // If hours is 0, clear patients for that day
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
    const currentIncentive = Math.max(0, metrics.wrvuCompensation - inputs.baseSalary);
    const adjustedIncentive = Math.max(0, adjustedWRVUCompensation - inputs.baseSalary);

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

    // Build email subject
    const subject = encodeURIComponent('Provider Schedule & wRVU Forecast Report');

    // Build email body with nicely formatted report
    const emailBody = encodeURIComponent(`Provider Schedule & wRVU Forecast Report
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════
SUMMARY METRICS
═══════════════════════════════════════════════════════

Total Compensation: ${formatCurrency(metrics.estimatedTotalCompensation)}
Incentive Payment: ${formatCurrency(currentIncentive)}${adjustedIncentive > currentIncentive ? ` (Potential: ${formatCurrency(adjustedIncentive)})` : ''}
Estimated Annual wRVUs: ${formatNumber(metrics.estimatedAnnualWRVUs)}${adjustedAnnualWRVUs > metrics.estimatedAnnualWRVUs ? ` (Potential: ${formatNumber(adjustedAnnualWRVUs)})` : ''}

═══════════════════════════════════════════════════════
WORK SCHEDULE
═══════════════════════════════════════════════════════

Weeks Worked Per Year: ${formatNumber(metrics.weeksWorkedPerYear)}
Vacation Weeks: ${inputs.vacationWeeks}
CME Days: ${inputs.cmeDays}
Statutory Holidays: ${inputs.statutoryHolidays}

Shift Types:
${inputs.shifts.map((shift, i) => `  ${i + 1}. ${shift.name}: ${shift.hours} hours × ${shift.perWeek} per week`).join('\n')}

Annual Clinic Days: ${formatNumber(metrics.annualClinicDays)}
Annual Clinical Hours: ${formatNumber(metrics.annualClinicalHours)}

═══════════════════════════════════════════════════════
PATIENT ENCOUNTERS
═══════════════════════════════════════════════════════

Patients Per ${inputs.isPerHour ? 'Hour' : 'Day'}: ${inputs.isPerHour ? inputs.patientsPerHour : inputs.patientsPerDay}
Encounters per Week: ${formatNumber(metrics.encountersPerWeek)}
Annual Patient Encounters: ${formatNumber(metrics.annualPatientEncounters)}

Average wRVU Per Encounter: ${inputs.avgWRVUPerEncounter.toFixed(2)}
Adjusted wRVU Per Encounter: ${inputs.adjustedWRVUPerEncounter.toFixed(2)}

═══════════════════════════════════════════════════════
COMPENSATION
═══════════════════════════════════════════════════════

Base Salary: ${formatCurrency(inputs.baseSalary)}
wRVU Conversion Factor: ${formatCurrency(inputs.wrvuConversionFactor)}/wRVU
Target Annual wRVUs: ${formatNumber(targetAnnualWRVUs)}

${adjustedIncentive > currentIncentive ? `\n⚠️ POTENTIAL INCREASE WITH ADJUSTED wRVU:\n   Additional Incentive: ${formatCurrency(adjustedIncentive - currentIncentive)}\n   Additional wRVUs: ${formatNumber(adjustedAnnualWRVUs - metrics.estimatedAnnualWRVUs)}\n` : ''}
═══════════════════════════════════════════════════════
Generated by CompLens™ Provider Compensation Intelligence
═══════════════════════════════════════════════════════`);

    // Open email client
    window.location.href = `mailto:?subject=${subject}&body=${emailBody}`;
  };

  const targetAnnualWRVUs =
    inputs.wrvuConversionFactor > 0
      ? inputs.baseSalary / inputs.wrvuConversionFactor
      : 0;

  // Validation functions
  const validateStep1 = () => {
    return inputs.shifts.length > 0 && inputs.shifts.some(s => s.perWeek > 0);
  };

  const validateStep2 = () => {
    // Check if we have at least some patient data in calendar
    const hasPatientData =
      inputs.dailyPatientCounts &&
      Object.keys(inputs.dailyPatientCounts).length > 0 &&
      Object.values(inputs.dailyPatientCounts).some((count) => count > 0);
    return hasPatientData && inputs.avgWRVUPerEncounter > 0;
  };

  const validateStep3 = () => {
    return inputs.baseSalary > 0 && inputs.wrvuConversionFactor > 0;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-4 sm:pb-6 md:pb-8">
      {/* Print View - Hidden except when printing */}
      <PrintView metrics={metrics} inputs={inputs} />

      {/* Normal View */}
      <div className="no-print">
        <ProgressiveForm
          totalSteps={3}
          stepNames={['Schedule & Encounters', 'Compensation', 'Results']}
          validateStep={(step): boolean => {
            if (step === 1) return !!(validateStep1() && validateStep2());
            if (step === 2) return !!validateStep3();
            return true;
          }}
          allowStepJump={false}
        >
          {/* Step 1: Work Schedule & Patient Encounters */}
          <ProgressiveFormStep step={1}>
            <div className="space-y-6" data-tour="forecaster-schedule">
              {/* Provider Name and Specialty */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Provider Name</h3>
                  <ScenarioLoader
                    scenarioType="wrvu-forecaster"
                    onLoad={handleLoadScenario}
                  />
                </div>
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
              
              {/* Calendar View - Always shown */}
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
            </div>
            <ProgressiveFormNavigation nextLabel="Compensation" />
          </ProgressiveFormStep>

          {/* Step 2: Compensation */}
          <ProgressiveFormStep step={2}>
            <div className="space-y-4">
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

              <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-800">
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
            </div>
            <ProgressiveFormNavigation nextLabel="Review Forecast" />
          </ProgressiveFormStep>

          {/* Step 3: Results */}
          <ProgressiveFormStep step={3}>
            <ResultsStepContent
              inputs={inputs}
              metrics={metrics}
              onLoadScenario={handleLoadScenario}
              onEmailReport={handleEmailReport}
              onPrint={handlePrint}
              onResetInputs={() => setInputs(getDefaultState())}
            />
          </ProgressiveFormStep>
        </ProgressiveForm>
      </div>
    </div>
  );
}

export default function WRVUForecasterPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-4 sm:pb-6 md:pb-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <WRVUForecasterPageContent />
    </Suspense>
  );
}
