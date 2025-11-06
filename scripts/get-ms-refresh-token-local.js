require('dotenv').config()
const http = require('http')
const url = require('url')
const crypto = require('crypto')
const { PublicClientApplication } = require('@azure/msal-node')

const { AZURE_CLIENT_ID, AZURE_TENANT_ID } = process.env
if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID) {
  console.error('Set AZURE_CLIENT_ID and AZURE_TENANT_ID in .env')
  process.exit(1)
}

const redirectUri = 'http://localhost:3000/callback'
const scopes = ['Tasks.ReadWrite', 'User.Read', 'offline_access', 'openid', 'profile', 'email']

const pca = new PublicClientApplication({
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`
  }
})

async function main() {
  // Generate PKCE verifier/challenge (required for public client auth code flow)
  const codeVerifier = crypto.randomBytes(64).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true)
    if (parsed.pathname !== '/callback') {
      res.statusCode = 404
      res.end('Not Found')
      return
    }

    const code = parsed.query.code
    if (!code) {
      res.statusCode = 400
      res.end('Missing code')
      return
    }

    try {
      const result = await pca.acquireTokenByCode({
        code,
        scopes,
        redirectUri,
        codeVerifier
      })

      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Success! You can close this tab.')

      console.log('\naccess_token:', result.accessToken)
      console.log('refresh_token:', result.refreshToken ?? '<none>')
      console.log('expires_on:', result.expiresOn)
    } catch (err) {
      res.statusCode = 500
      res.end('Token exchange failed')
      console.error('Failed to acquire token:', err)
    } finally {
      server.close(() => process.exit(0))
    }
  })

  server.listen(3000, async () => {
    const authUrl = await pca.getAuthCodeUrl({
      scopes,
      redirectUri,
      responseMode: 'query',
      codeChallenge,
      codeChallengeMethod: 'S256'
    })
    console.log('\nOpen this URL in your browser:\n')
    console.log(authUrl)
    console.log('\nWaiting for redirect to', redirectUri, '...\n')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


