// Redirects to /orchard -- merged into main Orchard page.
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function MyOrchardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/orchard') }, [router])
  return null
}