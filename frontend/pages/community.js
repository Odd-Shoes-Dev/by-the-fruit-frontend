import Head from 'next/head'
import { useState } from 'react'
import PostForm from '../components/PostForm'
import PostList from '../components/PostList'

export default function Community() {
  const [refresh, setRefresh] = useState(0)
  return (
    <>
      <Head>
        <title>Community — By the Fruit</title>
      </Head>
      <main className="container">
        <header>
          <h1>Community</h1>
          <p className="tagline">Connect, share deals, and record events. Your feed is ordered by relevance when you’re logged in.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
          <div>
            <PostForm onCreate={() => setRefresh(r => r + 1)} />
            <div style={{ marginTop: 18 }}>
              <PostList refreshTrigger={refresh} />
            </div>
          </div>

          <aside className="card">
            <h3>Upcoming</h3>
            <p>Events, opportunities, and announcements will appear here.</p>
          </aside>
        </div>
      </main>
    </>
  )
}
