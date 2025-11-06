import {proxyActivities} from '@temporalio/workflow'
import type * as microsoftTodoActivities from '../activities/microsoft-todo'
import type * as strapiActivities from '../activities/strapi'

const microsoftTodo = proxyActivities<typeof microsoftTodoActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

const strapi = proxyActivities<typeof strapiActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

interface MicrosoftTodoWorkflowInput {
  taskListId: string
  limit?: number
}

export async function microsoftTodoWorkflow(input?: MicrosoftTodoWorkflowInput): Promise<{ 
  processed: number
  errors: string[]
}> {
  let taskListId: string | undefined = input?.taskListId
  const limit = input?.limit ?? 10

  // Fallback: ask activity layer (allowed to access env) for default list ID
  if (!taskListId) {
    const defaultId = await microsoftTodo.getDefaultListId()
    if (!defaultId) {
      throw new Error('taskListId is required (provide input { taskListId: \"...\", limit?: number })')
    }
    taskListId = defaultId
  }
  const errors: string[] = []
  let processed = 0

  try {
    // Get all tasks from Microsoft To Do
    const tasks = await microsoftTodo.getTasks(taskListId!, limit)
    
    if (tasks.length === 0) {
      return { processed: 0, errors: [] }
    }

    // Process each task
    for (const task of tasks) {
      try {
        // Create item in Strapi
        await strapi.createNewService({
          slug: task.title,
          n8nstatus: 'new'
        })

        // Delete task from Microsoft To Do
        await microsoftTodo.deleteTask(taskListId!, task.id)
        
        processed++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to process task ${task.id}: ${errorMessage}`)
        // Continue processing other tasks even if one fails
      }
    }

    return { processed, errors }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Microsoft To Do workflow failed: ${errorMessage}`)
  }
}

