'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAnimations } from '@/components/AnimationProvider'
import { useFonts } from '@/hooks/useFonts'
import { cn } from '@/lib/utils'

interface LiteratureWork {
  id: string
  title: string
  author: string
  description: string
  year: number
  pages: number
  readingTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  content: LiteratureChapter[]
}

interface LiteratureChapter {
  id: string
  title: string
  content: string
  pageStart: number
  pageEnd: number
}

interface LiteratureReaderProps {
  workId: string
  onClose: () => void
}

// Sample content for the public domain works
const getLiteratureWork = (workId: string): LiteratureWork | null => {
  const works: Record<string, LiteratureWork> = {
    'morning-evening': {
      id: 'morning-evening',
      title: 'Morning and Evening',
      author: 'Charles Haddon Spurgeon',
      description: 'Daily devotional readings for morning and evening, offering spiritual nourishment and biblical meditation for every day of the year.',
      year: 1869,
      pages: 732,
      readingTime: 1095,
      difficulty: 'beginner',
      tags: ['devotional', 'daily reading', 'meditation', 'spiritual growth'],
      content: [
        {
          id: 'january-1-morning',
          title: 'January 1st - Morning',
          content: `"All the rivers run into the sea; yet the sea is not full." — Ecclesiastes 1:7\n\nEverything in nature teaches the believer lessons of faith and patience. Here is one for New Year's morning. All the rivers run into the sea, but the sea is never full. Year after year the old earth drinks her fill, and is refreshed, but she is not satisfied. The sea is not full, though all the rivers run into it. What a picture of the human heart! All earthly joys flow into it, but it is never satisfied. Riches, honors, pleasures, all pour their streams into the soul, but still it cries, "Give, give." The heart is not full. There is a something beyond and above the present which it craves.\n\nOnly God can fill the heart. The rivers of earthly comfort are sweet, but they cannot fill the ocean of man's soul. God has made us for Himself, and our hearts are restless until they rest in Him. Let your New Year's resolution be to seek your all in God. Let every earthly joy be taken as a drop from His ocean of love. Sanctify your pleasures by making them all tributary to your growth in grace.`,
          pageStart: 1,
          pageEnd: 2
        },
        {
          id: 'january-1-evening',
          title: 'January 1st - Evening',
          content: `"He took up also the mantle of Elijah that fell from him." — 2 Kings 2:13\n\nElisha had long waited for this moment. He had asked for a double portion of Elijah's spirit, and here was the sign that his prayer was heard—the mantle had fallen upon him. The cloak of the prophet was more than a garment; it was the symbol of his office, the token of his divine calling.\n\nWhen we enter upon a new year, we may well desire that the mantle of those who have gone before us in the faith should fall upon us. We need their spirit of devotion, their earnestness in prayer, their boldness in testimony, their patience in suffering. The year that is past has taken from us some whose mantles we would fain wear. They have crossed the Jordan of death, and their robes of righteousness have fallen on this side the stream.\n\nWho will take up the mantle? The Lord has need of laborers still. The fields are white unto harvest, but the laborers are few. May we each resolve that, by God's grace, we will take up the mantle of service which others have laid down, and serve our generation according to the will of God.`,
          pageStart: 2,
          pageEnd: 3
        }
      ]
    },
    'bondage-of-will': {
      id: 'bondage-of-will',
      title: 'The Bondage of the Will',
      author: 'Martin Luther',
      description: 'Luther\'s response to Erasmus on free will, defending the doctrine of predestination and divine sovereignty in salvation.',
      year: 1525,
      pages: 320,
      readingTime: 480,
      difficulty: 'advanced',
      tags: ['reformation', 'predestination', 'free will', 'salvation', 'theology'],
      content: [
        {
          id: 'preface',
          title: 'Preface',
          content: `I had determined, my friend Erasmus, to be silent concerning your book on "Free Will," and that for many reasons. First, because I have always been averse to contentions and disputations, and have ever preferred to walk in the plain and simple paths of Scripture rather than in the thorny mazes of human reasoning.\n\nSecond, because I hoped that you, being a man of learning and judgment, would yourself perceive the weakness of your cause, and would voluntarily abandon a position which you could not maintain with any show of reason or Scripture.\n\nBut since you persist in your opinion, and even challenge me to the combat, I can no longer remain silent without being justly charged with contempt of the truth and neglect of my duty. For the doctrine of free will is not a matter of indifference, but involves the very essence of Christianity.\n\nIf we know not what we can do, and what is done in us, we know not what Christianity is. And if we know not what Christianity is, we are not Christians. This ignorance of our own powers, of what we can do and what is done in us, has brought the whole world into such darkness that we see the abominations spoken of by Christ and Paul.`,
          pageStart: 1,
          pageEnd: 5
        }
      ]
    },
    'pilgrims-progress': {
      id: 'pilgrims-progress',
      title: 'The Pilgrim\'s Progress',
      author: 'John Bunyan',
      description: 'A Christian allegory following Christian\'s journey from the City of Destruction to the Celestial City, depicting the spiritual life.',
      year: 1678,
      pages: 320,
      readingTime: 480,
      difficulty: 'intermediate',
      tags: ['allegory', 'spiritual journey', 'salvation', 'christian life', 'pilgrimage'],
      content: [
        {
          id: 'part1-chapter1',
          title: 'The Pilgrim\'s Journey Begins',
          content: `As I walked through the wilderness of this world, I lighted on a certain place where was a Den, and I laid me down in that place to sleep: and, as I slept, I dreamed a dream. I dreamed, and behold, I saw a man clothed with rags, standing in a certain place, with his face from his own house, a book in his hand, and a great burden upon his back.\n\nI looked, and saw him open the book, and read therein; and, as he read, he wept, and trembled; and, not being able longer to contain, he brake out with a lamentable cry, saying, "What shall I do?"\n\nIn this plight, therefore, he went home and refrained himself as long as he could, that his wife and children should not perceive his distress; but he could not be silent long, because that his trouble increased. Wherefore at length he brake his mind to his wife and children; and thus he began to talk to them: O my dear wife, said he, and you the children of my bowels, I, your dear friend, am in myself undone by reason of a burden that lieth hard upon me; moreover, I am for certain informed that this our city will be burned with fire from heaven; in which fearful overthrow, both myself, with thee my wife, and you my sweet babes, shall miserably come to ruin, except (the which yet I see not) some way of escape can be found, whereby we may be delivered.`,
          pageStart: 1,
          pageEnd: 8
        }
      ]
    },
    'imitation-of-christ': {
      id: 'imitation-of-christ',
      title: 'The Imitation of Christ',
      author: 'Thomas à Kempis',
      description: 'A devotional book emphasizing the interior life and spiritual union with Jesus Christ through practical spiritual guidance.',
      year: 1418,
      pages: 240,
      readingTime: 360,
      difficulty: 'intermediate',
      tags: ['devotional', 'mysticism', 'spiritual discipline', 'imitation', 'contemplation'],
      content: [
        {
          id: 'book1-chapter1',
          title: 'Of the Imitation of Christ, and of Contempt of the World and All Its Vanities',
          content: `"He that followeth me shall not walk in darkness," saith the Lord. These are the words of Christ, by which we are admonished, how we ought to imitate His life and conversation, if we will be truly enlightened, and be delivered from all blindness of heart.\n\nLet therefore our chief endeavor be, to study the life of Jesus Christ.\n\nThe doctrine of Christ exceedeth all the doctrines of holy men; and he that hath His spirit, will find therein an hidden manna.\n\nNow there are many who hear the Gospel often, but care little for it, because they have not the spirit of Christ.\n\nBut whosoever would fully and feelingly understand the words of Christ, must study to make his whole life conformable to that of Christ.\n\nWhat will it avail thee to dispute profoundly of the Trinity, if thou be void of humility, and be thereby displeasing to the Trinity?\n\nSurely high words do not make a man holy and just; but a virtuous life maketh him dear to God.\n\nI had rather feel compunction, than understand the definition thereof.\n\nIf thou didst know the whole Bible by heart, and the sayings of all the philosophers, what would all that profit thee without the love of God, and without grace?`,
          pageStart: 1,
          pageEnd: 4
        }
      ]
    },
    'institutes-christian-religion': {
      id: 'institutes-christian-religion',
      title: 'Institutes of the Christian Religion',
      author: 'John Calvin',
      description: 'Calvin\'s masterwork of systematic theology, covering the knowledge of God, redemption in Christ, and the Christian life.',
      year: 1536,
      pages: 1521,
      readingTime: 2280,
      difficulty: 'advanced',
      tags: ['systematic theology', 'reformation', 'doctrine', 'sovereignty of God', 'predestination'],
      content: [
        {
          id: 'book1-chapter1',
          title: 'The Knowledge of God and That of Ourselves are Connected',
          content: `Nearly all the wisdom we possess, that is to say, true and sound wisdom, consists of two parts: the knowledge of God and of ourselves.\n\nBut, while joined by many bonds, which one precedes and brings forth the other is not easy to discern.\n\nIn the first place, no one can look upon himself without immediately turning his thoughts to the contemplation of God, in whom he "lives and moves" (Acts 17:28). For, quite clearly, the mighty gifts with which we are endowed are hardly from ourselves; indeed, our very being is nothing but subsistence in the one God.\n\nThen, by these benefits shed like dew from heaven upon us, we are led as by rivulets to the spring itself.\n\nIndeed, our very poverty better discloses the infinitude of benefits reposing in God. The miserable ruin, into which the rebellion of the first man cast us, especially compels us to look upward.\n\nThus, from the feeling of our own ignorance, vanity, poverty, infirmity, and—what is more—depravity and corruption, we recognize that the true light of wisdom, sound virtue, full abundance of every good, and purity of righteousness rest in the Lord alone.\n\nTo this extent we are prompted by our own ills to contemplate the good things of God; and we cannot seriously aspire to him before we begin to become displeased with ourselves.`,
          pageStart: 1,
          pageEnd: 6
        }
      ]
    }
  }
  
  return works[workId] || null
}

