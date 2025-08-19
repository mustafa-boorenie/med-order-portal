'use client';

import { useUser } from '../app/providers';
import Link from 'next/link';
import { LoginButton } from './auth/LoginButton';
import { useCart } from '@/contexts/CartContext';

export function Navigation() {
  const { user } = useUser();
  const { itemCount } = useCart();
  const role = user?.['https://medportal.com/roles'];
  const canSeeAdmin = role === 'ADMIN' || role === 'DOCTOR';

  return (
    <nav className="bg-transparent backdrop-blur-sm text-primary-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4 items-center">
          <Link href="/" className="flex items-center space-x-2">
            {/* Logo image slot */}
            <img src="/cls-logo.jpg" alt="CLS Health" className="h-6 w-auto" />
          </Link>
          
        </div>
        
        <LoginButton />
      </div>
    </nav>
  );
}