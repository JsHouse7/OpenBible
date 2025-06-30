# 🗄️ Supabase Setup for OpenBible

## **Step 1: Create Supabase Project**

1. **Visit Supabase**: Go to [supabase.com](https://supabase.com)
2. **Sign up/Login**: Create account or sign in
3. **New Project**: Click "New Project"
4. **Configure Project**:
   - **Name**: `OpenBible`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing**: Start with Free tier

## **Step 2: Database Setup**

1. **Open SQL Editor**: In your Supabase dashboard → SQL Editor
2. **Run Schema**: Copy and paste the entire contents of `database/schema.sql`
3. **Execute**: Click "Run" to create all tables and policies

## **Step 3: Environment Variables**

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find your keys:**
1. Go to Project Settings → API
2. Copy your **Project URL** and **anon/public key**

## **Step 4: Authentication Setup**

1. **Enable Email Auth**: 
   - Go to Authentication → Settings
   - Enable "Enable email confirmations" if you want email verification
   - Configure email templates if needed

2. **Email Templates** (Optional):
   - Customize confirmation and reset emails
   - Add your app branding

## **Step 5: Row Level Security**

Your schema already includes RLS policies, but verify:
1. Go to Authentication → Policies
2. Ensure all user tables have policies enabled
3. Test with a user account

## **Step 6: Storage (Optional)**

For user avatars and file uploads:
1. Go to Storage → Buckets
2. Create bucket named `avatars`
3. Set up policies for user access

## **Step 7: Production Deployment**

### **Vercel Deployment** (Recommended):

1. **Push to GitHub**: Commit all your changes
2. **Connect Vercel**: Link your GitHub repo to Vercel
3. **Environment Variables**: Add your Supabase keys to Vercel environment
4. **Deploy**: Vercel will build and deploy automatically

### **Alternative: Supabase Edge Functions**:

For advanced server-side logic, you can use Supabase Edge Functions.

---

## 🔧 **Next Steps After Setup**

1. ✅ Run the database schema
2. ✅ Configure environment variables  
3. ✅ Test authentication
4. ✅ Populate Bible data
5. ✅ Deploy to production

## 📊 **Database Population**

The schema includes sample John 3 data. To add more Bible content:

1. **API Import**: Use a Bible API to populate verses
2. **Bulk Insert**: Use SQL scripts for large datasets
3. **CSV Import**: Supabase supports CSV imports

## 🛡️ **Security Checklist**

- ✅ Row Level Security enabled
- ✅ Environment variables secured
- ✅ API keys in production environment only
- ✅ CORS configured properly
- ✅ Authentication policies tested

## 🚀 **Production Readiness**

Your app will be production-ready with:
- Real user authentication
- Persistent data storage
- Scalable database
- Edge functions capability
- Built-in security
- Automatic backups 