import { log } from '@temporalio/activity'
import { fetchBrandLogo } from './youtube'
import type {
  ServiceData,
  StrapiServiceResponse,
  StrapiTagResponse,
  StrapiCreateServiceResponse,
  StrapiCreateTagResponse,
  UploadLogoResponse
} from '../types/service'

const STRAPI_API_URL = process.env.STRAPI_API_URL || 'https://awesomeapps-strapi.meimberg.io/api'
const STRAPI_GRAPHQL_URL = process.env.STRAPI_GRAPHQL_URL || 'https://awesomeapps-strapi.meimberg.io/graphql'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || ''

if (!STRAPI_API_TOKEN) {
  console.warn('STRAPI_API_TOKEN not set')
}

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

  const result = await response.json()
  if (result.errors) {
    throw new Error(`Strapi GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  return result.data
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

export async function createTag(name: string): Promise<StrapiCreateTagResponse> {
  log.info('Creating tag', { name })
  
  const response = await strapiRequest('/tags', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        name
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

  const result = await response.json()
  return {
    id: result[0]?.id || result.id
  }
}

export async function fetchAndUploadLogo(domain: string): Promise<UploadLogoResponse | null> {
  log.info('Fetching and uploading logo', { domain })
  
  try {
    const brandData = await fetchBrandLogo(domain)
    
    if (!brandData.logo_png) {
      log.warn('No logo found for domain', { domain })
      return null
    }
    
    const logoResponse = await fetch(brandData.logo_png)
    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo: ${logoResponse.status} ${logoResponse.statusText}`)
    }
    
    const logoBuffer = Buffer.from(await logoResponse.arrayBuffer())
    const uploadResult = await uploadLogo(logoBuffer, `${domain}-logo.png`)
    
    return uploadResult
  } catch (error) {
    log.error('Failed to fetch and upload logo', { error, domain })
    throw error
  }
}

export async function triggerTranslationWorkflow(documentId: string, serviceName: string): Promise<void> {
  log.info('Triggering translation workflow', { documentId, serviceName })
  
  const { Connection, Client } = await import('@temporalio/client')
  const translationWorkflowId = process.env.TRANSLATION_WORKFLOW_ID
  
  if (!translationWorkflowId) {
    log.warn('TRANSLATION_WORKFLOW_ID not set, skipping translation workflow')
    return
  }
  
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })
    
    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default'
    })
    
    await client.workflow.start(translationWorkflowId, {
      args: [{
        service: serviceName,
        newtags: false
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

