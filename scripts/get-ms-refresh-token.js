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

app.acquireTokenByDeviceCode({
  scopes: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
  deviceCodeCallback: info => {
    console.log('Visit:', info.verificationUri)
    console.log('Code:', info.userCode)
  }
})
.then(result => {
  console.log('\n=== TOKEN RESULT ===')
  console.log('access_token:', result.accessToken ? 'PRESENT' : 'MISSING')
  console.log('refresh_token:', result.refreshToken ?? '<none>')
  console.log('scopes:', result.scopes)
  console.log('account:', result.account?.username)
  console.log('\nFull access_token (first 50 chars):', result.accessToken?.substring(0, 50))
  if (result.refreshToken) {
    console.log('Full refresh_token (first 50 chars):', result.refreshToken.substring(0, 50))
  }
})
.catch(err => {
  console.error('Failed to acquire token:', err)
  process.exit(1)
})