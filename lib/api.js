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
  const u = getStoredUser()
  if (!u) return null
  return u.id ?? u.user_data?.id ?? null
}

/** Cached user from localStorage (set on login). May be stale; call /user/me to refresh. */
export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('btf_user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

export function isAdmin() {
  const u = getStoredUser()
  if (!u) return false
  return !!(u.is_staff ?? u.user_data?.is_staff)
}

/** True if user is approved (or staff). Pending/rejected users see waitlist screen only. */
export function isApproved() {
  const u = getStoredUser()
  if (!u) return false
  if (u.is_staff ?? u.user_data?.is_staff) return true
  const status = u.approval_status ?? u.user_data?.approval_status
  return status === 'approved'
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
  localStorage.removeItem('btf_creator')
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
