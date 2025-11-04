import {
  generateAbstract,
  generateURL,
  generateDescription,
  generateFunctionality,
  generateShortfacts,
  generatePricing
} from '../activities/openai'
import {testActivity} from './test-utils'

async function runAllOpenAITests() {
  const serviceName = 'Cursor'
  
  console.log('Running all OpenAI tests...\n')
  
  try {
    console.log('Testing generateAbstract...')
    await testActivity(generateAbstract, 'generateAbstract', serviceName)
    console.log('')
    
    console.log('Testing generateURL...')
    await testActivity(generateURL, 'generateURL', serviceName)
    console.log('')
    
    console.log('Testing generateDescription...')
    await testActivity(generateDescription, 'generateDescription', serviceName)
    console.log('')
    
    console.log('Testing generateFunctionality...')
    await testActivity(generateFunctionality, 'generateFunctionality', serviceName)
    console.log('')
    
    console.log('Testing generateShortfacts...')
    await testActivity(generateShortfacts, 'generateShortfacts', serviceName)
    console.log('')
    
    console.log('Testing generatePricing...')
    await testActivity(generatePricing, 'generatePricing', serviceName)
    console.log('')
    
    console.log('✅ All OpenAI tests passed!')
  } catch (error) {
    console.error('❌ Test suite failed!')
    console.error('Error:', error)
    process.exit(1)
  }
}

runAllOpenAITests().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
