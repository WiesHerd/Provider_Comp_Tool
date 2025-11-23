'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkSchedulePanel } from '@/components/wrvu-forecaster/work-schedule-panel';
import { PatientEncountersPanel } from '@/components/wrvu-forecaster/patient-encounters-panel';
import { ProductivitySummary } from '@/components/wrvu-forecaster/productivity-summary';
import { ScenarioManager } from '@/components/wrvu-forecaster/scenario-manager';
import { PrintView } from '@/components/wrvu-forecaster/print-view';
import { Tooltip } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import {
  WRVUForecasterInputs,
  ProductivityMetrics,
  ShiftType,
  WRVUForecasterScenario,
} from '@/types/wrvu-forecaster';

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-8 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 safe-area-inset-top safe-area-inset-bottom">
      {/* Print View - Hidden except when printing */}
      <PrintView metrics={metrics} inputs={inputs} />

      {/* Normal View */}
      <Card className="no-print">
        <div className="p-3 sm:p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
              <div className="flex items-center gap-2 flex-wrap justify-center px-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-700 dark:text-gray-300 text-center">
                  Schedule and Average wRVU Per Encounter Input
                </h1>
                <Tooltip 
                  content="Enter your work schedule (vacation, holidays, CME, shift types), patient encounter metrics (patients per hour/day, wRVU per encounter), and compensation parameters (base salary, conversion factor). The tool calculates your estimated annual wRVUs, encounters, and compensation. Use 'Adjusted wRVU Per Encounter' to model scenarios with improved billing efficiency."
                  side="bottom"
                  className="max-w-[280px] sm:max-w-[350px]"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 cursor-help flex-shrink-0" />
                </Tooltip>
              </div>
            </div>

            {/* Action Buttons */}
            <ScenarioManager
              inputs={inputs}
              metrics={metrics}
              onLoadScenario={handleLoadScenario}
              onEmailReport={handleEmailReport}
              onPrint={handlePrint}
            />
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <WorkSchedulePanel
              inputs={inputs}
              onInputChange={handleInputChange}
              onShiftChange={handleShiftChange}
              onDeleteShift={handleDeleteShift}
            />

            <PatientEncountersPanel
              inputs={inputs}
              onInputChange={handleInputChange}
              targetAnnualWRVUs={targetAnnualWRVUs}
            />
          </div>
        </div>
      </Card>

      {/* Productivity Summary */}
      <ProductivitySummary metrics={metrics} inputs={inputs} />
    </div>
  );
}

