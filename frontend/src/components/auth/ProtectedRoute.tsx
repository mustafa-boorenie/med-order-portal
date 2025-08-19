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
  if (requiredRole) {
    const rolesClaim = user['https://medportal.com/roles'];
    const adminEmailsEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    const userEmail = (user as any).email as string | undefined;
    const isEmailAdmin = !!userEmail && adminEmailsEnv.includes(userEmail);
    const hasRequiredRole = rolesClaim === requiredRole || (requiredRole === 'ADMIN' && isEmailAdmin);

    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}