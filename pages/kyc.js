import Head from 'next/head'
import Link from 'next/link'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function KYCPage() {
  return (
    <>
      <Head><title>KYC Verification — By The Fruit</title></Head>
      <main className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <h1>KYC Is Managed on Sally</h1>
        <p style={{ marginTop: '0.75rem' }}>
          Identity verification has moved to Sally. Start or continue KYC in your Sally investor flow.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Continue on Sally →</a>
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/offerings">Back to offerings</Link>
        </p>
      </main>
    </>
  )
}
