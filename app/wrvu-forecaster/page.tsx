'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WorkSchedulePanel } from '@/components/wrvu-forecaster/work-schedule-panel';
import { PatientEncountersPanel } from '@/components/wrvu-forecaster/patient-encounters-panel';
import { ProductivitySummary } from '@/components/wrvu-forecaster/productivity-summary';
import { ScenarioManager } from '@/components/wrvu-forecaster/scenario-manager';
import { PrintView } from '@/components/wrvu-forecaster/print-view';
import {
  ProgressiveForm,
  ProgressiveFormStep,
  ProgressiveFormNavigation,
} from '@/components/ui/progressive-form';
import {
  WRVUForecasterInputs,
  ProductivityMetrics,
  ShiftType,
  WRVUForecasterScenario,
} from '@/types/wrvu-forecaster';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

const STORAGE_KEY = 'wrvuForecasterState';

const getInitialState = (): WRVUForecasterInputs => {
  if (typeof window === 'undefined') {
    return getDefaultState();
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
      return parsed;
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }

  return getDefaultState();
};

const getDefaultState = (): WRVUForecasterInputs => ({
  vacationWeeks: 4,
  statutoryHolidays: 10,
  cmeDays: 5,
  shifts: [
    { id: 'shift-0', name: 'Regular Clinic', hours: 8, perWeek: 4 },
    { id: 'shift-1', name: 'Extended Hours', hours: 10, perWeek: 1 },
  ],
  patientsPerHour: 2,
  patientsPerDay: 16,
  avgWRVUPerEncounter: 1.5,
  adjustedWRVUPerEncounter: 1.5,
  baseSalary: 150000,
  wrvuConversionFactor: 45.52,
  isPerHour: true,
});

