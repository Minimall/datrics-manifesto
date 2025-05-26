// OAuth proxy for Decap CMS → GitHub
const { createHandler } = require("netlify-cms-oauth-provider-node");

exports.handler = createHandler({
  provider: "github", // REQUIRED
  clientId: process.env.Ov23lidjFzr80VTu0n4z,
  clientSecret: process.env.2d2abd8e0678e284081c72924a8b2e46d0e1689b,
  // optional:
  // allowedOrgs: ["your-github-org"]
});
