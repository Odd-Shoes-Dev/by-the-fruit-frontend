import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'

/**
 * Email verification stub.
 * Backend verify-email endpoint is not currently enabled.
 * This page can be linked from "check your email" messages;
 * when backend is wired, call the API with token from query.
 */
export default function VerifyEmail() {
  const router = useRouter()
  const { token } = router.query

  return (
    <>
      <Head><title>Verify your email — By The Fruit</title></Head>
      <motion.div className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ maxWidth: 480 }}>
        <h2>Verify your email</h2>
        {token ? (
          <p>Verification links are not yet active. Your account is ready — you can <Link href="/login">log in</Link>.</p>
        ) : (
          <p>Check your email for a verification link. If you don’t see it, you can still <Link href="/login">log in</Link>.</p>
        )}
        <p><Link href="/login">Log in</Link> · <Link href="/">Home</Link></p>
      </motion.div>
    </>
  )
}
