'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useTheme } from './ThemeProvider'
import { 
  Palette,
  Volume2,
  Moon,
  Sun,
  Monitor,
  BookOpen,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAnimations } from './AnimationProvider'
import { useBibleVersion } from './BibleVersionProvider'
import { useUserPreferences } from './UserPreferencesProvider'
import { useFonts } from '@/hooks/useFonts'
import { userPreferencesService } from '@/lib/userPreferencesService'

function formatBytes(n: number) {
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** John 3:16 sample lines for translations shipped in the app */
const JOHN_316_PREVIEW: Record<string, string> = {
  kjv: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  esv: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
  niv: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  web: 'For God so loved the world that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.',
  nasb: 'For God so loved the world, that He gave His only begotten Son, that whoever believes in Him shall not perish, but have eternal life.',
  nkjv: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.',
  nlt: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
  asv: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.',
  ylt: 'For God did so love the world, that His Son -- the only begotten -- He gave, that every one who is believing in him may not perish, but may have life age-during.',
}
const DEFAULT_JOHN_316 =
  'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'

const Settings = () => {
  const { theme, setTheme } = useTheme()
  const {
    preferences: animationPreferences,
    updatePreferences: updateAnimationPreferences,
    getTransitionClass,
    getDuration,
    resetToDefaults: resetAnimationPreferences,
  } = useAnimations()
  const { selectedVersion, availableVersions, setSelectedVersion, resetToDefaultVersion } = useBibleVersion()
  const { preferences, updatePreferences, resetPreferences, saveStatus } = useUserPreferences()
  const { fontOptions, getBibleTextClasses } = useFonts()
  const importFileRef = useRef<HTMLInputElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [storageInfo, setStorageInfo] = useState<{ used?: number; quota?: number; localKb?: number }>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Extract values from preferences for easier access
  const {
    fontSize,
    lineHeight,
    fontFamily,
    readingMode,
    verseNumbers,
    highlightEnabled,
    autoSave,
    lexiconEnabled,
    lexiconInlineWords,
    lexiconShowTransliteration,
    notifications,
    audioEnabled,
    dailyReadingReminders,
    weeklyProgressUpdates,
    newLiteratureReleases,
    achievementNotifications,
    analyticsCollection,
    crashReporting,
    publicReadingStats
  } = preferences

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        const maxScroll = scrollWidth - clientWidth
        const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0
        setScrollProgress(progress)
      }
    }

    const scrollElement = scrollContainerRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      handleScroll() // Initial calculation
      
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
          const est = await navigator.storage.estimate()
          if (!cancelled) {
            setStorageInfo((s) => ({ ...s, used: est.usage, quota: est.quota }))
          }
        }
      } catch {
        /* ignore */
      }
      let bytes = 0
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (!k) continue
          bytes += k.length + (localStorage.getItem(k)?.length ?? 0)
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setStorageInfo((s) => ({ ...s, localKb: bytes / 1024 }))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const readingModeOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'focus', label: 'Focus Mode' },
    { value: 'study', label: 'Study Mode' },
    { value: 'meditation', label: 'Meditation Mode' },
  ]

  const handleExportData = async () => {
    try {
      userPreferencesService.clearCache()
      const prefs = await userPreferencesService.getPreferences()
      const animationPrefs = await userPreferencesService.getPreference('animationPreferences', null)
      const bibleVersion = await userPreferencesService.getPreference('bibleVersion', 'kjv')
      const themePref = await userPreferencesService.getPreference('theme', 'system')
      let lastReadingPosition: { book: string; chapter: number } | null = null
      try {
        const raw = localStorage.getItem('openbible-last-position')
        if (raw) lastReadingPosition = JSON.parse(raw) as { book: string; chapter: number }
      } catch {
        /* ignore */
      }
      const payload = {
        exportVersion: 1 as const,
        exportedAt: new Date().toISOString(),
        preferences: prefs,
        animationPreferences: animationPrefs,
        bibleVersion: bibleVersion,
        theme: themePref,
        lastReadingPosition,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = `openbible-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as {
        preferences?: Record<string, unknown>
        animationPreferences?: unknown
        bibleVersion?: string
        theme?: string
        lastReadingPosition?: { book: string; chapter: number }
      }
      if (!data.preferences || typeof data.preferences !== 'object') {
        throw new Error('Invalid backup file: missing preferences')
      }
      await userPreferencesService.savePreferences(data.preferences as Parameters<typeof userPreferencesService.savePreferences>[0])
      if (data.animationPreferences !== undefined && data.animationPreferences !== null && typeof data.animationPreferences === 'object') {
        await userPreferencesService.setPreference('animationPreferences', data.animationPreferences)
      }
      if (data.bibleVersion) {
        await userPreferencesService.setPreference('bibleVersion', data.bibleVersion)
      }
      if (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') {
        setTheme(data.theme)
      }
      if (
        data.lastReadingPosition &&
        typeof data.lastReadingPosition.book === 'string' &&
        typeof data.lastReadingPosition.chapter === 'number'
      ) {
        localStorage.setItem('openbible-last-position', JSON.stringify(data.lastReadingPosition))
      }
      userPreferencesService.clearCache()
      window.location.reload()
    } catch (err) {
      console.error(err)
      window.alert('Could not import this file. Use a backup exported from OpenBible.')
    }
  }

  const handleResetSettings = async () => {
    if (!window.confirm('Reset all settings to defaults? This cannot be undone.')) return
    await resetPreferences()
    setTheme('system')
    resetAnimationPreferences()
    await resetToDefaultVersion()
    userPreferencesService.clearCache()
  }

  return (
    <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Customize your OpenBible experience
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="text-xs text-muted-foreground">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive">Save failed</span>
                </>
              )}
            </div>
          )}
          <SettingsIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="appearance" className="space-y-4">
        <div>
          {/* Scroll hint text */}
          <div className="flex items-center justify-center mb-2 md:hidden">
            <div className="flex items-center gap-1 px-3 py-1 bg-muted/30 rounded-full">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground font-medium">Swipe to see all options</span>
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>
          
          <div className="relative">
            {/* Scroll indicator gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/90 to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/90 to-transparent z-10 pointer-events-none md:hidden" />
            
            <div ref={scrollContainerRef} className="w-full overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="flex w-max min-w-full md:grid md:w-full md:grid-cols-6 gap-2 md:gap-0 px-2 md:px-0">
              <TabsTrigger value="appearance" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                Appearance
              </TabsTrigger>
              <TabsTrigger value="animations" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                Animations
              </TabsTrigger>
              <TabsTrigger value="bible" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                Bible
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                Privacy
              </TabsTrigger>
                             <TabsTrigger value="data" className="flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap">
                 Data
               </TabsTrigger>
             </TabsList>
           </div>
           
           {/* Progress bar */}
           <div className="relative mt-2 md:hidden">
             <div className="h-0.5 bg-muted/30 rounded-full">
               <div 
                 className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                 style={{ width: `${scrollProgress}%` }}
               />
             </div>
           </div>
         </div>
        </div>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Choose your preferred color scheme and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="justify-start"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="justify-start"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="justify-start"
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Reading layout</Label>
                <p className="text-xs text-muted-foreground">
                  Column width, padding, and framing (more obvious on phones; calmer on larger screens)
                </p>
                <Select
                  value={readingMode}
                  onValueChange={(value) => updatePreferences({ readingMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {readingModeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={fontFamily} onValueChange={(value) => updatePreferences({ fontFamily: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <div className="flex flex-col">
                            <span>{font.name}</span>
                            <span className="text-xs text-muted-foreground">{font.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => updatePreferences({ fontSize: value[0] })}
                    max={24}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Line Height: {lineHeight}</Label>
                  <Slider
                    value={[lineHeight]}
                    onValueChange={(value) => updatePreferences({ lineHeight: value[0] })}
                    max={2.0}
                    min={1.2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your text will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-card">
                <div className="space-y-2">
                  {verseNumbers && <span className="text-blue-600 font-medium mr-2">16</span>}
                  <span className={getBibleTextClasses()}>For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                Animation Preferences
              </CardTitle>
              <CardDescription>
                Control animations and motion effects throughout the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on smooth transitions and animations
                  </p>
                </div>
                <Switch
                  checked={animationPreferences.enableAnimations}
                  onCheckedChange={(enableAnimations) =>
                    updateAnimationPreferences({ enableAnimations, enabled: enableAnimations })
                  }
                />
              </div>

              {animationPreferences.enableAnimations && !animationPreferences.reducedMotion && (
                <div className="space-y-6 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>Animation Speed</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={animationPreferences.animationSpeed === 'slow' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          updateAnimationPreferences({ animationSpeed: 'slow', speed: 'slow' })
                        }
                        className="justify-center"
                      >
                        Slow
                      </Button>
                      <Button
                        variant={animationPreferences.animationSpeed === 'normal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          updateAnimationPreferences({ animationSpeed: 'normal', speed: 'normal' })
                        }
                        className="justify-center"
                      >
                        Normal
                      </Button>
                      <Button
                        variant={animationPreferences.animationSpeed === 'fast' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          updateAnimationPreferences({ animationSpeed: 'fast', speed: 'fast' })
                        }
                        className="justify-center"
                      >
                        Fast
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Individual Animation Controls</Label>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Page Transitions</Label>
                          <p className="text-xs text-muted-foreground">
                            Smooth transitions between pages
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.pageTransitions}
                          onCheckedChange={(checked) => updateAnimationPreferences({ pageTransitions: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Verse Animations</Label>
                          <p className="text-xs text-muted-foreground">
                            Animated verse loading and selection
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.verseAnimations}
                          onCheckedChange={(checked) => updateAnimationPreferences({ verseAnimations: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Button Hovers</Label>
                          <p className="text-xs text-muted-foreground">
                            Hover effects on buttons and links
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.buttonHovers}
                          onCheckedChange={(checked) => updateAnimationPreferences({ buttonHovers: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Modal Animations</Label>
                          <p className="text-xs text-muted-foreground">
                            Animated modal openings and closings
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.modalAnimations}
                          onCheckedChange={(checked) => updateAnimationPreferences({ modalAnimations: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Loading Animations</Label>
                          <p className="text-xs text-muted-foreground">
                            Spinners and loading indicators
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.loadingAnimations}
                          onCheckedChange={(checked) => updateAnimationPreferences({ loadingAnimations: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Scroll Animations</Label>
                          <p className="text-xs text-muted-foreground">
                            Animations triggered by scrolling
                          </p>
                        </div>
                        <Switch
                          checked={animationPreferences.scrollAnimations}
                          onCheckedChange={(checked) => updateAnimationPreferences({ scrollAnimations: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Animation Preview</Label>
                    <div className="p-4 border rounded-lg bg-card relative overflow-hidden">
                      <div 
                        className={`w-8 h-8 bg-blue-500 rounded-full ${getTransitionClass('default')}`}
                        style={{
                          transform: 'translateX(0px)',
                          animation: `slide-preview ${getDuration('medium')}ms ease-in-out infinite alternate`
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Sample animation with your current speed setting
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {animationPreferences.reducedMotion && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Reduced motion is enabled by your system preferences
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label>What animations include:</Label>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Smooth verse selection and action button reveals</li>
                  <li>• Page transitions and modal appearances</li>
                  <li>• Button hover effects and menu animations</li>
                  <li>• Loading states and progress indicators</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bible" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Bible Version
              </CardTitle>
              <CardDescription>
                Select your preferred Bible translation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <h3 className="font-medium">{selectedVersion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.abbreviation} • {selectedVersion.year && `${selectedVersion.year} • `}{selectedVersion.language}
                    </p>
                  </div>
                  <Badge variant="default">Current</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Available Translations</Label>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {availableVersions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedVersion.id === version.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedVersion(version)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{version.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {version.abbreviation}
                              </Badge>
                              {version.year && (
                                <Badge variant="secondary" className="text-xs">
                                  {version.year}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {version.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Language: {version.language}
                            </p>
                          </div>
                          {selectedVersion.id === version.id && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Reading Preferences</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Show Verse Numbers</Label>
                        <p className="text-xs text-muted-foreground">
                          Display verse numbers alongside text
                        </p>
                      </div>
                      <Switch
                        checked={verseNumbers}
                        onCheckedChange={(checked) => updatePreferences({ verseNumbers: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Enable Highlighting</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow verse highlighting and selection
                        </p>
                      </div>
                      <Switch
                        checked={highlightEnabled}
                        onCheckedChange={(checked) => updatePreferences({ highlightEnabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Auto-save Progress</Label>
                        <p className="text-xs text-muted-foreground">
                          Remember last chapter when you leave the Bible reader
                        </p>
                      </div>
                      <Switch
                        checked={autoSave}
                        onCheckedChange={(checked) => updatePreferences({ autoSave: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm flex items-center gap-2">
                          <Volume2 className="h-3.5 w-3.5" />
                          Audio features
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Reserved for future verse audio playback
                        </p>
                      </div>
                      <Switch
                        checked={audioEnabled}
                        onCheckedChange={(checked) => updatePreferences({ audioEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Word Study / Lexicon</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Enable Word Study</Label>
                        <p className="text-xs text-muted-foreground">
                          Original Hebrew/Greek definitions with Strong&apos;s numbers and BibleHub links
                        </p>
                      </div>
                      <Switch
                        checked={lexiconEnabled}
                        onCheckedChange={(checked) => updatePreferences({ lexiconEnabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Clickable Words While Reading</Label>
                        <p className="text-xs text-muted-foreground">
                          Tap words in the KJV, NKJV, ESV, NIV, or YLT to open their original-language entries
                        </p>
                      </div>
                      <Switch
                        checked={lexiconInlineWords}
                        disabled={!lexiconEnabled}
                        onCheckedChange={(checked) => updatePreferences({ lexiconInlineWords: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Show Transliteration</Label>
                        <p className="text-xs text-muted-foreground">
                          Include pronunciation guides in word-study cards
                        </p>
                      </div>
                      <Switch
                        checked={lexiconShowTransliteration}
                        disabled={!lexiconEnabled}
                        onCheckedChange={(checked) => updatePreferences({ lexiconShowTransliteration: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version Preview</CardTitle>
              <CardDescription>Sample text from {selectedVersion.abbreviation}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-card">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    {verseNumbers && <span className="text-blue-600 font-medium text-sm">16</span>}
                    <span className="flex-1">
                      {JOHN_316_PREVIEW[selectedVersion.id] ?? DEFAULT_JOHN_316}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">John 3:16 ({selectedVersion.abbreviation})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage your alerts and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reading reminders and updates
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={async (checked) => {
                    updatePreferences({ notifications: checked })
                    if (
                      checked &&
                      typeof window !== 'undefined' &&
                      'Notification' in window &&
                      Notification.permission === 'default'
                    ) {
                      await Notification.requestPermission()
                    }
                  }}
                />
              </div>

              {notifications && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between">
                    <Label>Daily Reading Reminders</Label>
                    <Switch 
                      checked={dailyReadingReminders}
                      onCheckedChange={(checked) => updatePreferences({ dailyReadingReminders: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Weekly Progress Updates</Label>
                    <Switch 
                      checked={weeklyProgressUpdates}
                      onCheckedChange={(checked) => updatePreferences({ weeklyProgressUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>New Literature Releases</Label>
                    <Switch 
                      checked={newLiteratureReleases}
                      onCheckedChange={(checked) => updatePreferences({ newLiteratureReleases: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Achievement Notifications</Label>
                    <Switch 
                      checked={achievementNotifications}
                      onCheckedChange={(checked) => updatePreferences({ achievementNotifications: checked })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your data privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve OpenBible with anonymous usage data
                    </p>
                  </div>
                  <Switch 
                    checked={analyticsCollection}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        analyticsCollection: checked,
                        analyticsVisible: checked,
                        allowDataCollection: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Crash Reporting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send crash reports to help fix bugs
                    </p>
                  </div>
                  <Switch 
                    checked={crashReporting}
                    onCheckedChange={(checked) => updatePreferences({ crashReporting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Reading Stats</Label>
                    <p className="text-sm text-muted-foreground">
                      Share your reading statistics publicly
                    </p>
                  </div>
                  <Switch 
                    checked={publicReadingStats}
                    onCheckedChange={(checked) =>
                      updatePreferences({
                        publicReadingStats: checked,
                        showReadingStats: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Data storage</Label>
                <p className="text-sm text-muted-foreground">
                  When you sign in, notes and highlights sync with your account. Preferences can be stored
                  locally when you use the app without an account.
                </p>
                <Badge variant="secondary">Encrypted in transit (HTTPS)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Import, export, and manage your OpenBible data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                ref={importFileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => void handleExportData()}
                  variant="outline"
                  className="justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export settings
                </Button>
                <Button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  variant="outline"
                  className="justify-start"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import settings
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Exports preferences, theme, animation settings, translation choice, and last reading position
                stored in this browser.
              </p>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Browser storage</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Approximate space used on this device for this site
                  </p>
                  <div className="space-y-2 text-sm">
                    {storageInfo.used != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Site storage (estimate)</span>
                        <span>
                          {formatBytes(storageInfo.used)}
                          {storageInfo.quota != null ? ` / ${formatBytes(storageInfo.quota)}` : ''}
                        </span>
                      </div>
                    )}
                    {storageInfo.localKb != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">localStorage (preferences cache)</span>
                        <span>{storageInfo.localKb < 0.1 ? '< 0.1 KB' : `${storageInfo.localKb.toFixed(1)} KB`}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    onClick={() => void handleResetSettings()}
                    variant="outline"
                    className="justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset all settings
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Resets app preferences, theme, animations, and Bible translation to defaults.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings