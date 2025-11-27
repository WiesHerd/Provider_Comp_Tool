/**
 * Call Schedule Generator
 * 
 * Pure functions for generating and managing call schedules.
 */

import { 
  CallDayAssignment, 
  CallSchedule, 
  GenerateScheduleOptions,
  ScheduleBurdenResult,
  ScheduleFairnessSummary,
  CallDayType
} from '@/types/call-schedule';
import { startOfYear, endOfYear, eachDayOfInterval, isWeekend, format } from 'date-fns';

/**
 * Generate base calendar for a year with day types
 */
export function generateBaseCalendar(year: number, holidays: Date[] = []): CallDayAssignment[] {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  const days = eachDayOfInterval({ start, end });
  
  // Create a Set of holiday dates for quick lookup (normalize to date string)
  const holidaySet = new Set(
    holidays.map(h => format(h, 'yyyy-MM-dd'))
  );

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let type: CallDayType = 'weekday';
    
    if (holidaySet.has(dateStr)) {
      type = 'holiday';
    } else if (isWeekend(date)) {
      type = 'weekend';
    }
    
    return {
      date: new Date(date),
      type,
      tierAssignments: [], // Will be populated with tier assignments
    };
  });
}

/**
 * Generate default holidays for a year (US federal holidays)
 * This is a simple implementation - can be extended
 */
export function generateDefaultHolidays(year: number): Date[] {
  const holidays: Date[] = [];
  
  // New Year's Day
  holidays.push(new Date(year, 0, 1));
  
  // Memorial Day (last Monday in May)
  const memorialDay = new Date(year, 4, 31);
  while (memorialDay.getDay() !== 1) {
    memorialDay.setDate(memorialDay.getDate() - 1);
  }
  holidays.push(new Date(memorialDay));
  
  // Independence Day
  holidays.push(new Date(year, 6, 4));
  
  // Labor Day (first Monday in September)
  const laborDay = new Date(year, 8, 1);
  while (laborDay.getDay() !== 1) {
    laborDay.setDate(laborDay.getDate() + 1);
  }
  holidays.push(new Date(laborDay));
  
  // Thanksgiving (fourth Thursday in November)
  const thanksgiving = new Date(year, 10, 1);
  let thursdayCount = 0;
  while (thursdayCount < 4) {
    if (thanksgiving.getDay() === 4) {
      thursdayCount++;
    }
    if (thursdayCount < 4) {
      thanksgiving.setDate(thanksgiving.getDate() + 1);
    }
  }
  holidays.push(new Date(thanksgiving));
  
  // Christmas
  holidays.push(new Date(year, 11, 25));
  
  return holidays;
}

/**
 * Generate a call schedule based on providers, assumptions, and year
 */
export function generateCallSchedule(options: GenerateScheduleOptions): CallSchedule {
  const {
    year,
    providers,
    assumptions,
    activeTierId,
    holidays = generateDefaultHolidays(year),
  } = options;

  // Filter to eligible providers only
  const eligibleProviders = providers.filter(p => p.eligibleForCall);
  
  if (eligibleProviders.length === 0) {
    // Return empty schedule if no eligible providers
    const baseCalendar = generateBaseCalendar(year, holidays);
    return {
      year,
      assignments: baseCalendar,
    };
  }

  // Generate base calendar
  const assignments = generateBaseCalendar(year, holidays);

  // Calculate target calls
  const targetWeekdayCalls = assumptions.weekdayCallsPerMonth * 12;
  const targetWeekendCalls = assumptions.weekendCallsPerMonth * 12;
  const targetHolidayCalls = assumptions.holidaysPerYear;

  // Get days by type
  const weekdayDays = assignments.filter(a => a.type === 'weekday');
  const weekendDays = assignments.filter(a => a.type === 'weekend');
  const holidayDays = assignments.filter(a => a.type === 'holiday');

  // Select days for call assignments (evenly distributed)
  const selectedWeekdays = selectDaysEvenly(weekdayDays, targetWeekdayCalls);
  const selectedWeekends = selectDaysEvenly(weekendDays, targetWeekendCalls);
  const selectedHolidays = selectDaysEvenly(holidayDays, targetHolidayCalls);

  // Calculate provider weights based on FTE
  const totalFTE = eligibleProviders.reduce((sum, p) => sum + p.fte, 0);
  const providerWeights = eligibleProviders.map(p => ({
    provider: p,
    weight: p.fte / totalFTE,
    cumulativeWeight: 0, // Will be set below
  }));

  // Calculate cumulative weights for weighted round-robin
  let cumulative = 0;
  providerWeights.forEach(pw => {
    cumulative += pw.weight;
    pw.cumulativeWeight = cumulative;
  });

  // Assign providers using weighted round-robin
  const allSelectedDays = [
    ...selectedWeekdays.map(d => ({ day: d, type: 'weekday' as const })),
    ...selectedWeekends.map(d => ({ day: d, type: 'weekend' as const })),
    ...selectedHolidays.map(d => ({ day: d, type: 'holiday' as const })),
  ];

  // Shuffle to distribute evenly across the year
  const shuffled = shuffleArray([...allSelectedDays]);

  // Assign providers using weighted distribution
  // For now, assign only to the active tier (C1, C2, etc.)
  // Each tier will get its own provider assignment
  shuffled.forEach(({ day }, index) => {
    const provider = selectProviderByWeight(providerWeights, index, shuffled.length);
    // Create tier assignment for the active tier
    if (activeTierId) {
      day.tierAssignments = [{
        tierId: activeTierId,
        providerId: provider.id,
      }];
    }
  });

  return {
    year,
    assignments,
  };
}

