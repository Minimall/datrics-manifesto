// OAuth proxy for Decap CMS → GitHub
const { createHandler } = require("netlify-cms-oauth-provider-node");

exports.handler = createHandler({
  provider: "github", // REQUIRED
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  // optional:
  // allowedOrgs: ["your-github-org"]
});
