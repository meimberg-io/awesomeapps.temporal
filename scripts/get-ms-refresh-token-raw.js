require('dotenv').config()
const http = require('http')
const url = require('url')

const {
  AZURE_CLIENT_ID,
  AZURE_TENANT_ID,
  AZURE_CLIENT_SECRET
} = process.env

if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID || !AZURE_CLIENT_SECRET) {
  console.error('Set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET in .env')
  process.exit(1)
}

const redirectUri = 'http://localhost:3000/callback'
const scopes = [
  'Tasks.ReadWrite',
  'User.Read',
  'offline_access',
  'openid',
  'profile',
  'email'
].join(' ')

async function exchangeCodeForTokens(code) {
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: scopes
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(`Token endpoint error ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

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
      const tokens = await exchangeCodeForTokens(code)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Success! You can close this tab.')

      console.log('\naccess_token:', tokens.access_token ? 'PRESENT' : 'MISSING')
      console.log('refresh_token:', tokens.refresh_token ?? '<none>')
      console.log('expires_in:', tokens.expires_in)
    } catch (err) {
      res.statusCode = 500
      res.end('Token exchange failed')
      console.error('Failed:', err.message)
    } finally {
      server.close(() => process.exit(0))
    }
  })

  server.listen(3000, () => {
    const authorizeUrl =
      `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize` +
      `?client_id=${encodeURIComponent(AZURE_CLIENT_ID)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&prompt=consent`
    console.log('\nOpen this URL in your browser:\n')
    console.log(authorizeUrl)
    console.log('\nWaiting for redirect to', redirectUri, '...\n')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


