import {generatePricing} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generatePricing,
  'generatePricing',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
