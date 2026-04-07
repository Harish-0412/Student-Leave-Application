import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/ui/calendar';
import { Button } from '../components/ui/button';
import { Sparkles, CalendarClock, AlertTriangle, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { getLeaveHistory } from '../features/leave/leave.api';

function StudentDashboardPage() {
  const [leaves, setLeaves] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [calendarRefreshVersion, setCalendarRefreshVersion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const studentId = window.localStorage.getItem('student-id') || 'local-student';
        const responseData = await getLeaveHistory(studentId);
        if (Array.isArray(responseData)) {
          setLeaves(responseData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
        }
      } catch(e) {
        console.error(e);
      }
    };

    const handleAcademicRefresh = (event) => {
      const studentId = window.localStorage.getItem('student-id') || 'local-student';
      const refreshedStudentId = event?.detail?.studentId;

      if (!refreshedStudentId || refreshedStudentId === studentId) {
        fetchLeaves();
        setCalendarRefreshVersion((current) => current + 1);
      }
    };

    const handleStorageRefresh = (event) => {
      if (event.key !== 'academic-calendar-refresh' || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        const studentId = window.localStorage.getItem('student-id') || 'local-student';

        if (!payload?.studentId || payload.studentId === studentId) {
          fetchLeaves();
          setCalendarRefreshVersion((current) => current + 1);
        }
      } catch (error) {
        console.error('Failed to parse calendar refresh payload', error);
      }
    };

    fetchLeaves();

    window.addEventListener('academic-calendar-refresh', handleAcademicRefresh);
    window.addEventListener('storage', handleStorageRefresh);

    return () => {
      window.removeEventListener('academic-calendar-refresh', handleAcademicRefresh);
      window.removeEventListener('storage', handleStorageRefresh);
    };
  }, []);

  const latestLeave = leaves[0];

  const handleRescheduleExplanation = async () => {
    setIsAiLoading(true);
    // Logic for AI explanation would go here
    setTimeout(() => {
      setAiReport("Your curriculum has been adjusted to ensure no topics are missed. Key subjects like 'Database Systems' have been moved to next week's morning slots.");
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500 mb-3">
            Your Schedule
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Academic Calendar
          </h1>
          <p className="mt-4 text-lg text-muted-foreground mx-auto max-w-2xl">
            Keep track of your classes and topics. Select a date or see your mapped rescheduled tasks safely curated by AI.
          </p>
        </div>

        {latestLeave && (
          <div className={`mb-12 rounded-[2.5rem] border p-8 shadow-xl flex flex-wrap items-center justify-between gap-6 animate-in slide-in-from-top-6 duration-700 ${
            latestLeave.status === 'pending' ? 'bg-amber-500/5 border-amber-500/20' :
            latestLeave.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
            latestLeave.status === 'on-hold' ? 'bg-blue-500/5 border-blue-500/20' :
            'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${
                latestLeave.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                latestLeave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                latestLeave.status === 'on-hold' ? 'bg-blue-500/10 text-blue-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {latestLeave.status === 'pending' ? <Clock className="w-8 h-8 animate-spin-slow" /> :
                 latestLeave.status === 'approved' ? <CheckCircle2 className="w-8 h-8" /> :
                 latestLeave.status === 'on-hold' ? <AlertTriangle className="w-8 h-8" /> :
                 <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  Leave Application: {latestLeave.status === 'pending' ? 'Waiting for Approval' : latestLeave.status.charAt(0).toUpperCase() + latestLeave.status.slice(1)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {latestLeave.reason} • {new Date(latestLeave.startDate).toLocaleDateString()} to {new Date(latestLeave.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/leave/preview?leaveId=${latestLeave.id}`)}
              className="rounded-2xl px-6 h-12 font-bold group border-border hover:border-blue-500 transition-all"
            >
              View Application <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 bg-card rounded-[3rem] border border-border p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <CalendarClock className="w-64 h-64 text-blue-600" />
            </div>
            <Calendar key={calendarRefreshVersion} className="relative z-10" />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">AI Reschedule Review</h2>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Click below to let Groq analyze your upcoming schedule and explain how your missed classes have been balanced.
                </p>

                {aiReport ? (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6 animate-in zoom-in-95 duration-500">
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed italic">
                      "{aiReport}"
                    </p>
                  </div>
                ) : null}

                <Button 
                  onClick={handleRescheduleExplanation}
                  disabled={isAiLoading}
                  className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
                >
                  {isAiLoading ? "Analyzing Schedule..." : "Review Reschedule"}
                </Button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <AlertTriangle className="w-20 h-20" />
              </div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Quick Tip
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Hover over any calendar date to see specific class topics. AI-rescheduled tasks will appear with a distinct badge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
