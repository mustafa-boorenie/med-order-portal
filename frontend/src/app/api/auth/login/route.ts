import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/';
  const provider = searchParams.get('provider');

  // Resolve runtime origin to avoid redirect_uri mismatches
  const origin = request.nextUrl.origin;

  const auth0IssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const organizationId = process.env.AUTH0_ORGANIZATION_ID;
  const enableOrganizations = (process.env.AUTH0_ENABLE_ORGANIZATIONS || '').toLowerCase() === 'true';
  const audience = process.env.AUTH0_AUDIENCE;
  const redirectUri = `${origin}/api/auth/callback`;

  // Dev diagnostics (no secrets):
  console.log('[auth/login] building authorize URL', {
    origin,
    redirectUri,
    hasIssuer: !!auth0IssuerBaseUrl,
    hasClientId: !!clientId,
    hasAudience: !!audience,
    hasOrganizationId: !!organizationId,
    enableOrganizations,
    returnTo,
    provider,
  });

  if (!auth0IssuerBaseUrl || !clientId) {
    return NextResponse.json({
      error: 'Auth0 configuration missing',
      details: {
        hasIssuer: !!auth0IssuerBaseUrl,
        hasClientId: !!clientId,
        expectedRedirectUri: redirectUri,
      },
    }, { status: 500 });
  }

  const auth0Domain = auth0IssuerBaseUrl.replace(/^https?:\/\//, '');

  const authUrl = new URL(`https://${auth0Domain}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', returnTo);
  if (audience) authUrl.searchParams.set('audience', audience);
  // Only include organization when explicitly enabled; otherwise some clients will error with
  // "parameter organization is not allowed for this client".
  if (enableOrganizations && organizationId) authUrl.searchParams.set('organization', organizationId);
  if (provider === 'google') authUrl.searchParams.set('connection', 'google-oauth2');

  console.log('[auth/login] redirecting to', authUrl.toString());

  return NextResponse.redirect(authUrl.toString());
}