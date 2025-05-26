const { createHandler } = require("netlify-cms-oauth-provider-node");

exports.handler = createHandler({
  config: {
    oauth: {
      provider: "github",
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
    }
  }
});