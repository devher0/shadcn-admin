import { z } from 'zod'
import { apiClient } from './client'
import { logger, metrics } from '@/shared'

// Zod schemas for validation
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'moderator']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true })
const UpdateUserSchema = UserSchema.partial().omit({ id: true, createdAt: true, updatedAt: true })

// Types inferred from schemas
export type User = z.infer<typeof UserSchema>
export type CreateUserRequest = z.infer<typeof CreateUserSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>

export interface UsersListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class UsersService {
  private serviceLogger = logger.withContext({ service: 'users-service' })

  async getUsers(page: number = 1, limit: number = 10): Promise<UsersListResponse> {
    this.serviceLogger.info('Fetching users', { page, limit })
    
    try {
      const response = await apiClient.get<UsersListResponse>(`/users?page=${page}&limit=${limit}`)
      
      // Record metrics
      metrics.counter('users_fetched_total', response.users.length, { page: page.toString() })
      metrics.gauge('users_total_count', response.pagination.total)
      
      this.serviceLogger.info('Users fetched successfully', { 
        count: response.users.length, 
        total: response.pagination.total 
      })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to fetch users', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        page,
        limit
      })
      throw error
    }
  }

  async getUser(id: string): Promise<User> {
    this.serviceLogger.info('Fetching user', { userId: id })
    
    try {
      const response = await apiClient.get<User>(`/users/${id}`)
      
      // Record metrics
      metrics.counter('user_fetched_total', 1, { userId: id })
      
      this.serviceLogger.info('User fetched successfully', { userId: id })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to fetch user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      })
      throw error
    }
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    // Validate input
    const validatedData = CreateUserSchema.parse(data)
    
    this.serviceLogger.info('Creating user', { email: validatedData.email })
    
    try {
      const response = await apiClient.post<User>('/users', validatedData)
      
      // Record metrics
      metrics.counter('user_created_total', 1, { role: validatedData.role })
      
      this.serviceLogger.info('User created successfully', { 
        userId: response.id,
        email: response.email 
      })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to create user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: validatedData.email
      })
      throw error
    }
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    // Validate input
    const validatedData = UpdateUserSchema.parse(data)
    
    this.serviceLogger.info('Updating user', { userId: id, fields: Object.keys(validatedData) })
    
    try {
      const response = await apiClient.put<User>(`/users/${id}`, validatedData)
      
      // Record metrics
      metrics.counter('user_updated_total', 1, { userId: id })
      
      this.serviceLogger.info('User updated successfully', { userId: id })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to update user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      })
      throw error
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.serviceLogger.info('Deleting user', { userId: id })
    
    try {
      await apiClient.delete(`/users/${id}`)
      
      // Record metrics
      metrics.counter('user_deleted_total', 1, { userId: id })
      
      this.serviceLogger.info('User deleted successfully', { userId: id })
    } catch (error) {
      this.serviceLogger.error('Failed to delete user', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id
      })
      throw error
    }
  }

  async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<UsersListResponse> {
    this.serviceLogger.info('Searching users', { query, page, limit })
    
    try {
      const response = await apiClient.get<UsersListResponse>(
        `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      )
      
      // Record metrics
      metrics.counter('users_search_total', 1, { query })
      metrics.counter('users_search_results_total', response.users.length, { query })
      
      this.serviceLogger.info('Users search completed', { 
        query,
        results: response.users.length 
      })
      
      return response
    } catch (error) {
      this.serviceLogger.error('Failed to search users', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      })
      throw error
    }
  }
}

// Create and export service instance
export const usersService = new UsersService()

// Export types
