import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getUserId } from '../lib/api'

export default function PortfolioPage() {
  const router = useRouter()
  useEffect(() => {
    const id = getUserId()
    router.replace(id ? '/profile/' + id : '/login')
  }, [router])
  return null
}
