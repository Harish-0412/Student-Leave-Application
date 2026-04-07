const leaveRepository = require('./leave.repository');
const leaveLetterBuilder = require('./leave.letter-builder');
const planService = require('../plan/plan.service');

const formatDateKey = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
};

const parseDateInput = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

const normalizeDate = (value) => {
  const date = parseDateInput(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const rebuildDaysByDate = (days = []) =>
  days.reduce((accumulator, day) => {
    const dateKey = day.dateKey || formatDateKey(new Date(day.date));
    accumulator[dateKey] = {
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
  }, {});

const iterateDateRange = (fromDate, toDate) => {
  const days = [];
  const current = normalizeDate(fromDate);
  const end = normalizeDate(toDate);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

const markPendingDatesOnPlan = async (leave) => {
  const plan = await planService.getPlanByStudentId(leave.studentId);
  const dateKeys = iterateDateRange(leave.fromDate || leave.startDate, leave.toDate || leave.endDate).map(
    (date) => formatDateKey(date),
  );

  const updatedDays = plan.days.map((day) => {
    if (!dateKeys.includes(day.dateKey)) {
      return day;
    }

    return {
      ...day,
      status: 'pending',
      leaveId: leave.id,
      leaveReason: leave.reason || '',
    };
  });

  return await planService.updatePlanByStudentId(leave.studentId, {
    ...plan,
    days: updatedDays,
    daysByDate: rebuildDaysByDate(updatedDays),
  });
};

const applyApprovedLeaveToPlan = async (leave) => {
  const plan = await planService.getPlanByStudentId(leave.studentId);

  if (leave.planAdjustedApproved) {
    return plan;
  }

  const dateRange = iterateDateRange(leave.fromDate || leave.startDate, leave.toDate || leave.endDate);
  const dateKeys = dateRange.map((date) => formatDateKey(date));
  const today = normalizeDate(new Date());
  const missedDayEntries = [];

  const updatedDays = plan.days.map((day) => {
    if (!dateKeys.includes(day.dateKey)) {
      return day;
    }

    const absentStatus = normalizeDate(day.date) <= today ? 'absent' : 'approved';
    const classes = Array.isArray(day.classes) ? day.classes : [];

    missedDayEntries.push({
      sourceDateKey: day.dateKey,
      sourceDate: day.date,
      classes,
    });

    return {
      ...day,
      status: absentStatus,
      leaveId: leave.id,
      leaveReason: leave.reason || '',
      missedClasses: classes,
      classes: [],
    };
  });

  let lastDate = updatedDays.length > 0
    ? normalizeDate(updatedDays[updatedDays.length - 1].date)
    : normalizeDate(new Date());

  const appendedDays = missedDayEntries.map((entry, index) => {
    lastDate = new Date(lastDate);
    lastDate.setDate(lastDate.getDate() + 1);
    const nextDate = new Date(lastDate);
    const dateKey = formatDateKey(nextDate);

    return {
      date: nextDate.toISOString(),
      dateKey,
      dayNumber: updatedDays.length + index + 1,
      status: 'rescheduled',
      leaveId: leave.id,
      rescheduledFrom: entry.sourceDateKey,
      classes: entry.classes.map((classEntry) => ({
        ...classEntry,
        rescheduledFrom: entry.sourceDateKey,
      })),
      leaveReason: leave.reason || '',
    };
  });

  const finalDays = [...updatedDays, ...appendedDays];

  return await planService.updatePlanByStudentId(leave.studentId, {
    ...plan,
    days: finalDays,
    daysByDate: rebuildDaysByDate(finalDays),
  });
};

const clearPendingDatesFromPlan = async (leave) => {
  const plan = await planService.getPlanByStudentId(leave.studentId);
  const dateKeys = iterateDateRange(leave.fromDate || leave.startDate, leave.toDate || leave.endDate).map(
    (date) => formatDateKey(date),
  );

  const updatedDays = plan.days.map((day) => {
    if (!dateKeys.includes(day.dateKey) || day.leaveId !== leave.id || day.status !== 'pending') {
      return day;
    }

    const { leaveId, leaveReason, ...rest } = day;

    return {
      ...rest,
      status: 'scheduled',
    };
  });

  return await planService.updatePlanByStudentId(leave.studentId, {
    ...plan,
    days: updatedDays,
    daysByDate: rebuildDaysByDate(updatedDays),
  });
};

const submitLeave = async (data) => {
  const letter = await leaveLetterBuilder.buildLetter(data);
  const leaveData = {
    ...data,
    letter,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  const savedLeave = await leaveRepository.create(leaveData);
  await markPendingDatesOnPlan(savedLeave);
  return savedLeave;
};

const getLeavesByStudentId = async (studentId) => {
  return await leaveRepository.findByStudentId(studentId);
};

const getLeaveById = async (leaveId) => {
  return await leaveRepository.findById(leaveId);
};

const getAllLeaves = async () => {
  return await leaveRepository.findAll();
};

const updateLeaveStatus = async (leaveId, status) => {
  const currentLeave = await leaveRepository.findById(leaveId);

  if (!currentLeave) {
    const error = new Error('Leave application not found.');
    error.status = 404;
    throw error;
  }

  const normalizedStatus = (status || '').toLowerCase();
  let planAdjustedApproved = currentLeave.planAdjustedApproved || false;

  if (normalizedStatus === 'approved' && !planAdjustedApproved) {
    await applyApprovedLeaveToPlan({
      ...currentLeave,
      status: normalizedStatus,
    });
    planAdjustedApproved = true;
  } else if (normalizedStatus === 'pending' || normalizedStatus === 'on-hold') {
    await markPendingDatesOnPlan({
      ...currentLeave,
      status: normalizedStatus,
    });
  } else if ((normalizedStatus === 'declined' || normalizedStatus === 'rejected') && !planAdjustedApproved) {
    await clearPendingDatesFromPlan({
      ...currentLeave,
      status: normalizedStatus,
    });
  }

  return await leaveRepository.update(leaveId, {
    status: normalizedStatus,
    planAdjustedApproved,
    updatedAt: new Date().toISOString(),
  });
};

module.exports = {
  submitLeave,
  getLeavesByStudentId,
  getLeaveById,
  getAllLeaves,
  updateLeaveStatus,
};
