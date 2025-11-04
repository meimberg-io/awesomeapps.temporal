import OpenAI from 'openai'
import { config } from '../config/env'
import type { YouTubeVideo } from '../types/service'
import { prompts } from '../lib/prompts'

const OPENAI_API_KEY = config.ai.openaiApiKey

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function generateWithOpenAI(serviceName: string, prompt: string, modelName: string = 'gpt-4o', temperature: number = 0.7): Promise<string> {
  console.log(`Generating content with OpenAI - service: ${serviceName}, model: ${modelName}`)
  
  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature
  })

  const responseText = completion.choices[0]?.message?.content || ''
  return responseText.trim()
}

export async function generateURL(serviceName: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.url(serviceName), 'gpt-4o', 0.3)
}

export async function generateDescription(serviceName: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.description(serviceName))
}

export async function generateAbstract(serviceName: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.abstract(serviceName), 'gpt-4o', 0.5)
}

export async function generateFunctionality(serviceName: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.functionality(serviceName))
}

export async function generateShortfacts(serviceName: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.shortfacts(serviceName), 'gpt-4o', 0.5)
}

export async function generatePricing(serviceName: string): Promise<string> {
  const result = await generateWithOpenAI(serviceName, prompts.pricing(serviceName), 'gpt-4o', 0.3)
  return result.replace(/```markdown\s*/, '').replace(/```/, '').trim()
}

export async function chooseTags(serviceName: string, availableTags: string): Promise<string> {
  return await generateWithOpenAI(serviceName, prompts.tags(serviceName, availableTags), 'gpt-4o', 0.3)
}

export async function chooseYouTubeVideo(serviceName: string, videos: YouTubeVideo[]): Promise<YouTubeVideo> {
  console.log(`Choosing YouTube video - service: ${serviceName}, videos: ${videos.length}`)
  
  const videosJson = JSON.stringify(videos)
  const prompt = prompts.youtubeVideo(serviceName, videosJson)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3
  })

  const responseText = completion.choices[0]?.message?.content || ''
  
  let cleaned = responseText
    .replace(/```json\s*|\s*```/g, '')
    .replace(/\\n/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    return parsed
  } catch (error) {
    console.error(`Failed to parse YouTube video selection - error: ${error}, responseText: ${responseText}`)
    throw new Error(`Failed to parse YouTube video selection: ${error}`)
  }
}
