import {startServiceWorkflow} from '../client'

async function testServiceWorkflow() {
  console.log('🚀 Starting service workflow test...\n')
  
  const result = await startServiceWorkflow({
    service: 'Discord',
    fields: ['url', 'abstract', 'description', 'functionality', 'shortfacts', 'pricing', 'tags', 'video'],
    aiProvider: 'openai'
  })
  
  if (result.success && result.documentId) {
    console.log('\n✅ Service workflow completed successfully')
    console.log(`   Document ID: ${result.documentId}`)
  } else {
    console.error('\n❌ Workflow failed')
    process.exit(1)
  }
}

testServiceWorkflow().catch((error) => {
  console.error('\n❌ Workflow error:', error)
  process.exit(1)
})
