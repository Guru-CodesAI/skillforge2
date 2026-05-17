import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, useIsAdmin } from '@/store/authStore';

export default function AdminRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const isAdmin = useIsAdmin();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/403" replace />;

  return <Outlet />;
}
