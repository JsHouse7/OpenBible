'use client'

import { useState } from 'react'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBibleVersion } from './BibleVersionProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'
import { LoadingTranslations } from './ui/LoadingTranslations'

export function BibleVersionSelector() {
  const { selectedVersion, availableVersions, setSelectedVersion, isLoading } = useBibleVersion()
  const { getUITextClasses } = useFonts()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-auto p-2 hover:bg-muted/50 font-normal justify-between min-w-[60px]"
          disabled={isLoading}
        >
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className={cn("text-xs font-medium text-muted-foreground", getUITextClasses())}>
                {selectedVersion.abbreviation}
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search versions..." className="h-9" />
          <CommandEmpty>No version found.</CommandEmpty>
          <CommandList>
            {isLoading ? (
              <LoadingTranslations />
            ) : (
              <CommandGroup heading="Bible Translations">
                <ScrollArea className="h-64">
                  {availableVersions.map((version) => (
                    <CommandItem
                      key={version.id}
                      value={version.id}
                      onSelect={() => {
                        setSelectedVersion(version)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedVersion.id === version.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium", getUITextClasses())}>{version.abbreviation}</span>
                              <span className={cn("text-sm text-muted-foreground", getUITextClasses())}>
                                {version.name}
                              </span>
                            </div>
                            <span className={cn("text-xs text-muted-foreground", getUITextClasses())}>
                              {version.year && `${version.year} • `}{version.language}
                            </span>
                          </div>
                        </div>
                        {selectedVersion.id === version.id && (
                          <Badge variant="default" className={cn("text-xs", getUITextClasses())}>
                            Current
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}