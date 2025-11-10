import {proxyActivities, log} from '@temporalio/workflow'
import type * as strapiActivities from '../activities/strapi'
import type * as geminiActivities from '../activities/gemini'
import type * as openaiActivities from '../activities/openai'
import type * as youtubeActivities from '../activities/youtube'
import * as utils from '../lib/utils'
import type {ServiceWorkflowInput, ServiceData} from '../types/service'

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

const youtube = proxyActivities<typeof youtubeActivities>({
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
    const {service, fields = []} = input
    const serviceSlug = slugify(service)

    // Choose AI provider based on input

    const serviceExists = await strapi.checkServiceExists(serviceSlug)
    const existingService = serviceExists.data.services.length > 0 ? serviceExists.data.services[0] : null
    const isExisting = existingService !== null

    const data: ServiceData = {
        slug: serviceSlug,
        name: service
    }


    if (shouldExecuteField(fields, 'url')) {
        let url = await openai.generateURL(service)
        if (url) {
            data.url = utils.enforceHttps(url)
        }
    } else if (existingService?.url) {
        data.url = existingService.url
    }

    const detailedService = service + "(" + data.url + ")"


    if (shouldExecuteField(fields, 'description')) {
        data.description = await openai.generateDescription(detailedService)    
    }

    if (shouldExecuteField(fields, 'abstract')) {
        data.abstract = await openai.generateAbstract(detailedService)       
    }

    if (shouldExecuteField(fields, 'functionality')) {
        data.functionality = await openai.generateFunctionality(detailedService)
    }

    if (shouldExecuteField(fields, 'shortfacts')) {
        data.shortfacts = await openai.generateShortfacts(detailedService)
    }

    if (shouldExecuteField(fields, 'pricing')) {
        data.pricing = await gemini.generatePricing(detailedService)
    }

    if (shouldExecuteField(fields, 'tags')) {
        const allTagsResponse = await strapi.getAllTags()
        const allTags = allTagsResponse.data.tags

        const isTagExcluded = (tag: typeof allTags[number]) => tag?.tagStatus === 'excluded'

        const allowedTags = allTags.filter(tag => {
            if (tag.tagStatus) {
                return tag.tagStatus === 'active'
            }
            return !tag.excluded
        })

        const allowedTagNames = allowedTags.map(tag => tag.name).join(', ')

        let selectedTagNames: string[] = []

        if (allowedTagNames.length > 0) {
            const selectedTagsString = await gemini.chooseTags(detailedService, allowedTagNames)
            selectedTagNames = selectedTagsString.split(',').map(t => t.trim()).filter(Boolean)
        }

        const existingTagsMap = new Map(
            allTags.map(tag => [tag.name.toLowerCase(), tag])
        )

        const tagDocumentIds: string[] = []

        for (const tagName of selectedTagNames) {
            const existingTag = existingTagsMap.get(tagName.toLowerCase())
            if (existingTag) {
                if (isTagExcluded(existingTag)) {
                    continue
                }
                tagDocumentIds.push(existingTag.documentId)
            } else {
                const newTag = await strapi.createTag(tagName, 'proposed')
                tagDocumentIds.push(newTag.data.documentId)
            }
        }

        if (tagDocumentIds.length > 0) {
            data.tags = tagDocumentIds
        }
    }

    if (shouldExecuteField(fields, 'video')) {
        const selectedVideo = await youtube.getYouTubeVideo(detailedService)

        if (selectedVideo && selectedVideo.id && selectedVideo.id.videoId) {
            data.youtube_video = selectedVideo.id.videoId
            data.youtube_title = selectedVideo.snippet?.title
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

    // Translation workflow call - translate fields that were updated
    try {
        const translationCandidates = ['abstract', 'description', 'functionality', 'shortfacts', 'pricing'] as const
        const translationFields = translationCandidates.filter(field => {  
            return fields.includes(field) || !fields || fields.length === 0
        })
        log.info('Translation fields', { translationFields })
        
        if (translationFields.length > 0) {
            await strapi.triggerTranslationWorkflow(resultDocumentId, translationFields)
        }
    } catch (error) {
        // Translation workflow is optional, continue on error
    }

    return {
        success: true,
        documentId: resultDocumentId
    }
}

