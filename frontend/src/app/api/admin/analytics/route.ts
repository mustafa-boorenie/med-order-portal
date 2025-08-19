import { NextRequest, NextResponse } from 'next/server';

function getSession(request: NextRequest) {
  const cookie = request.cookies.get('appSession');
  if (!cookie) return null;
  try {
    const decoded = decodeURIComponent(cookie.value);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(request.url);
  const days = url.searchParams.get('days') || '30';

  try {
    const [ordersResp, inventoryResp, revenueResp, patientsResp] = await Promise.all([
      fetch(`${apiUrl}/analytics/orders?days=${encodeURIComponent(days)}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
      fetch(`${apiUrl}/analytics/inventory`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
      fetch(`${apiUrl}/analytics/revenue`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
      fetch(`${apiUrl}/analytics/patients-count`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }),
    ]);

    if (!ordersResp.ok || !inventoryResp.ok || !revenueResp.ok || !patientsResp.ok) {
      const text = await Promise.all([ordersResp.text(), inventoryResp.text(), revenueResp.text(), patientsResp.text()]);
      return NextResponse.json({ error: 'Failed to fetch analytics', details: text }, { status: 502 });
    }

    const [ordersPerDay, inventory, revenue, patients] = await Promise.all([
      ordersResp.json(),
      inventoryResp.json(),
      revenueResp.json(),
      patientsResp.json(),
    ]);

    return NextResponse.json({
      ordersPerDay,
      lowStockItems: inventory.lowStockItems,
      totalRevenue: revenue.totalRevenue,
      totalOrders: revenue.totalOrders,
      patientsCount: patients.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Upstream unavailable', details: String(error?.message || error) }, { status: 502 });
  }
}


