'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type Point = { date: string; expenses: number; profits: number };

export default function AdminAnalyticsPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<{ d1: number; d7: number; d28: number; products: number }>({ d1: 0, d7: 0, d28: 0, products: 0 });
  const [orders, setOrders] = useState<Array<{ createdAt: string; totalCents: number; status: string; items: Array<{ product?: { id: string; name: string; sku: string } ; productId: string; quantity: number }> }>>([]);
  const [windowDays, setWindowDays] = useState<number>(30);

  useEffect(() => {
    const load = async () => {
      try {
        // Expenses: stock orders are auto-fulfilled; use orders endpoint and derive
        const ordersResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`);
        if (!ordersResp.ok) throw new Error('Failed to fetch orders');
        const orders = await ordersResp.json();
        setOrders(orders);

        const productsResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const products = await productsResp.json();

        // Group by date
        const map = new Map<string, { exp: number; prof: number }>();
        for (const o of orders) {
          const date = new Date(o.createdAt).toISOString().slice(0, 10);
          const bucket = map.get(date) || { exp: 0, prof: 0 };
          if (o.status === 'FULFILLED' && o.patientName === 'Stock Order') {
            // treat as stock expense (already seeded with cost totals)
            bucket.exp += o.totalCents / 100;
          } else if (o.status === 'PAID' || o.status === 'FULFILLED') {
            bucket.prof += o.totalCents / 100;
          }
          map.set(date, bucket);
        }
        const pts: Point[] = Array.from(map.entries()).map(([date, v]) => ({ date, expenses: v.exp, profits: v.prof })).sort((a,b)=>a.date.localeCompare(b.date));
        setPoints(pts);

        const now = Date.now();
        const sumInDays = (days: number, fn: (p: Point)=>number) => pts.filter(p => (now - new Date(p.date).getTime()) <= days*24*60*60*1000).reduce((s,p)=>s+fn(p),0);
        setKpis({
          d1: sumInDays(1, p => p.profits - p.expenses),
          d7: sumInDays(7, p => p.profits - p.expenses),
          d28: sumInDays(28, p => p.profits - p.expenses),
          products: Array.isArray(products) ? products.length : 0,
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxY = useMemo(() => Math.max(1, ...points.flatMap(p => [p.expenses, p.profits])), [points]);
  const maxAvailableDays = useMemo(() => {
    if (points.length === 0) return 30;
    const first = new Date(points[0].date).getTime();
    const last = new Date(points[points.length - 1].date).getTime();
    return Math.max(1, Math.ceil((last - first) / (24 * 60 * 60 * 1000)) + 1);
  }, [points]);
  const viewPoints = useMemo(() => {
    const now = Date.now();
    return points.filter(p => (now - new Date(p.date).getTime()) <= windowDays * 24 * 60 * 60 * 1000);
  }, [points, windowDays]);

  const productStats = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; count: number; last: number }>();
    for (const o of orders) {
      if (!(o.status === 'PAID' || o.status === 'FULFILLED')) continue;
      const ts = new Date(o.createdAt).getTime();
      for (const it of o.items || []) {
        const id = it.product?.id || it.productId;
        const name = it.product?.name || id;
        const sku = it.product?.sku || '';
        const prev = map.get(id) || { name, sku, count: 0, last: 0 };
        prev.count += it.quantity || 1;
        prev.last = Math.max(prev.last, ts);
        map.set(id, prev);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [orders]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Kpi title="Gross Profit (1d)" value={`$${kpis.d1.toFixed(2)}`} />
                <Kpi title="Gross Profit (7d)" value={`$${kpis.d7.toFixed(2)}`} />
                <Kpi title="Gross Profit (28d)" value={`$${kpis.d28.toFixed(2)}`} />
                <Kpi title="Products" value={String(kpis.products)} />
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Expenses vs Profits</h2>
                  <div className="text-sm text-gray-600">Last {windowDays} day(s)</div>
                </div>
                <LineChart 
                  points={viewPoints} 
                  maxY={maxY}
                  onPinch={(dir) => {
                    if (dir === 'in') {
                      setWindowDays((d) => Math.max(3, Math.floor(d / 1.25)));
                    } else {
                      setWindowDays((d) => Math.min(maxAvailableDays, Math.ceil(d * 1.25)));
                    }
                  }}
                />
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
                  <span className="text-sm text-gray-500">Most ordered → least</span>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Ordered</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productStats.map((p) => (
                        <tr key={`${p.sku}-${p.name}`}>
                          <td className="px-6 py-2 text-sm text-gray-900">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.sku}</div>
                          </td>
                          <td className="px-6 py-2 text-sm text-gray-900">{p.count}</td>
                          <td className="px-6 py-2 text-sm text-gray-900">{p.last ? new Date(p.last).toLocaleString() : '—'}</td>
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

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function LineChart({ points, maxY, onPinch }: { points: Point[]; maxY: number; onPinch?: (dir: 'in' | 'out') => void }) {
  if (points.length === 0) return <div className="p-6 text-center text-gray-500">No data</div>;
  const width = Math.max(600, points.length * 40);
  const height = 240;
  const pad = 32;
  const x = (i: number) => pad + (i * (width - pad*2)) / Math.max(1, points.length - 1);
  const y = (v: number) => height - pad - (v / maxY) * (height - pad*2);
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const profits = points.map(p => p.profits);
  const expenses = points.map(p => p.expenses);

  // Basic pinch/zoom detection for trackpads (CTRL/CMD + wheel) and touch pinch
  let lastDist = 0;
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!onPinch) return;
    // Treat trackpad pinch as wheel with ctrlKey
    if (e.ctrlKey || (e as any).metaKey) {
      if (e.deltaY < 0) onPinch('in'); else onPinch('out');
    }
  };
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!onPinch) return;
    if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (lastDist !== 0) {
        if (dist > lastDist) onPinch('in');
        else if (dist < lastDist) onPinch('out');
      }
      lastDist = dist;
    }
  };
  const handleTouchEnd = () => { lastDist = 0; };

  return (
    <div className="overflow-x-auto">
      <svg 
        width={width} 
        height={height} 
        className="block"
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <g stroke="#e5e7eb">
          <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} />
          <line x1={pad} y1={pad} x2={pad} y2={height-pad} />
        </g>
        <path d={line(expenses)} stroke="#ef4444" fill="none" strokeWidth={2} />
        <path d={line(profits)} stroke="#10b981" fill="none" strokeWidth={2} />
        {points.map((p, i) => (
          <text key={p.date} x={x(i)} y={height - pad + 14} fontSize={10} textAnchor="middle" fill="#6b7280">{p.date.slice(5)}</text>
        ))}
      </svg>
      <div className="mt-2 text-sm text-gray-600">
        <span className="inline-flex items-center mr-4"><span className="inline-block w-3 h-3 bg-neutral-800 mr-2"/>Expenses</span>
        <span className="inline-flex items-center"><span className="inline-block w-3 h-3 bg-black mr-2"/>Profits</span>
      </div>
    </div>
  );
}


