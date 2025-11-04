import 'dotenv/config'

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
}

function getRequired(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
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
  }
}

export function validateConfig() {
  console.log('✓ Environment configuration loaded')
  console.log(`  Temporal: ${config.temporal.address} (${config.temporal.namespace})`)
  console.log(`  Strapi: ${config.strapi.apiUrl}`)
  console.log(`  Task Queue: ${config.temporal.taskQueue}`)
}

