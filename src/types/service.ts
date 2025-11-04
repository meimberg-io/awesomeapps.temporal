export interface ServiceWorkflowInput {
  service: string
  fields?: string[]
  newtags?: boolean
  aiProvider?: 'gemini' | 'openai'
}

export interface ServiceData {
  slug?: string
  name?: string
  abstract?: string
  description?: string
  shortfacts?: string
  functionality?: string
  url?: string
  youtube_video?: string
  youtube_title?: string
  pricing?: string
  tags?: string[]
  logo?: string[]
}

export interface StrapiService {
  documentId: string
  name: string
  slug: string
  url?: string
}

export interface StrapiServiceResponse {
  data: {
    services: StrapiService[]
  }
}

export interface StrapiTag {
  documentId: string
  name: string
}

export interface StrapiTagResponse {
  data: {
    tags: StrapiTag[]
  }
}

export interface StrapiCreateServiceResponse {
  data: {
    documentId: string
    name: string
  }
}

export interface StrapiCreateTagResponse {
  data: {
    documentId: string
    name: string
  }
}

export interface YouTubeSearchResult {
  items: YouTubeVideo[]
}

export interface YouTubeVideo {
  id: {
    videoId: string
  }
  snippet: {
    title: string
  }
}

export interface BrandfetchLogo {
  logo_png?: string
  id?: string
}

export interface UploadLogoResponse {
  id: string
}

export interface TranslationWorkflowInput {
  documentId: string
  serviceName: string
  fields?: string[]
}

export interface TranslationData {
  locale?: string
  slug?: string
  name?: string
  url?: string
  abstract?: string
  description?: string
  functionality?: string
  shortfacts?: string
  pricing?: string
  tags?: string[]
  youtube_video?: string
  youtube_title?: string
  top?: boolean
  publishdate?: string
  reviewCount?: number
  averageRating?: number
}

export interface StrapiServiceDetail extends StrapiService {
  abstract?: string
  description?: string
  functionality?: string
  shortfacts?: string
  pricing?: string
  tags?: StrapiTag[]
  youtube_video?: string
  youtube_title?: string
  top?: boolean
  publishdate?: string
  reviewCount?: number
  averageRating?: number
}

export interface StrapiServiceDetailResponse {
  data: {
    services: StrapiServiceDetail[]
  }
}

export interface NewService {
  documentId: string
  slug: string
  field?: string
}

export interface NewServicesResponse {
  data: {
    newServices: NewService[]
  }
}

