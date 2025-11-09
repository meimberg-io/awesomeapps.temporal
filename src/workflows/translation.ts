import {proxyActivities} from '@temporalio/workflow'
import type * as strapiActivities from '../activities/strapi'
import type * as translationActivities from '../activities/translation'
import type {TranslationWorkflowInput, TranslationData, StrapiServiceDetail} from '../types/service'

const strapi = proxyActivities<typeof strapiActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

const translation = proxyActivities<typeof translationActivities>({
  startToCloseTimeout: '3 minutes',
  retry: {
    maximumAttempts: 2
  }
})

export async function translationWorkflow(input: TranslationWorkflowInput): Promise<{success: boolean}> {
  const {documentId, serviceName, fields = []} = input

  // Fetch service details from Strapi
  const serviceResponse = await strapi.getServiceByDocumentId(documentId)
  
  if (!serviceResponse.data.services || serviceResponse.data.services.length === 0) {
    throw new Error(`Service not found: ${serviceName} (${documentId})`)
  }

  const service = serviceResponse.data.services[0] as StrapiServiceDetail

  // Start with all existing service fields (like n8n Data Array node)
  const translationData: TranslationData = {
    slug: service.slug,
    name: service.name,
    url: service.url,
    abstract: service.abstract,
    description: service.description,
    functionality: service.functionality,
    shortfacts: service.shortfacts,
    pricing: service.pricing,
    youtube_video: service.youtube_video,
    youtube_title: service.youtube_title,
    top: service.top,
    publishdate: service.publishdate,
    reviewCount: service.reviewCount,
    averageRating: service.averageRating
  }

  // Convert tags to documentIds array
  if (service.tags && service.tags.length > 0) {
    translationData.tags = service.tags.map(tag => tag.documentId)
  }

  // Translate only fields that exist and were requested (or translate all if no fields specified)
  const shouldTranslate = (field: string) => fields.length === 0 || fields.includes(field)

  if (service.abstract && shouldTranslate('abstract')) {
    translationData.abstract = await translation.translateAbstract(service.abstract)
  }

  if (service.description && shouldTranslate('description')) {
    translationData.description = await translation.translateDescription(service.description)
  }

  if (service.functionality && shouldTranslate('functionality')) {
    translationData.functionality = await translation.translateFunctionality(service.functionality)
  }

  if (service.shortfacts && shouldTranslate('shorty')) {
    translationData.shortfacts = await translation.translateShortfacts(service.shortfacts)
  }

  if (service.pricing && shouldTranslate('pricing')) {
    translationData.pricing = await translation.translatePricing(service.pricing)
  }

  // Update Strapi with German translations
  await strapi.updateServiceTranslation(documentId, translationData)

  return {success: true}
}

