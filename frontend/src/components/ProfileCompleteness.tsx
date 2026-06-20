interface Props {
  score: number
}

export default function ProfileCompleteness({ score }: Props) {
  const level = score >= 80 ? 'Completo' : score >= 50 ? 'Buono' : 'In corso'
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-agic-secondary' : 'bg-agic-primary'

  return (
    <div className="card p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-white/60">Completezza profilo</span>
        <span className="text-sm font-bold text-gray-800 dark:text-white">{score}% — {level}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-agic-border rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
