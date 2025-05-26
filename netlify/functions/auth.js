const { createHandlers } = require("netlify-cms-oauth-provider-node");

const handlers = createHandlers({
  providers: {
    github: {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
    }
  }
});

exports.handler = handlers.auth;
