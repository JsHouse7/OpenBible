'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { useAuth } from '@/components/AuthProvider'
import { LiteratureAdmin } from '@/components/LiteratureAdmin'
import { cn } from '@/lib/utils'

export default function LiteratureAdminRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Uploading and editing literature requires an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/auth" className={cn(buttonVariants({}))}>
              Sign in
            </Link>
            <Link href="/literature" className={cn(buttonVariants({ variant: 'outline' }))}>
              Back to library
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <LiteratureAdmin />
}
