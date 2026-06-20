interface Props {
  score: number
}

export default function ProfileCompleteness({ score }: Props) {
  const level = score >= 80 ? 'Completo' : score >= 50 ? 'Buono' : 'In corso'

  return (
    <div className="bg-agic-card rounded-xl p-4 border border-agic-border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-white/60">Completezza profilo</span>
        <span className="text-sm font-bold text-white">{score}% — {level}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500 bg-gradient-agic"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
