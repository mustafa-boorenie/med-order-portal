import { NextRequest, NextResponse } from 'next/server';

function getAccessTokenFromCookie(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('appSession');
  if (!sessionCookie) return null;
  try {
    const decoded = decodeURIComponent(sessionCookie.value);
    const sessionData = JSON.parse(decoded);
    return sessionData.accessToken as string | undefined || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const accessToken = getAccessTokenFromCookie(request);
  const sessionCookie = request.cookies.get('appSession');
  if (!accessToken || !sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = decodeURIComponent(sessionCookie.value);
  const session = JSON.parse(decoded);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const resp = await fetch(`${apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-User-Email': session.user?.email || '',
      },
      cache: 'no-store',
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

export async function POST(request: NextRequest) {
  const accessToken = getAccessTokenFromCookie(request);
  const sessionCookie = request.cookies.get('appSession');
  if (!accessToken || !sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const decoded = decodeURIComponent(sessionCookie.value);
  const session = JSON.parse(decoded);
  const body = await request.json();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const resp = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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

