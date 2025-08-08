'use client';

import { useUser } from '../app/providers';
import Link from 'next/link';
import { LoginButton } from './auth/LoginButton';
import { useCart } from '@/contexts/CartContext';

export function Navigation() {
  const { user } = useUser();
  const { itemCount } = useCart();

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
              <Link href="/products" className="hover:underline relative">
                Products
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
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