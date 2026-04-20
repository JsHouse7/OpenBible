import { NextRequest, NextResponse } from 'next/server'
import { getBearerUser } from '@/lib/supabaseRouteAuth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPrefs, error } = await auth.supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: userPrefs?.preferences || {} }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferences } = await request.json().catch(() => ({}))

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 })
    }

    const { data, error } = await auth.supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: auth.user.id,
          preferences,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving user preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Preferences saved successfully', data }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getBearerUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferences: newPreferences } = await request.json().catch(() => ({}))

    if (!newPreferences || typeof newPreferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 })
    }

    const { data: existing } = await auth.supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    const mergedPreferences = {
      ...(existing?.preferences && typeof existing.preferences === 'object' ? existing.preferences : {}),
      ...newPreferences,
    }

    const { data, error } = await auth.supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: auth.user.id,
          preferences: mergedPreferences,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Preferences updated successfully', preferences: mergedPreferences, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
