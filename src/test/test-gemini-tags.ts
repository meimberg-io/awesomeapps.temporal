import './setup'
import {chooseTags} from '../activities/gemini'
import {getAllTags} from '../activities/strapi'
import {testActivityWithTwoParams} from './test-utils'

async function runTest() {
  const tagsResponse = await getAllTags()
  const availableTags = tagsResponse.data.tags.map(tag => tag.name).join(', ')
  
  await testActivityWithTwoParams(
    chooseTags,
    'chooseTags',
    'Cursor',
    availableTags
  )
}

runTest().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
