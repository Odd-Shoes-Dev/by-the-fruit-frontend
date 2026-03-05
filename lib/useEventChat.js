/**
 * React hook for real-time event live chat via WebSocket.
 * Loads existing comments via REST on mount, then uses WebSocket for live messages.
 * When the event is ended (replay mode), only loads from REST — no WebSocket.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch, getToken } from './api'

function getWsUrl(eventId) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!base) return null
  const wsProtocol = base.startsWith('https') ? 'wss' : 'ws'
  const host = base.replace(/^https?:\/\//, '')
  return `${wsProtocol}://${host}/ws/events/${eventId}/`
}

function normalizeComment(c) {
  return {
    id: c.id,
    content: c.content,
    sender_id: c.sender_id ?? c.user ?? c.user_detail?.id ?? null,
    sender_name: c.sender_name ?? c.user_detail?.full_name ?? 'Unknown',
    created_at: c.created_at,
  }
}

/**
 * @param {number|string} eventId
 * @param {'live'|'ended'|'scheduled'} status  - if not 'live', WebSocket is not opened
 */
export function useEventChat(eventId, status) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError]       = useState(null)
  const wsRef = useRef(null)

  const addMessage = useCallback((msg) => {
    const norm = normalizeComment(msg)
    setMessages((prev) => {
      if (prev.some((m) => m.id === norm.id)) return prev
      return [...prev, norm].sort((a, b) => (a.id || 0) - (b.id || 0))
    })
  }, [])

  // Load existing comments via REST (works for live, replay, and upcoming)
  useEffect(() => {
    if (!eventId) return
    apiFetch(`/profiles/events/${eventId}/comments/`)
      .then((r) => r.ok ? r.json() : [])
      .then((list) => setMessages(list.map(normalizeComment)))
      .catch(() => {})
  }, [eventId])

  // Open WebSocket only while event is live and user is authenticated
  useEffect(() => {
    if (!eventId || status !== 'live' || typeof window === 'undefined') return

    const token = getToken()
    if (!token) return   // read-only if not logged in — REST comments still show

    const wsUrl = getWsUrl(eventId)
    if (!wsUrl) return

    const url = `${wsUrl}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(url)

    ws.onopen  = () => { setConnected(true); setError(null) }
    ws.onclose = (e) => {
      setConnected(false)
      if (e.code !== 1000 && e.code < 4000) setError('Connection closed')
    }
    ws.onerror = () => setError('Connection error')
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') addMessage(data)
      } catch (_) {}
    }

    wsRef.current = ws
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [eventId, status, addMessage])

  const send = useCallback((content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false
    try {
      wsRef.current.send(JSON.stringify({ content: String(content).trim() }))
      return true
    } catch {
      return false
    }
  }, [])

  return { messages, connected, error, send }
}
