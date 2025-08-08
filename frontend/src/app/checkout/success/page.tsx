'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');

  useEffect(() => {
    // Clear any cart data from localStorage if needed
    if (typeof window !== 'undefined') {
      // Optional: Send confirmation analytics event
      console.log('Order completed:', orderId);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been confirmed and the patient will receive a confirmation email.
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Order ID: <span className="font-mono">{orderId}</span>
          </p>
        )}

        <div className="space-y-3">
          <Link href="/dashboard" className="block w-full btn btn-primary">
            Return to Dashboard
          </Link>
          <Link href="/products" className="block w-full btn btn-secondary">
            Create Another Order
          </Link>
        </div>
      </div>
    </div>
  );
}