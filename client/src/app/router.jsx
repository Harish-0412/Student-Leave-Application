import { createBrowserRouter, Outlet } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AuthPage from '../pages/AuthPage';
import StudentOnboardingPage from '../pages/StudentOnboardingPage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import TeacherDashboardPage from '../pages/TeacherDashboardPage';
import LeaveApplyPage from '../pages/LeaveApplyPage';
import LeavePreviewPage from '../pages/LeavePreviewPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminStudentDetailPage from '../pages/AdminStudentDetailPage';
import NotFoundPage from '../pages/NotFoundPage';
import ChatbotWidget from '../components/chat/ChatbotWidget';

const RootLayout = () => (
  <>
    <Outlet />
    <ChatbotWidget />
  </>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'student/onboarding',
        element: <StudentOnboardingPage />,
      },
      {
        path: 'student/dashboard',
        element: <StudentDashboardPage />,
      },
      {
        path: 'leave/apply',
        element: <LeaveApplyPage />,
      },
      {
        path: 'leave/preview',
        element: <LeavePreviewPage />,
      },
      {
        path: 'teacher/dashboard',
        element: <TeacherDashboardPage />,
      },
      {
        path: 'admin/dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'admin/student/:id',
        element: <AdminStudentDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
