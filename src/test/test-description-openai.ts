import {generateDescription} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generateDescription,
  'generateDescription',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
