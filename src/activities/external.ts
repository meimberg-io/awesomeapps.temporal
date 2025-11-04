import { log } from '@temporalio/activity'
import type { YouTubeSearchResult, BrandfetchLogo } from '../types/service'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''
const BRANDFETCH_API_KEY = process.env.BRANDFETCH_API_KEY || ''

if (!YOUTUBE_API_KEY) {
  log.warn('YOUTUBE_API_KEY not set')
}

if (!BRANDFETCH_API_KEY) {
  log.warn('BRANDFETCH_API_KEY not set')
}

export async function searchYouTube(serviceName: string): Promise<YouTubeSearchResult> {
  log.info('Searching YouTube', { serviceName })
  
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
  return data
}

export async function fetchBrandLogo(domain: string): Promise<BrandfetchLogo> {
  log.info('Fetching brand logo', { domain })
  
  const url = `https://api.brandfetch.io/v2/brands/${domain}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brandfetch API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data
}

