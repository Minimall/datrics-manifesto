exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters } = event;
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  if (httpMethod === 'GET') {
    const { code, provider } = queryStringParameters || {};
    
    // If no code, redirect to GitHub OAuth
    if (!code) {
      const clientId = process.env.GITHUB_CLIENT_ID;
      
      // Debug: Check if client ID exists
      if (!clientId) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'GITHUB_CLIENT_ID not configured' })
        };
      }
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=https://datrics-cms.netlify.app/.netlify/functions/auth&scope=repo,user`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': authUrl
        },
        body: ''
      };
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error('GitHub OAuth error:', tokenData);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: tokenData.error_description || 'OAuth failed' })
        };
      }

      const token = tokenData.access_token;

      const script = `
        <script>
          const receiveMessage = (message) => {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
              message.origin
            );
            window.removeEventListener("message", receiveMessage, false);
          }
          window.addEventListener("message", receiveMessage, false);
          
          window.opener.postMessage("authorizing:github", "*");
        </script>
      `;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/html'
        },
        body: script
      };
    } catch (error) {
      console.error('Auth error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Authentication failed', details: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};