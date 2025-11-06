# API Keys & Tokens

This guide explains where each credential is used, how to issue a new one, and how to store it safely for the Temporal worker.

## Summary

| Env var / Secret | Purpose | Where it lives | Notes |
|------------------|---------|----------------|-------|
| `STRAPI_API_TOKEN` | Authenticate Strapi REST + GraphQL calls | `.env`, GitHub Secret | Requires Strapi admin role |
| `OPENAI_API_KEY` | AI content generation | `.env`, GitHub Secret | Maps to OpenAI project |
| `GOOGLE_GEMINI_API_KEY` | AI fallback model | `.env`, GitHub Secret | Issued via Google AI Studio |
| `YOUTUBE_API_KEY` | Fetch channel metadata | `.env`, GitHub Secret | Google Cloud API key |
| `AZURE_TENANT_ID` | Microsoft tenant for automation app | `.env`, GitHub Secret | Example: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_CLIENT_ID` | Azure AD application client ID | `.env`, GitHub Secret | Same app used for To Do automation |
| `AZURE_CLIENT_SECRET` | Azure AD application secret | `.env`, GitHub Secret | Rotate periodically; never check in |
| `MICROSOFT_TODO_REFRESH_TOKEN` | Refresh token for Graph Tasks scope | `.env`, GitHub Secret | Used to mint short-lived access tokens |
| `MICROSOFT_TODO_ACCESS_TOKEN` | (Optional) fallback access token | `.env`, GitHub Secret | Only used until first refresh |

General workflow:

1. Create/regenerate the credential in the provider console.
2. Store it in the team password manager.
3. Update local `.env` for development.
4. Update `awesomeapps.temporal` GitHub Actions secret for deployment.
5. Trigger a redeploy (or restart the worker) if the key changed.

Never commit secrets to the repository.

## Strapi API Token (`STRAPI_API_TOKEN`)

1. Sign in to the Strapi admin portal at `https://awesomeapps-strapi.meimberg.io/admin`.
2. Navigate to **Settings → API Tokens**.
3. Create a token:
   - **Type:** Custom
   - **Name:** `awesomeapps-temporal-worker`
   - **Permissions:** Grant the collections used by the worker (`new-services`, related content) read/write access.
   - **Expires:** Set to _No expiration_ unless policy requires rotation.
4. Copy the token immediately (Strapi shows it once).
5. Store it in the password manager, update `.env`, and add/update the `STRAPI_API_TOKEN` GitHub Secret.

## OpenAI API Key (`OPENAI_API_KEY`)

1. Go to [OpenAI dashboard](https://platform.openai.com/api-keys) with the project owner account.
2. Create a new secret key (name it after the environment, e.g., `awesomeapps-temporal-prod`).
3. Copy the key once it is shown.
4. Store it securely, then update `.env` and the `OPENAI_API_KEY` GitHub Secret.
5. Rotate old keys from the dashboard when no longer needed.

## Google Gemini API Key (`GOOGLE_GEMINI_API_KEY`)

1. Sign in to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API key**, pick the correct Google Cloud project, and confirm.
3. Copy the generated key.
4. Store it, add to `.env`, and update the `GOOGLE_GEMINI_API_KEY` GitHub Secret.
5. If the project enforces quotas, review usage in Google Cloud Console.

## YouTube Data API Key (`YOUTUBE_API_KEY`)

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with the shared project account.
2. Select the `awesomeapps` project (create it if missing).
3. Enable **YouTube Data API v3** under **APIs & Services → Library**.
4. In **APIs & Services → Credentials**, click **Create credentials → API key**.
5. Restrict the key:
   - Application restriction: **IP addresses** (GitHub Actions runners) or **None** if not feasible.
   - API restriction: **YouTube Data API v3**.
6. Store the key, update `.env`, and set the `YOUTUBE_API_KEY` GitHub Secret.
7. Remove unused keys from the project to avoid quota leaks.

## Microsoft To Do OAuth Credentials

1. Sign in to [Azure Portal](https://portal.azure.com) with the automation tenant account.
2. Navigate to **Azure Active Directory → App registrations** and locate the existing app (e.g., `awesomeapps-temporal`). If absent, create a new registration:
   - Redirect URI (public client/native): `https://login.microsoftonline.com/common/oauth2/nativeclient`
3. Under **API permissions**, add delegated permissions:
   - `Tasks.ReadWrite`
   - `offline_access`
   - `User.Read`
   Grant admin consent.
4. Create a client secret (**Certificates & secrets**) and store it securely.
5. Acquire credentials (client ID, client secret, tenant ID) and store them in the password manager.
6. Generate a refresh token using the Microsoft identity platform. Two options:
   - **Azure CLI (interactive):**
     ```bash
     az account set --subscription "<subscription-id>"
     az account get-access-token \
       --tenant "<tenant-id>" \
       --resource-type ms-graph \
       --query accessToken -o tsv
     ```
     Then run `az login --tenant <tenant-id> --scope https://graph.microsoft.com/.default offline_access` to capture the refresh token.
   - **MSAL device code flow:**
     ```bash
     npx @azure/msal-node device-code
     ```
     Configure it with the client ID, tenant ID, and requested scopes (`Tasks.ReadWrite offline_access`).
7. Store `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `MICROSOFT_TODO_REFRESH_TOKEN` in the password manager, local `.env`, and GitHub Secrets.
8. (Optional) Add `MICROSOFT_TODO_ACCESS_TOKEN` if you want the worker to start with a known access token; it is refreshed automatically after startup.
9. The worker now refreshes access tokens at runtime—no redeploy needed unless the long-lived credentials change. If the refresh token is rotated, update secrets and restart the worker to load the new values.

> Tip: Keep the refresh token, client ID, tenant ID, and client secret in the password manager so tokens can be regenerated without portal access. Rotate the client secret and refresh token periodically per security policy.


