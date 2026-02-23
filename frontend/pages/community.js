import Head from 'next/head'
import { useState } from 'react'
import { motion } from 'framer-motion'
import PostForm from '../components/PostForm'
import PostList from '../components/PostList'

export default function Community() {
  const [refresh, setRefresh] = useState(0)
  return (
    <>
      <Head><title>Feed — By The Fruit</title></Head>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <header>
          <h1>Community Feed</h1>
          <p className="tagline">Connect, share deals, and record events. Your feed is ordered by relevance.</p>
        </header>

        <div className="community-layout">
          <div>
            <PostForm onCreate={() => setRefresh(r => r + 1)} />
            <div style={{ marginTop: 18 }}>
              <PostList refreshTrigger={refresh} />
            </div>
          </div>

          <aside className="card community-aside">
            <h3>Upcoming</h3>
            <p>Events, opportunities, and announcements will appear here.</p>
          </aside>
        </div>
      </motion.main>
    </>
  )
}
