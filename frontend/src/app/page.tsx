'use client';

import Link from 'next/link';
import { useUser } from './providers';
import { ShoppingCartIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {user ? (
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Welcome back, {user.name}!
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Access your dashboard, manage orders, and track inventory.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link href="/products" className="btn btn-secondary">
                  Browse Products
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Streamlined Medical Supply Ordering
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                HIPAA-compliant platform for cash-pay medication and medical supply orders.
                Secure, efficient, and designed for healthcare professionals.
              </p>
              <div className="mt-8">
                <Link href="/api/auth/login" className="btn btn-primary btn-lg">
                  Sign In to Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}