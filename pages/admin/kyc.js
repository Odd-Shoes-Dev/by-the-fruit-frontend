import Head from 'next/head'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'
import styles from '../../styles/Admin.module.css'

const SALLY_PORTAL_URL = process.env.NEXT_PUBLIC_SALLY_PORTAL_URL || 'https://auth.sally.co/'

export default function AdminKYCPage() {
  return (
    <>
      <Head><title>KYC Queue — Admin — By The Fruit</title></Head>
      <AdminLayout active="kyc">
        <div className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.pageTitle}>KYC Is Managed in Sally</h1>
            <p className={styles.pageSub}>KYC review and approvals are no longer performed in By The Fruit.</p>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <p style={{ marginBottom: 12 }}>
            Open Sally to review investor verification status and perform KYC decisions.
          </p>
          <a href={SALLY_PORTAL_URL} target="_blank" rel="noreferrer" className="btn btn--orange">
            Open Sally KYC Queue
          </a>
          <p style={{ marginTop: 12 }}>
            <Link href="/admin">Back to Admin Overview</Link>
          </p>
        </div>
      </AdminLayout>
    </>
  )
}
