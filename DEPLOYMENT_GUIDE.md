# OpenBible Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Vercel account
- GitHub repository (recommended for automatic deployments)
- Supabase project with configured database

## Environment Variables

Ensure these environment variables are set in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=https://ikbjaqdnsvxmjckihtih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmphcWRuc3Z4bWpja2lodGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjcyMzQsImV4cCI6MjA2NjgwMzIzNH0.EUbUcsH7XRUrTR6KR7qYbxKwLzIS3A2aR2g4YOcdFCk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYmphcWRuc3Z4bWpja2lodGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIyNzIzNCwiZXhwIjoyMDY2ODAzMjM0fQ.HySLQR5S6Q2C4jleUvEOd4KtC5z6Rwuc0VsIYW6QKkg
```

## Manual Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from Project Root

```bash
# Navigate to project directory
cd /path/to/OpenBible

# Deploy to Vercel
vercel
```

### 4. Configure Environment Variables

During deployment, Vercel will prompt you to set environment variables. Add the Supabase credentials listed above.

Alternatively, set them via Vercel dashboard:
1. Go to your project in Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with appropriate values

### 5. Set Production Domain (Optional)

```bash
vercel --prod
```

## GitHub Integration (Recommended)

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

### 3. Automatic Deployments

Once connected, Vercel will automatically deploy:
- Production deployments on pushes to `main` branch
- Preview deployments on pull requests

## Build Configuration

The project includes a `vercel.json` configuration file:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

## Post-Deployment Verification

### 1. Test Core Features

- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Bible search functionality
- [ ] Literature section
- [ ] Notes and bookmarks
- [ ] Theme switching

### 2. API Endpoints

Test these API routes:
- `/api/search/reference` - Bible reference search
- `/api/search/verses` - Verse search
- `/api/literature/list` - Literature listing
- `/api/user/preferences` - User preferences

### 3. Database Connectivity

Verify Supabase connection:
- User registration/login
- Data persistence (notes, bookmarks)
- Search history

## Troubleshooting

### Build Errors

If build fails:

```bash
# Clean build cache
rm -rf .next
npm run build
```

### Environment Variable Issues

1. Verify all required variables are set in Vercel dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure no trailing spaces in values

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Ensure RLS policies allow public access where needed

## Performance Optimization

### 1. Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

Add to `layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Enable Edge Runtime (Optional)

For API routes that don't need Node.js features:

```tsx
export const runtime = 'edge'
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to repository
2. **Supabase RLS**: Ensure Row Level Security is properly configured
3. **API Routes**: Validate all inputs and implement rate limiting
4. **CORS**: Configure appropriate CORS policies

## Monitoring

1. **Vercel Dashboard**: Monitor deployments and performance
2. **Supabase Dashboard**: Monitor database usage and performance
3. **Error Tracking**: Consider adding Sentry or similar service

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Test locally with production environment variables

---

**Note**: This project uses Next.js 14 with App Router and Supabase for backend services. Ensure your deployment environment supports these technologies.