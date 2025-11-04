import {getYouTubeVideo} from '../activities/youtube'
import {testYouTubeVideoActivity} from './test-utils'

testYouTubeVideoActivity(
  getYouTubeVideo,
  'getYouTubeVideo',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

