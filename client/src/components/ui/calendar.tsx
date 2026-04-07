"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaveHistory } from "../../features/leave/leave.api";
import { getStudyPlan } from "../../features/plan/plan.api";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalendarProps {
  initialDate?: Date;
  onDateSelect?: (date: Date) => void;
  showSelectedDateInfo?: boolean;
  className?: string;
  maxWidth?: string;
  studentId?: string;
}

type LeaveRecord = {
  id?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  reason?: string;
};

const subjects = ["FSD", "ML", "DS"];
const slotLabels = ["Class 1", "Class 2", "Class 3"];

const normalizeDate = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const formatDateKey = (date: Date) => normalizeDate(date).toISOString().slice(0, 10);

const sameDate = (left: Date, right: Date) =>
  normalizeDate(left).toDateString() === normalizeDate(right).toDateString();

const getFallbackClassesForDate = (date: Date) => {
  const seed = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
  const focusTopics = [
    "Core concepts and guided practice",
    "Applied examples and revision",
    "Problem-solving and recap",
    "Lab discussion and checkpoints",
  ];

  return subjects.map((subject, index) => ({
    subject,
    slot: slotLabels[index],
    topic: focusTopics[(seed + index) % focusTopics.length],
  }));
};

const getAssignedClassesForDate = (date: Date, plan: any) => {
  const fallbackClasses = getFallbackClassesForDate(date);

  if (!plan) {
    return fallbackClasses;
  }

  if (Array.isArray(plan.days)) {
    const matchedDay = plan.days.find(
      (day: any) => (day.dateKey || formatDateKey(new Date(day.date))) === formatDateKey(date),
    );

    if (matchedDay?.classes?.length) {
      return matchedDay.classes.map((entry: any, index: number) => ({
        subject: entry.subject || subjects[index] || `Class ${index + 1}`,
        slot: entry.slot || slotLabels[index] || `Class ${index + 1}`,
        topic:
          entry.topic ||
          entry.notes ||
          fallbackClasses[index % fallbackClasses.length].topic,
      }));
    }
  }

  return fallbackClasses;
};

const getLeaveStateForDate = (date: Date, leaves: LeaveRecord[]) => {
  const targetDate = normalizeDate(date);
  const today = normalizeDate(new Date());

  for (const leave of leaves) {
    if (!leave.startDate || !leave.endDate) {
      continue;
    }

    const start = normalizeDate(new Date(leave.startDate));
    const end = normalizeDate(new Date(leave.endDate));

    if (targetDate >= start && targetDate <= end) {
      const status = (leave.status || "pending").toLowerCase();

      if (status === "pending" || status === "on-hold") {
        return {
          tone: "pending",
          label: status === "on-hold" ? "On Hold" : "Pending Leave",
          reason:
            leave.reason ||
            (status === "on-hold"
              ? "Waiting for teacher follow-up"
              : "Awaiting faculty review"),
        };
      }

      if (status === "approved") {
        return targetDate <= today
          ? {
              tone: "absent",
              label: "Absent",
              reason: leave.reason || "Approved leave date",
            }
          : {
              tone: "approved",
              label: "Approved Leave",
              reason: leave.reason || "Upcoming approved leave",
            };
      }

      if (status === "rejected" || status === "declined") {
        return {
          tone: "rejected",
          label: "Rejected Leave",
          reason: leave.reason || "Leave request was rejected",
        };
      }

      return {
        tone: "pending",
        label: "Pending Leave",
        reason: leave.reason || "Leave request in progress",
      };
    }
  }

  return null;
};

const leaveToneClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-200 ring-1 ring-amber-300/70",
  absent: "bg-red-100 text-red-800 hover:bg-red-200 ring-1 ring-red-300/70",
  approved: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 ring-1 ring-emerald-300/70",
  rejected: "bg-slate-200 text-slate-700 hover:bg-slate-300 ring-1 ring-slate-300/70",
};

const leaveDotClasses: Record<string, string> = {
  pending: "bg-amber-500",
  absent: "bg-red-500",
  approved: "bg-emerald-500",
  rejected: "bg-slate-500",
};

