'use client';

import { useUser } from '../../app/providers';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className = "btn btn-primary", children = "Logout" }: LogoutButtonProps) {
  const { refreshUser } = useUser();

  const handleLogout = async () => {
    try {
      // Navigate to logout endpoint which will redirect to Auth0 logout
      window.location.href = '/api/auth/logout';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children}
    </button>
  );
}