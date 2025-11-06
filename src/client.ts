import { Connection, Client } from '@temporalio/client'
import { config } from './config/env'
import { serviceWorkflow } from './workflows/service'
import { translationWorkflow } from './workflows/translation'
import { schedulerWorkflow } from './workflows/scheduler'
import { microsoftTodoWorkflow } from './workflows/microsoft-todo'
import type { ServiceWorkflowInput, TranslationWorkflowInput } from './types/service'

export async function createClient() {
  const connection = await Connection.connect({
    address: config.temporal.address
  })

  const client = new Client({
    connection,
    namespace: config.temporal.namespace
  })

  return { client, connection }
}

export async function startServiceWorkflow(input: ServiceWorkflowInput) {
  const { client, connection } = await createClient()

  const handle = await client.workflow.start(serviceWorkflow, {
    args: [input],
    taskQueue: config.temporal.taskQueue,
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

export async function startTranslationWorkflow(input: TranslationWorkflowInput) {
  const { client, connection } = await createClient()

  const handle = await client.workflow.start(translationWorkflow, {
    args: [input],
    taskQueue: config.temporal.taskQueue,
    workflowId: `translate-${input.documentId}-${Date.now()}`
  })

  console.log('Translation workflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
    serviceName: input.serviceName,
    documentId: input.documentId
  })

  const result = await handle.result()

  await connection.close()

  return result
}

export async function startSchedulerWorkflow() {
  const { client, connection } = await createClient()

  const handle = await client.workflow.start(schedulerWorkflow, {
    args: [],
    taskQueue: config.temporal.taskQueue,
    workflowId: `scheduler-${Date.now()}`
  })

  console.log('Scheduler workflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId
  })

  const result = await handle.result()

  await connection.close()

  return result
}

export async function startMicrosoftTodoWorkflow(taskListId?: string, limit?: number) {
  const { client, connection } = await createClient()

  const resolvedListId = taskListId || config.microsoftTodo.credentials.defaultListId
  if (!resolvedListId) {
    await connection.close()
    throw new Error('MICROSOFT_TODO_LIST_ID is not set and no taskListId was provided')
  }

  const handle = await client.workflow.start(microsoftTodoWorkflow, {
    args: [{ taskListId: resolvedListId, limit }],
    taskQueue: config.temporal.taskQueue,
    workflowId: `microsoft-todo-${Date.now()}`
  })

  console.log('Microsoft To Do workflow started', {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
    taskListId: resolvedListId,
    limit
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
