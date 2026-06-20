import { useEffect, useState } from 'react'
import TinderCard from 'react-tinder-card'
import { api, WorkMatchCard } from '../lib/api'
import SwipeCard from '../components/SwipeCard'

export default function WorkMatch() {
  const [cards, setCards] = useState<WorkMatchCard[]>([])
  const [loading, setLoading] = useState(true)
  const [lastMatch, setLastMatch] = useState<string | null>(null)

  useEffect(() => {
    api.get<WorkMatchCard[]>('/workmatch/cards')
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSwipe = async (direction: string, card: WorkMatchCard) => {
    try {
      const result = await api.post<{ matched: boolean }>('/workmatch/swipe', {
        targetId: card.id,
        direction: direction === 'right' ? 'like' : 'pass',
      })

      setCards((current) => current.filter((item) => item.id !== card.id))

      if (result.matched) {
        setLastMatch(card.displayName)
        setTimeout(() => setLastMatch(null), 4000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="min-h-screen bg-agic-dark flex items-center justify-center text-white/40 text-sm">Caricamento...</div>

  return (
    <div className="min-h-screen bg-agic-dark pb-20 md:pt-20 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-white mb-2">WorkMatch 💼</h1>
      <p className="text-white/50 text-sm mb-8">Swipe a destra per connetterti, a sinistra per passare</p>

      {lastMatch && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-50 animate-bounce">
          <div className="bg-gradient-agic text-white rounded-2xl p-4 text-center shadow-xl">
            <div className="text-2xl mb-1">🎉</div>
            <p className="font-bold">Nuova connessione!</p>
            <p className="text-sm opacity-90">Prenota un caffè virtuale con {lastMatch} ☕</p>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center text-white/40">
          <div className="text-5xl mb-4">🎯</div>
          <p>Hai visto tutti i profili disponibili!</p>
          <p className="text-sm mt-2">Torna presto per nuovi suggerimenti</p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm h-[450px]">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="absolute inset-0"
              style={{ zIndex: cards.length - index }}
            >
              <TinderCard
                onSwipe={(dir) => void handleSwipe(dir, card)}
                preventSwipe={['up', 'down']}
              >
                <SwipeCard card={card} />
              </TinderCard>
            </div>
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <div className="flex gap-8 mt-8">
          <button
            onClick={() => void handleSwipe('left', cards[cards.length - 1])}
            className="w-16 h-16 rounded-full bg-agic-card border border-agic-border flex items-center justify-center text-2xl hover:border-red-500/50 hover:bg-red-500/10 transition-all"
          >
            ✕
          </button>
          <button
            onClick={() => void handleSwipe('right', cards[cards.length - 1])}
            className="w-16 h-16 rounded-full bg-agic-card border border-agic-border flex items-center justify-center text-2xl hover:border-agic-primary/50 hover:bg-agic-primary/10 transition-all"
          >
            ❤️
          </button>
        </div>
      )}
    </div>
  )
}
