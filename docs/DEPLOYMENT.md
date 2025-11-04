# Deployment

Automatic deployment on push to `main` via GitHub Actions.

## Deploy

```bash
git push origin main
```

Watch: https://github.com/meimberg-io/awesomeapps.temporal/actions

**Duration:** ~3-4 minutes

## How It Works

1. Checkout code
2. Build Docker image
3. Push to GitHub Container Registry
4. Copy `docker-compose.prod.yml` to server
5. SSH to server, create networks if needed, and run `envsubst` to substitute variables
6. Pull image and restart container

**File:** `.github/workflows/deploy.yml`
**Template:** `docker-compose.prod.yml` (uses `${PROJECT_NAME}`, `${DOCKER_IMAGE}`, `${APP_DOMAIN}`)

## Initial Setup

**First time?** See [GITHUB-SETUP.md](GITHUB-SETUP.md) for:
- GitHub Secrets/Variables
- DNS configuration
- SSH keys
- Server setup
- Temporal server connection

## Prerequisites

The deployment requires:
- ✅ Traefik reverse proxy configured
- ✅ `deploy` user with SSH access
- ✅ `traefik` network (created by Ansible)

**Note:** The deployment includes the complete Temporal stack (PostgreSQL, Temporal Server, Temporal UI, Worker) in a single docker-compose file.

## Operations

**View logs:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs awesomeapps-temporal -f"
```

**Restart:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "cd /srv/projects/awesomeapps-temporal && docker compose restart"
```

**Manual deploy:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "cd /srv/projects/awesomeapps-temporal && docker compose pull && docker compose up -d"
```

## Troubleshooting

**Container logs:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs awesomeapps-temporal --tail 100"
```

**Check all containers:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker ps | grep awesomeapps-temporal"
```

**Check Temporal server logs:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs awesomeapps-temporal-server --tail 50"
```

**Check database logs:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs awesomeapps-temporal-postgresql --tail 50"
```

**Check Temporal UI logs:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs awesomeapps-temporal-ui --tail 50"
```

**Traefik routing:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker logs traefik --tail 50"
```

**Check running containers:**
```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io "docker ps"
```

**DNS:**
```bash
dig awesomeapps-temporal.meimberg.io +short
```

**Test direct access:**
```bash
curl -I https://awesomeapps-temporal.meimberg.io/
```

## Configuration

**Environment Variables (GitHub Secrets):**
- `SSH_PRIVATE_KEY` - SSH key for server access
- `STRAPI_API_TOKEN` - Strapi API authentication token
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `YOUTUBE_API_KEY` - YouTube Data API key

**Environment Variables (GitHub Variables):**
- `SERVER_HOST` - Server hostname (hc-02.meimberg.io)
- `SERVER_USER` - SSH user (deploy)
- `APP_DOMAIN` - Worker domain (awesomeapps-temporal.meimberg.io)
- `UI_DOMAIN` - Temporal UI domain (temporal.meimberg.io)
- `TEMPORAL_NAMESPACE` - Temporal namespace (default)
- `TEMPORAL_TASK_QUEUE` - Task queue name (awesomeapps-tasks)
- `WORKER_CONCURRENCY` - Worker concurrency (10)
- `MAX_CONCURRENT_ACTIVITIES` - Max concurrent activities (10)
- `STRAPI_API_URL` - Strapi API URL
- `STRAPI_GRAPHQL_URL` - Strapi GraphQL URL
- `TRANSLATION_WORKFLOW_ID` - Translation workflow ID

## Server Access

**SSH Key:** `~/.ssh/oli_key`

```bash
ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io
```

**Project Directory:** `/srv/projects/awesomeapps-temporal/`

