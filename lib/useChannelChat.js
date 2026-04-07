/**
 * React hook for real-time channel chat via WebSocket (Phase 3).
 * Loads initial messages via REST, then uses WebSocket for real-time.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch, getToken } from './api'

function getWsUrl(channelId) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!base) return null
  const wsProtocol = base.startsWith('https') ? 'wss' : 'ws'
  const host = base.replace(/^https?:\/\//, '')
  return `${wsProtocol}://${host}/ws/channels/${channelId}/`
}

function normalizeMessage(m) {
  return {
    ...m,
    id: m.id,
    content: m.content,
    sender: m.sender ?? m.sender_id ?? m.sender_detail?.id,
    sender_id: m.sender ?? m.sender_id ?? m.sender_detail?.id,
    sender_name: m.sender_detail?.full_name || m.sender_name || 'Unknown',
    sender_photo: m.sender_detail?.photo || m.sender_photo || null,
    created_at: m.created_at,
    image_url: m.image_url ?? null,
    file_url:  m.file_url  ?? null,
    video_url: m.video_url ?? null,
  }
}

export function useChannelChat(channelId) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  const addMessage = useCallback((msg) => {
    const norm = normalizeMessage(msg)
    setMessages((prev) => {
      if (prev.some((m) => m.id === norm.id)) return prev
      return [...prev, norm].sort((a, b) => (a.id || 0) - (b.id || 0))
    })
  }, [])

  // Load initial messages via REST
  useEffect(() => {
    if (!channelId || !getToken()) return
    apiFetch(`/profiles/channel-messages/?channel=${channelId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((list) => {
        setMessages(list.map(normalizeMessage).sort((a, b) => (a.id || 0) - (b.id || 0)))
      })
      .catch(() => {})
  }, [channelId])

  useEffect(() => {
    if (!channelId || typeof window === 'undefined') return

    const token = getToken()
    if (!token) {
      setError('Not authenticated')
      return
    }

    const wsUrl = getWsUrl(channelId)
    if (!wsUrl) {
      setError('WebSocket URL not configured')
      return
    }

    const url = `${wsUrl}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          addMessage({
            id: data.id,
            content: data.content,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            created_at: data.created_at,
          })
        }
      } catch (_) {}
    }

    ws.onclose = (e) => {
      setConnected(false)
      if (e.code !== 1000 && e.code < 4000) {
        setError('Connection closed')
      }
    }

    ws.onerror = () => setError('WebSocket error')

    wsRef.current = ws
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [channelId, addMessage])

  const send = useCallback(
    (content) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false
      try {
        wsRef.current.send(JSON.stringify({ content: String(content).trim() }))
        return true
      } catch {
        return false
      }
    },
    []
  )

  return { messages, connected, error, send, addMessage }
}