/**
 * Select days evenly distributed across the array
 */
function selectDaysEvenly(days: CallDayAssignment[], count: number): CallDayAssignment[] {
  if (count >= days.length) {
    return days;
  }
  
  const selected: CallDayAssignment[] = [];
  const step = days.length / count;
  
  for (let i = 0; i < count; i++) {
    const index = Math.round(i * step);
    if (index < days.length) {
      selected.push(days[index]);
    }
  }
  
  return selected;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select provider using weighted round-robin
 */
function selectProviderByWeight(
  providerWeights: Array<{ provider: { id: string }; weight: number; cumulativeWeight: number }>,
  index: number,
  total: number
): { id: string } {
  // Use index to create a pseudo-random but weighted selection
  const normalizedIndex = (index / total) % 1;
  
  for (const pw of providerWeights) {
    if (normalizedIndex < pw.cumulativeWeight) {
      return pw.provider;
    }
  }
  
  // Fallback to last provider
  return providerWeights[providerWeights.length - 1].provider;
}

/**
 * Calculate burden metrics from actual schedule assignments
 */
export function calculateBurdenFromSchedule(
  schedule: CallSchedule,
  providers: Array<{ id: string; name?: string; fte: number; eligibleForCall: boolean }>
): {
  results: ScheduleBurdenResult[];
  summary: ScheduleFairnessSummary;
} {
  // Filter to eligible providers
  const eligibleProviders = providers.filter(p => p.eligibleForCall);
  
  if (eligibleProviders.length === 0) {
    return {
      results: [],
      summary: {
        groupAverageCalls: 0,
        minCalls: 0,
        maxCalls: 0,
        averageCalls: 0,
        standardDeviation: 0,
        fairnessScore: 100,
        eligibleProviderCount: 0,
      },
    };
  }

  // Count calls per provider
  const callCounts = new Map<string, { weekday: number; weekend: number; holiday: number }>();
  
  eligibleProviders.forEach(p => {
    callCounts.set(p.id, { weekday: 0, weekend: 0, holiday: 0 });
  });

  schedule.assignments.forEach(assignment => {
    // Count calls for each tier assignment
    assignment.tierAssignments.forEach(tierAssignment => {
      if (tierAssignment.providerId && callCounts.has(tierAssignment.providerId)) {
        const counts = callCounts.get(tierAssignment.providerId)!;
        if (assignment.type === 'weekday') {
          counts.weekday++;
        } else if (assignment.type === 'weekend') {
          counts.weekend++;
        } else if (assignment.type === 'holiday') {
          counts.holiday++;
        }
      }
    });
  });

  // Build results
  const results: ScheduleBurdenResult[] = eligibleProviders.map(provider => {
    const counts = callCounts.get(provider.id)!;
    const totalCalls = counts.weekday + counts.weekend + counts.holiday;
    
    return {
      providerId: provider.id,
      providerName: provider.name,
      fte: provider.fte,
      weekdayCalls: counts.weekday,
      weekendCalls: counts.weekend,
      holidayCalls: counts.holiday,
      totalCalls,
      burdenIndex: 0, // Will be calculated below
    };
  });

  // Calculate group average
  const totalCalls = results.reduce((sum, r) => sum + r.totalCalls, 0);
  const groupAverageCalls = totalCalls / results.length;

  // Calculate burden index for each provider
  results.forEach(result => {
    result.burdenIndex = groupAverageCalls > 0
      ? ((result.totalCalls - groupAverageCalls) / groupAverageCalls) * 100
      : 0;
  });

  // Calculate summary metrics
  const calls = results.map(r => r.totalCalls);
  const minCalls = Math.min(...calls);
  const maxCalls = Math.max(...calls);
  
  // Standard deviation
  const variance = results.reduce((sum, r) => {
    const diff = r.totalCalls - groupAverageCalls;
    return sum + (diff * diff);
  }, 0) / results.length;
  const standardDeviation = Math.sqrt(variance);

  // Fairness score
  let fairnessScore = 100;
  if (groupAverageCalls > 0) {
    const coefficientOfVariation = standardDeviation / groupAverageCalls;
    fairnessScore = Math.max(0, Math.min(100, 100 * (1 - coefficientOfVariation * 2)));
  }

  const summary: ScheduleFairnessSummary = {
    groupAverageCalls,
    minCalls,
    maxCalls,
    averageCalls: groupAverageCalls,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    fairnessScore: Math.round(fairnessScore * 10) / 10,
    eligibleProviderCount: results.length,
  };

  return { results, summary };
}

