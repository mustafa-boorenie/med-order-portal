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
    
    // Normalize role claim for frontend ProtectedRoute
    const user = sessionData.user || {};
    if (user.email && !user['https://medportal.com/roles']) {
      // Allow local admin via seed or env-approved email
      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
      if (adminEmails.includes(user.email)) {
        user['https://medportal.com/roles'] = 'ADMIN';
      }
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me route error:', error);
    return NextResponse.json({ user: null, error: 'Invalid session' }, { status: 401 });
  }
}