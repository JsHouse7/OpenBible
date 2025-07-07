'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: { 
    full_name?: string; 
    avatar_url?: string; 
    bio?: string; 
    location?: string; 
    denomination?: string; 
  }) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not properly configured, running in demo mode')
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (error) {
        console.error('Failed to get initial session:', error)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } as AuthError }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { error }
      }

      // If email confirmation is disabled, user will be automatically signed in
      if (data.user && !data.user.email_confirmed_at) {
        console.log('Check your email for confirmation link')
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected sign up error:', error)
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } as AuthError }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      console.log('Sign in successful:', data.user?.email)
      return { error: null }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { error }
      }

      console.log('Sign out successful')
      return { error: null }
    } catch (error) {
      console.error('Unexpected sign out error:', error)
      return { error: error as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } as AuthError }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        return { error }
      }

      console.log('Password reset email sent')
      return { error: null }
    } catch (error) {
      console.error('Unexpected password reset error:', error)
      return { error: error as AuthError }
    }
  }

  const updateProfile = async (updates: { 
    full_name?: string; 
    avatar_url?: string; 
    bio?: string; 
    location?: string; 
    denomination?: string; 
  }) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } as AuthError }
    }

    try {
      if (!user) {
        return { error: { message: 'No user logged in' } as AuthError }
      }

      const { error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        console.error('Profile update error:', error)
        return { error }
      }

      console.log('Profile updated successfully')
      return { error: null }
    } catch (error) {
      console.error('Unexpected profile update error:', error)
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login or show auth modal
      console.log('User not authenticated, redirect to login')
    }
  }, [user, loading])

  return { user, loading }
} 