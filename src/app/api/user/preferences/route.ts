import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for server-side operations
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    // Create a client with the user's JWT token
    const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error } = await supabaseWithAuth.auth.getUser()

    if (error) {
      console.error('Authentication error:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error verifying user token:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user preferences from database
    const { data: userPrefs, error } = await supabaseServer
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return preferences or empty object if none found
    return NextResponse.json(
      { preferences: userPrefs?.preferences || {} },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { preferences } = await request.json()

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      )
    }

    // Upsert user preferences
    const { data, error } = await supabaseServer
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Preferences saved successfully', data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { preferences: newPreferences } = await request.json()

    if (!newPreferences || typeof newPreferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      )
    }

    // Get existing preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single()

    // Merge with existing preferences
    const mergedPreferences = {
      ...(existing?.preferences || {}),
      ...newPreferences
    }

    // Upsert merged preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences: mergedPreferences
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Preferences updated successfully', preferences: mergedPreferences },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}