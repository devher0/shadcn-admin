import { prisma } from '@/lib/database/client'
import { logger } from '@/shared'
import { z } from 'zod'

// Validation schemas
const CreateUserProfileSchema = z.object({
  clerkUserId: z.string().min(1),
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'USER']).default('USER'),
  avatar: z.string().url().optional(),
  email: z.string().email().optional(),
})

const UpdateUserProfileSchema = CreateUserProfileSchema.partial().omit({ clerkUserId: true })

export type CreateUserProfileRequest = z.infer<typeof CreateUserProfileSchema>
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>

export class UserProfileService {
  /**
   * Get or create user profile by Clerk user ID
   * This is the main method for Clerk integration
   */
  static async getOrCreateUserProfile(clerkUserId: string, userData?: {
    displayName?: string
    email?: string
    avatar?: string
  }) {
    try {
      // First try to find existing profile
      let userProfile = await prisma.userProfile.findUnique({
        where: { clerkUserId },
        include: {
          settings: true,
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      })

      if (!userProfile) {
        // Create new profile if doesn't exist
        userProfile = await prisma.userProfile.create({
          data: {
            clerkUserId,
            displayName: userData?.displayName,
            email: userData?.email,
            avatar: userData?.avatar,
            role: 'USER',
          },
          include: {
            settings: true,
            memberships: {
              include: {
                tenant: true,
              },
            },
          },
        })

        // Create default settings
        await prisma.userSettings.create({
          data: {
            userId: userProfile.id,
          },
        })

        logger.info('UserProfile created from Clerk', { 
          clerkUserId, 
          profileId: userProfile.id 
        })
      }

      return userProfile
    } catch (error) {
      logger.error('Failed to get or create user profile', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId 
      })
      throw error
    }
  }

  /**
   * Get user profile by Clerk user ID
   */
  static async getUserProfileByClerkId(clerkUserId: string) {
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { clerkUserId },
        include: {
          settings: true,
          memberships: {
            include: {
              tenant: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              activities: true,
            },
          },
        },
      })

      if (!userProfile) {
        throw new Error('UserProfile not found')
      }

      return userProfile
    } catch (error) {
      logger.error('Failed to get user profile by Clerk ID', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId 
      })
      throw error
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(clerkUserId: string, data: UpdateUserProfileRequest) {
    try {
      const validatedData = UpdateUserProfileSchema.parse(data)
      
      const userProfile = await prisma.userProfile.update({
        where: { clerkUserId },
        data: validatedData,
        include: {
          settings: true,
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      })

      logger.info('UserProfile updated', { 
        clerkUserId, 
        updatedFields: Object.keys(validatedData) 
      })
      
      return userProfile
    } catch (error) {
      logger.error('Failed to update user profile', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId,
        data 
      })
      throw error
    }
  }

  /**
   * Delete user profile (when Clerk user is deleted)
   */
  static async deleteUserProfile(clerkUserId: string) {
    try {
      await prisma.userProfile.delete({
        where: { clerkUserId },
      })

      logger.info('UserProfile deleted', { clerkUserId })
    } catch (error) {
      logger.error('Failed to delete user profile', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId 
      })
      throw error
    }
  }

  /**
   * List user profiles with pagination and filtering
   */
  static async listUserProfiles(params: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }) {
    try {
      const { page = 1, limit = 10, search, role } = params
      const skip = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { displayName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      }

      const [userProfiles, total] = await Promise.all([
        prisma.userProfile.findMany({
          where,
          skip,
          take: limit,
          include: {
            settings: true,
            memberships: {
              include: {
                tenant: true,
              },
            },
            _count: {
              select: {
                sessions: true,
                activities: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.userProfile.count({ where }),
      ])

      return {
        userProfiles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      logger.error('Failed to list user profiles', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      })
      throw error
    }
  }

  /**
   * Log user activity
   */
  static async logActivity(clerkUserId: string, type: string, description: string, metadata?: any) {
    try {
      const userProfile = await this.getUserProfileByClerkId(clerkUserId)
      
      await prisma.activity.create({
        data: {
          userId: userProfile.id,
          type: type as any,
          description,
          metadata,
        },
      })

      logger.debug('Activity logged', { clerkUserId, type, description })
    } catch (error) {
      logger.error('Failed to log activity', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId,
        type 
      })
    }
  }

  /**
   * Get user settings
   */
  static async getUserSettings(clerkUserId: string) {
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { clerkUserId },
        include: {
          settings: true,
        },
      })

      if (!userProfile) {
        throw new Error('UserProfile not found')
      }

      return userProfile.settings
    } catch (error) {
      logger.error('Failed to get user settings', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId 
      })
      throw error
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(clerkUserId: string, settings: {
    theme?: string
    language?: string
    notifications?: any
    preferences?: any
  }) {
    try {
      const userProfile = await this.getUserProfileByClerkId(clerkUserId)
      
      const updatedSettings = await prisma.userSettings.update({
        where: { userId: userProfile.id },
        data: settings,
      })

      logger.info('User settings updated', { clerkUserId, updatedFields: Object.keys(settings) })
      
      return updatedSettings
    } catch (error) {
      logger.error('Failed to update user settings', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkUserId,
        settings 
      })
      throw error
    }
  }
}
