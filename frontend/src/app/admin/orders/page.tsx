'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { Order } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [drillDate, setDrillDate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`);
        if (!resp.ok) throw new Error('Failed to fetch orders');
        const data = await resp.json();
        setOrders(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const daily = useMemo(() => {
    const buckets = new Map<string, { orders: number; revenue: number }>();
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = d.toISOString().slice(0, 10);
      const b = buckets.get(key) || { orders: 0, revenue: 0 };
      b.orders += 1;
      b.revenue += o.totalCents / 100;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!selectedDate) return orders;
    return orders.filter(o => o.createdAt.slice(0,10) === selectedDate);
  }, [orders, selectedDate]);

  const hourly = useMemo(() => {
    if (!drillDate) return [] as Array<{ hour: number; orders: number; revenue: number }>;
    const buckets: Array<{ hour: number; orders: number; revenue: number }> = Array.from({ length: 24 }, (_ , i) => ({ hour: i, orders: 0, revenue: 0 }));
    for (const o of orders) {
      if (o.createdAt.slice(0,10) !== drillDate) continue;
      const h = new Date(o.createdAt).getHours();
      buckets[h].orders += 1;
      buckets[h].revenue += o.totalCents / 100;
    }
    return buckets;
  }, [orders, drillDate]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <Link href="/admin" className="btn btn-secondary">Back</Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
            <div className="space-y-8">
              <div className="card">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Daily Orders & Revenue</h2>
                    <p className="text-gray-600 text-sm">Click a bar to filter orders by date.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Filter date</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded px-3 py-2" />
                  </div>
                  {selectedDate && (
                    <button onClick={() => setSelectedDate('')} className="btn">Clear</button>
                  )}
                </div>
                <div className="mt-6 overflow-x-auto">
                  <div className="min-w-full">
                    <Chart
                      daily={daily}
                      hourly={hourly}
                      drillDate={drillDate}
                      onSelectDate={(d) => setSelectedDate(d)}
                      onEnterDrill={(d) => { setSelectedDate(d); setDrillDate(d); }}
                      onExitDrill={() => setDrillDate(null)}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Orders ({filteredOrders.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{new Date(o.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{o.patientName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{o.patientEmail}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${(o.totalCents / 100).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function Chart({ daily, hourly, drillDate, onSelectDate, onEnterDrill, onExitDrill }: {
  daily: Array<{ date: string; orders: number; revenue: number }>;
  hourly: Array<{ hour: number; orders: number; revenue: number }>;
  drillDate: string | null;
  onSelectDate: (d: string) => void;
  onEnterDrill: (d: string) => void;
  onExitDrill: () => void;
}) {
  if (!drillDate && daily.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data</div>;
  }

  if (drillDate) {
    const maxOrders = Math.max(...hourly.map(h => h.orders), 1);
    return (
      <div className="w-full overflow-x-auto transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-700">Hourly orders • {drillDate}</div>
          <button className="btn" onClick={onExitDrill}>Back</button>
        </div>
        <div className="flex items-end gap-2 h-48 transform transition-transform duration-300">
          {hourly.map(d => {
            const height = Math.max(2, Math.round((d.orders / maxOrders) * 160));
            return (
              <div key={d.hour} className="flex flex-col items-center">
                <div className={`bg-black w-6 rounded-t`} style={{ height }} />
                <span className="mt-2 text-[10px] text-gray-600">{String(d.hour).padStart(2,'0')}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-sm text-gray-600">Hourly order counts for the selected date.</div>
      </div>
    );
  }

  const maxOrders = Math.max(...daily.map(d => d.orders));
  const maxRevenue = Math.max(...daily.map(d => d.revenue));
  return (
    <div className="w-full overflow-x-auto transition-all duration-300">
      <div className="flex items-end gap-3 h-48 transform transition-transform duration-300">
        {daily.map(d => {
          const height = Math.max(4, Math.round((d.orders / maxOrders) * 160));
          const color = 'bg-black';
          return (
            <button
              key={d.date}
              className="flex flex-col items-center focus:outline-none"
              onClick={() => onSelectDate(d.date)}
              onDoubleClick={() => onEnterDrill(d.date)}
              title={`${d.date}: ${d.orders} orders, $${d.revenue.toFixed(2)}`}
            >
              <div className={`${color} w-10 rounded-t`} style={{ height }} />
              <span className="mt-2 text-xs text-gray-600">{d.date.slice(5)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-sm text-gray-600">Click a bar to filter; double-click to drill into hourly view.</div>
    </div>
  );
}


