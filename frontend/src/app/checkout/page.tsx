'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid checkout link');
      setLoading(false);
      return;
    }

    // Verify token and get order data
    const verifyToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-checkout-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Invalid or expired checkout link');
        }

        const tokenData = await response.json();
        
        // Get order details
        const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${tokenData.orderId}`);
        if (!orderResponse.ok) {
          throw new Error('Order not found');
        }

        const order = await orderResponse.json();
        setOrderData(order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handlePayment = async () => {
    if (!orderData) return;

    try {
      // Create payment intent
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: orderData.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      // Redirect to Stripe Checkout or use Elements
      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <a href="/" className="mt-4 inline-block btn btn-primary">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Order</h1>
          
          {orderData && (
            <>
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  {orderData.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>${((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${(orderData.totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
                <p><strong>Name:</strong> {orderData.patientName}</p>
                <p><strong>Email:</strong> {orderData.patientEmail}</p>
              </div>

              <button
                onClick={handlePayment}
                className="w-full btn btn-primary text-lg py-3"
              >
                Pay ${(orderData.totalCents / 100).toFixed(2)}
              </button>

              <p className="mt-4 text-sm text-gray-600 text-center">
                Your payment is secured by Stripe. We never store your payment information.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}