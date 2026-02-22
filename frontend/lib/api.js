/**
 * API helpers for By The Fruit
 * Uses Token auth (Django TokenAuthentication)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('btf_token')
}

export function getUserId() {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('btf_user')
    return u ? JSON.parse(u).id : null
  } catch {
    return null
  }
}

export function setAuth(user, token) {
  if (typeof window === 'undefined') return
  localStorage.setItem('btf_token', token)
  localStorage.setItem('btf_user', JSON.stringify(user))
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('btf_token')
  localStorage.removeItem('btf_user')
}

export function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...options.headers } })
  return res
}
