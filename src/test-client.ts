import { startExampleWorkflow } from './client'

async function main() {
  const args = process.argv.slice(2)
  const name = args[0] || 'World'

  try {
    console.log(`Starting workflow with name: ${name}`)
    const result = await startExampleWorkflow(name)
    console.log('Workflow completed:', result)
    process.exit(0)
  } catch (error) {
    console.error('Workflow failed:', error)
    process.exit(1)
  }
}

main()

