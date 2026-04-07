// Redirects to /orchard — merged into main Orchard page.
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function MyOrchardRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/orchard') }, [router])
  return null
}

  async function load() {
    setLoading(true)
    try {
      const [walletRes, subRes, histRes, allTimeRes] = await Promise.all([
        apiFetch('/seeds/wallet/me/'),
        apiFetch('/seeds/subscription/me/'),
        apiFetch('/seeds/allocations/my-history/'),
        apiFetch('/seeds/allocations/all-time/'),
      ])
      if (walletRes.ok) setWallet(await walletRes.json())
      if (subRes.ok) setSubscription(await subRes.json())
      if (histRes.ok) setHistory(unwrap(await histRes.json()))
      if (allTimeRes.ok) setAllTime(unwrap(await allTimeRes.json()))
    } catch (e) {}
    setLoading(false)
  }

  function unwrap(json) {
    const r = json?.data ?? json
    return Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : []
  }

  async function handleDeallocate(projectId) {
    try {
      const res = await apiFetch('/seeds/allocations/deallocate/', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId }),
      })
      const data = await res.json()
      if (res.ok) {
        setWallet(prev => prev ? { ...prev, balance: data.new_balance } : prev)
        setHistory(prev => prev.filter(a => a.project !== projectId))
        load()
      }
    } catch (e) {}
  }

  function daysUntilReset() {
    if (!wallet?.next_reset) return null
    const diff = new Date(wallet.next_reset) - new Date()
    const days = Math.ceil(diff / 86400000)
    return days > 0 ? days : 0
  }

  const hasAccess = isAdmin() || (!!subscription)
  const totalAllocated = history.reduce((sum, a) => sum + a.amount, 0)
  const projectsSupported = history.length

  if (loading) return (
    <div className={styles.loading}>Loading your Orchard…</div>
  )

  return (
    <>
      <Head>
        <title>My Orchard — By The Fruit</title>
      </Head>

      <div className={styles.page}>
        <div className={styles.hero}>
          <p className={styles.heroEyebrow}>My Membership</p>
          <h1 className={styles.heroTitle}><SeedSymbol size={32} /> My Orchard</h1>
          <p className={styles.heroSubtitle}>
            Your seed wallet, supported projects, and allocation history.
          </p>
        </div>

        <div className={styles.container} style={{ paddingTop: '1.75rem' }}>

          {/* Level-up nudge for community tier */}
          {subscription && subscription.tier === 'community' && (
            <div className={styles.upgradeBanner}>
              <p className={styles.upgradeTitle}>Want more seeds?</p>
              <p className={styles.upgradeSub}>
                You have 250 seeds this month as a Community member. Patron, Advocate, and Champion members get more.
              </p>
              <div className={styles.tierRow}>
                {[
                  { name: 'Patron', seeds: '1,000' },
                  { name: 'Advocate', seeds: '2,500' },
                  { name: 'Champion', seeds: '5,000' },
                ].map(t => (
                  <div key={t.name} className={styles.tierCard}>
                    <span className={styles.tierName}>{t.name}</span>
                    <span className={styles.tierSeeds}><SeedSymbol size={11} /> {t.seeds}</span>
                    <span className={styles.tierSeedsUnit}>/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet card */}
          {subscription && wallet && (
            <motion.div
              className={styles.walletCard}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.walletRow}>
                <div className={styles.walletLeft}>
                  <div className={styles.walletLabel}>Seed Balance</div>
                  <div className={styles.walletBalance}>
                    <SeedSymbol size={38} />
                    {(wallet.balance || 0).toLocaleString()}
                  </div>
                  <span className={styles.walletUnit}>seeds remaining</span>
                  <span className={styles.walletTier}>{subscription?.tier} member</span>
                </div>
                <div className={styles.walletRight}>
                  {daysUntilReset() !== null && (
                    <>
                      <div className={styles.walletCycleLabel}>Monthly reset in</div>
                      <div className={styles.walletCountdown}>{daysUntilReset()} days</div>
                      <div className={styles.walletCountdownSub}>Unused seeds expire</div>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.walletStats}>
                <div className={styles.walletStat}>
                  <div className={styles.walletStatNum}>{(wallet.seeds_this_cycle || 0).toLocaleString()}</div>
                  <div className={styles.walletStatLabel}>Issued this cycle</div>
                </div>
                <div className={styles.walletStat}>
                  <div className={styles.walletStatNum}>{totalAllocated.toLocaleString()}</div>
                  <div className={styles.walletStatLabel}>Allocated this cycle</div>
                </div>
                <div className={styles.walletStat}>
                  <div className={styles.walletStatNum}>{projectsSupported}</div>
                  <div className={styles.walletStatLabel}>Projects supported</div>
                </div>
              </div>
            </motion.div>
          )}

          <div className={styles.dashGrid}>
            {/* This cycle's allocations */}
            <div className={styles.dashCard}>
              <h3 className={styles.dashCardTitle}><SeedSymbol size={15} /> This Month's Allocations</h3>
              {history.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🌱</div>
                  <p className={styles.emptyText}>
                    No allocations yet.{' '}
                    <Link href="/orchard" style={{ color: '#4caf50' }}>Explore The Orchard →</Link>
                  </p>
                </div>
              ) : (
                history.map(a => (
                  <div key={a.id} className={styles.allocationItem}>
                    <div>
                      <div className={styles.allocationProjectName}>
                        <Link href={`/orchard/${a.project}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {a.project_detail?.title || `Project #${a.project}`}
                        </Link>
                      </div>
                      <div className={styles.allocationStage}>
                        {STAGE_LABELS[a.project_detail?.stage] || ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={styles.allocationAmount}>
                        <SeedSymbol size={12} /> {a.amount.toLocaleString()}
                      </span>
                      {subscription && (
                        <button
                          onClick={() => handleDeallocate(a.project)}
                          title="Remove allocation"
                          style={{
                            background: 'none', border: 'none',
                            color: '#c9a0a0', cursor: 'pointer', fontSize: '0.8rem',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* All-time summary */}
            <div className={styles.dashCard}>
              <h3 className={styles.dashCardTitle}>📊 All-Time Impact</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2d6a2d' }}>
                    {allTime.reduce((s, a) => s + a.amount, 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8aaa8a' }}>Total seeds planted across all projects</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4caf50' }}>
                    {new Set(allTime.map(a => a.project)).size}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8aaa8a' }}>Unique projects supported</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', color: '#8aaa8a', lineHeight: 1.5, margin: 0 }}>
                    Seeds have no monetary value and do not represent equity or ownership.
                    This is a cultural participation record only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA to orchard */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/orchard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.75rem 1.75rem',
              background: 'linear-gradient(135deg,#2d6a2d,#4caf50)',
              color: '#fff', borderRadius: '100px',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
            }}>
              <SeedSymbol size={16} /> Explore The Orchard
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {allocateTarget && (
          <SeedAllocateModal
            project={allocateTarget}
            wallet={wallet}
            onClose={() => setAllocateTarget(null)}
            onSuccess={({ new_balance }) => {
              setWallet(prev => prev ? { ...prev, balance: new_balance } : prev)
              load()
              setAllocateTarget(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
