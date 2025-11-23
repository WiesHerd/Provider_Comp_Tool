'use client';

import { ProductivityMetrics, WRVUForecasterInputs } from '@/types/wrvu-forecaster';
import {
  DollarSign,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Info,
  Gift,
  CalendarCheck,
  BookOpen,
} from 'lucide-react';

interface PrintViewProps {
  metrics: ProductivityMetrics;
  inputs: WRVUForecasterInputs;
}

export function PrintView({ metrics, inputs }: PrintViewProps) {
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: white !important;
            color: #000 !important;
            font-size: 10pt;
            line-height: 1.3;
          }
          nav,
          [role='tablist'],
          [role='tab'],
          button:not([data-print-keep]),
          header,
          .no-print {
            display: none !important;
          }
          .print-view {
            display: block !important;
            padding: 0;
            background: white !important;
            color: #000 !important;
            max-width: 100% !important;
          }
          .print-view h1,
          .print-view h2,
          .print-view h3,
          .print-view h4 {
            color: #000 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .print-view .border {
            border-color: #000 !important;
          }
          .print-view svg {
            display: none !important;
          }
          .print-view .summary-grid {
            page-break-inside: avoid;
            margin-bottom: 0.5rem;
          }
          .print-view .main-content {
            page-break-inside: avoid;
          }
          .print-view .column {
            page-break-inside: avoid;
          }
          .print-view .section {
            page-break-inside: avoid;
          }
        }
        @media screen {
          .print-view {
            display: none !important;
          }
        }
      `}} />
      <div className="print-view">

      {/* Header */}
      <div className="text-center mb-4 pb-3 border-b-2 border-gray-400">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Provider Schedule & wRVU Forecast Report</h1>
        <p className="text-sm text-gray-700">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Top row - Summary metrics */}
      <div className="summary-grid grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 border-2 border-gray-400">
          <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Total Compensation</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(metrics.estimatedTotalCompensation)}
          </p>
        </div>

        <div className="p-3 border-2 border-gray-400">
          <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Incentive Payment</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(currentIncentive)}</p>
          {adjustedIncentive > currentIncentive && (
            <p className="text-xs text-gray-600 mt-1">
              Potential: {formatCurrency(adjustedIncentive)}
            </p>
          )}
        </div>

        <div className="p-3 border-2 border-gray-400">
          <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Annual wRVUs</p>
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(metrics.estimatedAnnualWRVUs)}
          </p>
          {adjustedAnnualWRVUs > metrics.estimatedAnnualWRVUs && (
            <p className="text-xs text-gray-600 mt-1">
              Potential: {formatNumber(adjustedAnnualWRVUs)}
            </p>
          )}
        </div>
      </div>

      {/* Main content - Two-column layout */}
      <div className="main-content flex justify-between gap-2">
        {/* Left column - Provider Input Data */}
        <div className="column w-[49%] p-3 border-2 border-gray-400">
          <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-400 uppercase tracking-wide">
            Provider Input Data
          </h3>

          {/* Work Schedule */}
          <div className="section mb-3">
            <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Work Schedule
            </h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Weeks Worked:</span>
                <span className="text-gray-900">{formatNumber(metrics.weeksWorkedPerYear)} weeks/year</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Vacation:</span>
                <span className="text-gray-900">{inputs.vacationWeeks} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">CME:</span>
                <span className="text-gray-900">{inputs.cmeDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Holidays:</span>
                <span className="text-gray-900">{inputs.statutoryHolidays} days</span>
              </div>
            </div>
          </div>

          {/* Shift Types */}
          <div className="section mb-3 pt-2 border-t border-gray-300">
            <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Shift Types
            </h4>
            <div className="text-xs space-y-1">
              {inputs.shifts.map((shift, i) => (
                <div key={i} className="flex justify-between">
                  <span className="font-semibold text-gray-700">{shift.name}:</span>
                  <span className="text-gray-900">
                    {shift.hours} hrs × {shift.perWeek}/week
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Encounters */}
          <div className="section pt-2 border-t border-gray-300">
            <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
              Patient Encounters
            </h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Patients Per {inputs.isPerHour ? 'Hour' : 'Day'}:</span>
                <span className="text-gray-900">
                  {inputs.isPerHour ? inputs.patientsPerHour : inputs.patientsPerDay}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Avg wRVU/Encounter:</span>
                <span className="text-gray-900">{inputs.avgWRVUPerEncounter.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Adj wRVU/Encounter:</span>
                <span className="text-gray-900">{inputs.adjustedWRVUPerEncounter.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Base Salary:</span>
                <span className="text-gray-900">{formatCurrency(inputs.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">wRVU Conversion:</span>
                <span className="text-gray-900">
                  {formatCurrency(inputs.wrvuConversionFactor)}/wRVU
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Productivity Metrics */}
        <div className="column w-[49%] p-3 border-2 border-gray-400">
          <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-400 uppercase tracking-wide">
            Productivity Metrics
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Annual Clinic Days</p>
                <p className="text-base font-bold text-gray-900">
                  {formatNumber(metrics.annualClinicDays)}
                </p>
              </div>
              <div className="p-2 border border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Annual Clinical Hours</p>
                <p className="text-base font-bold text-gray-900">
                  {formatNumber(metrics.annualClinicalHours)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Encounters per Week</p>
                <p className="text-base font-bold text-gray-900">
                  {formatNumber(metrics.encountersPerWeek)}
                </p>
              </div>
              <div className="p-2 border border-gray-300">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Annual Patient Encounters</p>
                <p className="text-base font-bold text-gray-900">
                  {formatNumber(metrics.annualPatientEncounters)}
                </p>
              </div>
            </div>

            {/* Projected Increase */}
            {adjustedIncentive > currentIncentive && (
              <div className="section pt-3 border-t-2 border-gray-400">
                <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Projected Increase with Adjusted wRVU
                </h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Current wRVU per Encounter:</span>
                    <span className="text-gray-900">
                      {inputs.avgWRVUPerEncounter.toFixed(2)} = {formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Adjusted wRVU per Encounter:
                    </span>
                    <span className="text-gray-900">
                      {inputs.adjustedWRVUPerEncounter.toFixed(2)} = {formatNumber(adjustedAnnualWRVUs)} wRVUs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Potential Additional Incentive:
                    </span>
                    <span className="text-gray-900 font-bold">
                      +{formatCurrency(adjustedIncentive - currentIncentive)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {adjustedIncentive > currentIncentive && (
        <div className="mt-3 pt-2 text-center border-t border-gray-300">
          <p className="text-xs text-gray-600 italic">
            *Potential increases shown with adjusted wRVU per encounter
          </p>
        </div>
      )}
      <div className="mt-2 pt-2 text-center border-t border-gray-300">
        <p className="text-xs text-gray-600">
          Generated by CompLens™ Provider Compensation Intelligence
        </p>
      </div>
      </div>
    </>
  );
}

