import Head from 'next/head'
import Link from 'next/link'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function EditOfferingPage() {
  return (
    <>
      <Head><title>Edit Offering — By The Fruit</title></Head>
      <main className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <h1>Offering Updates Are Managed on Sally</h1>
        <p style={{ marginTop: '0.75rem' }}>
          Editing and publishing offerings now happens in Sally.
        </p>
        <p style={{ marginTop: '1rem' }}>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer">Open Sally →</a>
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/my-offerings">Back to My Offerings</Link>
        </p>
      </main>
    </>
  )
}
