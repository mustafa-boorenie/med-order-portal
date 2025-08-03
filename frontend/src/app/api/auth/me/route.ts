import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('appSession');
  
  // Debug logging
  console.log('Auth check:', {
    hasSessionCookie: !!sessionCookie,
    cookieValue: sessionCookie ? 'present' : 'missing',
    allCookies: request.cookies.getAll().map(c => c.name)
  });
  
  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  
  try {
    // Decode the cookie value before parsing because it will be URL-encoded when sent by the browser
    const decoded = decodeURIComponent(sessionCookie.value);
    const sessionData = JSON.parse(decoded);
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    return NextResponse.json({ user: sessionData.user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}