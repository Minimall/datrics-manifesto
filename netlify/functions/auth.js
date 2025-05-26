exports.handler = async (event, context) => {
  const { code, provider } = event.queryStringParameters;

  // If no code, redirect to Auth0 for authentication
  if (!code) {
    const authUrl = `https://${process.env.AUTH0_DOMAIN}/authorize?` +
      `response_type=code&` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.URL}/.netlify/functions/auth`)}&` +
      `scope=openid profile email&` +
      `connection=github`;

    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
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

    // Get user info and GitHub token from Auth0
    const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    // Get GitHub access token from Auth0
    const githubTokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userData.sub}`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const githubData = await githubTokenResponse.json();
    const githubToken = githubData.identities?.[0]?.access_token;

    // Return success page with GitHub token for Decap CMS
    const successPage = `
      <script>
        window.opener.postMessage({
          token: "${githubToken || tokenData.access_token}",
          provider: "github"
        }, window.location.origin);
        window.close();
      </script>
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: successPage,
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