export default function WRVUForecasterPage() {
  const [inputs, setInputs] = useState<WRVUForecasterInputs>(getInitialState);
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
  const [showResults, setShowResults] = useState(false);

  // Save to localStorage whenever inputs change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  }, [inputs]);

  // Calculate metrics whenever inputs change
  useEffect(() => {
    // Calculate weeks worked per year
    const totalWeeksOff =
      inputs.vacationWeeks + (inputs.cmeDays + inputs.statutoryHolidays) / 7;
    const weeksWorkedPerYear = 52 - totalWeeksOff;

    // Calculate annual clinic days and hours
    const totalDaysPerWeek = inputs.shifts.reduce(
      (total, shift) => total + shift.perWeek,
      0
    );
    const totalHoursPerWeek = inputs.shifts.reduce(
      (total, shift) => total + shift.hours * shift.perWeek,
      0
    );

    const annualClinicDays =
      totalDaysPerWeek * weeksWorkedPerYear -
      inputs.statutoryHolidays -
      inputs.cmeDays;
    const annualClinicalHours = totalHoursPerWeek * weeksWorkedPerYear;

    // Calculate encounters
    const encountersPerWeek = inputs.isPerHour
      ? totalHoursPerWeek * inputs.patientsPerHour
      : totalDaysPerWeek * inputs.patientsPerDay;

    const annualPatientEncounters = inputs.isPerHour
      ? annualClinicalHours * inputs.patientsPerHour
      : annualClinicDays * inputs.patientsPerDay;

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
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleShiftChange = (
    index: number | null,
    field: keyof ShiftType | 'add',
    value: string | number
  ) => {
    if (field === 'add') {
      setInputs((prev) => ({
        ...prev,
        shifts: [
          ...prev.shifts,
          {
            id: `shift-${Date.now()}`,
            name: 'New Shift',
            hours: 8,
            perWeek: 1,
          },
        ],
      }));
      return;
    }

    if (index === null) return;

    setInputs((prev) => {
      const newShifts = [...prev.shifts];
      newShifts[index] = {
        ...newShifts[index],
        [field]: value,
      };
      return {
        ...prev,
        shifts: newShifts,
      };
    });
  };

  const handleDeleteShift = (index: number) => {
    setInputs((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index),
    }));
  };

  const handleLoadScenario = (scenario: WRVUForecasterScenario) => {
    setInputs(scenario.inputs);
    // Metrics will be recalculated automatically via useEffect
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReport = () => {
    // Calculate adjusted metrics
    const adjustedAnnualWRVUs = metrics.annualPatientEncounters * inputs.adjustedWRVUPerEncounter;
    const adjustedWRVUCompensation = adjustedAnnualWRVUs * inputs.wrvuConversionFactor;
    const adjustedTotalCompensation = Math.max(inputs.baseSalary, adjustedWRVUCompensation);
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
    if (inputs.isPerHour) {
      return inputs.patientsPerHour > 0 && inputs.avgWRVUPerEncounter > 0;
    }
    return inputs.patientsPerDay > 0 && inputs.avgWRVUPerEncounter > 0;
  };

  const validateStep3 = () => {
    return inputs.baseSalary > 0 && inputs.wrvuConversionFactor > 0;
  };

  return (
    <div className="w-full px-3 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8">
      {/* Print View - Hidden except when printing */}
      <PrintView metrics={metrics} inputs={inputs} />

      {/* Normal View */}
      <div className="no-print">
        <ProgressiveForm
          totalSteps={3}
          stepNames={['Schedule & Encounters', 'Compensation', 'Results']}
          validateStep={(step) => {
            if (step === 1) return validateStep1() && validateStep2();
            if (step === 2) return validateStep3();
            return true;
          }}
          allowStepJump={false}
        >
          {/* Step 1: Work Schedule & Patient Encounters */}
          <ProgressiveFormStep step={1}>
            <div className="space-y-6" data-tour="forecaster-schedule">
              <WorkSchedulePanel
                inputs={inputs}
                onInputChange={handleInputChange}
                onShiftChange={handleShiftChange}
                onDeleteShift={handleDeleteShift}
              />
              
              <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-800 space-y-4" data-tour="forecaster-encounters">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Patient Volume</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="toggle-mode" className="text-sm text-gray-600 dark:text-gray-400">
                      {inputs.isPerHour ? 'Per Hour' : 'Per Day'}
                    </Label>
                    <input
                      type="checkbox"
                      id="toggle-mode"
                      checked={inputs.isPerHour}
                      onChange={(e) => handleInputChange('isPerHour', e.target.checked)}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('isPerHour', !inputs.isPerHour)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        inputs.isPerHour ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          inputs.isPerHour ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <NumberInputWithButtons
                  label={inputs.isPerHour ? 'Patients Seen Per Hour' : 'Patients Seen Per Day'}
                  value={inputs.isPerHour ? inputs.patientsPerHour : inputs.patientsPerDay}
                  onChange={(value) =>
                    handleInputChange(inputs.isPerHour ? 'patientsPerHour' : 'patientsPerDay', value)
                  }
                  min={0}
                  step={1}
                  integerOnly
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInputWithButtons
                    label="Average wRVU Per Encounter"
                    value={inputs.avgWRVUPerEncounter}
                    onChange={(value) => handleInputChange('avgWRVUPerEncounter', value)}
                    min={0}
                    step={0.01}
                  />

                  <NumberInputWithButtons
                    label="Adjusted wRVU Per Encounter"
                    value={inputs.adjustedWRVUPerEncounter}
                    onChange={(value) => handleInputChange('adjustedWRVUPerEncounter', value)}
                    min={0}
                    step={0.01}
                  />
                </div>
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
            <div className="space-y-6">
              <ScenarioManager
                inputs={inputs}
                metrics={metrics}
                onLoadScenario={handleLoadScenario}
                onEmailReport={handleEmailReport}
                onPrint={handlePrint}
              />
              <div data-tour="forecaster-productivity">
                <ProductivitySummary metrics={metrics} inputs={inputs} />
              </div>
            </div>
          </ProgressiveFormStep>
        </ProgressiveForm>
      </div>
    </div>
  );
}
