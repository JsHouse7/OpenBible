# OpenBible - Quick Setup Guide 🚀

## 📋 What You Need
1. **Supabase Account** (free) - [Sign up here](https://supabase.com)
2. **Vercel Account** (free) - [Sign up here](https://vercel.com) 
3. **Node.js 18+** installed on your computer

## ⚡ 5-Minute Setup

### Step 1: Environment Variables
Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=OpenBible
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Supabase Database Setup
1. Create a new project in Supabase
2. Go to **Settings > API** and copy your:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **SQL Editor** in Supabase
4. Copy the entire contents of `database/schema.sql`
5. Paste and run it to create all tables + sample data

### Step 3: Run the App
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` - you should see OpenBible running!

## 🎯 Testing Your Setup

You should be able to:
- ✅ See John Chapter 3 displayed
- ✅ Click on verses to select them
- ✅ Add notes to verses (will be stored locally in MVP)
- ✅ Highlight verses
- ✅ Navigate between books using the menu button
- ✅ Browse Old/New Testament books
- ✅ Switch chapters within books

## 🚀 Deploying to Production

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add the same environment variables in Vercel dashboard
4. Deploy!

### Option 2: Other Hosting
The app is a standard Next.js app and can be deployed anywhere that supports Node.js.

## 🔧 Troubleshooting

### Common Issues:
1. **"Cannot connect to Supabase"** 
   - Check your environment variables
   - Make sure Supabase URL and key are correct

2. **"No data showing"**
   - Make sure you ran the database schema in Supabase
   - Check that the sample data was inserted

3. **"Build errors"**
   - Run `npm install` to ensure all dependencies are installed
   - Make sure you're using Node.js 18+

### Development Commands:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Check for code issues
```

## 📱 Testing PWA Features

To test the Progressive Web App features:
1. Open the app in Chrome/Edge on mobile
2. Look for "Add to Home Screen" prompt
3. Install it as a native app
4. Test offline functionality (coming in future updates)

## 🎯 What's Built

### ✅ Complete MVP Features:
- **Bible Reading Interface** - Clean, mobile-first verse display
- **Navigation System** - All 66 books, chapter browsing
- **Note-Taking** - Add/edit notes on any verse
- **Highlighting** - Visual verse highlighting
- **Progressive Web App** - Installable, app-like experience
- **Responsive Design** - Works perfectly on all device sizes

### 🔮 Ready for Enhancement:
- Database schema supports user authentication
- Structure ready for multiple Bible translations
- Foundation for Christian literature integration
- Scalable component architecture

## 📞 Need Help?

If you run into issues:
1. Check this setup guide first
2. Review the main README.md
3. Check the database schema in `database/schema.sql`
4. Verify your environment variables

---

**🎉 Congratulations! You now have a fully functional Bible study app running locally.** 