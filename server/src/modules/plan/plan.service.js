const planRepository = require('./plan.repository');
const planEngine = require('./plan.engine');

const formatDateKey = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate.toISOString().slice(0, 10);
};

const isValidPlanDataset = (plan) =>
  Boolean(
    plan &&
      Array.isArray(plan.days) &&
      plan.days.length >= 30 &&
      plan.days.every(
        (day) =>
          day &&
          day.date &&
          Array.isArray(day.classes) &&
          (
            ['scheduled', 'pending', 'rescheduled'].includes(day.status || 'scheduled')
              ? day.classes.length === 3
              : day.classes.length >= 0
          ),
      ),
  );

const getPlanByStudentId = async (studentId) => {
  let plan = await planRepository.findByStudentId(studentId);
  if (!isValidPlanDataset(plan)) {
    plan = await planEngine.generatePlan(studentId);
    await planRepository.create(plan);
  }
  return plan;
};

const updatePlanByStudentId = async (studentId, data) => {
  const normalizedPlan = {
    ...data,
    studentId,
    updatedAt: new Date().toISOString(),
    daysByDate:
      data.daysByDate ||
      (Array.isArray(data.days)
        ? data.days.reduce((accumulator, day) => {
            accumulator[day.dateKey || formatDateKey(day.date)] = {
              classes: day.classes || [],
              status: day.status || 'scheduled',
              dayNumber: day.dayNumber,
              date: day.date,
              leaveId: day.leaveId,
              leaveReason: day.leaveReason,
              missedClasses: day.missedClasses,
              modifiedBy: day.modifiedBy,
              modifiedAt: day.modifiedAt,
              rescheduledFrom: day.rescheduledFrom,
            };
            return accumulator;
          }, {})
        : {}),
  };

  return await planRepository.update(studentId, normalizedPlan);
};

module.exports = {
  getPlanByStudentId,
  updatePlanByStudentId,
};
