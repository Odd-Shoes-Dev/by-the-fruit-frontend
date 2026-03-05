import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import InvestorProfileForm from '../../components/InvestorProfileForm'
import BusinessProfileForm from '../../components/BusinessProfileForm'
import FluffyButton from '../../components/FluffyButton'
import styles from '../../styles/Auth.module.css'

export default function Profile() {
    const router = useRouter()
    const [role, setRole] = useState(null)
    const [userId, setUserId] = useState(null)
    const [isDone, setIsDone] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('btf_pending_role')
            const storedUserId = localStorage.getItem('btf_pending_user_id')
            if (storedRole && storedUserId) {
                setRole(storedRole)
                setUserId(storedUserId)
            } else {
                // Not supposed to be here
                router.push('/')
            }
        }
    }, [router])

    const handleProfileComplete = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('btf_pending_role')
            localStorage.removeItem('btf_pending_user_id')
            localStorage.removeItem('btf_pending_token')
        }
        setIsDone(true)
    }

    if (!role || !userId) {
        return <div className={styles.authPage}>Loading...</div>
    }

    const roleLabel = role === 'founder' ? 'Founder' : 'Investor'

    return (
        <>
            <Head>
                <title>Complete your {roleLabel} profile — By The Fruit</title>
            </Head>
            <div className={styles.authPage}>
                <motion.div
                    className={`${styles.authCard} ${styles.authCardWide}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <Link href="/" className={styles.authLogo}>
                        <Image src="/images/logo.png" alt="By The Fruit" width={44} height={44} />
                        <span style={{ fontStyle: 'italic' }}><span style={{ fontSize: '1.2em' }}>B</span>y <span style={{ fontSize: '1.2em' }}>T</span>he <span style={{ fontSize: '1.2em' }}>F</span>ruit</span>
                    </Link>

                    {isDone ? (
                        <div className={styles.successBox}>
                            <h1 className={styles.authTitle}>You're on the waitlist!</h1>
                            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: 16, marginTop: 16 }}>
                                We review each request to keep the community trusted. We may contact you by email before approving. Once approved, you can log in and access the full app.
                            </p>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24, alignItems: 'center' }}>
                                <FluffyButton href="/login" label="Check your status" width={190} height={44} strands={1000} strandLen={7} fontSize={14} color="#F5A623" color2="#F57C00" />
                                <Link href="/" className={styles.authLink} style={{ alignSelf: 'center' }}>
                                    Back to home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className={styles.authTitle}>Complete your {roleLabel} Profile</h1>
                            <p className={styles.authSub}>Tell us a bit more about yourself to help build the community.</p>

                            <div style={{ marginTop: 24 }}>
                                {role === 'investor' && <InvestorProfileForm initial={{ user: parseInt(userId, 10) }} onSave={handleProfileComplete} />}
                                {role === 'founder' && <BusinessProfileForm initial={{ user: parseInt(userId, 10) }} onSave={handleProfileComplete} />}
                            </div>
                        </>
                    )}

                </motion.div>
            </div>
            <div className={styles.authPageBar}>
                <span>© {new Date().getFullYear()} By The Fruit</span>
                <Link href="/">Home</Link>
            </div>
        </>
    )
}
