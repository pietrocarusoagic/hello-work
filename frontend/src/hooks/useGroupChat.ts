import { useEffect, useRef, useState, useCallback } from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { api, MessageDto } from '../lib/api'
import { DEV_BYPASS } from '../lib/devBypass'

export interface UseGroupChatReturn {
  messages: MessageDto[]
  sendMessage: (body: string) => Promise<void>
  askBot: (prompt?: string) => Promise<void>
  loading: boolean
  connected: boolean
}

export function useGroupChat(groupId: string, groupName?: string): UseGroupChatReturn {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const connectionRef = useRef<HubConnection | null>(null)
  // Used in DEV_BYPASS to simulate real-time delivery
  const pendingBotReplyRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load initial history ──────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return
    setLoading(true)
    api
      .get<MessageDto[]>(`/groups/${groupId}/messages`)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [groupId])

  // ── SignalR connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId || DEV_BYPASS) {
      // In DEV_BYPASS mode we simulate real-time via setTimeout — no hub needed.
      setConnected(true)
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (msg: MessageDto) => {
      setMessages((prev) => {
        // Avoid duplicates (e.g. sender already appended optimistically)
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    connection
      .start()
      .then(() => {
        setConnected(true)
        return connection.invoke('JoinGroup', groupId)
      })
      .catch((err) => console.error('SignalR connection error:', err))

    connectionRef.current = connection

    return () => {
      if (pendingBotReplyRef.current) clearTimeout(pendingBotReplyRef.current)
      connection
        .invoke('LeaveGroup', groupId)
        .catch(() => {})
        .finally(() => connection.stop())
      connectionRef.current = null
      setConnected(false)
    }
  }, [groupId])

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (body: string) => {
      if (!body.trim()) return

      if (DEV_BYPASS) {
        // Optimistic add as user message
        const mockMsg: MessageDto = {
          id: Date.now(),
          groupId,
          senderId: 'demo-user-1',
          senderDisplayName: 'Giulia Rossi',
          senderType: 'user',
          body,
          sourceUrls: [],
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, mockMsg])

        // Simulate echo from server after 800ms
        pendingBotReplyRef.current = setTimeout(() => {
          // No server echo in dev — message already in state
        }, 800)
        return
      }

      await api.post<MessageDto>(`/groups/${groupId}/messages`, { body })
      // The broadcast from the server will add the message via ReceiveMessage
    },
    [groupId],
  )

  const askBot = useCallback(
    async (prompt?: string) => {
      if (DEV_BYPASS) {
        setLoading(true)
        pendingBotReplyRef.current = setTimeout(() => {
          const botMsg: MessageDto = {
            id: Date.now(),
            groupId,
            senderId: undefined,
            senderDisplayName: 'HelloWork Bot',
            senderType: 'bot',
            body: `Ottima domanda! Nel gruppo "${groupName ?? groupId}" stiamo esplorando temi innovativi. Cosa ne pensate? 🤖`,
            sourceUrls: [],
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, botMsg])
          setLoading(false)
        }, 800)
        return
      }

      setLoading(true)
      try {
        await api.post<MessageDto>(`/groups/${groupId}/bot-ask`, { prompt: prompt ?? null })
        // SignalR broadcast will deliver the bot message
      } catch (err) {
        console.error('Bot ask error:', err)
      } finally {
        setLoading(false)
      }
    },
    [groupId, groupName],
  )

  return { messages, sendMessage, askBot, loading, connected }
}
