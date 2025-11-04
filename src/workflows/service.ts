import { proxyActivities } from '@temporalio/workflow'
import type * as strapiActivities from '../activities/strapi'
import type * as geminiActivities from '../activities/gemini'
import type * as openaiActivities from '../activities/openai'
import type * as externalActivities from '../activities/external'
import * as utils from '../lib/utils'
import type { ServiceWorkflowInput, ServiceData } from '../types/service'

const strapi = proxyActivities<typeof strapiActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

const gemini = proxyActivities<typeof geminiActivities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 2
  }
})

const openai = proxyActivities<typeof openaiActivities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 2
  }
})

const external = proxyActivities<typeof externalActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

function shouldExecuteField(fields: string[] | undefined, fieldName: string): boolean {
  if (!fields || fields.length === 0) {
    return true
  }
  return fields.includes(fieldName)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function serviceWorkflow(input: ServiceWorkflowInput): Promise<{ success: boolean; documentId?: string }> {
  const { service, fields = [], newtags = false, aiProvider = 'gemini' } = input
  const serviceSlug = slugify(service)
  
  // Choose AI provider based on input
  const ai = aiProvider === 'openai' ? openai : gemini
  
  const serviceExists = await strapi.checkServiceExists(serviceSlug)
  const existingService = serviceExists.data.services.length > 0 ? serviceExists.data.services[0] : null
  const isExisting = existingService !== null
  
  const data: ServiceData = {
    slug: serviceSlug,
    name: service
  }
  
  let url: string | undefined
  let description: string | undefined
  let abstract: string | undefined
  let functionality: string | undefined
  let shortfacts: string | undefined
  let pricing: string | undefined
  let tags: string[] | undefined
  let youtubeVideo: string | undefined
  let youtubeTitle: string | undefined
  let logoDocumentId: string | undefined
  
  if (shouldExecuteField(fields, 'url')) {
    url = await ai.generateURL(service)
    if (url) {
      data.url = utils.enforceHttps(url)
    }
  } else if (existingService?.url) {
    data.url = existingService.url
  }
  
  if (shouldExecuteField(fields, 'description')) {
    description = await ai.generateDescription(service)
    if (description) {
      data.description = description
    }
  }
  
  if (shouldExecuteField(fields, 'abstract')) {
    abstract = await ai.generateAbstract(service)
    if (abstract) {
      data.abstract = abstract
    }
  }
  
  if (shouldExecuteField(fields, 'functionality')) {
    functionality = await ai.generateFunctionality(service)
    if (functionality) {
      data.functionality = functionality
    }
  }
  
  if (shouldExecuteField(fields, 'shortfacts')) {
    shortfacts = await ai.generateShortfacts(service)
    if (shortfacts) {
      data.shortfacts = shortfacts
    }
  }
  
  if (shouldExecuteField(fields, 'pricing')) {
    pricing = await ai.generatePricing(service)
    if (pricing) {
      data.pricing = pricing
    }
  }
  
  if (shouldExecuteField(fields, 'tags')) {
    const allTagsResponse = await strapi.getAllTags()
    const allTags = allTagsResponse.data.tags.map(tag => tag.name).join(', ')
    
    const selectedTagsString = await ai.chooseTags(service, allTags)
    const selectedTagNames = selectedTagsString.split(',').map(t => t.trim()).filter(Boolean)
    
    const existingTagsMap = new Map(
      allTagsResponse.data.tags.map(tag => [tag.name.toLowerCase(), tag.documentId])
    )
    
    const tagDocumentIds: string[] = []
    
    for (const tagName of selectedTagNames) {
      const existingTagId = existingTagsMap.get(tagName.toLowerCase())
      if (existingTagId) {
        tagDocumentIds.push(existingTagId)
      } else if (newtags) {
        const newTag = await strapi.createTag(tagName)
        tagDocumentIds.push(newTag.data.documentId)
      }
    }
    
    if (tagDocumentIds.length > 0) {
      data.tags = tagDocumentIds
    }
  }
  
  if (shouldExecuteField(fields, 'video')) {
    const youtubeResults = await external.searchYouTube(service)
    
    if (youtubeResults.items && youtubeResults.items.length > 0) {
      // chooseYouTubeVideo is only available in OpenAI
      const selectedVideo = await openai.chooseYouTubeVideo(service, youtubeResults.items)
      
      if (selectedVideo && selectedVideo.id && selectedVideo.id.videoId) {
        data.youtube_video = selectedVideo.id.videoId
        data.youtube_title = selectedVideo.snippet?.title
      }
    }
  }
  
  
  const finalData: ServiceData = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
      finalData[key as keyof ServiceData] = value
    }
  })
  
  let resultDocumentId: string
  
  if (isExisting && existingService) {
    const updateResult = await strapi.updateService(existingService.documentId, finalData)
    resultDocumentId = updateResult.data.documentId
  } else {
    const createResult = await strapi.createService(finalData)
    resultDocumentId = createResult.data.documentId
  }
  
  // Translation workflow call - handled by activity
  try {
    await strapi.triggerTranslationWorkflow(resultDocumentId, data.name || service)
  } catch (error) {
    // Translation workflow is optional, continue on error
  }
  
  return {
    success: true,
    documentId: resultDocumentId
  }
}

