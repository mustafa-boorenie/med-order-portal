'use client';

import { useUser } from '../../app/providers';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>,
  requiredRole 
}: ProtectedRouteProps) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <>{fallback}</>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return null;

  // Check role if required
  if (requiredRole && user['https://medportal.com/roles'] !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}