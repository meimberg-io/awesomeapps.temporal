import { log } from '@temporalio/activity'
import { microsoftTokenProvider } from '../services/microsoft-token'
import { config } from '../config/env'

const MICROSOFT_GRAPH_API_URL = 'https://graph.microsoft.com/v1.0'

interface MicrosoftTodoTask {
  id: string
  title: string
  status: string
  createdDateTime: string
  lastModifiedDateTime: string
}

interface MicrosoftTodoTasksResponse {
  value: MicrosoftTodoTask[]
  '@odata.nextLink'?: string
}

async function microsoftGraphRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${MICROSOFT_GRAPH_API_URL}${endpoint}`
  
  for (let attempt = 0; attempt < 2; attempt++) {
    const accessToken = await microsoftTokenProvider.getAccessToken()
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
      }
    })

    if (response.ok) {
      if (response.status === 204) {
        return undefined
      }
      return response.json()
    }

    if (response.status === 401 && attempt === 0) {
      log.warn('Microsoft Graph API returned 401, attempting token refresh')
      microsoftTokenProvider.invalidate()
      continue
    }

    const errorText = await response.text()
    throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  throw new Error('Microsoft Graph API: exceeded retry attempts')
}

export async function getTasks(taskListId: string, limit: number = 10): Promise<MicrosoftTodoTask[]> {
  log.info('Fetching tasks from Microsoft To Do', { taskListId, limit })
  
  const tasks: MicrosoftTodoTask[] = []
  let url = `/me/todo/lists/${taskListId}/tasks?$top=${limit}&$orderby=createdDateTime desc`
  
  while (url && tasks.length < limit) {
    const response = await microsoftGraphRequest(url) as MicrosoftTodoTasksResponse
    
    if (response.value && Array.isArray(response.value)) {
      tasks.push(...response.value)
    }
    
    url = response['@odata.nextLink']?.replace(MICROSOFT_GRAPH_API_URL, '') || undefined
    
    if (tasks.length >= limit) {
      break
    }
  }
  
  return tasks.slice(0, limit)
}

export async function deleteTask(taskListId: string, taskId: string): Promise<void> {
  log.info('Deleting task from Microsoft To Do', { taskListId, taskId })
  
  await microsoftGraphRequest(`/me/todo/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE'
  })
  
  log.info('Task deleted successfully', { taskListId, taskId })
}

export async function getDefaultListId(): Promise<string> {
  return config.microsoftTodo.credentials.defaultListId || ''
}

