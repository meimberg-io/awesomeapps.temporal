# Temporal Workflows

Temporal workflows for awesomeapps - migrated from n8n.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Copy environment file:**
```bash
cp env.example .env
```

3. **Start Temporal server:**
```bash
docker compose up -d temporal-server temporal-postgresql temporal-ui
```

4. **Start worker in development mode:**
```bash
docker compose --profile dev up temporal-worker
```

Or run locally:
```bash
npm run start:dev
```

5. **Access Temporal UI:**
Open http://localhost:8080

## 📦 Project Structure

```
src/
├── workflows/      # Workflow definitions
│   ├── service.ts
│   ├── translation.ts
│   ├── scheduler.ts
│   └── index.ts
├── activities/     # Activity implementations
│   ├── strapi.ts
│   ├── gemini.ts
│   ├── openai.ts
│   ├── youtube.ts
│   ├── translation.ts
│   └── index.ts
├── test/           # Test files
├── client.ts       # Temporal client for starting workflows
└── worker.ts       # Worker that executes workflows
```

## 🔧 Configuration

Environment variables (see `env.example`):

- `TEMPORAL_ADDRESS` - Temporal server address (default: `localhost:7233`)
- `TEMPORAL_NAMESPACE` - Temporal namespace (default: `default`)
- `TEMPORAL_TASK_QUEUE` - Task queue name (default: `awesomeapps-tasks`)
- `MAX_CONCURRENT_ACTIVITIES` - Max concurrent activities (default: `10`)

## 🏃 Running Workflows

### Available Workflows

#### Service Workflow
Processes a service by generating content using AI (Gemini or OpenAI), fetching data, and storing it in Strapi.

```bash
npm run test:workflow:service
```

#### Translation Workflow
Translates service content to German locale.

```bash
npm run test:workflow:translation
```

#### Scheduler Workflow
Queue processor that monitors the Strapi `new-services` table and processes entries one by one:
- Checks for pending services (skips if busy)
- Gets next "new" service
- Updates status to "pending"
- Executes service workflow
- Deletes on success or marks as "error" on failure

```bash
npm run test:workflow:scheduler
```

**To run continuously**, set up a Temporal Schedule. See [docs/operations.md](docs/operations.md) for detailed instructions on using Temporal UI, CLI, or code to create a schedule.

### From code:

```typescript
import { startServiceWorkflow } from './src/client'

const result = await startServiceWorkflow({
  service: 'Discord',
  fields: ['url', 'abstract', 'description'],
  aiProvider: 'openai'
})
```

### Using Temporal CLI:

```bash
temporal workflow start \
  --type serviceWorkflow \
  --task-queue awesomeapps-tasks \
  --input '[{"service":"Discord","fields":["url"],"aiProvider":"gemini"}]'
```

## 🐳 Docker

### Development:
```bash
docker compose --profile dev up
```

### Production:
```bash
docker compose --profile prod up
```

## 📝 Building

```bash
npm run build
```

## 🚀 Deployment

Push to `main` triggers automatic deployment:

```bash
git push origin main
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

### Documentation

- **[Deployment](docs/DEPLOYMENT.md)** - Deploy to production
- **[GitHub Setup](docs/GITHUB-SETUP.md)** - Initial configuration
- **[Operations](docs/operations.md)** - Temporal operations

## Production

**Temporal UI:** https://temporal.meimberg.io
**Server:** hc-02.meimberg.io
**SSH:** `ssh -i ~/.ssh/oli_key root@hc-02.meimberg.io`

**Note:** 
- The production deployment includes the complete Temporal stack (PostgreSQL, Temporal Server, UI, Worker) in a single docker-compose file - identical to local development.
- The worker runs in the background and doesn't serve HTTP traffic. Use the Temporal UI to monitor workflows and activities.

## 🔄 Migration from n8n

This project is set up to migrate complex n8n workflows to Temporal. Key differences:

- **Workflows**: Define in `src/workflows/`
- **Activities**: Define in `src/activities/` (replaces n8n nodes)
- **Worker**: Runs continuously to execute workflows
- **Client**: Starts workflows programmatically

See Temporal documentation: https://docs.temporal.io

