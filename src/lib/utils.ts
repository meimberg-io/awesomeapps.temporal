export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractDomain(url: string): string | null {
  const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/:?#]+)/i)
  return match ? match[1] : null
}

export function enforceHttps(url: string): string {
  const stringUrl = String(url || '').trim()
  const cleaned = stringUrl.replace(/^https?:\/\//i, '')
  return 'https://' + cleaned
}

export function normalizeYouTubeData(data: any): any {
  if (typeof data === 'string') {
    let cleaned = data
      .replace(/```json\s*|\s*```/g, '')
      .replace(/\\n/g, '')
      .trim()
    
    try {
      return JSON.parse(cleaned)
    } catch (error) {
      console.warn('Failed to parse YouTube data', { error, data })
      return null
    }
  }
  return data
}

