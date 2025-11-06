import { config } from '../config/env'

interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type?: string
}

const REFRESH_BUFFER_SECONDS = 60

class MicrosoftTokenProvider {
  private accessToken?: string
  private expiresAt?: number
  private refreshPromise?: Promise<string>

  constructor(private credentials = config.microsoftTodo.credentials) {
    if (credentials.initialAccessToken) {
      this.accessToken = credentials.initialAccessToken
      this.expiresAt = 0
    }
  }

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken as string
    }

    return this.refresh()
  }

  invalidate() {
    this.accessToken = undefined
    this.expiresAt = undefined
  }

  private isTokenValid(): boolean {
    if (!this.accessToken || !this.expiresAt) {
      return false
    }

    const now = Date.now()
    return now < this.expiresAt - REFRESH_BUFFER_SECONDS * 1000
  }

  private async refresh(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.executeRefresh()
      .catch(error => {
        this.invalidate()
        throw error
      })
      .finally(() => {
        this.refreshPromise = undefined
      })

    return this.refreshPromise
  }

  private async executeRefresh(): Promise<string> {
    const { tenantId, clientId, clientSecret, refreshToken } = this.credentials
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'https://graph.microsoft.com/.default offline_access'
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Microsoft identity platform token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const payload = (await response.json()) as TokenResponse

    if (!payload.access_token) {
      throw new Error('Microsoft identity platform response missing access_token')
    }

    this.accessToken = payload.access_token

    const expiresInSeconds =
      typeof payload.expires_in === 'number'
        ? payload.expires_in
        : parseInt(String(payload.expires_in), 10)

    const safeExpiresIn = Number.isFinite(expiresInSeconds) ? expiresInSeconds : 3600
    this.expiresAt = Date.now() + Math.max(safeExpiresIn - REFRESH_BUFFER_SECONDS, 30) * 1000

    if (payload.refresh_token) {
      this.credentials.refreshToken = payload.refresh_token
    }

    return this.accessToken
  }
}

export const microsoftTokenProvider = new MicrosoftTokenProvider()

