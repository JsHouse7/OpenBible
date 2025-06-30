export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary">OpenBible</h1>
              <span className="text-sm text-muted-foreground">Free Bible Study App</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Welcome to OpenBible
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A free, open-source Bible study app with note-taking, bookmarks, and classic Christian literature. 
              Read, study, and grow in your faith.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Bible Reading */}
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">📖 Bible Reading</h3>
                <p className="text-sm text-muted-foreground">
                  Complete KJV Bible with all 66 books and 31,000+ verses
                </p>
              </div>
            </div>

            {/* Notes & Study */}
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">📝 Notes & Study</h3>
                <p className="text-sm text-muted-foreground">
                  Take personal study notes and bookmark your favorite verses
                </p>
              </div>
            </div>

            {/* Literature */}
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">📚 Christian Literature</h3>
                <p className="text-sm text-muted-foreground">
                  Access classic Christian writings and devotional materials
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              ✅ <strong>Deployment Successful!</strong> Your OpenBible app is now live and working.
            </div>
            <p className="text-sm text-muted-foreground">
              Ready to gradually restore full functionality: authentication, Bible reader, notes, and more.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 OpenBible. Built for spiritual growth. • Bible: KJV • Literature: Public Domain
          </div>
        </div>
      </footer>
    </div>
  )
}
