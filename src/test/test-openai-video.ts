import './setup'
import {chooseYouTubeVideo} from '../activities/openai'
import {testYouTubeVideoActivity} from './test-utils'
import type {YouTubeVideo} from '../types/service'

const mockVideos: YouTubeVideo[] = [
  {
    id: {
      videoId: 'abc123'
    },
    snippet: {
      title: 'Introduction to Cursor - AI Code Editor'
    }
  },
  {
    id: {
      videoId: 'def456'
    },
    snippet: {
      title: 'Cursor Tutorial - Getting Started'
    }
  },
  {
    id: {
      videoId: 'ghi789'
    },
    snippet: {
      title: 'Best AI Coding Tools 2024'
    }
  }
]

testYouTubeVideoActivity(
  chooseYouTubeVideo,
  'chooseYouTubeVideo',
  'Cursor',
  mockVideos
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
