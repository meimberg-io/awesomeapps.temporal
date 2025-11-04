import {log} from '@temporalio/activity'
import OpenAI from 'openai'
import type {YouTubeSearchResult, YouTubeVideo} from '../types/service'
import {prompts} from '../lib/prompts'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

if (!YOUTUBE_API_KEY) {
    log.warn('YOUTUBE_API_KEY not set')
}

if (!OPENAI_API_KEY) {
    log.warn('OPENAI_API_KEY not set')
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

async function searchYouTube(serviceName: string): Promise<YouTubeSearchResult> {
    log.info('Searching YouTube', {serviceName})

    const url = new URL('https://youtube.googleapis.com/youtube/v3/search')
    url.searchParams.set('q', serviceName)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('maxResults', '10')
    url.searchParams.set('key', YOUTUBE_API_KEY)

    const response = await fetch(url.toString(), {
        method: 'GET'
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data as YouTubeSearchResult
}

async function chooseVideo(serviceName: string, videos: YouTubeVideo[]): Promise<YouTubeVideo> {
    log.info('Choosing YouTube video with OpenAI', {serviceName, videoCount: videos.length})
  
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
        log.error('Failed to parse YouTube video selection', {error, responseText})
        throw new Error(`Failed to parse YouTube video selection: ${error}`)
    }
}

export async function getYouTubeVideo(serviceName: string): Promise<YouTubeVideo | null> {
    const searchResults = await searchYouTube(serviceName)

    if (!searchResults.items || searchResults.items.length === 0) {
        log.warn('No YouTube videos found', {serviceName})
        return null
    }

    const selectedVideo = await chooseVideo(serviceName, searchResults.items)
    return selectedVideo
}



