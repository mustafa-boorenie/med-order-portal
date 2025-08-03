import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/';
  
    // Create Auth0 login URL
  const auth0IssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const organizationId = process.env.AUTH0_ORGANIZATION_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (!auth0IssuerBaseUrl || !clientId) {
    return NextResponse.json({ error: 'Auth0 configuration missing' }, { status: 500 });
  }

  // Extract domain from Auth0 issuer URL (remove https:// if present)
  const auth0Domain = auth0IssuerBaseUrl.replace(/^https?:\/\//, '');
  
  const authUrl = new URL(`https://${auth0Domain}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', returnTo);
  
  // Add organization parameter if configured
  if (organizationId) {
    authUrl.searchParams.set('organization', organizationId);
  }
  
  return NextResponse.redirect(authUrl.toString());
}