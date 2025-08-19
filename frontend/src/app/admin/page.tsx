'use client';

import Link from 'next/link';
import { 
  ShoppingCartIcon, 
  UserGroupIcon, 
  CubeIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
       

            <Link
              href="/admin/products"
              className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-black"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-8 w-8 text-black" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Stock</h3>
                  <p className="text-sm text-gray-600">Manage and replenish inventory</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                  <p className="text-sm text-gray-600">View purchases and trends</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Users</h3>
                  <p className="text-sm text-gray-600">Manage user accounts</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">Expenses vs profits, KPIs</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="card">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        New order created (#12345)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        john.doe@example.com
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        2 minutes ago
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Product stock updated
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        admin@medportal.com
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        15 minutes ago
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Payment processed successfully
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        jane.smith@example.com
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        1 hour ago
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}