const simpleOauthModule = require('simple-oauth2');

const oauth2 = simpleOauthModule.create({
  client: {
    id: process.env.OAUTH_CLIENT_ID,
    secret: process.env.OAUTH_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize',
  },
});

exports.handler = async (event, context) => {
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Authorization code not provided' }),
    };
  }

  try {
    const result = await oauth2.authorizationCode.getToken({
      code,
      redirect_uri: process.env.REDIRECT_URL || `${process.env.URL}/.netlify/functions/auth`,
    });

    const token = oauth2.accessToken.create(result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: token.token.access_token,
        provider: 'github',
      }),
    };
  } catch (error) {
    console.error('OAuth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Authentication failed' }),
    };
  }
};