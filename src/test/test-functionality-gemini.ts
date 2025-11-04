import './setup'
import {generateFunctionality} from '../activities/gemini'
import {testActivity} from './test-utils'

testActivity(
  generateFunctionality,
  'generateFunctionality',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
