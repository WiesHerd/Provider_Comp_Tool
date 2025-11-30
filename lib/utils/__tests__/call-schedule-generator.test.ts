import {
  generateBaseCalendar,
  generateDefaultHolidays,
  generateCallSchedule,
  calculateBurdenFromSchedule,
} from '../call-schedule-generator';
import { CallSchedule } from '@/types/call-schedule';

describe('Call Schedule Generator', () => {
  describe('generateBaseCalendar', () => {
    it('should generate 365 days for a non-leap year', () => {
      const calendar = generateBaseCalendar(2023);
      expect(calendar).toHaveLength(365);
    });

    it('should generate 366 days for a leap year', () => {
      const calendar = generateBaseCalendar(2024);
      expect(calendar).toHaveLength(366);
    });

    it('should correctly classify weekdays and weekends', () => {
      const calendar = generateBaseCalendar(2024);
      
      // Check a known weekday (Jan 1, 2024 is a Monday)
      const monday = calendar.find(d => d.date.getDate() === 1 && d.date.getMonth() === 0);
      expect(monday?.type).toBe('weekday');
      
      // Check a known weekend (Jan 6, 2024 is a Saturday)
      const saturday = calendar.find(d => d.date.getDate() === 6 && d.date.getMonth() === 0);
      expect(saturday?.type).toBe('weekend');
    });

    it('should mark holidays correctly', () => {
      const holidays = [
        new Date(2024, 0, 1), // New Year's Day
        new Date(2024, 6, 4), // Independence Day
      ];
      const calendar = generateBaseCalendar(2024, holidays);
      
      const newYears = calendar.find(d => 
        d.date.getDate() === 1 && d.date.getMonth() === 0
      );
      expect(newYears?.type).toBe('holiday');
      
      const independenceDay = calendar.find(d => 
        d.date.getDate() === 4 && d.date.getMonth() === 6
      );
      expect(independenceDay?.type).toBe('holiday');
    });

    it('should have null providerId and tierId for all days initially', () => {
      const calendar = generateBaseCalendar(2024);
      calendar.forEach(day => {
        expect(day.providerId).toBeNull();
        expect(day.tierId).toBeNull();
      });
    });
  });

  describe('generateDefaultHolidays', () => {
    it('should generate holidays for a given year', () => {
      const holidays = generateDefaultHolidays(2024);
      expect(holidays.length).toBeGreaterThan(0);
    });

    it('should include New Year\'s Day', () => {
      const holidays = generateDefaultHolidays(2024);
      const newYears = holidays.find(h => 
        h.getMonth() === 0 && h.getDate() === 1
      );
      expect(newYears).toBeDefined();
    });

    it('should include Christmas', () => {
      const holidays = generateDefaultHolidays(2024);
      const christmas = holidays.find(h => 
        h.getMonth() === 11 && h.getDate() === 25
      );
      expect(christmas).toBeDefined();
    });
  });

  describe('generateCallSchedule', () => {
    const mockProviders = [
      { id: 'p1', name: 'Dr. Smith', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p2', name: 'Dr. Jones', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p3', name: 'Dr. Brown', fte: 0.5, tierId: 'C1', eligibleForCall: true },
      { id: 'p4', name: 'Dr. White', fte: 0.0, tierId: 'C1', eligibleForCall: false },
    ];

    const mockAssumptions = {
      weekdayCallsPerMonth: 5,
      weekendCallsPerMonth: 2,
      holidaysPerYear: 10,
    };

    it('should generate a schedule for the specified year', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: mockProviders,
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      expect(schedule.year).toBe(2024);
      expect(schedule.assignments.length).toBe(366); // 2024 is a leap year
    });

    it('should filter out ineligible providers', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: mockProviders,
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      // Count assignments
      const assignedDays = schedule.assignments.filter(a => a.providerId !== null);
      
      // Should have assignments
      expect(assignedDays.length).toBeGreaterThan(0);
      
      // None should be assigned to ineligible provider (p4)
      const ineligibleAssignments = assignedDays.filter(a => a.providerId === 'p4');
      expect(ineligibleAssignments.length).toBe(0);
    });

    it('should assign providers based on FTE weighting', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: mockProviders,
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      const assignedDays = schedule.assignments.filter(a => a.providerId !== null);
      
      // Count assignments per provider
      const p1Count = assignedDays.filter(a => a.providerId === 'p1').length;
      const p2Count = assignedDays.filter(a => a.providerId === 'p2').length;
      const p3Count = assignedDays.filter(a => a.providerId === 'p3').length;

      // p1 and p2 have same FTE (1.0), should have similar counts
      // p3 has 0.5 FTE, should have roughly half the assignments
      expect(p1Count).toBeGreaterThan(0);
      expect(p2Count).toBeGreaterThan(0);
      expect(p3Count).toBeGreaterThan(0);
      
      // p3 should have fewer assignments than p1 or p2
      expect(p3Count).toBeLessThan(p1Count);
      expect(p3Count).toBeLessThan(p2Count);
    });

    it('should set tierId for assigned days', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: mockProviders,
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      const assignedDays = schedule.assignments.filter(a => a.providerId !== null);
      assignedDays.forEach(day => {
        expect(day.tierId).toBe('C1');
      });
    });

    it('should return empty schedule if no eligible providers', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: [
          { id: 'p1', fte: 1.0, tierId: 'C1', eligibleForCall: false },
        ],
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      expect(schedule.assignments.length).toBe(366);
      const assignedDays = schedule.assignments.filter(a => a.providerId !== null);
      expect(assignedDays.length).toBe(0);
    });

    it('should distribute calls across weekday, weekend, and holiday types', () => {
      const schedule = generateCallSchedule({
        year: 2024,
        providers: mockProviders,
        assumptions: mockAssumptions,
        activeTierId: 'C1',
      });

      const assignedDays = schedule.assignments.filter(a => a.providerId !== null);
      
      const weekdayCalls = assignedDays.filter(a => a.type === 'weekday').length;
      const weekendCalls = assignedDays.filter(a => a.type === 'weekend').length;
      const holidayCalls = assignedDays.filter(a => a.type === 'holiday').length;

      // Should have assignments for each type
      expect(weekdayCalls).toBeGreaterThan(0);
      expect(weekendCalls).toBeGreaterThan(0);
      expect(holidayCalls).toBeGreaterThan(0);
    });
  });

  describe('calculateBurdenFromSchedule', () => {
    const mockProviders = [
      { id: 'p1', name: 'Dr. Smith', fte: 1.0, eligibleForCall: true },
      { id: 'p2', name: 'Dr. Jones', fte: 1.0, eligibleForCall: true },
    ];

    it('should calculate burden for each provider', () => {
      // Create a simple schedule
      const schedule: CallSchedule = {
        year: 2024,
        assignments: [
          { date: new Date(2024, 0, 1), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 2), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 3), type: 'weekend', providerId: 'p2', tierId: 'C1' },
          { date: new Date(2024, 0, 4), type: 'holiday', providerId: 'p2', tierId: 'C1' },
        ],
      };

      const { results, summary } = calculateBurdenFromSchedule(schedule, mockProviders);

      expect(results).toHaveLength(2);
      
      const p1Result = results.find(r => r.providerId === 'p1');
      expect(p1Result).toBeDefined();
      expect(p1Result?.weekdayCalls).toBe(2);
      expect(p1Result?.weekendCalls).toBe(0);
      expect(p1Result?.holidayCalls).toBe(0);
      expect(p1Result?.totalCalls).toBe(2);

      const p2Result = results.find(r => r.providerId === 'p2');
      expect(p2Result).toBeDefined();
      expect(p2Result?.weekdayCalls).toBe(0);
      expect(p2Result?.weekendCalls).toBe(1);
      expect(p2Result?.holidayCalls).toBe(1);
      expect(p2Result?.totalCalls).toBe(2);
    });

    it('should calculate group average correctly', () => {
      const schedule: CallSchedule = {
        year: 2024,
        assignments: [
          { date: new Date(2024, 0, 1), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 2), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 3), type: 'weekday', providerId: 'p2', tierId: 'C1' },
        ],
      };

      const { summary } = calculateBurdenFromSchedule(schedule, mockProviders);

      // Average = (2 + 1) / 2 = 1.5
      expect(summary.groupAverageCalls).toBe(1.5);
      expect(summary.averageCalls).toBe(1.5);
    });

    it('should calculate fairness metrics', () => {
      const schedule: CallSchedule = {
        year: 2024,
        assignments: [
          { date: new Date(2024, 0, 1), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 2), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 3), type: 'weekday', providerId: 'p2', tierId: 'C1' },
        ],
      };

      const { summary } = calculateBurdenFromSchedule(schedule, mockProviders);

      expect(summary.minCalls).toBe(1);
      expect(summary.maxCalls).toBe(2);
      expect(summary.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(summary.fairnessScore).toBeGreaterThanOrEqual(0);
      expect(summary.fairnessScore).toBeLessThanOrEqual(100);
      expect(summary.eligibleProviderCount).toBe(2);
    });

    it('should return empty results for no eligible providers', () => {
      const schedule: CallSchedule = {
        year: 2024,
        assignments: [
          { date: new Date(2024, 0, 1), type: 'weekday', providerId: 'p1', tierId: 'C1' },
        ],
      };

      const { results, summary } = calculateBurdenFromSchedule(schedule, [
        { id: 'p1', fte: 1.0, eligibleForCall: false },
      ]);

      expect(results).toHaveLength(0);
      expect(summary.eligibleProviderCount).toBe(0);
      expect(summary.fairnessScore).toBe(100); // Perfect fairness when no providers
    });

    it('should calculate burden index correctly', () => {
      const schedule: CallSchedule = {
        year: 2024,
        assignments: [
          { date: new Date(2024, 0, 1), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 2), type: 'weekday', providerId: 'p1', tierId: 'C1' },
          { date: new Date(2024, 0, 3), type: 'weekday', providerId: 'p2', tierId: 'C1' },
        ],
      };

      const { results } = calculateBurdenFromSchedule(schedule, mockProviders);

      const p1Result = results.find(r => r.providerId === 'p1')!;
      const p2Result = results.find(r => r.providerId === 'p2')!;

      // p1 has 2 calls, average is 1.5, so index = (2 - 1.5) / 1.5 * 100 = 33.33%
      expect(p1Result.burdenIndex).toBeGreaterThan(0);
      
      // p2 has 1 call, average is 1.5, so index = (1 - 1.5) / 1.5 * 100 = -33.33%
      expect(p2Result.burdenIndex).toBeLessThan(0);
    });
  });
});




