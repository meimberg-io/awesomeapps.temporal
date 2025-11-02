import { Connection, Client } from '@temporalio/client'
import { exampleWorkflow } from './workflows/example'

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

export async function startExampleWorkflow(name: string) {
  const { client, connection } = await createClient()

  const handle = await client.workflow.start(exampleWorkflow, {
    args: [name],
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'awesomeapps-tasks',
    workflowId: `example-${Date.now()}`
  })

  console.log('Workflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId
  })

  const result = await handle.result()

  await connection.close()

  return result
}

