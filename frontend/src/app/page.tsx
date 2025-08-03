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

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card text-center">
            <div className="flex justify-center">
              <ShoppingCartIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Easy Ordering</h3>
            <p className="mt-2 text-gray-600">
              Streamlined product catalog with quick order placement and secure payment processing.
            </p>
            {user ? (
              <Link href="/products" className="mt-4 inline-block btn btn-primary">
                Browse Products
              </Link>
            ) : (
              <Link href="/api/auth/login" className="mt-4 inline-block btn btn-primary">
                Sign In to Order
              </Link>
            )}
          </div>

          <div className="card text-center">
            <div className="flex justify-center">
              <UserIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Doctor Portal</h3>
            <p className="mt-2 text-gray-600">
              Secure login for clinicians to manage patient orders and track inventory.
            </p>
            {user ? (
              <Link href="/dashboard" className="mt-4 inline-block btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/api/auth/login" className="mt-4 inline-block btn btn-primary">
                Doctor Login
              </Link>
            )}
          </div>

          <div className="card text-center">
            <div className="flex justify-center">
              <ChartBarIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Analytics</h3>
            <p className="mt-2 text-gray-600">
              Real-time insights into inventory, orders, and revenue for administrators.
            </p>
            {user ? (
              <Link href="/dashboard" className="mt-4 inline-block btn btn-primary">
                View Dashboard
              </Link>
            ) : (
              <Link href="/api/auth/login" className="mt-4 inline-block btn btn-primary">
                Sign In for Analytics
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}