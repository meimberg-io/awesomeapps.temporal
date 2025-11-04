import {generateFunctionality} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generateFunctionality,
  'generateFunctionality',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
