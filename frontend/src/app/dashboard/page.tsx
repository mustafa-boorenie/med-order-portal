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
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        // Mock data for now
        const mockData: AnalyticsData = {
          ordersPerDay: [
            { date: '2023-12-01', orders: 12, revenue: 2400 },
            { date: '2023-12-02', orders: 19, revenue: 3800 },
            { date: '2023-12-03', orders: 15, revenue: 3000 },
            { date: '2023-12-04', orders: 22, revenue: 4400 },
            { date: '2023-12-05', orders: 18, revenue: 3600 },
            { date: '2023-12-06', orders: 25, revenue: 5000 },
            { date: '2023-12-07', orders: 30, revenue: 6000 },
          ],
          lowStockItems: [
            { id: '1', name: 'Insulin Pen', quantity: 2, parLevel: 10 },
            { id: '2', name: 'Blood Pressure Monitor', quantity: 1, parLevel: 5 },
            { id: '3', name: 'Glucose Test Strips', quantity: 5, parLevel: 20 },
          ],
          totalRevenue: 28800,
          totalOrders: 141,
        };
        setAnalytics(mockData);
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <nav className="flex space-x-4">
              <Link href="/admin" className="btn btn-secondary">
                Admin Portal
              </Link>
              <Link href="/products" className="btn btn-secondary">
                Products
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics?.totalOrders}</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${analytics?.totalRevenue ? (analytics.totalRevenue / 100).toFixed(2) : '0.00'}
                </p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>8% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-semibold text-gray-900">87</p>
                <div className="flex items-center text-sm text-red-600">
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                  <span>2% from last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.lowStockItems.length}
                </p>
                <p className="text-sm text-red-600">Immediate attention required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Orders per Day</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.ordersPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alerts</h3>
            <div className="space-y-3">
              {analytics?.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Current: {item.quantity} | Par Level: {item.parLevel}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                </div>
              ))}
              {analytics?.lowStockItems.length === 0 && (
                <p className="text-gray-600">No low stock alerts</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/products" className="card hover:shadow-lg transition-shadow text-center">
              <ChartBarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Manage Products</h4>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or remove products</p>
            </Link>
            
            <Link href="/admin/orders" className="card hover:shadow-lg transition-shadow text-center">
              <ShoppingCartIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">View Orders</h4>
              <p className="text-sm text-gray-600 mt-1">Track and manage all orders</p>
            </Link>
            
            <Link href="/admin/users" className="card hover:shadow-lg transition-shadow text-center">
              <UserGroupIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">User Management</h4>
              <p className="text-sm text-gray-600 mt-1">Manage user accounts and roles</p>
            </Link>
            
            <Link href="/products" className="card hover:shadow-lg transition-shadow text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Create Order</h4>
              <p className="text-sm text-gray-600 mt-1">Place a new patient order</p>
            </Link>
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}