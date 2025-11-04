import {MockActivityEnvironment} from '@temporalio/testing'
import type {YouTubeVideo} from '../types/service'

export async function testActivity(
  activityFunction: (serviceName: string) => Promise<string>,
  activityType: string,
  serviceName: string
): Promise<void> {
  const env = new MockActivityEnvironment({
    attempt: 1,
    activityType,
    scheduledTimestampMs: Date.now()
  })

  const result = await env.run(activityFunction, serviceName)

  if (result && typeof result === 'string' && result.length > 0) {
    console.log(`✅ ${activityType}`, result)
  } else {
    console.error(`❌ Generated ${activityType} is invalid`)
    process.exit(1)
  }
}

export async function testActivityWithTwoParams(
  activityFunction: (serviceName: string, availableTags: string) => Promise<string>,
  activityType: string,
  serviceName: string,
  availableTags: string
): Promise<void> {
  const env = new MockActivityEnvironment({
    attempt: 1,
    activityType,
    scheduledTimestampMs: Date.now()
  })

  const result = await env.run(activityFunction, serviceName, availableTags)

  if (result && typeof result === 'string' && result.length > 0) {
    console.log(`✅ ${activityType}`, result)
  } else {
    console.error(`❌ Generated ${activityType} is invalid`)
    process.exit(1)
  }
}

export async function testYouTubeVideoActivity(
  activityFunction: (serviceName: string) => Promise<YouTubeVideo | null>,
  activityType: string,
  serviceName: string
): Promise<void> {
  const env = new MockActivityEnvironment({
    attempt: 1,
    activityType,
    scheduledTimestampMs: Date.now()
  })

  const result = await env.run(activityFunction, serviceName)

  if (result && result.id && result.id.videoId && result.snippet && result.snippet.title) {
    console.log(`✅ ${activityType}`)
    console.log(`   Video ID: ${result.id.videoId}`)
    console.log(`   Title: ${result.snippet.title}`)
  } else {
    console.error(`❌ Generated ${activityType} is invalid`)
    process.exit(1)
  }
}
