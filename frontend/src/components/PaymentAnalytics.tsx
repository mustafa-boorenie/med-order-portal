'use client';

import { useState, useEffect } from 'react';

interface PaymentAnalytics {
  totalPayments: number;
  totalRevenueCents: number;
  averageOrderValueCents: number;
  paymentsToday: number;
  revenueTodayCents: number;
  successRate: number;
  recentPayments: Array<{
    id: string;
    orderId: string;
    amount: number;
    status: string;
    patientName: string;
    createdAt: string;
  }>;
}

export default function PaymentAnalytics() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/admin/analytics/payments`);

        if (!response.ok) {
          throw new Error('Failed to fetch payment analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No payment analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalPayments}</p>
            </div>
            <div className="text-black">
              💳
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(analytics.totalRevenueCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-black">
              💰
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(analytics.averageOrderValueCents / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-black">
              📊
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.successRate}%</p>
            </div>
            <div className="text-black">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Payments Today</span>
              <span className="font-medium">{analytics.paymentsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue Today</span>
              <span className="font-medium">${(analytics.revenueTodayCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {analytics.recentPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{payment.patientName}</p>
                  <p className="text-xs text-gray-500">{payment.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${(payment.amount / 100).toFixed(2)}
                  </p>
                  <p className={`text-xs text-gray-800`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}