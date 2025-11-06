require('dotenv').config()
const http = require('http')
const url = require('url')
const { ConfidentialClientApplication } = require('@azure/msal-node')

const { AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET } = process.env
if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID || !AZURE_CLIENT_SECRET) {
  console.error('Set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET in .env')
  process.exit(1)
}

const redirectUri = 'http://localhost:3000/callback'
const scopes = ['Tasks.ReadWrite', 'User.Read', 'offline_access', 'openid', 'profile', 'email']

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: AZURE_CLIENT_ID,
    clientSecret: AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`
  }
})

async function main() {
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
      const result = await cca.acquireTokenByCode({
        code,
        scopes,
        redirectUri
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
    const authUrl = await cca.getAuthCodeUrl({
      scopes,
      redirectUri,
      responseMode: 'query',
      prompt: 'consent'
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


