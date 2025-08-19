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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(request);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const resp = await fetch(`${apiUrl}/users/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        'X-User-Email': session.user?.email || '',
      },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    try {
      const data = text ? JSON.parse(text) : {};
      return NextResponse.json(data, { status: resp.status });
    } catch {
      return new NextResponse(text, { status: resp.status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Upstream unavailable', details: String(error?.message || error) }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(request);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const resp = await fetch(`${apiUrl}/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'X-User-Email': session.user?.email || '',
      },
    });
    const text = await resp.text();
    return new NextResponse(text, { status: resp.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Upstream unavailable', details: String(error?.message || error) }, { status: 502 });
  }
}
