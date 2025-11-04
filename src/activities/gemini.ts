import { log } from '@temporalio/activity'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prompts } from '../lib/prompts'

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || ''

function safeLogWarn(message: string) {
  try {
    log.warn(message)
  } catch {
    console.warn(`[Activity] ${message}`)
  }
}

if (!GOOGLE_GEMINI_API_KEY) {
  safeLogWarn('GOOGLE_GEMINI_API_KEY not set')
}

const gemini = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY)

async function generateWithGemini(serviceName: string, prompt: string, modelName: string = 'models/gemini-2.5-pro'): Promise<string> {
  console.log(`Generating content with Gemini - service: ${serviceName}, model: ${modelName}`)
  
  const model = gemini.getGenerativeModel({ model: modelName })
  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()
  
  return text.trim()
}

export async function generateURL(serviceName: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.url(serviceName))
}

export async function generateDescription(serviceName: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.description(serviceName))
}

export async function generateAbstract(serviceName: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.abstract(serviceName))
}

export async function generateFunctionality(serviceName: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.functionality(serviceName))
}

export async function generateShortfacts(serviceName: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.shortfacts(serviceName))
}

export async function generatePricing(serviceName: string): Promise<string> {
  const result = await generateWithGemini(serviceName, prompts.pricing(serviceName))
  return result.replace(/```markdown\s*/, '').replace(/```/, '').trim()
}

export async function chooseTags(serviceName: string, availableTags: string): Promise<string> {
  return await generateWithGemini(serviceName, prompts.tags(serviceName, availableTags))
}
