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

function getOptional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

export const config: Config = {
  temporal: {
    address: getOptional('TEMPORAL_ADDRESS', 'localhost:7233'),
    namespace: getOptional('TEMPORAL_NAMESPACE', 'default'),
    taskQueue: getOptional('TEMPORAL_TASK_QUEUE', 'awesomeapps-tasks'),
    maxConcurrentActivities: parseInt(
      getOptional('MAX_CONCURRENT_ACTIVITIES', '10'),
      10
    )
  },
  strapi: {
    apiUrl: getOptional('STRAPI_API_URL', 'https://awesomeapps-strapi.meimberg.io/api'),
    graphqlUrl: getOptional('STRAPI_GRAPHQL_URL', 'https://awesomeapps-strapi.meimberg.io/graphql'),
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

