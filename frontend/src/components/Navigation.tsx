'use client';

import { useUser } from '../app/providers';
import Link from 'next/link';
import { LoginButton } from './auth/LoginButton';

export function Navigation() {
  const { user } = useUser();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="/" className="font-bold text-xl">
            Medical Order Portal
          </Link>
          
          {user && (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/products" className="hover:underline">
                Products
              </Link>
              {user['https://medportal.com/roles'] === 'ADMIN' && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
            </>
          )}
        </div>
        
        <LoginButton />
      </div>
    </nav>
  );
}