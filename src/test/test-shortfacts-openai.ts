import {generateShortfacts} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generateShortfacts,
  'generateShortfacts',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
