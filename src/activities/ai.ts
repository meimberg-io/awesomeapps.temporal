import { log, Context } from '@temporalio/activity'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import type { YouTubeVideo } from '../types/service'

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

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

if (!OPENAI_API_KEY) {
  safeLogWarn('OPENAI_API_KEY not set')
}

const gemini = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function generateWithGemini(prompt: string, modelName: string = 'models/gemini-2.5-pro'): Promise<string> {
  log.info('Generating content with Gemini', { modelName })
  
  const model = gemini.getGenerativeModel({ model: modelName })
  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()
  
  return text.trim()
}

export async function generateURL(serviceName: string): Promise<string> {
  log.info('Generating URL', { serviceName })
  
  const prompt = `URL of the platform "${serviceName}". Respond only with the complete URL, e.g., https://agent.ai. No explanations, no warnings. Just the URL.`
  
  return await generateWithGemini(prompt)
}

export async function generateDescription(serviceName: string): Promise<string> {
  log.info('Generating description', { serviceName })
  
  const prompt = `Write a short description (100-200 words) of the service / the app: ${serviceName}. 

The text should have 3-4 subheadings. 

Please use Markdown, but only use heading formatting. 

The first heading should be on the second level (##), all others should be on the third level (###).

Please only output the Markdown, no additional text around it. Please only output the pure Markdown, do not surround it with \`\`\`markdown and \`\`\``
  
  return await generateWithGemini(prompt)
}

export async function generateAbstract(serviceName: string): Promise<string> {
  log.info('Generating abstract', { serviceName })
  
  const prompt = `Write a short descriptive sentence (60–120 characters) without an article at the beginning of the sentence and without mentioning the name again, referring to the following service: ${serviceName}`
  
  return await generateWithGemini(prompt)
}

export async function generateFunctionality(serviceName: string): Promise<string> {
  log.info('Generating functionality', { serviceName })
  
  const prompt = `Create a concise list of 3–8 important functions and uses as bullet points for the following internet service/app: ${serviceName}. The list should clearly convey the core characteristics, categories, and top features for users so that they can understand at a glance what the service is suitable for. 

The list should NOT list content offered by the platform, but rather features and uses.

Example for Canva:

* User-friendly design templates
* Diverse fonts and color palettes
* Simple drag-and-drop functionality
* Large selection of free stock photos
* Ability to collaborate in a team
* Customizable infographics and charts

Please create the answer in pure Markdown, but only use list markers.

Please only output the Markdown, no additional text around it. Please only output the pure Markdown, do not surround it with \`\`\`markdown and \`\`\`


Now create such a list for ${serviceName}.`
  
  return await generateWithGemini(prompt)
}

export async function generateShortfacts(serviceName: string): Promise<string> {
  log.info('Generating shortfacts', { serviceName })
  
  const prompt = `In a short, coherent sentence (100-200 characters), list the most important facts about the app ${serviceName} that are of interest to users. Write in a professional journalistic style, using commas to separate information.`
  
  return await generateWithGemini(prompt)
}

export async function generatePricing(serviceName: string): Promise<string> {
  log.info('Generating pricing', { serviceName })
  
  const prompt = `pricing of service ${serviceName}: in the form of a markdown table. state pricing categories, a short description if you have the price. If there is a free usage possible, include this (write "free" instead of $0). 

Language: English

No more text, introduction, or other words. Just the markdown table. nothing else. 

If you don't find a pricing, just state nothing.`
  
  const result = await generateWithGemini(prompt)
  return result.replace(/```markdown\s*/, '').replace(/```/, '').trim()
}

export async function chooseTags(serviceName: string, availableTags: string): Promise<string> {
  log.info('Choosing tags', { serviceName })
  
  const prompt = `I run a website that catalogs all kinds of internet services and organizes them by tags.

This is the global tag list: ${availableTags}

Now search this list for suitable tags for the app/service ${serviceName}. If only one really fits, use only that one. If several fit, use several. There should not be more than 6. There can also be fewer. Only tags that describe the core function of the service or app should be used, not any secondary functions.

Output the tags without any additional text, separated by commas!`
  
  return await generateWithGemini(prompt)
}

export async function chooseYouTubeVideo(serviceName: string, videos: YouTubeVideo[]): Promise<YouTubeVideo> {
  log.info('Choosing YouTube video', { serviceName, videoCount: videos.length })
  
  const videosJson = JSON.stringify(videos)
  
  const prompt = `Here is a list of YouTube videos:

${videosJson}

---

Return the video that best suits introducing a user to the app/service "${serviceName}".

Only return the video. Return the complete JSON for the video. Make sure to return the complete JSON. The JSON must be valid! And only return the JSON, no text, no explanation, no punctuation. No Markdown, no embedding in \`\`\``

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
    log.error('Failed to parse YouTube video selection', { error, responseText })
    throw new Error(`Failed to parse YouTube video selection: ${error}`)
  }
}

