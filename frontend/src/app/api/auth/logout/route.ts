import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const returnTo = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  
  if (!auth0Domain || !clientId) {
    return NextResponse.json({ error: 'Auth0 configuration missing' }, { status: 500 });
  }
  
  // Ensure auth0Domain has the proper protocol
  const auth0BaseUrl = auth0Domain.startsWith('http') ? auth0Domain : `https://${auth0Domain}`;
  
  // Create response that redirects to Auth0 logout
  const logoutUrl = `${auth0BaseUrl}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`;
  const response = NextResponse.redirect(logoutUrl);
  
  // Clear the session cookie with proper configuration
  response.cookies.set('appSession', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  return response;
}