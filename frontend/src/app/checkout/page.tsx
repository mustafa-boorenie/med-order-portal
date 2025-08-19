'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system is not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate form before submitting
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Please check your payment information');
        setIsProcessing(false);
        return;
      }

      console.log('💳 Submitting payment for order:', orderId);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        },
      });

      if (error) {
        console.error('💥 Payment confirmation failed:', error);
        
        // Provide more specific error messages
        if (error.type === 'card_error') {
          setError(`Card Error: ${error.message}`);
        } else if (error.type === 'validation_error') {
          setError(`Please check your payment information: ${error.message}`);
        } else {
          setError(error.message || 'Payment failed. Please try again.');
        }
        setIsProcessing(false);
      }
      // If no error, user will be redirected to success page
    } catch (unexpectedError) {
      console.error('💥 Unexpected error during payment:', unexpectedError);
      setError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-neutral-100 border border-neutral-200 text-black rounded-md">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid checkout link');
      setLoading(false);
      return;
    }

    // Verify token and get order data
    const initializeCheckout = async () => {
      try {
        // Verify token
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

        // Create payment intent immediately
        const paymentStartTime = Date.now();
        const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: order.id }),
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment intent');
        }

        const paymentData = await paymentResponse.json();
        const paymentTime = Date.now() - paymentStartTime;
        console.log(`Payment intent created in ${paymentTime}ms`);
        
        setClientSecret(paymentData.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [token]);

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
          <p className="text-gray-800 text-lg">{error}</p>
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

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm clientSecret={clientSecret} orderId={orderData.id} />
                </Elements>
              )}

              <p className="mt-6 text-sm text-gray-600 text-center">
                Your payment is secured by Stripe. We never store your payment information.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}