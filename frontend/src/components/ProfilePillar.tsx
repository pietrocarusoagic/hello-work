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
    <div className="card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-white/40 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-agic-primary/10 text-agic-primary rounded-full text-xs font-medium"
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
          className="flex-1 text-sm border border-gray-200 dark:border-agic-border rounded-lg px-3 py-2 bg-white dark:bg-agic-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40 transition-colors"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 gradient-bg text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          +
        </button>
      </div>
    </div>
  )
}
