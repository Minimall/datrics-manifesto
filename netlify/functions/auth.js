const handler = require("netlify-cms-oauth-provider-node");

exports.handler = handler({
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
});