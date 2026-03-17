import Head from 'next/head'
import Link from 'next/link'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function PaymentSuccessPage() {
  return (
    <>
      <Head><title>Investment Status — By The Fruit</title></Head>
      <main className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <h1>Investment Status Lives on Sally</h1>
        <p style={{ marginTop: '0.75rem' }}>
          Payment, signing, and investment status updates are managed in Sally.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Open Sally →</a>
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/portfolio">Back to portfolio</Link>
        </p>
      </main>
    </>
  )
}
