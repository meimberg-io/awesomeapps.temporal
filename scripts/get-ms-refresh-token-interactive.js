require('dotenv').config()
const { PublicClientApplication } = require('@azure/msal-node')

const { AZURE_CLIENT_ID, AZURE_TENANT_ID } = process.env
if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID) {
  throw new Error('Set AZURE_CLIENT_ID and AZURE_TENANT_ID in .env')
}

const app = new PublicClientApplication({
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`
  }
})

// Use interactive flow with local redirect
const redirectUri = 'http://localhost:3000'

console.log('\nOpen this URL in your browser:\n')
console.log(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?client_id=${AZURE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent('Tasks.ReadWrite User.Read offline_access')}&state=12345`)
console.log('\nAfter login, paste the entire redirect URL here:')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Redirect URL: ', async (url) => {
  rl.close()
  
  const code = new URL(url).searchParams.get('code')
  if (!code) {
    console.error('No authorization code found in URL')
    process.exit(1)
  }

  try {
    const result = await app.acquireTokenByCode({
      code,
      scopes: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
      redirectUri
    })
    
    console.log('\naccess_token:', result.accessToken)
    console.log('refresh_token:', result.refreshToken ?? '<none>')
    console.log('expires_on:', result.expiresOn)
  } catch (err) {
    console.error('Failed to acquire token:', err)
    process.exit(1)
  }
})

