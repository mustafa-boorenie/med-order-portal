import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const auth0Domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const returnTo = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  
  if (!auth0Domain || !clientId) {
    return NextResponse.json({ error: 'Auth0 configuration missing' }, { status: 500 });
  }
  
  // Clear the session cookie
  const response = NextResponse.redirect(`${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo || '')}`);
  
  response.cookies.delete('appSession');
  
  return response;
}