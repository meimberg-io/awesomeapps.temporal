import {generateURL} from '../activities/gemini'
import {testActivity} from './test-utils'

testActivity(
  generateURL,
  'generateURL',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
