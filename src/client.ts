import { Connection, Client } from '@temporalio/client'
import { serviceWorkflow } from './workflows/service'
import type { ServiceWorkflowInput } from './types/service'

export async function createClient() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
  })

  const client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default'
  })

  return { client, connection }
}

export async function startServiceWorkflow(input: ServiceWorkflowInput) {
  const { client, connection } = await createClient()

  const handle = await client.workflow.start(serviceWorkflow, {
    args: [input],
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'awesomeapps-tasks',
    workflowId: `service-${slugify(input.service)}-${Date.now()}`
  })

  console.log('Service workflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
    service: input.service
  })

  const result = await handle.result()

  await connection.close()

  return result
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

