import { auth } from '@clerk/nextjs/server'
import { UserProfileService } from '@/lib/services/user-profile-service'
import { logger } from '@/shared'

export interface AuthenticatedRequest extends Request {
  user?: {
    clerkUserId: string
    userProfile: any
  }
}

/**
 * Clerk middleware for API routes
 * Extracts user from Clerk and ensures UserProfile exists
 */
export async function withClerkAuth(request: Request): Promise<AuthenticatedRequest> {
  try {
    // Get user from Clerk
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized: No Clerk user ID')
    }

    // Get or create user profile
    const userProfile = await UserProfileService.getOrCreateUserProfile(userId)

    // Log successful authentication
    await UserProfileService.logActivity(
      userId,
      'LOGIN',
      'User authenticated via API'
    )

    logger.info('User authenticated via Clerk middleware', { 
      clerkUserId: userId,
      profileId: userProfile.id 
    })

    // Extend request with user data
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      clerkUserId: userId,
      userProfile,
    }

    return authenticatedRequest
  } catch (error) {
    logger.error('Clerk authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    throw error
  }
}

/**
 * Get current user from request (must be used after withClerkAuth)
 */
export function getCurrentUser(request: AuthenticatedRequest) {
  if (!request.user) {
    throw new Error('User not authenticated. Use withClerkAuth middleware first.')
  }
  return request.user
}

/**
 * Check if user has required role
 */
export function requireRole(request: AuthenticatedRequest, requiredRole: string) {
  const user = getCurrentUser(request)
  
  if (user.userProfile.role !== requiredRole && user.userProfile.role !== 'OWNER') {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`)
  }
  
  return user
}

/**
 * Check if user is admin or owner
 */
export function requireAdmin(request: AuthenticatedRequest) {
  return requireRole(request, 'ADMIN')
}

/**
 * Check if user is owner
 */
export function requireOwner(request: AuthenticatedRequest) {
  return requireRole(request, 'OWNER')
}
