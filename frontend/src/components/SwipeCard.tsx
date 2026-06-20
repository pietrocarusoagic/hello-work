import { WorkMatchCard } from '../lib/api'

interface Props {
  card: WorkMatchCard
}

export default function SwipeCard({ card }: Props) {
  return (
    <div className="card-2xl shadow-xl p-6 w-full max-w-sm mx-auto select-none cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-4 mb-4">
        {card.avatarUrl ? (
          <img src={card.avatarUrl} alt={card.displayName} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-2xl font-bold text-white">
            {card.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{card.displayName}</h3>
          <p className="text-sm text-gray-500 dark:text-white/50">{card.role} {card.department ? `— ${card.department}` : ''}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide">Match Score</span>
          <span className="text-lg font-bold gradient-text">{Math.round(card.matchScore * 100)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-agic-border rounded-full h-2">
          <div
            className="gradient-bg h-2 rounded-full"
            style={{ width: `${card.matchScore * 100}%` }}
          />
        </div>
      </div>

      {card.sharedSkills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">💼 Competenze in comune</p>
          <div className="flex flex-wrap gap-1">
            {card.sharedSkills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-agic-primary/10 text-agic-primary rounded-full text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {card.sharedAiTools.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">🤖 AI Tools in comune</p>
          <div className="flex flex-wrap gap-1">
            {card.sharedAiTools.slice(0, 4).map((t) => (
              <span key={t} className="px-2 py-0.5 bg-agic-secondary/10 text-agic-secondary rounded-full text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}

      {card.sharedInterests.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">❤️ Interessi in comune</p>
          <div className="flex flex-wrap gap-1">
            {card.sharedInterests.slice(0, 4).map((i) => (
              <span key={i} className="px-2 py-0.5 bg-agic-primary/10 text-agic-primary rounded-full text-xs">{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
