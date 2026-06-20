import { useState } from 'react'

interface Props {
  title: string
  icon: string
  description: string
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  inputPlaceholder: string
}

export default function ProfilePillar({ title, icon, description, tags, onAddTag, onRemoveTag, inputPlaceholder }: Props) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed)
      setInput('')
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
          >
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="hover:text-red-500 ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={inputPlaceholder}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
