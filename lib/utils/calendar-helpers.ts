/**
 * Calendar Helper Utilities
 * Functions for date manipulation, formatting, and calendar calculations
 */

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  addDays,
  subDays,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  differenceInDays,
  startOfYear,
  endOfYear,
} from 'date-fns';

export type DateString = string; // Format: YYYY-MM-DD

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): DateString {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateString(dateString: DateString): Date {
  return parseISO(dateString);
}

/**
 * Check if date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return isValid(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  } catch {
    return false;
  }
}

/**
 * Get all days in a week (Monday to Sunday)
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

/**
 * Get all days in a month
 */
export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

/**
 * Get weeks in a month (array of week arrays)
 */
export function getWeeksInMonth(date: Date): Date[][] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeks: Date[][] = [];
  
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  return weeks;
}

/**
 * Check if a date is a vacation, CME, or holiday date
 */
export function isVacationDate(
  dateString: DateString,
  vacationDates?: DateString[]
): boolean {
  return vacationDates?.includes(dateString) ?? false;
}

export function isCMEDate(
  dateString: DateString,
  cmeDates?: DateString[]
): boolean {
  return cmeDates?.includes(dateString) ?? false;
}

export function isHolidayDate(
  dateString: DateString,
  holidayDates?: DateString[]
): boolean {
  return holidayDates?.includes(dateString) ?? false;
}

/**
 * Check if a date is a non-working day (vacation, CME, or holiday)
 */
export function isNonWorkingDay(
  dateString: DateString,
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): boolean {
  return (
    isVacationDate(dateString, vacationDates) ||
    isCMEDate(dateString, cmeDates) ||
    isHolidayDate(dateString, holidayDates)
  );
}

/**
 * Count working days in a date range (excluding weekends and non-working days)
 */
export function countWorkingDays(
  startDate: Date,
  endDate: Date,
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter((day) => {
    const dateStr = formatDateString(day);
    return (
      !isWeekend(day) &&
      !isNonWorkingDay(dateStr, vacationDates, cmeDates, holidayDates)
    );
  }).length;
}

/**
 * Sync calendar dates to number inputs
 * Converts specific dates to counts
 */
export function syncCalendarToNumbers(
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): {
  vacationWeeks: number;
  cmeDays: number;
  statutoryHolidays: number;
} {
  // Count unique vacation weeks (group consecutive dates into weeks)
  const vacationWeeks = calculateVacationWeeks(vacationDates || []);
  
  return {
    vacationWeeks,
    cmeDays: cmeDates?.length || 0,
    statutoryHolidays: holidayDates?.length || 0,
  };
}

/**
 * Calculate vacation weeks from vacation dates
 * Groups consecutive dates and counts weeks
 */
function calculateVacationWeeks(vacationDates: DateString[]): number {
  if (vacationDates.length === 0) return 0;
  
  // Sort dates
  const sorted = [...vacationDates].sort();
  
  // Group consecutive dates
  const groups: DateString[][] = [];
  let currentGroup: DateString[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = parseDateString(sorted[i - 1]);
    const currDate = parseDateString(sorted[i]);
    const daysDiff = differenceInDays(currDate, prevDate);
    
    if (daysDiff === 1) {
      // Consecutive day
      currentGroup.push(sorted[i]);
    } else {
      // New group
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  
  // Calculate total weeks (7 days = 1 week)
  const totalDays = vacationDates.length;
  return Math.round((totalDays / 7) * 10) / 10; // Round to 1 decimal
}

/**
 * Sync number inputs to calendar dates
 * Distributes days evenly across the year or allows user selection
 */
export function syncNumbersToCalendar(
  vacationWeeks: number,
  cmeDays: number,
  statutoryHolidays: number,
  year: number = new Date().getFullYear()
): {
  vacationDates: DateString[];
  cmeDates: DateString[];
  statutoryHolidayDates: DateString[];
} {
  // For now, return empty arrays - user will select specific dates in calendar
  // This function can be enhanced later to auto-distribute dates
  return {
    vacationDates: [],
    cmeDates: [],
    statutoryHolidayDates: [],
  };
}

/**
 * Get date type (vacation, CME, holiday, or null)
 */
export function getDateType(
  dateString: DateString,
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): 'vacation' | 'cme' | 'holiday' | null {
  if (isVacationDate(dateString, vacationDates)) return 'vacation';
  if (isCMEDate(dateString, cmeDates)) return 'cme';
  if (isHolidayDate(dateString, holidayDates)) return 'holiday';
  return null;
}

/**
 * Analyze calendar data coverage
 * Returns information about how much data is available
 */
export function analyzeCalendarDataCoverage(
  dailyPatientCounts: Record<DateString, number>,
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): {
  totalDaysWithData: number;
  dateRange: { start: Date | null; end: Date | null };
  monthsCovered: number;
  coveragePercentage: number;
  isFullYear: boolean;
  workingDaysWithData: number;
} {
  const datesWithData = Object.keys(dailyPatientCounts)
    .filter((dateStr) => {
      const count = dailyPatientCounts[dateStr];
      return count > 0 && !isNonWorkingDay(dateStr, vacationDates, cmeDates, holidayDates);
    })
    .map((dateStr) => parseDateString(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  if (datesWithData.length === 0) {
    return {
      totalDaysWithData: 0,
      dateRange: { start: null, end: null },
      monthsCovered: 0,
      coveragePercentage: 0,
      isFullYear: false,
      workingDaysWithData: 0,
    };
  }

  const start = datesWithData[0];
  const end = datesWithData[datesWithData.length - 1];
  
  // Count unique months
  const months = new Set<string>();
  datesWithData.forEach((date) => {
    months.add(format(date, 'yyyy-MM'));
  });

  // Calculate coverage for current year
  const yearStart = startOfYear(start);
  const yearEnd = endOfYear(start);
  const totalWorkingDaysInYear = countWorkingDays(yearStart, yearEnd, vacationDates, cmeDates, holidayDates);
  const coveragePercentage = totalWorkingDaysInYear > 0 
    ? (datesWithData.length / totalWorkingDaysInYear) * 100 
    : 0;

  // Check if we have a full year (at least 80% coverage)
  const isFullYear = coveragePercentage >= 80;

  return {
    totalDaysWithData: datesWithData.length,
    dateRange: { start, end },
    monthsCovered: months.size,
    coveragePercentage,
    isFullYear,
    workingDaysWithData: datesWithData.length,
  };
}

/**
 * Calculate total patients from calendar data with annualization info
 */
export function calculateTotalPatientsFromCalendar(
  dailyPatientCounts: Record<DateString, number>,
  vacationDates?: DateString[],
  cmeDates?: DateString[],
  holidayDates?: DateString[]
): {
  totalPatients: number;
  workingDays: number;
  averagePerDay: number;
  coverage: ReturnType<typeof analyzeCalendarDataCoverage>;
} {
  const workingDays = Object.keys(dailyPatientCounts).filter(
    (dateStr) => !isNonWorkingDay(dateStr, vacationDates, cmeDates, holidayDates)
  );
  
  const totalPatients = workingDays.reduce(
    (sum, dateStr) => sum + (dailyPatientCounts[dateStr] || 0),
    0
  );
  
  const averagePerDay = workingDays.length > 0 ? totalPatients / workingDays.length : 0;

  const coverage = analyzeCalendarDataCoverage(dailyPatientCounts, vacationDates, cmeDates, holidayDates);
  
  return {
    totalPatients,
    workingDays: workingDays.length,
    averagePerDay,
    coverage,
  };
}
