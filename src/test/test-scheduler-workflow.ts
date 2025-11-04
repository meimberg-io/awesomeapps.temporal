import {startSchedulerWorkflow} from '../client'

async function testSchedulerWorkflow() {
  console.log('🚀 Starting scheduler workflow test...\n')
  
  const result = await startSchedulerWorkflow()
  
  if (result.processed) {
    if (result.error) {
      console.log('\n⚠️  Scheduler processed with error')
      console.log(`   Document ID: ${result.documentId}`)
      console.log(`   Error: ${result.error}`)
    } else {
      console.log('\n✅ Scheduler workflow completed successfully')
      console.log(`   Document ID: ${result.documentId}`)
    }
  } else {
    console.log('\n⏭️  No services to process')
    console.log('   Either a service is already being processed or the queue is empty')
  }
}

testSchedulerWorkflow().catch((error) => {
  console.error('\n❌ Workflow error:', error)
  process.exit(1)
})

