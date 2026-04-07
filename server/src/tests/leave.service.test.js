const leaveService = require('../modules/leave/leave.service');
const planService = require('../modules/plan/plan.service');

describe('Leave Service', () => {
  test('should submit leave', async () => {
    const data = {
      studentId: 'leave-test-student',
      studentName: 'Test Student',
      reason: 'Sick',
      startDate: '2026-04-10T00:00:00.000Z',
      endDate: '2026-04-12T00:00:00.000Z',
      fromDate: '2026-04-10',
      toDate: '2026-04-12',
      numberOfDays: 3,
    };
    const leave = await leaveService.submitLeave(data);
    expect(leave).toBeDefined();
    expect(leave.status).toBe('pending');
  });

  test('approving leave updates the stored timetable with rescheduled days', async () => {
    const data = {
      studentId: 'approval-test-student',
      studentName: 'Approval Student',
      reason: 'Medical leave',
      startDate: '2026-04-10T00:00:00.000Z',
      endDate: '2026-04-12T00:00:00.000Z',
      fromDate: '2026-04-10',
      toDate: '2026-04-12',
      numberOfDays: 3,
    };

    const leave = await leaveService.submitLeave(data);
    const approvedLeave = await leaveService.updateLeaveStatus(leave.id, 'approved');
    const plan = await planService.getPlanByStudentId(data.studentId);

    expect(approvedLeave.status).toBe('approved');
    expect(approvedLeave.planAdjustedApproved).toBe(true);
    expect(Array.isArray(plan.days)).toBe(true);
    expect(plan.days.length).toBeGreaterThan(30);
    expect(plan.days.some((day) => day.leaveId === leave.id && day.status !== 'scheduled')).toBe(true);
    expect(plan.days.some((day) => day.leaveId === leave.id && day.status === 'rescheduled')).toBe(true);
  });
});
