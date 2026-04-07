const planEngine = require('../modules/plan/plan.engine');

describe('Plan Engine', () => {
  test('should generate a 30-day timetable with three classes per day', async () => {
    const plan = await planEngine.generatePlan('student1');

    expect(plan).toBeDefined();
    expect(plan.studentId).toBe('student1');
    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days).toHaveLength(30);
    expect(plan.days[0].classes).toHaveLength(3);
    expect(plan.days[0].classes.map((entry) => entry.subject)).toEqual([
      'FSD',
      'ML',
      'DS',
    ]);
    expect(plan.daysByDate[plan.days[0].dateKey].classes).toHaveLength(3);
  });
});
