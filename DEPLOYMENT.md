# 🚀 OpenBible Deployment Guide

## **Quick Setup Checklist**

### ✅ **Before Deployment:**

1. **Supabase Project Created** ✓
2. **Database Schema Applied** ✓ 
3. **Environment Variables Ready** ✓
4. **Authentication Configured** ✓
5. **Code Pushed to GitHub** ✓

---

## **1. Environment Variables Setup**

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**🔑 Where to find your keys:**
1. Go to your Supabase project
2. Settings → API
3. Copy **Project URL** and **anon public** key

---

## **2. Vercel Deployment** (Recommended)

### **Step 1: Connect GitHub**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your OpenBible repository

### **Step 2: Configure Build Settings**
Vercel will auto-detect Next.js settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **Step 3: Add Environment Variables**
In Vercel dashboard → Your Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
```

### **Step 4: Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## **3. Alternative Deployments**

### **Netlify**
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `out` (add `output: 'export'` to next.config.js)
4. Add environment variables in Netlify dashboard

### **Railway**
1. Connect GitHub repository
2. Add environment variables
3. Railway auto-deploys on git push

### **Self-Hosted (Docker)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## **4. Production Checklist**

### **Security:**
- ✅ Row Level Security enabled in Supabase
- ✅ Environment variables in production only
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ API keys secured

### **Performance:**
- ✅ Next.js optimizations enabled
- ✅ Images optimized
- ✅ Static assets cached
- ✅ Database indexes created

### **Monitoring:**
- ✅ Supabase monitoring enabled
- ✅ Vercel analytics configured
- ✅ Error tracking setup (optional)

---

## **5. Custom Domain Setup**

### **Vercel Custom Domain:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (up to 24 hours)

---

## **6. Database Population**

After deployment, populate your database:

### **Option 1: Manual via Supabase Dashboard**
1. Go to Table Editor
2. Import CSV files or add records manually

### **Option 2: API Script**
Create a script to populate from Bible APIs:

```javascript
// scripts/populate-bible.js
import { supabase } from '../src/lib/supabase'

async function populateBible() {
  // Fetch from Bible API and insert into Supabase
  // Implementation depends on your chosen Bible API
}
```

### **Option 3: SQL Bulk Insert**
Use the SQL editor in Supabase for large datasets.

---

## **7. Monitoring & Maintenance**

### **Supabase Dashboard:**
- Monitor database usage
- Check authentication metrics
- Review logs for errors

### **Vercel Analytics:**
- Page performance
- User engagement
- Traffic sources

### **Backup Strategy:**
- Supabase automatic backups (Pro plan)
- Export critical data periodically
- Version control for schema changes

---

## **8. Post-Deployment Testing**

### **Test Authentication:**
1. Register new account
2. Email confirmation (if enabled)
3. Login/logout flow
4. Password reset

### **Test Core Features:**
1. Bible reading
2. Note-taking
3. Bookmarks
4. Highlights
5. User preferences

### **Test Performance:**
1. Page load times
2. Database queries
3. Mobile responsiveness
4. Search functionality

---

## **🎉 Success!**

Your OpenBible app is now live with:
- ✅ Real authentication
- ✅ Persistent data
- ✅ Scalable infrastructure
- ✅ Professional hosting
- ✅ Automatic SSL
- ✅ Global CDN

**Next Steps:**
1. Share your app with users
2. Monitor usage and feedback
3. Add more Bible translations
4. Implement additional features
5. Consider Bible content licensing

---

## **Support & Resources**

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **OpenBible Issues**: Create GitHub issues for support

**🔗 Your live app:** `https://your-project.vercel.app` 