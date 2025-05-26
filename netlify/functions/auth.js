const { AuthorizationCode } = require('simple-oauth2');

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
    const client = new AuthorizationCode({
      client: {
        id: process.env.GITHUB_CLIENT_ID,
        secret: process.env.GITHUB_CLIENT_SECRET,
      },
      auth: {
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize',
      },
    });

    const { code } = queryStringParameters;
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No authorization code provided' })
      };
    }

    try {
      const tokenParams = {
        code,
        redirect_uri: `https://datrics-cms.netlify.app/.netlify/functions/auth`,
        scope: 'repo,user'
      };

      const accessToken = await client.getToken(tokenParams);
      const token = accessToken.token.access_token;

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
        body: JSON.stringify({ error: 'Authentication failed' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};