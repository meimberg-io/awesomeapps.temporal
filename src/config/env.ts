import 'dotenv/config'

export interface MicrosoftTodoConfig {
  clientId: string
  clientSecret: string
  tenantId: string
  refreshToken: string
  initialAccessToken?: string
  defaultListId?: string
}

interface Config {
  temporal: {
    address: string
    namespace: string
    taskQueue: string
    maxConcurrentActivities: number
  }
  strapi: {
    apiUrl: string
    graphqlUrl: string
    apiToken: string
  }
  ai: {
    geminiApiKey: string
    openaiApiKey: string
  }
  youtube: {
    apiKey: string
  }
  microsoftTodo: {
    credentials: MicrosoftTodoConfig
  }
}

function getRequired(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptional(key: string): string | undefined {
  return process.env[key] || undefined
}

export const config: Config = {
  temporal: {
    address: getRequired('TEMPORAL_ADDRESS'),
    namespace: getRequired('TEMPORAL_NAMESPACE'),
    taskQueue: getRequired('TEMPORAL_TASK_QUEUE'),
    maxConcurrentActivities: parseInt(
      getRequired('MAX_CONCURRENT_ACTIVITIES'),
      10
    )
  },
  strapi: {
    apiUrl: getRequired('STRAPI_API_URL'),
    graphqlUrl: getRequired('STRAPI_GRAPHQL_URL'),
    apiToken: getRequired('STRAPI_API_TOKEN')
  },
  ai: {
    geminiApiKey: getRequired('GOOGLE_GEMINI_API_KEY'),
    openaiApiKey: getRequired('OPENAI_API_KEY')
  },
  youtube: {
    apiKey: getRequired('YOUTUBE_API_KEY')
  },
  microsoftTodo: {
    credentials: {
      clientId: getRequired('AZURE_CLIENT_ID'),
      clientSecret: getRequired('AZURE_CLIENT_SECRET'),
      tenantId: getRequired('AZURE_TENANT_ID'),
      refreshToken: getRequired('MICROSOFT_TODO_REFRESH_TOKEN'),
      initialAccessToken: getOptional('MICROSOFT_TODO_ACCESS_TOKEN'),
      defaultListId: getOptional('MICROSOFT_TODO_LIST_ID')
    }
  }
}

export function validateConfig() {
  console.log('✓ Environment configuration loaded')
  console.log(`  Temporal: ${config.temporal.address} (${config.temporal.namespace})`)
  console.log(`  Strapi: ${config.strapi.apiUrl}`)
  console.log(`  Task Queue: ${config.temporal.taskQueue}`)
}