const Calendar: React.FC<CalendarProps> = ({
  initialDate = new Date(),
  onDateSelect,
  showSelectedDateInfo = true,
  className = "",
  maxWidth = "max-w-2xl",
  studentId: propStudentId,
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const handleAcademicRefresh = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const activeStudentId =
        propStudentId || window.localStorage.getItem("student-id") || "local-student";

      if (!detail?.studentId || detail.studentId === activeStudentId) {
        setRefreshVersion((current) => current + 1);
      }
    };

    const handleStorageRefresh = (event: StorageEvent) => {
      if (event.key !== "academic-calendar-refresh" || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        const activeStudentId =
          propStudentId || window.localStorage.getItem("student-id") || "local-student";

        if (!payload?.studentId || payload.studentId === activeStudentId) {
          setRefreshVersion((current) => current + 1);
        }
      } catch (error) {
        console.error("Failed to parse academic refresh payload", error);
      }
    };

    window.addEventListener("academic-calendar-refresh", handleAcademicRefresh as EventListener);
    window.addEventListener("storage", handleStorageRefresh);

    return () => {
      window.removeEventListener(
        "academic-calendar-refresh",
        handleAcademicRefresh as EventListener,
      );
      window.removeEventListener("storage", handleStorageRefresh);
    };
  }, [propStudentId]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const studentId =
          propStudentId || window.localStorage.getItem("student-id") || "local-student";

        const [leaveData, planData] = await Promise.all([
          getLeaveHistory(studentId),
          getStudyPlan(studentId),
        ]);

        if (Array.isArray(leaveData)) {
          setLeaves(leaveData);
        }

        if (planData) {
          setPlan(planData);
        }
      } catch (error) {
        console.error("Failed to load calendar data", error);
      }
    };

    fetchCalendarData();
  }, [propStudentId, refreshVersion]);

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const calendarDate = new Date(startDate);
      calendarDate.setDate(startDate.getDate() + i);

      days.push({
        date: calendarDate,
        isCurrentMonth: calendarDate.getMonth() === month,
        isToday: calendarDate.toDateString() === today.toDateString(),
        isSelected: selectedDate
          ? calendarDate.toDateString() === selectedDate.toDateString()
          : false,
      });
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate, selectedDate]);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const selectedClasses = selectedDate
    ? getAssignedClassesForDate(selectedDate, plan)
    : [];
  const selectedLeaveState = selectedDate
    ? getLeaveStateForDate(selectedDate, leaves)
    : null;

  return (
    <motion.div
      initial={{ scale: 0.9, y: 10, filter: "blur(10px)" }}
      animate={{ scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-white rounded-2xl shadow-2xl p-8 w-full",
        maxWidth,
        className,
      )}
    >
      <motion.div
        initial={{ y: -10, filter: "blur(5px)" }}
        animate={{ y: 0, filter: "blur(0px)" }}
        className="flex items-center justify-between mb-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        <motion.h1
          key={currentDate.getMonth()}
          initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="text-3xl font-bold text-gray-800"
        >
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </motion.h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            className="p-3 text-center font-semibold text-gray-600"
          >
            {day}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        <AnimatePresence mode="wait">
          {days.map((day, index) => {
            const leaveState = getLeaveStateForDate(day.date, leaves);
            const assignedClasses = getAssignedClassesForDate(day.date, plan);

            return (
              <motion.button
                key={`${day.date.toDateString()}-${index}`}
                initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                transition={{ delay: index * 0.001 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(day.date)}
                className={cn(
                  "group relative p-4 rounded-lg text-center transition-all duration-200",
                  day.isCurrentMonth
                    ? "text-gray-800 hover:bg-blue-50"
                    : "text-gray-400 hover:bg-gray-50",
                  day.isToday ? "bg-blue-500 !text-white hover:bg-blue-600" : "",
                  day.isSelected && !day.isToday
                    ? "bg-blue-200 text-blue-800 hover:bg-blue-200"
                    : "",
                  leaveState ? leaveToneClasses[leaveState.tone] : "",
                )}
              >
                <span className="relative z-10">{day.date.getDate()}</span>

                {leaveState ? (
                  <span
                    className={cn(
                      "absolute right-2 top-2 h-2.5 w-2.5 rounded-full",
                      leaveDotClasses[leaveState.tone],
                    )}
                  />
                ) : null}

                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-4 w-72 -translate-x-1/2 overflow-hidden rounded-[1.25rem] border border-slate-700/80 bg-[#060b1f] p-0 text-left text-xs text-white opacity-0 shadow-[0_24px_70px_rgba(2,6,23,0.65)] transition-all duration-300 group-hover:opacity-100">
                  <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-300">
                    <div className="text-sm font-semibold tracking-wide">
                      {day.date.toDateString()}
                    </div>
                    {leaveState ? (
                      <div className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                        {leaveState.label}
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">
                        Active Classes
                      </div>
                    )}
                  </div>

                  {leaveState ? (
                    <div className="space-y-2 px-4 py-4">
                      <p className="text-sm font-semibold text-white">{leaveState.label}</p>
                      <p className="leading-5 text-slate-300">{leaveState.reason}</p>
                      <p className="text-[11px] leading-5 text-slate-400">
                        Missed classes are rescheduled after leave handling.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0 px-4 py-3">
                      {assignedClasses.map((entry: any, classIndex: number) => (
                        <div
                          key={`${entry.subject}-${classIndex}`}
                          className={cn(
                            "flex flex-col py-3",
                            classIndex < assignedClasses.length - 1
                              ? "border-b border-slate-800"
                              : "",
                          )}
                        >
                          <span className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
                            {entry.slot || slotLabels[classIndex]}
                          </span>
                          <span className="mt-1 text-xl font-bold leading-none text-[#7bc0ff]">
                            {entry.subject}
                          </span>
                          <span className="mt-2 text-sm leading-5 text-slate-300">
                            {entry.topic || "Scheduled class"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-[8px] border-transparent border-t-[#060b1f]" />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {showSelectedDateInfo && selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="mt-8 rounded-lg bg-gray-50 p-4"
        >
          <p className="text-gray-600">
            Selected:{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {selectedClasses.map((entry: any, index: number) => (
              <div
                key={`${entry.subject}-${index}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  {entry.slot || slotLabels[index]}
                </p>
                <p className="mt-2 font-semibold text-gray-800">{entry.subject}</p>
                <p className="mt-1 text-sm text-gray-600">{entry.topic}</p>
              </div>
            ))}
          </div>

          {selectedLeaveState ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {selectedLeaveState.label}: {selectedLeaveState.reason}
            </div>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Calendar;
