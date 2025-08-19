'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  ShoppingCartIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsData } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useUser } from '@/app/providers';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const resp = await fetch('/api/admin/analytics');
        if (!resp.ok) throw new Error('Failed to fetch analytics');
        const data = await resp.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
  

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}

        <h1 className="text-5xl font-bold mb-8 p-5 text-gray-900">Welcome back, {user?.email || 'user'}!!</h1>
        <br/>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-black" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics?.totalOrders}</p>
                <div className="flex items-center text-sm text-gray-700">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-black" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{(analytics as any)?.patientsCount ?? '-'}</p>
                <div className="flex items-center text-sm text-gray-700">
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                  <span>2% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-black" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.lowStockItems.length}
                </p>
                <p className="text-sm text-gray-700">Immediate attention required</p>
              </div>
            </div>
          </div>
           
          <Link href="/products" className="card bg-black hover:shadow-lg hover:bg-neutral-900 transition-shadow text-center">
              <ShoppingCartIcon className="h-8 w-8 text-white mx-auto mb-2" />
              <h4 className="font-medium text-white">Create Order</h4>
              <p className="text-sm text-white mt-1">Place a new patient order</p>
            </Link>
        </div>
     

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  
            

          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}