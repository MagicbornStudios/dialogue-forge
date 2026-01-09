"use client"

import { PAYLOAD_COLLECTIONS } from "@/app/payload-collections/enums"

const API_BASE = "/api"

export interface PayloadQueryOptions {
  where?: Record<string, unknown>
  limit?: number
  page?: number
  sort?: string
  depth?: number
}

export interface PayloadFindResult<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page?: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number | null
  nextPage?: number | null
}

/**
 * Client-side Payload CMS API client using REST API.
 * For server-side usage, use getPayload from @payloadcms/sdk directly.
 */
export class PayloadClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  /**
   * Find documents in a collection
   */
  async find<T = unknown>(
    collection: string,
    options: PayloadQueryOptions = {}
  ): Promise<PayloadFindResult<T>> {
    const params = new URLSearchParams()
    
    if (options.where) {
      params.append("where", JSON.stringify(options.where))
    }
    if (options.limit) {
      params.append("limit", options.limit.toString())
    }
    if (options.page) {
      params.append("page", options.page.toString())
    }
    if (options.sort) {
      params.append("sort", options.sort)
    }
    if (options.depth) {
      params.append("depth", options.depth.toString())
    }

    const url = `${this.baseUrl}/${collection}${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${collection}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Find a document by ID
   */
  async findByID<T = unknown>(
    collection: string,
    id: string | number,
    options: { depth?: number } = {}
  ): Promise<T> {
    const params = new URLSearchParams()
    if (options.depth) {
      params.append("depth", options.depth.toString())
    }

    const url = `${this.baseUrl}/${collection}/${id}${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Document not found: ${collection}/${id}`)
      }
      throw new Error(`Failed to fetch ${collection}/${id}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a new document
   */
  async create<T = unknown>(
    collection: string,
    data: Partial<T>
  ): Promise<T> {
    const url = `${this.baseUrl}/${collection}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Failed to create ${collection}: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update a document by ID
   */
  async update<T = unknown>(
    collection: string,
    id: string | number,
    data: Partial<T>
  ): Promise<T> {
    const url = `${this.baseUrl}/${collection}/${id}`
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Failed to update ${collection}/${id}: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete a document by ID
   */
  async delete(collection: string, id: string | number): Promise<void> {
    const url = `${this.baseUrl}/${collection}/${id}`
    const response = await fetch(url, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete ${collection}/${id}: ${response.statusText}`)
    }
  }
}

// Singleton instance
let clientInstance: PayloadClient | null = null

/**
 * Get the Payload client instance (singleton)
 */
export function getPayloadClient(): PayloadClient {
  if (!clientInstance) {
    clientInstance = new PayloadClient()
  }
  return clientInstance
}
