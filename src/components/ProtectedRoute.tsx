import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isAdmin, isSuperAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is authenticated but trying to access login/register pages
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    // Redirect admin users to admin dashboard, regular users to regular dashboard
    const redirectPath = (isAdmin || isSuperAdmin) ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Special handling for admin dashboard - don't redirect if already on admin route
  if (isAuthenticated && (isAdmin || isSuperAdmin) && 
      (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
    return <>{children}</>;
  }

  return <>{children}</>;
}; 