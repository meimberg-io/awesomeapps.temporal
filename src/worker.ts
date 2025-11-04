import { NativeConnection, Worker } from '@temporalio/worker'
import * as strapiActivities from './activities/strapi'
import * as geminiActivities from './activities/gemini'
import * as openaiActivities from './activities/openai'
import * as youtubeActivities from './activities/youtube'

const activities = {
  ...strapiActivities,
  ...geminiActivities,
  ...openaiActivities,
  ...youtubeActivities
}

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
  })

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'awesomeapps-tasks',
    workflowsPath: require.resolve('./workflows'),
    activities: activities as any,
    maxConcurrentActivityTaskExecutions: parseInt(
      process.env.MAX_CONCURRENT_ACTIVITIES || '10',
      10
    )
  })

  console.log('Worker started', {
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'awesomeapps-tasks'
  })

  await worker.run()

  await connection.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

