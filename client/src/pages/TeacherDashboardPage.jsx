import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  ShieldCheck, 
  UserRound, 
  Bell, 
  Check, 
  X as Close, 
  Clock, 
  Calendar as CalendarIcon,
  User,
  FileText,
  Edit2,
  Save,
  Sparkles
} from 'lucide-react';
import { getAuthenticatedActivities, getCurrentSession, logout } from '../features/auth/auth.api';
import { getAllLeaves, updateLeaveStatus } from '../features/leave/leave.api';
import { getStudyPlan, updateStudyPlan } from '../features/plan/plan.api';
import { Button } from '../components/ui/button';
import Calendar from '../components/ui/calendar';

function TeacherDashboardPage() {
  const [activities, setActivities] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications'); // notifications | students | calendar
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentPlan, setStudentPlan] = useState(null);
  const [editingDay, setEditingDay] = useState(null); // { date: string, classes: [] }
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const session = getCurrentSession();

  const broadcastAcademicRefresh = (studentId) => {
    const payload = {
      studentId,
      timestamp: new Date().toISOString(),
    };

    window.localStorage.setItem('academic-calendar-refresh', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('academic-calendar-refresh', { detail: payload }));
  };

  const loadInitialData = async () => {
    try {
      const [activityRecords, leaveRecords] = await Promise.all([
        getAuthenticatedActivities(12),
        getAllLeaves()
      ]);

      const sortedLeaves = Array.isArray(leaveRecords)
        ? [...leaveRecords].sort(
            (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0),
          )
        : [];

      setActivities(activityRecords);
      setLeaves(sortedLeaves);
      setSelectedLeave((currentLeave) => {
        if (!currentLeave) {
          return sortedLeaves[0] || null;
        }

        return sortedLeaves.find((leave) => leave.id === currentLeave.id) || null;
      });
    } catch (error) {
      console.error('Failed to load teacher data', error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      const updatedLeave = await updateLeaveStatus(leaveId, status);
      await loadInitialData();

      if (updatedLeave?.studentId) {
        if (selectedStudentId === updatedLeave.studentId) {
          await loadStudentPlan(updatedLeave.studentId);
        }

        broadcastAcademicRefresh(updatedLeave.studentId);
      }
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const loadStudentPlan = async (studentId) => {
    setLoading(true);
    setSelectedStudentId(studentId);
    try {
      const plan = await getStudyPlan(studentId);
      setStudentPlan(plan);
    } catch (error) {
      console.error('Failed to load plan', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayEdit = (date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    const mappedDayPlan =
      studentPlan?.daysByDate?.[dateStr] ||
      studentPlan?.days?.find?.((day) => day.dateKey === dateStr);
    const dayPlan = mappedDayPlan || {
      classes: [
        { subject: 'FSD', topic: '', description: '' },
        { subject: 'ML', topic: '', description: '' },
        { subject: 'DS', topic: '', description: '' },
      ],
    };
    setEditingDay({ date: dateStr, ...dayPlan });
  };

  const saveDayPlan = async () => {
    if (!selectedStudentId || !editingDay) return;

    const existingDays = Array.isArray(studentPlan?.days) ? studentPlan.days : [];
    const updatedDays = existingDays.some((day) => day.dateKey === editingDay.date)
      ? existingDays.map((day) =>
          day.dateKey === editingDay.date
            ? {
                ...day,
                classes: editingDay.classes,
                status: day.status || 'scheduled',
                modifiedBy: session?.user?.fullName || 'Teacher',
                modifiedAt: new Date().toISOString(),
              }
            : day,
        )
      : [
          ...existingDays,
          {
            date: new Date(editingDay.date).toISOString(),
            dateKey: editingDay.date,
            dayNumber: existingDays.length + 1,
            status: 'scheduled',
            classes: editingDay.classes,
            modifiedBy: session?.user?.fullName || 'Teacher',
            modifiedAt: new Date().toISOString(),
          },
        ];

    const updatedPlan = {
      ...studentPlan,
      days: updatedDays,
      daysByDate: updatedDays.reduce((accumulator, day) => {
        accumulator[day.dateKey] = {
          classes: day.classes,
          status: day.status || 'scheduled',
          dayNumber: day.dayNumber,
          date: day.date,
          modifiedBy: day.modifiedBy,
          modifiedAt: day.modifiedAt,
        };
        return accumulator;
      }, {}),
    };

    try {
      await updateStudyPlan(selectedStudentId, updatedPlan);
      setStudentPlan(updatedPlan);
      setEditingDay(null);
      alert('Academic calendar updated successfully!');
    } catch (error) {
      alert('Failed to save plan: ' + error.message);
    }
  };

  const updateClassField = (idx, field, value) => {
    const updatedClasses = [...editingDay.classes];
    updatedClasses[idx] = { ...updatedClasses[idx], [field]: value };
    setEditingDay({ ...editingDay, classes: updatedClasses });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <UserRound className="w-40 h-40 text-blue-600" />
          </div>
          
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 mb-2">
              Faculty Management System
            </p>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Welcome back, {session?.user?.fullName || 'Teacher'}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Manage leave applications, track student academic impact, and personalize curriculum schedules for your department.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('notifications')}
                className="rounded-2xl px-6 h-12 font-bold transition-all"
              >
                <Bell className="w-5 h-5 mr-2" />
                Notification Center ({leaves.filter(l => l.status === 'pending').length})
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'outline'}
                onClick={() => setActiveTab('calendar')}
                className="rounded-2xl px-6 h-12 font-bold transition-all"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Academic Calendar
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  navigate('/auth?role=teacher');
                }}
                className="rounded-2xl h-12 font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>

        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Notifications List */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-2xl font-bold text-foreground px-2 flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Applications
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {leaves.map((leave) => (
                  <button
                    key={leave.id}
                    onClick={() => setSelectedLeave(leave)}
                    className={`w-full text-left rounded-[1.75rem] border p-5 transition-all ${
                      selectedLeave?.id === leave.id 
                        ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20 text-white' 
                        : 'bg-card border-border hover:border-blue-300 hover:shadow-md text-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg">{leave.studentName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        leave.status === 'pending' ? 'bg-amber-500/20 text-amber-600' :
                        leave.status === 'approved' ? 'bg-emerald-500/20 text-emerald-600' :
                        'bg-red-500/20 text-red-600'
                      } ${selectedLeave?.id === leave.id ? 'bg-white/20 text-white' : ''}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className={`text-sm line-clamp-1 mb-3 ${selectedLeave?.id === leave.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {leave.reason}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-medium opacity-70">
                      <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      <span>{leave.numberOfDays} Days</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Application Detail & Actions */}
            <div className="lg:col-span-7">
              {selectedLeave ? (
                <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{selectedLeave.studentName}</h3>
                        <p className="text-sm text-muted-foreground">{selectedLeave.department} • {selectedLeave.semester}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Submitted On</p>
                      <p className="font-medium">{new Date(selectedLeave.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Reason for Leave
                      </h4>
                      <p className="text-lg text-foreground bg-muted/30 p-6 rounded-3xl border border-border/50 leading-relaxed italic">
                        "{selectedLeave.reason}"
                      </p>
                    </div>

                    {selectedLeave.leaveImpact && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-[2rem] p-6 border border-blue-100 dark:border-blue-900/50">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> AI Academic Impact Analysis
                        </h4>
                        <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mb-4">{selectedLeave.leaveImpact.summary}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Priority</span>
                            <p className="font-bold text-blue-600">{selectedLeave.leaveImpact.recoveryPriority}</p>
                          </div>
                          <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Missed Sessions</span>
                            <p className="font-bold text-blue-600">{selectedLeave.leaveImpact.missedClasses?.length || 0} Days</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={() => handleStatusUpdate(selectedLeave.id, 'approved')}
                        disabled={selectedLeave.status === 'approved'}
                        className="flex-1 rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 font-bold text-lg shadow-lg shadow-emerald-500/20"
                      >
                        <Check className="w-6 h-6 mr-2" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedLeave.id, 'on-hold')}
                        disabled={selectedLeave.status === 'on-hold'}
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 border-amber-500 text-amber-600 hover:bg-amber-50 font-bold text-lg"
                      >
                        <Clock className="w-6 h-6 mr-2" /> On Hold
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedLeave.id, 'declined')}
                        disabled={selectedLeave.status === 'declined'}
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 border-red-500 text-red-600 hover:bg-red-50 font-bold text-lg"
                      >
                        <Close className="w-6 h-6 mr-2" /> Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-card rounded-[2.5rem] border border-dashed border-border p-10 text-center text-muted-foreground">
                  <Bell className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-bold">No application selected</h3>
                  <p className="mt-2">Select a student from the list to review their leave request.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card rounded-[2rem] border border-border p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Select Student
                </h3>
                <div className="space-y-2">
                  {Array.from(new Set(leaves.map(l => l.studentId))).map(sid => {
                    const studentName = leaves.find(l => l.studentId === sid)?.studentName || 'Student';
                    return (
                      <button
                        key={sid}
                        onClick={() => loadStudentPlan(sid)}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          selectedStudentId === sid 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {studentName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingDay && (
                <div className="bg-card rounded-[2rem] border border-border p-6 shadow-xl animate-in slide-in-from-left-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-blue-600">Editing: {editingDay.date}</h3>
                    <button onClick={() => setEditingDay(null)}><Close className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    {editingDay.classes.map((cls, idx) => (
                      <div key={idx} className="space-y-2 p-4 bg-muted/30 rounded-2xl border border-border">
                        <input 
                          value={cls.subject} 
                          onChange={(e) => updateClassField(idx, 'subject', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1 text-sm font-bold"
                          placeholder="Subject"
                        />
                        <input 
                          value={cls.topic} 
                          onChange={(e) => updateClassField(idx, 'topic', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1 text-xs"
                          placeholder="Topic"
                        />
                        <textarea 
                          value={cls.description} 
                          onChange={(e) => updateClassField(idx, 'description', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1 text-[10px] min-h-[60px]"
                          placeholder="Daily description/impact..."
                        />
                      </div>
                    ))}
                    <Button onClick={saveDayPlan} className="w-full rounded-xl h-12 font-bold">
                      <Save className="w-4 h-4 mr-2" /> Save Day Plan
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                  Student Curriculum Manager
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Select a date to modify class topics and descriptions for the student's personal calendar.</p>
              </div>
              
              {selectedStudentId ? (
                <Calendar 
                  studentId={selectedStudentId}
                  onDateSelect={handleDayEdit}
                  className="mx-auto"
                />
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-10" />
                  <p>Please select a student to manage their calendar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
