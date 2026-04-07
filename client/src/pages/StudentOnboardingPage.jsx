import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText } from 'lucide-react';
import StudentDetailsForm from '../components/forms/StudentDetailsForm';
import {
  getCurrentSession,
  updateAuthenticatedProfile,
} from '../features/auth/auth.api';

function StudentOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const session = getCurrentSession();

  const initialValues = useMemo(() => {
    const searchEmail = searchParams.get('email');
    const storedEmail = window.localStorage.getItem('student-login-email');
    const sessionUser = session?.user || {};

    return {
      name: sessionUser.fullName || '',
      email: searchEmail || storedEmail || sessionUser.email || '',
      studentId: sessionUser.studentId || '',
      department: sessionUser.department || '',
      semester: sessionUser.semester || '',
      section: sessionUser.section || '',
    };
  }, [searchParams, session]);

  const handleSubmit = async (data) => {
    setSaving(true);
    setError('');

    try {
      if (session?.user?.role === 'student') {
        const nextSession = await updateAuthenticatedProfile({
          profile: {
            fullName: data.name,
            studentId: data.studentId,
            department: data.department,
            semester: data.semester,
            section: data.section,
          },
          activityType: 'student_onboarding_completed',
        });

        window.localStorage.setItem(
          'student-name',
          nextSession.user.fullName || data.name || '',
        );
        window.localStorage.setItem(
          'student-login-email',
          nextSession.user.email || data.email || '',
        );
        window.localStorage.setItem(
          'student-id',
          nextSession.user.studentId || data.studentId || 'local-student',
        );
      } else {
        window.localStorage.setItem('student-name', data.name || '');
        window.localStorage.setItem('student-login-email', data.email || '');
        window.localStorage.setItem('student-id', data.studentId || 'local-student');
      }

      setStudentData(data);
      setStep(2);
    } catch (submitError) {
      setError(submitError.message || 'Could not save student onboarding details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
      {step === 1 && (
        <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Step 1
            </p>
            <h1 className="mt-3 text-4xl font-bold text-foreground">
              Student Onboarding
            </h1>
            <p className="mt-3 text-muted-foreground">
              Confirm your details so the scheduler can build your 30-day class plan
              and handle leave rescheduling correctly.
            </p>
          </div>
          {error && (
            <div className="mb-6 w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <StudentDetailsForm onSubmit={handleSubmit} initialValues={initialValues} />
          {saving && (
            <p className="mt-4 text-sm text-muted-foreground">
              Saving your onboarding profile to Firebase...
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="w-full">
          <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Step 2
            </p>
            <h1 className="mt-3 text-4xl font-bold text-foreground">
              What do you need to do?
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Welcome, <span className="font-semibold text-foreground">{studentData?.name || 'Student'}</span>! Choose an action below to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="group flex flex-col items-center gap-5 rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:bg-accent/50 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95"
            >
              <div className="rounded-full bg-blue-500/10 p-6 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/20 dark:text-blue-400">
                <Calendar className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">View Academic Calendar</h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">Check your 30-day plan and upcoming commitments.</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/leave/apply')}
              className="group flex flex-col items-center gap-5 rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/40 hover:bg-accent/50 hover:shadow-2xl hover:shadow-purple-500/10 active:scale-95"
            >
              <div className="rounded-full bg-purple-500/10 p-6 text-purple-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-purple-500/20 dark:text-purple-400">
                <FileText className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">Apply for Leave</h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">Submit a leave request and get AI-assisted rescheduling options.</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentOnboardingPage;
