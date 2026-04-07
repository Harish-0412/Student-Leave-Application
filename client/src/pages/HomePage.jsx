import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavbarHero } from '@/components/ui/hero-with-video';
import { getCurrentSession, initializeSessionListener } from '../features/auth/auth.api';

function HomePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getCurrentSession());

  useEffect(() => {
    const unsubscribe = initializeSessionListener((nextSession) => {
      setSession(nextSession || getCurrentSession());
    });

    return () => unsubscribe?.();
  }, []);

  const handleSchedulerEntry = (email) => {
    window.localStorage.setItem('student-login-email', email);
    navigate(`/auth?role=student&email=${encodeURIComponent(email)}`);
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <NavbarHero
      brandName="Schedulr"
      heroTitle="Student leave planning that stays smart before and after every absence."
      heroSubtitle="Email login for students"
      heroDescription="Start with your email, enter the scheduler, and move into a leave-aware planner for FSD, ML, and DS with AI-assisted recovery suggestions."
      emailPlaceholder="you@college.edu"
      backgroundImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80"
      videoUrl="/coverr-students-gossiping-on-campus-9748-1080p.mp4"
      ctaLabel="Enter the Scheduler"
      onEmailSubmit={handleSchedulerEntry}
      onLoginClick={handleLogin}
      greetingEmail={session?.user?.email || ''}
    />
  );
}

export default HomePage;
