import {GoogleGenerativeAI} from '@google/generative-ai'
import {config} from '../config/env'
import {prompts} from '../lib/prompts'
import {systemmessages} from '../lib/systemmessages'

export const GEMINI_MODELS = {
    gemini25pro: 'models/gemini-2.5-pro',
}

const GOOGLE_GEMINI_API_KEY = config.ai.geminiApiKey

const gemini = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY)

async function generateWithGemini(
    serviceName: string,
    prompt: string,
    modelName: string = GEMINI_MODELS.gemini25pro,
    systemMessage?: string,
    temperature: number = 1
): Promise<string> {
    console.log(`Generating content with Gemini - service: ${serviceName}, model: ${modelName}`)

    const model = gemini.getGenerativeModel({
        model: modelName,
        ...(systemMessage
            ? {systemInstruction: systemMessage}
            : {}),
    })
    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [{text: prompt}],
            },
        ],
        generationConfig: {
            temperature,
        },
    })
    const response = result.response
    const text = response.text()

    return text.trim()
}

export async function generateURL(serviceName: string): Promise<string> {
    return await generateWithGemini(serviceName, prompts.url(serviceName), GEMINI_MODELS.gemini25pro, systemmessages.none, 0.3)
}

export async function generateDescription(serviceName: string): Promise<string> {
    return await generateWithGemini(
        serviceName,
        prompts.description(serviceName),
        GEMINI_MODELS.gemini25pro,
        systemmessages.author
    )
}

export async function generateAbstract(serviceName: string): Promise<string> {
    return await generateWithGemini(serviceName, prompts.abstract(serviceName), GEMINI_MODELS.gemini25pro, systemmessages.author, 0.5)
}

export async function generateFunctionality(serviceName: string): Promise<string> {
    return await generateWithGemini(serviceName, prompts.functionality(serviceName))
}

export async function generateShortfacts(serviceName: string): Promise<string> {
    return await generateWithGemini(serviceName, prompts.shortfacts(serviceName), GEMINI_MODELS.gemini25pro, systemmessages.shorty, 0.5)
}

export async function generatePricing(serviceName: string): Promise<string> {
    const result = await generateWithGemini(serviceName, prompts.pricing(serviceName), GEMINI_MODELS.gemini25pro, systemmessages.none, 0.3)
    return result.replace(/```markdown\s*/, '').replace(/```/, '').trim()
}

export async function chooseTags(serviceName: string, availableTags: string): Promise<string> {
    return await generateWithGemini(serviceName, prompts.tags(serviceName, availableTags), GEMINI_MODELS.gemini25pro, systemmessages.none, 0.3)
}
