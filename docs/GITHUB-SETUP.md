# GitHub Setup

Initial configuration required for automatic deployment.

## GitHub Variables

**Settings → Variables → Actions**

| Name | Value | Description |
|------|-------|-------------|
| `APP_DOMAIN` | `temporal.meimberg.io` | Temporal UI domain |
| `SERVER_HOST` | `hc-02.meimberg.io` | Server hostname |
| `SERVER_USER` | `deploy` | SSH user for deployment |
| `TEMPORAL_NAMESPACE` | `default` | Temporal namespace |
| `TEMPORAL_TASK_QUEUE` | `awesomeapps-tasks` | Task queue name |
| `WORKER_CONCURRENCY` | `10` | Worker concurrency |
| `MAX_CONCURRENT_ACTIVITIES` | `10` | Max concurrent activities |
| `STRAPI_API_URL` | `https://awesomeapps-strapi.meimberg.io/api` | Strapi API URL |
| `STRAPI_GRAPHQL_URL` | `https://awesomeapps-strapi.meimberg.io/graphql` | Strapi GraphQL URL |
| `TRANSLATION_WORKFLOW_ID` | `UxndSFHh7ve4DPto` | Translation workflow ID |

## GitHub Secrets

**Settings → Secrets → Actions**

| Name | Value | Description |
|------|-------|-------------|
| `SSH_PRIVATE_KEY` | `<private key contents>` | Deploy user private key |
| `STRAPI_API_TOKEN` | `<strapi token>` | Strapi API authentication token |
| `OPENAI_API_KEY` | `<openai key>` | OpenAI API key |
| `GOOGLE_GEMINI_API_KEY` | `<gemini key>` | Google Gemini API key |
| `YOUTUBE_API_KEY` | `<youtube key>` | YouTube Data API key |

**Get SSH private key:**
```bash
# Linux/Mac
cat ~/.ssh/id_rsa
# Or your deploy key: cat ~/.ssh/deploy_key

# Windows PowerShell
Get-Content C:\Users\YourName\.ssh\id_rsa
```

Copy entire output including `-----BEGIN` and `-----END` lines.

**Get Strapi API Token:**
1. Login to Strapi admin panel
2. Settings → API Tokens → Global settings
3. Create new token with appropriate permissions
4. Copy the token (shown only once)

**Get API Keys:**
- **OpenAI:** https://platform.openai.com/api-keys
- **Google Gemini:** https://aistudio.google.com/app/apikey
- **YouTube:** https://console.cloud.google.com/apis/credentials



# DNS Configuration

**Add CNAME record:**
```
temporal.meimberg.io  →  CNAME  →  hc-02.meimberg.io
```

**Note:** The worker runs in the background and doesn't serve HTTP traffic, so only the Temporal UI needs a domain.

# Server Infrastructure

**Prerequisites (one-time setup):**

Run Ansible to setup server infrastructure:

```bash
cd ../io.meimberg.ansible

# Install Ansible collections
ansible-galaxy collection install -r requirements.yml

# Run infrastructure setup
ansible-playbook -i inventory/hosts.ini playbooks/site.yml --vault-password-file vault_pass
```

**This installs:**
- ✅ Docker + Docker Compose
- ✅ Traefik reverse proxy (automatic SSL)
- ✅ `deploy` user (for deployments)
- ✅ Firewall rules (SSH, HTTP, HTTPS)
- ✅ Automated backups

**Server must be ready before first deployment!**

**Note:** Ansible automatically creates deploy user and configures SSH access.



# Temporal Server Setup

**The deployment includes everything:** PostgreSQL, Temporal Server, Temporal UI, and the worker - all in one docker-compose file, just like it works locally.

The deployment automatically sets up:
- **PostgreSQL database** - Temporal data storage
- **Temporal server** - Core Temporal service
- **Temporal UI** - Web interface at https://temporal.meimberg.io
- **Worker** - Your awesomeapps worker

No separate infrastructure setup needed - it's all automated!



# First Deployment

After completing all steps above:

```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

**Monitor:** https://github.com/meimberg-io/awesomeapps.temporal/actions

**Deployment takes ~3-4 minutes:**
1. ✅ Docker image builds
2. ✅ Pushes to GitHub Container Registry
3. ✅ SSHs to server
4. ✅ Deploys full stack (PostgreSQL + Temporal Server + UI + Worker)
5. ✅ Temporal UI live at https://temporal.meimberg.io
6. ✅ Worker running in background (no web interface)

# Additional Information

## Checklist

Before first deployment:

- [ ] GitHub Variables added: `APP_DOMAIN`, `SERVER_HOST`, `SERVER_USER`, Temporal config, API URLs
- [ ] GitHub Secrets added: `SSH_PRIVATE_KEY`, API keys
- [ ] DNS CNAME record configured for Temporal UI
- [ ] Server infrastructure deployed via Ansible
- [ ] `traefik` network exists (created by Ansible)
- [ ] Can SSH to server: `ssh deploy@hc-02.meimberg.io`

**Estimated setup time:** 20-25 minutes


## Troubleshooting

**GitHub Actions fails at deploy step:**
```bash
# Test SSH manually
ssh -i ~/.ssh/deploy_key deploy@hc-02.meimberg.io

# Check deploy user exists
ssh root@hc-02.meimberg.io "id deploy"
```

**Container not starting:**
```bash
ssh deploy@hc-02.meimberg.io "docker logs awesomeapps-temporal"
```

**Temporal connection issues:**
```bash
# Check if Temporal server is running
ssh root@hc-02.meimberg.io "docker ps | grep temporal"

# Check Temporal server logs
ssh root@hc-02.meimberg.io "docker logs temporal-server --tail 50"

# Test connectivity from worker
ssh root@hc-02.meimberg.io "docker exec awesomeapps-temporal nc -zv temporal-server 7233"
```

**SSL certificate issues:**
```bash
# Check Traefik logs
ssh root@hc-02.meimberg.io "docker logs traefik | grep awesomeapps-temporal"

# Verify DNS propagated
dig awesomeapps-temporal.meimberg.io +short
```

**Image pull failed:**
- Automatically handled via `GITHUB_TOKEN`
- If still failing, verify package permissions in GitHub



## Changing Domain

1. Update DNS A record
2. Update GitHub Variable `APP_DOMAIN`
3. Push to trigger redeploy

No code changes needed!



## Related Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment operations
- [operations.md](operations.md) - Temporal operations
- [../../io.meimberg.ansible/README.md](../../io.meimberg.ansible/README.md) - Ansible overview
- [../../io.meimberg.ansible/docs/SETUP.md](../../io.meimberg.ansible/docs/SETUP.md) - Server setup
- [../../io.meimberg.ansible/docs/SSH-KEYS.md](../../io.meimberg.ansible/docs/SSH-KEYS.md) - SSH key configuration