export function LiteratureReader({ workId, onClose }: LiteratureReaderProps) {
  const [work, setWork] = useState<LiteratureWork | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [readingProgress, setReadingProgress] = useState(0)
  const { getTransitionClass } = useAnimations()
  const { getBibleTextClasses, getUITextClasses, getHeadingClasses } = useFonts()

  useEffect(() => {
    const literatureWork = getLiteratureWork(workId)
    setWork(literatureWork)
  }, [workId])

  useEffect(() => {
    if (work && work.content.length > 0) {
      const progress = ((currentChapter + 1) / work.content.length) * 100
      setReadingProgress(progress)
    }
  }, [currentChapter, work])

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  const handleNextChapter = () => {
    if (work && currentChapter < work.content.length - 1) {
      setCurrentChapter(currentChapter + 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (!work) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6 text-center">
            <p className={cn("text-lg", getUITextClasses())}>Work not found</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentContent = work.content[currentChapter]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className={cn("text-xl", getHeadingClasses())}>
                {work.title}
              </CardTitle>
              <p className={cn("text-sm text-muted-foreground mt-1", getUITextClasses())}>
                by {work.author} • {work.year}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getDifficultyColor(work.difficulty)} text-white`}
              >
                {work.difficulty}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className={getUITextClasses()}>Progress</span>
              <span className={getUITextClasses()}>{Math.round(readingProgress)}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
          
          {/* Chapter Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousChapter}
              disabled={currentChapter === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-center">
              <p className={cn("text-sm font-medium", getUITextClasses())}>
                {currentContent?.title}
              </p>
              <p className={cn("text-xs text-muted-foreground", getUITextClasses())}>
                Chapter {currentChapter + 1} of {work.content.length}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextChapter}
              disabled={currentChapter === work.content.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <div className={cn(
            "prose prose-lg max-w-none",
            "prose-headings:font-bold prose-headings:text-foreground",
            "prose-p:text-foreground prose-p:leading-relaxed",
            "prose-strong:text-foreground",
            getBibleTextClasses(),
            getTransitionClass('default')
          )}>
            {currentContent?.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null
              
              // Handle scripture references (text in quotes)
              if (paragraph.includes('"') && paragraph.includes('—')) {
                const parts = paragraph.split('—')
                return (
                  <div key={index} className="mb-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <p className="text-lg italic mb-2">{parts[0].trim()}</p>
                    {parts[1] && (
                      <p className="text-sm text-muted-foreground font-medium">
                        — {parts[1].trim()}
                      </p>
                    )}
                  </div>
                )
              }
              
              return (
                <p key={index} className="mb-4 text-justify leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>
        </CardContent>
        
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className={getUITextClasses()}>
                Pages {currentContent?.pageStart}-{currentContent?.pageEnd}
              </span>
              <span className={getUITextClasses()}>
                {formatReadingTime(Math.round(work.readingTime / work.content.length))} read time
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Bookmark
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LiteratureReader