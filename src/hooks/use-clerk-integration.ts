import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { logger } from '@/shared'

interface UserProfile {
  id: string
  clerkUserId: string
  displayName: string | null
  role: string
  avatar: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

export function useClerkIntegration() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !userId) {
      setUserProfile(null)
      setIsLoading(false)
      return
    }

    const createUserProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        logger.info('Creating/getting user profile for Clerk user', {
          clerkUserId: userId,
          email: user?.emailAddresses?.[0]?.emailAddress
        })

        // First try to get existing profile
        let response = await fetch(`/api/user-profiles/clerk/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 404) {
          logger.info('User profile not found, creating new one', { clerkUserId: userId })

          const userData = {
            clerkUserId: userId,
            displayName: user?.fullName || user?.firstName || 'New User',
            email: user?.emailAddresses?.[0]?.emailAddress,
            avatar: user?.imageUrl,
          }

          response = await fetch('/api/user-profiles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          })

          if (!response.ok) {
            throw new Error(`Failed to create user profile: ${response.statusText}`)
          }
        } else if (!response.ok) {
          throw new Error(`Failed to get user profile: ${response.statusText}`)
        }

        const profile = await response.json()
        setUserProfile(profile)

        logger.info('User profile retrieved/created successfully', {
          profileId: profile.id,
          clerkUserId: profile.clerkUserId
        })

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        logger.error('Failed to create/get user profile', {
          error: errorMessage,
          clerkUserId: userId
        })
      } finally {
        setIsLoading(false)
      }
    }

    createUserProfile()
  }, [isLoaded, isSignedIn, userId, user])

  return {
    userProfile,
    isLoading,
    error,
    isSignedIn,
    userId,
    user
  }
}
