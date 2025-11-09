import {log} from '@temporalio/activity'
import OpenAI from 'openai'
import {config} from '../config/env'

const OPENAI_API_KEY = config.ai.openaiApiKey

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

async function translateText(text: string, preserveMarkdown: boolean = false): Promise<string> {
  log.info('Translating text to German', {textLength: text.length, preserveMarkdown})

  const briefing = 'Return only the translated text. No comments. Don\'t use formal language.'

  const systemMessage = preserveMarkdown
    ? briefing + ' The text is in markdown. The markdown formatting must be preserved.'
    : briefing

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: `Translate the following text to German: ${text}`
      }
    ],
    temperature: 0.3
  })

  const translation = completion.choices[0]?.message?.content || ''
  log.info('Translation completed', {originalLength: text.length, translationLength: translation.length})
  
  return translation
}

export async function translateAbstract(text: string): Promise<string> {
  return await translateText(text, false)
}

export async function translateDescription(text: string): Promise<string> {
  return await translateText(text, true)
}

export async function translateFunctionality(text: string): Promise<string> {
  return await translateText(text, true)
}

export async function translateShortfacts(text: string): Promise<string> {
  return await translateText(text, false)
}

export async function translatePricing(text: string): Promise<string> {
  return await translateText(text, true)
}

