exports.handler = async (event, context) => {
  const { code, state } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authorization code not provided' }),
    };
  }

  try {
    // Exchange code for token with Auth0
    const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.URL}/.netlify/functions/auth`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    // Get user info from Auth0
    const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    // Return the token for Decap CMS
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: tokenData.access_token,
        provider: 'auth0',
        user: userData,
      }),
    };
  } catch (error) {
    console.error('Auth0 authentication error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Authentication failed',
        details: error.message 
      }),
    };
  }
};