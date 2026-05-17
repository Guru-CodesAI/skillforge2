import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load pages for code splitting
const LandingPage       = lazy(() => import('@/pages/LandingPage'));
const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const SignupPage        = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const OnboardingPage    = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'));
const DiscoverPage      = lazy(() => import('@/pages/DiscoverPage'));
const ProfilePage       = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'));
const AdminDashboard    = lazy(() => import('@/pages/AdminDashboard'));
const AuthCallbackPage  = lazy(() => import('@/pages/AuthCallbackPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const Error403          = lazy(() => import('@/pages/errors/Error403'));
const Error404          = lazy(() => import('@/pages/errors/Error404'));
const Error500          = lazy(() => import('@/pages/errors/Error500'));

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/signup"         element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback"  element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding"  element={<OnboardingPage />} />
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/discover"    element={<DiscoverPage />} />
              <Route path="/profile"     element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/settings"    element={<SettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin"       element={<AdminDashboard />} />
            </Route>

            {/* Error Pages */}
            <Route path="/403"           element={<Error403 />} />
            <Route path="/500"           element={<Error500 />} />
            <Route path="*"              element={<Error404 />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
