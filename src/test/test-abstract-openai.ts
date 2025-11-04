import './setup'
import {generateAbstract} from '../activities/openai'
import {testActivity} from './test-utils'

testActivity(
  generateAbstract,
  'generateAbstract',
  'Cursor'
).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

