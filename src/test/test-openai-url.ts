import './setup'
import {generateURL} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generateURL,
  'generateURL',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
