import { log } from '@temporalio/activity'

export async function greet(name: string): Promise<string> {
  log.info('Greeting activity started', { name })
  
  const greeting = `Hello, ${name}!`
  
  log.info('Greeting activity completed', { greeting })
  
  return greeting
}

