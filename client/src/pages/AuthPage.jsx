import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, KeyRound, School, Sparkles, UserRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import WarpShaderHero from '../components/ui/wrap-shader';
import {
  isFirebaseConfigured,
  registerWithFirebase,
  signInWithFirebase,
} from '../features/auth/auth.api';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  department: '',
  semester: '',
  section: '',
  studentId: '',
  employeeId: '',
  designation: 'Teacher',
};

function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState(searchParams.get('role') || 'student');
  const [form, setForm] = useState({
    ...initialForm,
    email: searchParams.get('email') || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const navigateByRole = (resolvedRole) => {
    if (resolvedRole === 'teacher') {
      navigate('/teacher/dashboard');
      return;
    }

    navigate(`/student/onboarding?email=${encodeURIComponent(form.email)}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'register') {
        const session = await registerWithFirebase({
          email: form.email,
          password: form.password,
          role,
          profile: {
            fullName: form.fullName,
            email: form.email,
            department: form.department,
            semester: role === 'student' ? form.semester : '',
            section: role === 'student' ? form.section : '',
            studentId: role === 'student' ? form.studentId : '',
            employeeId: role === 'teacher' ? form.employeeId : '',
            designation: role === 'teacher' ? form.designation : '',
          },
        });
        navigateByRole(session.user.role);
        return;
      }

      const session = await signInWithFirebase({
        email: form.email,
        password: form.password,
      });
      navigateByRole(session.user.role);
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WarpShaderHero
      align="split"
      title="Secure access for students and teachers"
      description="Enter Schedulr through a cinematic shader hero, then continue into the student planner or the teacher portal with Firebase-backed identity and activity tracking."
      primaryLabel="Student & Teacher Login"
      secondaryLabel="Firebase Connected"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-white/12 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <section className="rounded-[1.7rem] border border-white/12 bg-slate-950/55 p-6 text-white md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                Firebase Auth
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {mode === 'register' ? 'Create account' : 'Sign in'}
              </h2>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
              {['signin', 'register'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === value
                      ? 'bg-white text-slate-900'
                      : 'text-white/80'
                  }`}
                >
                  {value === 'signin' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: 'Student accounts',
                text: 'Continue into onboarding and the leave scheduler.',
                icon: School,
              },
              {
                title: 'Teacher portal',
                text: 'Redirect directly into the faculty workspace.',
                icon: UserRound,
              },
              {
                title: 'Tracked actions',
                text: 'Store account actions and leave activity in Firebase.',
                icon: KeyRound,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4"
              >
                <item.icon className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/65">{item.text}</p>
              </div>
            ))}
          </div>

          {!firebaseReady && (
            <div className="mt-6 rounded-[1.5rem] border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              Firebase is not configured yet. Add the `VITE_FIREBASE_*` values
              to the environment before using authentication.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {['student', 'teacher'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                    role === value
                      ? 'border-emerald-300/60 bg-emerald-200/18 text-white shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-white/5 text-white/85'
                  }`}
                >
                  <p className="font-semibold capitalize">{value}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {value === 'student'
                      ? 'For personal planning and leave requests'
                      : 'For faculty access and student oversight'}
                  </p>
                </button>
              ))}
            </div>

            {mode === 'register' && (
              <label className="block text-sm font-medium text-white">
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                />
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-white">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                />
              </label>

              <label className="block text-sm font-medium text-white">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                />
              </label>
            </div>

            {mode === 'register' && (
              <>
                <label className="block text-sm font-medium text-white">
                  Department
                  <input
                    value={form.department}
                    onChange={(event) => updateField('department', event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                  />
                </label>

                {role === 'student' ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-white">
                      Semester
                      <input
                        value={form.semester}
                        onChange={(event) => updateField('semester', event.target.value)}
                        required
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </label>
                    <label className="block text-sm font-medium text-white">
                      Section
                      <input
                        value={form.section}
                        onChange={(event) => updateField('section', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </label>
                    <label className="block text-sm font-medium text-white">
                      Student ID
                      <input
                        value={form.studentId}
                        onChange={(event) => updateField('studentId', event.target.value)}
                        required
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-white">
                      Employee ID
                      <input
                        value={form.employeeId}
                        onChange={(event) => updateField('employeeId', event.target.value)}
                        required
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </label>
                    <label className="block text-sm font-medium text-white">
                      Designation
                      <input
                        value={form.designation}
                        onChange={(event) => updateField('designation', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white placeholder:text-white/35"
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                Redirects by role after sign-in
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {role === 'teacher' ? 'Teacher portal' : 'Student flow'}
              </span>
            </div>

            <Button
              type="submit"
              disabled={submitting || !firebaseReady}
              className="mt-2 h-12 w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90"
            >
              <span className="inline-flex items-center gap-2">
                {submitting
                  ? mode === 'register'
                    ? 'Creating account...'
                    : 'Signing in...'
                  : mode === 'register'
                    ? `Create ${role} account`
                    : 'Continue securely'}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>
        </section>
      </div>
    </WarpShaderHero>
  );
}

export default AuthPage;
