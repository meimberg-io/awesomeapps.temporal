import { log } from '@temporalio/activity'
import { config } from '../config/env'
import type {
  ServiceData,
  StrapiServiceResponse,
  StrapiTagResponse,
  StrapiCreateServiceResponse,
  StrapiCreateTagResponse,
  UploadLogoResponse,
  StrapiServiceDetailResponse,
  TranslationData,
  NewServicesResponse
} from '../types/service'

const STRAPI_API_URL = config.strapi.apiUrl
const STRAPI_GRAPHQL_URL = config.strapi.graphqlUrl
const STRAPI_API_TOKEN = config.strapi.apiToken

async function strapiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${STRAPI_API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Strapi API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

async function strapiGraphQL(query: string): Promise<any> {
  const response = await fetch(STRAPI_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Strapi GraphQL error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json() as any
  if (result.errors) {
    throw new Error(`Strapi GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  return result.data as StrapiServiceResponse
}

export async function checkServiceExists(slug: string): Promise<StrapiServiceResponse> {
  log.info('Checking if service exists', { slug })
  
  const query = `
    query GetServiceDetailBySlug {
      services(filters: { slug: { eq: "${slug}" } }) {
        documentId
        name
        slug
        url
      }
    }
  `

  const data = await strapiGraphQL(query)
  
  return {
    data: {
      services: data.services || []
    }
  }
}

export async function getAllTags(): Promise<StrapiTagResponse> {
  console.log('Fetching all tags from Strapi')
  
  const query = `
    query GetTags {
      tags(sort: "name:asc") {
        documentId
        name
        tagStatus
      }
    }
  `

  const data = await strapiGraphQL(query)
  
  return {
    data: {
      tags: data.tags || []
    }
  }
}

export async function createService(data: ServiceData): Promise<StrapiCreateServiceResponse> {
  log.info('Creating service', { name: data.name })
  
  const response = await strapiRequest('/services', {
    method: 'POST',
    body: JSON.stringify({ data })
  })

  return {
    data: {
      documentId: response.data.documentId,
      name: response.data.name
    }
  }
}

export async function updateService(documentId: string, data: ServiceData): Promise<StrapiCreateServiceResponse> {
  log.info('Updating service', { documentId, name: data.name })
  
  const response = await strapiRequest(`/services/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({ data })
  })

  return {
    data: {
      documentId: response.data.documentId,
      name: response.data.name
    }
  }
}

export async function createTag(
  name: string,
  tagStatus: 'active' | 'proposed' | 'excluded' = 'proposed'
): Promise<StrapiCreateTagResponse> {
  log.info('Creating tag', { name })
  
  const response = await strapiRequest('/tags', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        name,
        tagStatus
      }
    })
  })

  return {
    data: {
      documentId: response.data.documentId,
      name: response.data.name
    }
  }
}

export async function uploadLogo(file: Buffer, filename: string): Promise<UploadLogoResponse> {
  log.info('Uploading logo', { filename })
  
  const FormData = require('form-data')
  const formData = new FormData()
  formData.append('files', file, filename)

  const response = await fetch(`${STRAPI_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      ...formData.getHeaders()
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Logo upload error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json() as any
  return {
    id: result[0]?.id || result.id
  } as UploadLogoResponse
}

export async function fetchAndUploadLogo(domain: string): Promise<UploadLogoResponse | null> {
  log.info('Fetching and uploading logo - NOT IMPLEMENTED', { domain })
  log.warn('fetchBrandLogo not implemented yet')
  return null
  
  // try {
  //   const brandData = await fetchBrandLogo(domain)
  //   
  //   if (!brandData.logo_png) {
  //     log.warn('No logo found for domain', { domain })
  //     return null
  //   }
  //   
  //   const logoResponse = await fetch(brandData.logo_png)
  //   if (!logoResponse.ok) {
  //     throw new Error(`Failed to fetch logo: ${logoResponse.status} ${logoResponse.statusText}`)
  //   }
  //   
  //   const logoBuffer = Buffer.from(await logoResponse.arrayBuffer())
  //   const uploadResult = await uploadLogo(logoBuffer, `${domain}-logo.png`)
  //   
  //   return uploadResult
  // } catch (error) {
  //   log.error('Failed to fetch and upload logo', { error, domain })
  //   throw error
  // }
}

export async function getServiceByDocumentId(documentId: string): Promise<StrapiServiceDetailResponse> {
  log.info('Fetching service by documentId', { documentId })

  const query = `
    query GetServiceByDocumentId($documentId: ID!) {
      services(filters: { documentId: { eq: $documentId } }) {
        documentId
        name
        slug
        url
        abstract
        description
        pricing
        functionality
        shortfacts
        youtube_video
        youtube_title
        top
        publishdate
        reviewCount
        averageRating
        tags {
          documentId
          name
        }
      }
    }
  `

  const variables = { documentId }

  const response = await fetch(STRAPI_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Strapi GraphQL error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return await response.json() as StrapiServiceDetailResponse
}

export async function updateServiceTranslation(documentId: string, translationData: TranslationData): Promise<void> {
  log.info('Updating service translation', { documentId, locale: 'de' })

  const endpoint = `/services/${documentId}?locale=de`

  // Remove undefined/null/empty values (like n8n does)
  const cleanData: Record<string, any> = {}
  Object.entries(translationData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
      cleanData[key] = value
    }
  })

  await strapiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify({ data: cleanData })
  })

  log.info('Service translation updated successfully', { documentId, locale: 'de' })
}

export async function triggerTranslationWorkflow(documentId: string, serviceName: string, fields?: string[]): Promise<void> {
  log.info('Triggering translation workflow', { documentId, serviceName, fields })
  
  const { Connection, Client } = await import('@temporalio/client')
  const { translationWorkflow } = await import('../workflows/translation')
  
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })
    
    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default'
    })
    
    await client.workflow.start(translationWorkflow, {
      args: [{
        documentId,
        serviceName,
        fields: fields || []
      }],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'awesomeapps-tasks',
      workflowId: `translate-${documentId}-${Date.now()}`
    })
    
    await connection.close()
    log.info('Translation workflow triggered successfully', { documentId })
  } catch (error) {
    log.error('Failed to trigger translation workflow', { error, documentId })
    throw error
  }
}

export async function getNewServices(status: 'new' | 'pending'): Promise<NewServicesResponse> {
  log.info('Fetching new services', { status })
  
  const query = `
    query GetNewServices {
      newServices(filters: { n8nstatus: { eq: "${status}" } }) {
        documentId
        slug
        field
      }
    }
  `

  const data = await strapiGraphQL(query)
  
  return {
    data: {
      newServices: data.newServices || []
    }
  }
}

export async function updateNewServiceStatus(documentId: string, status: 'new' | 'pending' | 'error'): Promise<void> {
  log.info('Updating new service status', { documentId, status })
  
  await strapiRequest(`/new-services/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        n8nstatus: status
      }
    })
  })

  log.info('New service status updated successfully', { documentId, status })
}

export async function deleteNewService(documentId: string): Promise<void> {
  log.info('Deleting new service', { documentId })
  
  await strapiRequest(`/new-services/${documentId}`, {
    method: 'DELETE'
  })

  log.info('New service deleted successfully', { documentId })
}

export async function createNewService(data: { slug: string; n8nstatus: string }): Promise<void> {
  log.info('Creating new service', { slug: data.slug, n8nstatus: data.n8nstatus })
  
  await strapiRequest('/new-services', {
    method: 'POST',
    body: JSON.stringify({ data })
  })

  log.info('New service created successfully', { slug: data.slug })
}

