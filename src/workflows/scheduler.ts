import {proxyActivities, sleep, executeChild} from '@temporalio/workflow'
import type * as strapiActivities from '../activities/strapi'
import {serviceWorkflow} from './service'
import type {ServiceWorkflowInput} from '../types/service'

const strapi = proxyActivities<typeof strapiActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3
  }
})

export async function schedulerWorkflow(): Promise<{ processed: boolean; documentId?: string; error?: string }> {
  // Check if there are any pending services already being processed
  const pendingServices = await strapi.getNewServices('pending')
  
  if (pendingServices.data.newServices.length > 0) {
    // Another service is already being processed, skip this iteration
    return { processed: false }
  }

  // Get the next "new" service
  const newServices = await strapi.getNewServices('new')
  
  if (newServices.data.newServices.length === 0) {
    // No new services to process
    return { processed: false }
  }

  const firstNew = newServices.data.newServices[0]
  const {documentId, slug, field} = firstNew

  try {
    // Wait 2 seconds before processing (matching n8n Wait1)
    await sleep('2 seconds')

    // Update status to "pending"
    await strapi.updateNewServiceStatus(documentId, 'pending')

    // Prepare service workflow input
    const serviceInput: ServiceWorkflowInput = {
      service: slug,
      fields: field ? [field] : [],
      newtags: false
    }

    // Execute the service workflow as a child workflow
    const result = await executeChild(serviceWorkflow, {
      args: [serviceInput],
      workflowId: `service-${slug}-${Date.now()}`
    })

    // Wait 15 seconds after successful processing (matching n8n Wait2)
    await sleep('15 seconds')

    // Delete the processed service
    await strapi.deleteNewService(documentId)

    return { 
      processed: true,
      documentId: result.documentId
    }
  } catch (error) {
    // On error, update status to "error"
    try {
      await strapi.updateNewServiceStatus(documentId, 'error')
    } catch (updateError) {
      // Log but don't throw if status update fails
    }

    return {
      processed: true,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}


