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
│   ├── example.ts
│   └── index.ts
├── activities/     # Activity implementations
│   ├── example.ts
│   └── index.ts
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

### From code:

```typescript
import { startExampleWorkflow } from './src/client'

const result = await startExampleWorkflow('World')
console.log(result) // "Hello, World!"
```

### Using Temporal CLI:

```bash
temporal workflow start \
  --type exampleWorkflow \
  --task-queue awesomeapps-tasks \
  --input '["World"]'
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

## 🔄 Migration from n8n

This project is set up to migrate complex n8n workflows to Temporal. Key differences:

- **Workflows**: Define in `src/workflows/`
- **Activities**: Define in `src/activities/` (replaces n8n nodes)
- **Worker**: Runs continuously to execute workflows
- **Client**: Starts workflows programmatically

See Temporal documentation: https://docs.temporal.io

