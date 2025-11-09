import OpenAI from 'openai'
import type {ChatCompletionMessageParam} from 'openai/resources/chat/completions'
import {config} from '../config/env'
import type {YouTubeVideo} from '../types/service'
import {prompts} from '../lib/prompts'
import {systemmessages} from '../lib/systemmessages'


export const OPENAI_MODELS = {
    gpt5: 'gpt-5',
    gpt4o: 'gpt-4o',
    gpt4omini: 'gpt-4o-mini',
}

const OPENAI_API_KEY = config.ai.openaiApiKey
const openai = new OpenAI({apiKey: OPENAI_API_KEY})

async function generateWithOpenAI(serviceName: string, prompt: string, modelName: string = OPENAI_MODELS.gpt5, systemMessage?: string, temperature: number = 1): Promise<string> {
    console.log(`Generating content with OpenAI - service: ${serviceName}, model: ${modelName}`)

    const messages: ChatCompletionMessageParam[] = []
    if (systemMessage) {
        messages.push({role: 'system', content: systemMessage})
    }
    messages.push({role: 'user', content: prompt})

    const completion = await openai.chat.completions.create({
        model: modelName,
        messages: messages,
        temperature: temperature
    })

    const responseText = completion.choices[0]?.message?.content || ''
    return responseText.trim()
}

// URL
export async function generateURL(serviceName: string): Promise<string> {
    return await generateWithOpenAI(serviceName, prompts.url(serviceName), OPENAI_MODELS.gpt5)
}

// Description
export async function generateDescription(serviceName: string): Promise<string> {
    return await generateWithOpenAI(
        serviceName,
        prompts.description(serviceName),
        OPENAI_MODELS.gpt5,
        systemmessages.author
    )
}

// Abstract
export async function generateAbstract(serviceName: string): Promise<string> {
    return await generateWithOpenAI(serviceName, prompts.abstract(serviceName), OPENAI_MODELS.gpt5, systemmessages.shorty, 0.5)
}

// Functionality
export async function generateFunctionality(serviceName: string): Promise<string> {
    return await generateWithOpenAI(serviceName, prompts.functionality(serviceName))
}

// Shortfacts
export async function generateShortfacts(serviceName: string): Promise<string> {
    return await generateWithOpenAI(serviceName, prompts.shortfacts(serviceName), OPENAI_MODELS.gpt5, systemmessages.shorty, 0.5)
}

// Pricing
export async function generatePricing(serviceName: string): Promise<string> {
    const result = await generateWithOpenAI(serviceName, prompts.pricing(serviceName), OPENAI_MODELS.gpt5, systemmessages.none, 0.3)
    return result.replace(/```markdown\s*/, '').replace(/```/, '').trim()
}

// Tags
export async function chooseTags(serviceName: string, availableTags: string): Promise<string> {
    return await generateWithOpenAI(serviceName, prompts.tags(serviceName, availableTags), OPENAI_MODELS.gpt5, systemmessages.none, 0.3)
}

// YouTube Video
export async function chooseYouTubeVideo(serviceName: string, videos: YouTubeVideo[]): Promise<YouTubeVideo> {
    console.log(`Choosing YouTube video - service: ${serviceName}, videos: ${videos.length}`)

    const videosJson = JSON.stringify(videos)
    const prompt = prompts.youtubeVideo(serviceName, videosJson)

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.gpt5,
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
