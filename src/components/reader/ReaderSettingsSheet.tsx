'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { ReaderPreferences, ReaderTheme } from '@/lib/readerPreferences'
import { fontOptions } from '@/hooks/useFonts'

interface ReaderSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefs: ReaderPreferences
  onUpdate: (partial: Partial<ReaderPreferences>) => void
  onReset: () => void
}

const themes: { value: ReaderTheme; label: string; swatch: string }[] = [
  { value: 'light', label: 'Light', swatch: '#ffffff' },
  { value: 'sepia', label: 'Sepia', swatch: '#f4ecd8' },
  { value: 'gray', label: 'Gray', swatch: '#e5e5e5' },
  { value: 'black', label: 'Black', swatch: '#000000' },
]

export function ReaderSettingsSheet({
  open,
  onOpenChange,
  prefs,
  onUpdate,
  onReset,
}: ReaderSettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Reading settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onUpdate({ theme: t.value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                    prefs.theme === t.value ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full border"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reading mode</Label>
            <Select
              value={prefs.readingMode}
              onValueChange={(v: 'paginated' | 'scroll') => onUpdate({ readingMode: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paginated">Paginated (page turn)</SelectItem>
                <SelectItem value="scroll">Continuous scroll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font</Label>
            <Select
              value={prefs.fontFamily}
              onValueChange={(v) => onUpdate({ fontFamily: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font size: {prefs.fontSize}px</Label>
            <Slider
              value={[prefs.fontSize]}
              min={12}
              max={32}
              step={1}
              onValueChange={([v]) => onUpdate({ fontSize: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Line spacing: {prefs.lineHeight.toFixed(1)}</Label>
            <Slider
              value={[prefs.lineHeight]}
              min={1.2}
              max={2.4}
              step={0.1}
              onValueChange={([v]) => onUpdate({ lineHeight: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Margins: {prefs.margins}px</Label>
            <Slider
              value={[prefs.margins]}
              min={8}
              max={64}
              step={4}
              onValueChange={([v]) => onUpdate({ margins: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Text alignment</Label>
            <Select
              value={prefs.textAlign}
              onValueChange={(v: 'left' | 'justify') => onUpdate({ textAlign: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="justify">Justified</SelectItem>
                <SelectItem value="left">Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={onReset}>
            Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
