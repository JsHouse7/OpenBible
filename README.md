# OpenBible - Free Bible Study App 📖

A free, open-source Bible study app with note-taking, bookmarks, and classic Christian literature. Built with Next.js, Supabase, and designed with a mobile-first approach for the best reading experience.

![OpenBible App](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)
![Supabase](https://img.shields.io/badge/Supabase-2.45.6-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

### 📱 **Mobile-First Bible Reading**
- Clean, responsive interface optimized for all devices
- Verse-by-verse reading with intuitive navigation
- Smooth scrolling and touch-friendly interactions

### 📝 **Note-Taking System**
- Add personal notes to any verse
- Edit and manage your study notes
- Notes are saved to your account and sync across devices

### 🎯 **Verse Highlighting**
- Highlight important verses while reading
- Visual indicators for verses with notes
- Easy highlight management

### 🔖 **Bookmarks & Navigation**
- Bookmark favorite verses for quick access
- Navigate between all 66 Bible books
- Chapter-by-chapter browsing
- Testament-based organization (Old/New)

### 🔍 **Smart Features**
- Interactive verse selection
- Reading progress tracking
- Mobile-optimized interface
- PWA support (installable as native app)

### 🚀 **Progressive Web App (PWA)**
- Install on mobile devices like a native app
- Offline reading capability (coming soon)
- Fast loading and smooth performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **UI Components**: Custom components with Headless UI
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- A Supabase account
- A Vercel account (for deployment)

### 1. Clone and Install
```bash
git clone <your-repo>
cd OpenBible
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App Configuration
NEXT_PUBLIC_APP_NAME=OpenBible
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Settings > API
3. **Run the database schema**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `database/schema.sql`
   - Run the script to create all tables and sample data

### 4. Migrate Bible Data
```bash
npm run migrate:bible
```
This will transfer all Bible verses from JSON files to your Supabase database.

### 5. Development
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app running!

### 6. Authentication
- Visit `/auth` to test the authentication system
- Create a new account or sign in
- All user data (notes, bookmarks, highlights) will be saved to your account

## 📊 Database Schema

The app uses the following main tables:

- **`bible_verses`** - Bible text content (KJV included)
- **`user_notes`** - Personal study notes linked to verses
- **`user_bookmarks`** - Saved favorite verses
- **`user_highlights`** - Highlighted verses with colors
- **`reading_progress`** - Track reading progress per book
- **`authors`** - Christian authors (for future literature feature)
- **`works`** - Christian literature works (for future feature)

## 🎯 Current MVP Features

✅ **Complete Bible Reading Interface**
- Mobile-first responsive design
- All 66 Bible books with chapter navigation
- Clean verse-by-verse display

✅ **Note-Taking System**
- Add, edit, and save notes on any verse
- Notes persist across sessions
- User-specific with authentication

✅ **Highlighting & Bookmarking**
- Highlight verses for emphasis
- Visual feedback for important passages
- Quick bookmark management

✅ **Navigation System**
- Testament-based book organization
- Chapter grid for easy jumping
- Current reading position tracking

✅ **Progressive Web App**
- Installable on mobile devices
- App-like experience
- Optimized performance

## 🔮 Roadmap (Future Features)

### Phase 2: Enhanced Bible Study
- [ ] Multiple Bible translations (ESV, NIV, NASB)
- [ ] Cross-references between verses
- [ ] Verse search functionality
- [ ] Reading plans and daily devotions
- [ ] Export notes to PDF

### Phase 3: Christian Literature
- [ ] Classic Christian authors integration
- [ ] Commentaries by Calvin, Spurgeon, etc.
- [ ] Devotionals (Morning & Evening)
- [ ] Sermons and theological works
- [ ] Author timeline and categorization

### Phase 4: Community Features
- [ ] Share verses and notes
- [ ] Study groups and discussions
- [ ] Community annotations
- [ ] Social reading features

### Phase 5: Advanced Features
- [ ] AI-powered study assistant
- [ ] Audio Bible integration
- [ ] Advanced search with filters
- [ ] Offline sync capabilities
- [ ] Multi-language support

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_NAME=OpenBible
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📱 PWA Installation

Users can install OpenBible as a native app:

1. **On Mobile**: Use "Add to Home Screen" option
2. **On Desktop**: Click the install button in the browser
3. **Features**: Works offline, full-screen experience, app icon

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Areas for Contribution
- Additional Bible translations
- UI/UX improvements
- Performance optimizations
- New features from the roadmap
- Bug fixes and testing
- Documentation improvements

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Bible Text**: King James Version (Public Domain)
- **Inspiration**: Logos Bible Software
- **UI Design**: Modern, mobile-first approach
- **Community**: Built for the global Christian community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/openbible/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/openbible/discussions)
- **Documentation**: This README and inline code comments

---

### 🎯 Mission Statement

> "To provide a completely free, accessible, and comprehensive Bible study platform that empowers believers worldwide to dive deeper into Scripture and classic Christian literature, without barriers or costs."

**Built with ❤️ for the Kingdom**
