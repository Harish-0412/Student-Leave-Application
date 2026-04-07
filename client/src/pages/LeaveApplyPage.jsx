import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/range-calendar';
import LeaveDraftStudio from '../components/leave/LeaveDraftStudio';
import { submitLeaveApplication, getLeaveImpact, suggestLeaveReasons } from '../features/leave/leave.api';
import { getCurrentSession, recordAuthenticatedActivity } from '../features/auth/auth.api';

function LeaveApplyPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 2)),
  });
  const [reason, setReason] = useState('');
  const [supportingDetails, setSupportingDetails] = useState('');
  const [contactWhileAway, setContactWhileAway] = useState('');
  const [draftPayload, setDraftPayload] = useState({
    finalDrafts: {},
    generatedDrafts: {},
    tone: 'formal',
    format: 'email',
    userEdits: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedLeave, setSubmittedLeave] = useState(null);
  const [leaveImpact, setLeaveImpact] = useState(null);
  const [analyzingImpact, setAnalyzingImpact] = useState(false);
  const [reasonSuggestions, setReasonSuggestions] = useState([]);
  const [suggestingReason, setSuggestingReason] = useState(false);
  const session = getCurrentSession();

  const calculateDays = () => {
    if (dateRange?.from && dateRange?.to) {
      const diffTime = Math.abs(dateRange.to - dateRange.from);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const daysCount = calculateDays();

  const leavePayload = useMemo(
    () => ({
      reason,
      fromDate: dateRange?.from?.toLocaleDateString('en-CA') || '',
      toDate: dateRange?.to?.toLocaleDateString('en-CA') || '',
      numberOfDays: daysCount,
      supportingDetails,
      contactWhileAway,
    }),
    [contactWhileAway, dateRange, daysCount, reason, supportingDetails],
  );

  const studentContext = useMemo(
    () => ({
      studentId: session?.user?.studentId || window.localStorage.getItem('student-id') || 'local-student',
      fullName: session?.user?.fullName || window.localStorage.getItem('student-name') || 'Student',
      email: session?.user?.email || window.localStorage.getItem('student-login-email') || '',
      department: session?.user?.department || 'Computer Science',
      semester: session?.user?.semester || 'Current Semester',
    }),
    [session],
  );

  useEffect(() => {
    const fetchImpact = async () => {
      if (dateRange?.from && dateRange?.to) {
        setAnalyzingImpact(true);
        try {
          const impact = await getLeaveImpact({
            student: studentContext,
            leave: leavePayload,
          });
          setLeaveImpact(impact);
        } catch (error) {
          console.error('Failed to fetch leave impact:', error);
        } finally {
          setAnalyzingImpact(false);
        }
      }
    };

    const timer = setTimeout(fetchImpact, 1000);
    return () => clearTimeout(timer);
  }, [dateRange, studentContext, leavePayload]);

  const handleSuggestReason = async () => {
    setSuggestingReason(true);
    try {
      const { data } = await suggestLeaveReasons({ context: reason });
      setReasonSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to suggest reasons:', error);
    } finally {
      setSuggestingReason(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      alert('Please select a date range on the calendar first.');
      return;
    }

    setSubmitting(true);
    try {
      const leaveData = {
        studentId: studentContext.studentId,
        studentName: studentContext.fullName,
        studentEmail: studentContext.email,
        department: studentContext.department,
        semester: studentContext.semester,
        reason,
        supportingDetails,
        contactWhileAway,
        fromDate: leavePayload.fromDate,
        toDate: leavePayload.toDate,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        numberOfDays: daysCount,
        days: daysCount,
        finalDrafts: draftPayload.finalDrafts,
        generatedDrafts: draftPayload.generatedDrafts,
        leaveImpact,
        draftPreferences: {
          tone: draftPayload.tone,
          format: draftPayload.format,
          userEdits: draftPayload.userEdits,
        },
      };

      const savedLeave = await submitLeaveApplication(leaveData);
      
      if (session) {
        await recordAuthenticatedActivity({
          type: 'leave_application_submitted',
          role: session?.user?.role || 'student',
          details: {
            leaveId: savedLeave.id,
            fromDate: leavePayload.fromDate,
            toDate: leavePayload.toDate,
            numberOfDays: daysCount,
          },
        });
      }

      setSubmittedLeave(savedLeave);
      navigate(`/leave/preview?leaveId=${savedLeave.id}`);
    } catch (error) {
      alert(error.message || 'Could not submit the leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
            Absence Management
          </p>
          <h1 className="text-4xl font-bold text-foreground">Apply for Leave</h1>
          <p className="mx-auto mt-3 w-full max-w-2xl text-muted-foreground">
            Fill out your leave request, prepare recipient-ready drafts, and
            personalize your final letter or email before submission.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl lg:grid-cols-12 md:p-10">
          <div className="flex w-full flex-col gap-6 lg:col-span-5">
            <div>
              <h2 className="mb-1 text-2xl font-semibold text-foreground">
                Leave Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Provide the reason, dates, and any extra notes the faculty
                should know.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Reason for leave
                  </span>
                  <button
                    type="button"
                    onClick={handleSuggestReason}
                    disabled={suggestingReason}
                    className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 transition-all hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {suggestingReason ? 'Thinking...' : 'AI Suggest Reason'}
                  </button>
                </div>
                <textarea
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="e.g. Medical reasons, family emergency, college event..."
                  className="min-h-[140px] resize-y rounded-3xl border border-border bg-input px-5 py-4 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>

              {reasonSuggestions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    AI Suggestions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reasonSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setReason(suggestion.detailed);
                          setReasonSuggestions([]);
                        }}
                        className="rounded-xl border border-blue-200 bg-blue-50/30 px-3 py-2 text-left text-xs text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-900/10 dark:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        <div className="font-bold">{suggestion.short}</div>
                        <div className="mt-0.5 line-clamp-1 text-[10px] opacity-80">
                          {suggestion.detailed}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Supporting details
                </span>
                <textarea
                  value={supportingDetails}
                  onChange={(e) => setSupportingDetails(e.target.value)}
                  placeholder="Add context the AI draft should mention, such as a medical appointment, travel window, or assessment conflict."
                  className="min-h-[110px] resize-y rounded-3xl border border-border bg-input px-5 py-4 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Contact while away
                </span>
                <input
                  value={contactWhileAway}
                  onChange={(e) => setContactWhileAway(e.target.value)}
                  placeholder="Phone number or alternate contact"
                  className="rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground"
                />
              </label>

              <div className="rounded-2xl border border-border/50 bg-muted/40 p-5">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Summary
                </p>
                <div className="mb-2 flex items-center justify-between rounded-xl border border-border bg-background p-3 shadow-sm">
                  <span className="text-sm font-medium text-foreground">
                    Total Days:
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-600">
                    {daysCount} Days
                  </span>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Dates: {dateRange?.from ? dateRange.from.toLocaleDateString() : '--'}{' '}
                  to {dateRange?.to ? dateRange.to.toLocaleDateString() : '--'}
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 md:grid-cols-3">
                <div className="rounded-xl bg-muted/50 px-3 py-3 text-center text-sm text-foreground">
                  AI drafting
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-3 text-center text-sm text-foreground">
                  Editable canvas
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-3 text-center text-sm text-foreground">
                  Preserved final draft
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-14 w-full rounded-2xl bg-blue-600 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-500/40 disabled:opacity-60"
                >
                  {submitting ? 'Saving leave application...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>

          <div className="flex h-full flex-col rounded-[2.5rem] border border-border/50 bg-muted/20 p-6 shadow-inner lg:col-span-7 md:p-8">
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Select Dates
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Click once for the start date and again for the end date.
              </p>
            </div>

            <div className="flex flex-grow items-center justify-center overflow-x-auto rounded-[2rem] border border-border bg-background p-4 shadow-md sm:p-6 lg:p-10">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="select-none [&_.rdp-day_button]:rounded-xl [&_.rdp-day_button]:size-12 [&_.rdp-day]:size-12 lg:[&_.rdp-day_button]:size-14 lg:[&_.rdp-day]:size-14"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {analyzingImpact ? (
                <div className="flex animate-pulse items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-xs font-medium text-blue-600">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.4s]" />
                  Analyzing missed classes...
                </div>
              ) : leaveImpact?.missedClasses?.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-900/10">
                    <h4 className="mb-2 text-sm font-bold text-blue-700 dark:text-blue-400">
                      AI Impact Analysis
                    </h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80">
                      {leaveImpact.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                        Recovery Priority:
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        leaveImpact.recoveryPriority?.toLowerCase() === 'high' 
                          ? 'bg-red-500/10 text-red-600' 
                          : 'bg-green-500/10 text-green-600'
                      }`}>
                        {leaveImpact.recoveryPriority}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-500/20">
                    {leaveImpact.missedClasses.map((dayImpact, idx) => (
                      <div key={idx} className="rounded-2xl border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                          <span className="text-xs font-bold text-foreground">
                            {dayImpact.day}, {new Date(dayImpact.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            3 Classes
                          </span>
                        </div>
                        <div className="space-y-3">
                          {dayImpact.classes.map((cls, cIdx) => (
                            <div key={cIdx} className="group relative pl-4">
                              <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                  {cls.subject}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground line-clamp-1">
                                  {cls.topic}
                                </span>
                                <span className="mt-1 text-[9px] italic text-muted-foreground/70">
                                  Impact: {cls.impact}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-blue-500/10 px-4 py-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400">
                  Select dates to see which classes you'll miss and how to recover.
                </div>
              )}
            </div>
          </div>
        </div>

        <LeaveDraftStudio
          leavePayload={leavePayload}
          studentContext={studentContext}
          onDraftsChange={setDraftPayload}
          submittedLeave={submittedLeave}
        />
      </div>
    </div>
  );
}

export default LeaveApplyPage;
