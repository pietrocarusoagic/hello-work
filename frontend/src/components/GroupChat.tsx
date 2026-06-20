import { useEffect, useRef, useState } from 'react'
import { useGroupChat } from '../hooks/useGroupChat'
import { MessageDto } from '../lib/api'

interface GroupChatProps {
  groupId: string
  groupName: string
}

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { messages, sendMessage, askBot, loading } = useGroupChat(groupId, groupName)
  const [input, setInput] = useState('')
  const [botPrompt, setBotPrompt] = useState('')
  const [showBotPrompt, setShowBotPrompt] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleBotAsk = async () => {
    const prompt = botPrompt.trim() || undefined
    setBotPrompt('')
    setShowBotPrompt(false)
    await askBot(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[420px]">
      {/* Message feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <p className="text-center text-white/30 text-xs pt-8">
            Nessun messaggio ancora. Inizia la conversazione! 💬
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 pl-11">
            <span className="text-white/40 text-xs animate-pulse">Il bot sta scrivendo…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bot prompt input (collapsed by default) */}
      {showBotPrompt && (
        <div className="flex gap-2 mb-2 mt-1">
          <input
            value={botPrompt}
            onChange={(e) => setBotPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBotAsk()}
            placeholder="Chiedi qualcosa al bot… (lascia vuoto per auto)"
            className="flex-1 bg-agic-dark border border-agic-secondary/40 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-secondary/40"
          />
          <button
            onClick={handleBotAsk}
            disabled={loading}
            className="px-3 py-2 bg-agic-secondary/80 hover:bg-agic-secondary text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            Chiedi
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 border-t border-agic-border pt-3">
        <button
          onClick={() => setShowBotPrompt(!showBotPrompt)}
          title="Chiedi al Bot"
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors
            ${showBotPrompt
              ? 'bg-agic-secondary/30 text-agic-secondary'
              : 'bg-white/5 text-white/50 hover:bg-agic-secondary/20 hover:text-agic-secondary'
            }`}
        >
          🤖
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio… (Invio per inviare)"
          rows={2}
          className="flex-1 bg-agic-dark border border-agic-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-agic-primary/40 resize-none"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 px-4 py-2 bg-gradient-agic text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Invia
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: MessageDto }) {
  const isBot = message.senderType === 'bot'
  const initials = getInitials(message.senderDisplayName)
  const time = formatTime(message.createdAt)

  return (
    <div className="flex items-start gap-2.5">
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none
          ${isBot
            ? 'bg-purple-600/80 text-white'
            : 'bg-agic-primary/80 text-white'
          }`}
        title={message.senderDisplayName}
      >
        {isBot ? '🤖' : initials}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-xs font-medium ${isBot ? 'text-purple-400' : 'text-white/70'}`}>
            {message.senderDisplayName}
          </span>
          <span className="text-white/25 text-[10px]">{time}</span>
        </div>
        <div
          className={`rounded-lg px-3 py-2 text-sm text-white/90 break-words
            ${isBot
              ? 'bg-purple-900/30 border border-purple-700/30'
              : 'bg-white/5 border border-agic-border'
            }`}
        >
          {message.body}
        </div>
        {message.sourceUrls.length > 0 && (
          <div className="mt-1 flex flex-col gap-0.5">
            {message.sourceUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-agic-secondary/70 hover:text-agic-secondary truncate"
              >
                🔗 {url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
