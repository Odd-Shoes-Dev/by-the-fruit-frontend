import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Fonts ─────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* ── PWA Manifest ─────────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Theme colour ─────────────────────────────────────── */}
        <meta name="theme-color" content="#4F6BD9" />
        <meta name="msapplication-TileColor" content="#4F6BD9" />
        <meta name="msapplication-TileImage" content="/images/logo.png" />

        {/* ── Favicon / App icons ──────────────────────────────── */}
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="By The Fruit" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="By The Fruit" />

        {/* ── Base SEO (can be overridden per-page via <Head> in each page) */}
        <meta name="author" content="By The Fruit" />
        <meta name="robots" content="noindex, nofollow, nosnippet, noarchive, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="bingbot" content="noindex, nofollow" />

        {/* ── Default OG fallback ───────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="By The Fruit" />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@bythefruit" />
        <meta name="twitter:image" content="/images/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
