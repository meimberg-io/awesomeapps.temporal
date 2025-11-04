# Operations Guide

## Setting Up the Scheduler

The scheduler workflow monitors the Strapi `new-services` table (queue) and processes entries one by one. To run it continuously, you need to set up a Temporal Schedule.

### Option 1: Using Temporal UI

1. Open Temporal UI at `http://localhost:8080`
2. Click **"Schedules"** in the left navigation
3. Click **"Create Schedule"**
4. Configure the following fields:
   - **Schedule ID**: `scheduler-loop` (or any unique identifier)
   - **Workflow Type**: `schedulerWorkflow`
   - **Task Queue**: `awesomeapps-tasks`
   - **Cron Expression**: `* * * * *` (every minute) or `*/5 * * * * *` (every 5 seconds)
   - **Workflow Input**: `[]` (empty array - scheduler takes no arguments)
5. Click **"Create"**

The scheduler will now run automatically at the specified interval.

### Option 2: Using Temporal CLI

#### With Interval (recommended for frequent execution):

```bash
temporal schedule create \
  --schedule-id scheduler-loop \
  --workflow-type schedulerWorkflow \
  --task-queue awesomeapps-tasks \
  --interval 1s \
  --workflow-input '[]'
```

#### With Cron Expression:

```bash
temporal schedule create \
  --schedule-id scheduler-loop \
  --workflow-type schedulerWorkflow \
  --task-queue awesomeapps-tasks \
  --cron-schedule "* * * * *" \
  --workflow-input '[]'
```

#### List Schedules:

```bash
temporal schedule list
```

#### Delete a Schedule:

```bash
temporal schedule delete --schedule-id scheduler-loop
```

#### Pause a Schedule:

```bash
temporal schedule toggle --schedule-id scheduler-loop --pause
```

#### Resume a Schedule:

```bash
temporal schedule toggle --schedule-id scheduler-loop --unpause
```

### Option 3: Programmatically (Code)

Create a setup script:

```typescript
import { Client, Connection } from '@temporalio/client'
import { config } from '../config/env'

async function setupScheduler() {
  const connection = await Connection.connect({
    address: config.temporal.address
  })

  const client = new Client({
    connection,
    namespace: config.temporal.namespace
  })

  try {
    // Create schedule with 1-second interval
    await client.schedule.create({
      scheduleId: 'scheduler-loop',
      spec: {
        intervals: [{ every: '1s' }]
        // Or use cron: cronExpressions: ['* * * * *']
      },
      action: {
        type: 'startWorkflow',
        workflowType: 'schedulerWorkflow',
        taskQueue: config.temporal.taskQueue,
        args: []
      }
    })

    console.log('✅ Scheduler created successfully')
  } catch (error) {
    console.error('❌ Failed to create scheduler:', error)
  } finally {
    await connection.close()
  }
}

setupScheduler()
```

## How the Scheduler Works

1. **Check for pending services**: If any service is already being processed (status: `pending`), skip this iteration
2. **Get next "new" service**: Query Strapi for services with status `new`
3. **Update status to "pending"**: Mark the service as being processed
4. **Execute service workflow**: Run the service workflow as a child workflow
5. **Handle completion**:
   - **On success**: Wait 15 seconds, then delete the entry
   - **On error**: Update status to `error` (manual intervention required)

## Monitoring

### Temporal UI

- View running schedules: http://localhost:8080/schedules
- View workflow executions: http://localhost:8080/workflows
- Check for failed workflows and inspect error details

### Strapi Admin

- Monitor the `new-services` table for:
  - Services stuck in `pending` status (workflow crashed)
  - Services with `error` status (workflow failed)

## Troubleshooting

### Scheduler not processing services

1. Check if worker is running:
   ```bash
   docker compose ps temporal-worker
   # or
   npm run start:dev
   ```

2. Check if schedule exists:
   ```bash
   temporal schedule list
   ```

3. Check Temporal UI for failed workflows

### Services stuck in "pending" status

If a workflow crashes, services may remain in `pending` status. Manually reset them:

```graphql
mutation {
  updateNewService(
    id: "DOCUMENT_ID",
    data: { n8nstatus: "new" }
  ) {
    documentId
  }
}
```

Or use Strapi REST API:
```bash
curl -X PUT https://awesomeapps-strapi.meimberg.io/api/new-services/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"n8nstatus":"new"}}'
```

### Performance Tuning

Adjust the schedule interval based on load:
- **High load**: `--interval 5s` or `--interval 10s`
- **Low load**: `--interval 1s` (matches n8n behavior)

Remember: Each scheduler execution checks the queue, so frequent executions are fine - the workflow will skip if nothing is ready to process.

## Best Practices

1. **Monitor failed workflows**: Set up alerts for workflows in `error` status
2. **Use appropriate intervals**: Balance between responsiveness and system load
3. **Keep the worker running**: Ensure at least one worker is always active
4. **Review logs regularly**: Check Temporal UI for patterns in failures
5. **Test in dev first**: Always test schedule changes in development before production

