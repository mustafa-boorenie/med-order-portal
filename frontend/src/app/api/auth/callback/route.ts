import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';
  const error = searchParams.get('error');
  
  console.log('Callback received:', {
    hasCode: !!code,
    hasError: !!error,
    state,
    searchParams: Object.fromEntries(searchParams.entries())
  });
  
  if (error) {
    console.error('Auth0 returned error:', error);
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }
  
  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }
  
  try {
    // Exchange code for tokens
    const auth0IssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    
    if (!auth0IssuerBaseUrl || !clientId || !clientSecret) {
      console.error('Missing Auth0 configuration:', {
        hasAuth0IssuerBaseUrl: !!auth0IssuerBaseUrl,
        auth0IssuerBaseUrl: auth0IssuerBaseUrl ? 'set' : 'MISSING',
        hasClientId: !!clientId,
        clientId: clientId ? 'set' : 'MISSING',
        hasClientSecret: !!clientSecret,
        clientSecret: clientSecret ? 'set' : 'MISSING'
      });
      throw new Error('Auth0 configuration missing');
    }
    
    const auth0Domain = auth0IssuerBaseUrl.replace(/^https?:\/\//, '');
    const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000';
    
    const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const user = await userResponse.json();
    
    // Create session
    const sessionData = {
      user,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    };
    
    const response = NextResponse.redirect(new URL(state, request.url));
    
    // Set session cookie (simplified - in production use proper encryption)
    // Store an encoded session to avoid issues with special characters in JSON
    const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
    response.cookies.set('appSession', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });
    
    console.log('Session cookie set successfully:', {
      cookieLength: cookieValue.length,
      expiresIn: tokens.expires_in,
      redirectTo: state
    });
    
    return response;
    
  } catch (error) {
    console.error('Auth callback error:', error);
    // More detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, request.url));
  }
}