import Head from 'next/head'
import Link from 'next/link'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function OfferingDashboardPage() {
  return (
    <>
      <Head><title>Offering Pipeline — By The Fruit</title></Head>
      <main className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <h1>Pipeline Management Is on Sally</h1>
        <p style={{ marginTop: '0.75rem' }}>
          Commitment pipeline, KYC status, funding, and signature tracking are managed in Sally.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Open Sally pipeline →</a>
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/my-offerings">Back to My Offerings</Link>
        </p>
      </main>
    </>
  )
}
