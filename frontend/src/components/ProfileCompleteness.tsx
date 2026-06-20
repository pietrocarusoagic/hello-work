interface Props {
  score: number
}

export default function ProfileCompleteness({ score }: Props) {
  const level = score >= 80 ? 'Completo' : score >= 50 ? 'Buono' : 'In corso'
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400'

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">Completezza profilo</span>
        <span className="text-sm font-bold text-gray-800">{score}% — {level}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
