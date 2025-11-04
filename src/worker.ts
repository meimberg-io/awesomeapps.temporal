import { NativeConnection, Worker } from '@temporalio/worker'
import { config, validateConfig } from './config/env'
import * as strapiActivities from './activities/strapi'
import * as geminiActivities from './activities/gemini'
import * as openaiActivities from './activities/openai'
import * as youtubeActivities from './activities/youtube'
import * as translationActivities from './activities/translation'

const activities = {
  ...strapiActivities,
  ...geminiActivities,
  ...openaiActivities,
  ...youtubeActivities,
  ...translationActivities
}

async function run() {
  validateConfig()

  const connection = await NativeConnection.connect({
    address: config.temporal.address
  })

  const worker = await Worker.create({
    connection,
    namespace: config.temporal.namespace,
    taskQueue: config.temporal.taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities: activities as any,
    maxConcurrentActivityTaskExecutions: config.temporal.maxConcurrentActivities
  })

  console.log('Worker started', {
    namespace: config.temporal.namespace,
    taskQueue: config.temporal.taskQueue
  })

  await worker.run()

  await connection.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

