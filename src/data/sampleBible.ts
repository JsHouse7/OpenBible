// Sample Bible data for demonstration - John 3 (KJV)
// In production, this would come from the Supabase database
export const sampleBibleData = [
  {
    id: 'john-3-1',
    book: 'John',
    chapter: 3,
    verse: 1,
    text: 'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:',
    translation: 'KJV'
  },
  {
    id: 'john-3-2',
    book: 'John',
    chapter: 3,
    verse: 2,
    text: 'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.',
    translation: 'KJV'
  },
  {
    id: 'john-3-3',
    book: 'John',
    chapter: 3,
    verse: 3,
    text: 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.',
    translation: 'KJV'
  },
  {
    id: 'john-3-4',
    book: 'John',
    chapter: 3,
    verse: 4,
    text: 'Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother\'s womb, and be born?',
    translation: 'KJV'
  },
  {
    id: 'john-3-5',
    book: 'John',
    chapter: 3,
    verse: 5,
    text: 'Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.',
    translation: 'KJV'
  },
  {
    id: 'john-3-6',
    book: 'John',
    chapter: 3,
    verse: 6,
    text: 'That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.',
    translation: 'KJV'
  },
  {
    id: 'john-3-7',
    book: 'John',
    chapter: 3,
    verse: 7,
    text: 'Marvel not that I said unto thee, Ye must be born again.',
    translation: 'KJV'
  },
  {
    id: 'john-3-8',
    book: 'John',
    chapter: 3,
    verse: 8,
    text: 'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.',
    translation: 'KJV'
  },
  {
    id: 'john-3-9',
    book: 'John',
    chapter: 3,
    verse: 9,
    text: 'Nicodemus answered and said unto him, How can these things be?',
    translation: 'KJV'
  },
  {
    id: 'john-3-10',
    book: 'John',
    chapter: 3,
    verse: 10,
    text: 'Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?',
    translation: 'KJV'
  },
  {
    id: 'john-3-11',
    book: 'John',
    chapter: 3,
    verse: 11,
    text: 'Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.',
    translation: 'KJV'
  },
  {
    id: 'john-3-12',
    book: 'John',
    chapter: 3,
    verse: 12,
    text: 'If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?',
    translation: 'KJV'
  },
  {
    id: 'john-3-13',
    book: 'John',
    chapter: 3,
    verse: 13,
    text: 'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.',
    translation: 'KJV'
  },
  {
    id: 'john-3-14',
    book: 'John',
    chapter: 3,
    verse: 14,
    text: 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:',
    translation: 'KJV'
  },
  {
    id: 'john-3-15',
    book: 'John',
    chapter: 3,
    verse: 15,
    text: 'That whosoever believeth in him should not perish, but have eternal life.',
    translation: 'KJV'
  },
  {
    id: 'john-3-16',
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    translation: 'KJV'
  },
  {
    id: 'john-3-17',
    book: 'John',
    chapter: 3,
    verse: 17,
    text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
    translation: 'KJV'
  },
  {
    id: 'john-3-18',
    book: 'John',
    chapter: 3,
    verse: 18,
    text: 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
    translation: 'KJV'
  },
  {
    id: 'john-3-19',
    book: 'John',
    chapter: 3,
    verse: 19,
    text: 'And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.',
    translation: 'KJV'
  },
  {
    id: 'john-3-20',
    book: 'John',
    chapter: 3,
    verse: 20,
    text: 'For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.',
    translation: 'KJV'
  },
  {
    id: 'john-3-21',
    book: 'John',
    chapter: 3,
    verse: 21,
    text: 'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.',
    translation: 'KJV'
  }
] as const

// Helper function to get verses for a specific chapter
export const getChapterVerses = (book: string, chapter: number) => {
  return sampleBibleData.filter(verse => 
    verse.book === book && verse.chapter === chapter
  )
}

// Helper function to get a specific verse
export const getVerse = (book: string, chapter: number, verse: number) => {
  return sampleBibleData.find(v => 
    v.book === book && v.chapter === chapter && v.verse === verse
  )
} 