import {startTranslationWorkflow} from '../client'

async function testTranslationWorkflow() {
  console.log('🚀 Starting translation workflow test...\n')
  
  // Replace with actual documentId from Strapi
  const documentId = 'YOUR_DOCUMENT_ID'
  
  const result = await startTranslationWorkflow({
    documentId,
    serviceName: 'Test Service',
    fields: ['abstract', 'description']
  })
  
  if (result.success) {
    console.log('\n✅ Translation workflow completed successfully')
  } else {
    console.error('\n❌ Translation workflow failed')
    process.exit(1)
  }
}

testTranslationWorkflow().catch((error) => {
  console.error('\n❌ Workflow error:', error)
  process.exit(1)
})

