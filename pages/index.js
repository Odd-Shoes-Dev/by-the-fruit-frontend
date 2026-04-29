import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState('founder')
  const [submitting, setSubmitting]     = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')
  const [submitted, setSubmitted]       = useState(false)

  const capitalSectionRef = useRef(null)
  const parallaxImgRef    = useRef(null)

  const roleConfig = {
    founder:  { label: 'What are you building?',                                       placeholder: '1-2 sentences' },
    investor: { label: 'What kinds of companies do you want to back?',                 placeholder: '1-2 sentences' },
    creator:  { label: 'What kind of content do you make and who do you make it for?', placeholder: '1-2 sentences' },
  }

  useEffect(() => {
    const capitalSection = capitalSectionRef.current
    const parallaxImg    = parallaxImgRef.current
    const desktopMQ      = window.matchMedia('(min-width: 1101px)')
    let currentOffset  = 0
    let targetOffset   = 0
    let parallaxActive = false
    let rafId          = null

    function getTargetOffset() {
      if (!capitalSection) return 0
      const rect     = capitalSection.getBoundingClientRect()
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      return (Math.max(0, Math.min(1, progress)) - 0.5) * 200
    }

    function parallaxLoop() {
      targetOffset   = getTargetOffset()
      const delta    = targetOffset - currentOffset
      currentOffset += delta * 0.06
      if (parallaxImg) parallaxImg.style.transform = `translateY(${currentOffset.toFixed(2)}px)`
      rafId = Math.abs(delta) > 0.05 ? requestAnimationFrame(parallaxLoop) : (parallaxActive = false, null)
    }

    function startParallax() {
      if (!parallaxActive && parallaxImg) { parallaxActive = true; rafId = requestAnimationFrame(parallaxLoop) }
    }

    function clearParallax() {
      if (rafId) cancelAnimationFrame(rafId)
      parallaxActive = false
      if (parallaxImg) parallaxImg.style.transform = ''
      currentOffset = 0
    }

    const onMQChange = e => e.matches ? startParallax() : clearParallax()
    const onScroll   = () => { if (desktopMQ.matches) startParallax() }
    const onResize   = () => { targetOffset = getTargetOffset() }

    desktopMQ.addEventListener('change', onMQChange)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    if (desktopMQ.matches) startParallax()

    return () => {
      desktopMQ.removeEventListener('change', onMQChange)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const delay = parseInt(entry.target.style.transitionDelay) || 0
        setTimeout(() => entry.target.classList.add('visible'), delay)
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    const email = e.target.email.value.trim()
    const about = e.target.about.value.trim()
    if (!email) { setErrorMsg('Please enter your email address.'); return }
    setSubmitting(true)
    try {
      const res  = await fetch(`${BACKEND_URL}/user/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, intended_role: selectedRole, building_description: about }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSubmitted(true)
      } else {
        const raw = data?.data || data
        const allErrText = [
          raw?.email?.[0] || '',
          ...(Array.isArray(raw?.errors) ? raw.errors : []),
        ].join(' ').toLowerCase()
        setErrorMsg(
          allErrText.includes('already exists')
            ? "You're already on the list — check your inbox."
            : (raw?.message || raw?.detail || raw?.errors?.[0] || 'Something went wrong. Please try again.')
        )
      }
    } catch (_) {
      setErrorMsg('Could not reach the server. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>By the Fruit</title>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <meta name="description" content="" />
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content="By the Fruit" />
        <meta property="og:description" content="" />
        <meta property="og:url"         content="https://www.bythefruit.com" />
        <meta property="og:image"       content="https://www.bythefruit.com/images/OG-image.png" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="By the Fruit" />
        <meta name="twitter:description" content="" />
        <meta name="twitter:image"       content="https://www.bythefruit.com/images/OG-image.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        .btf-page *, .btf-page *::before, .btf-page *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }
        .btf-page {
          background: #fff;
          color: #3a3a34;
          font-family: 'IBM Plex Mono', monospace;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          overflow-x: hidden;
        }
        :root {
          --color-dark:       #1c1f1d;
          --color-olive:      #2e2e28;
          --color-green:      #0e513a;
          --color-green-pale: #e8f6e7;
          --color-text:       #3a3a34;
        }
        .hero {
          position: relative; width: 100%; height: 1029px;
          overflow: hidden;
          background: linear-gradient(to bottom, #fcfffa 67%, #e8f6e6);
        }
        .hero-lines { position: absolute; right: 0; top: 0; width: 804px; height: 100%; pointer-events: none; }
        .hero-lines img { width: 100%; height: 100%; object-fit: fill; }
        .hero-tree { position: absolute; right: 0; top: 80px; width: 720px; pointer-events: none; opacity: 0.2; }
        .hero-tree img { width: 100%; height: auto; display: block; }
        .hero-art-main { position: absolute; left: calc(50% + 222px); top: 240px; width: 407px; height: 543px; overflow: hidden; }
        .hero-art-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-frame { position: absolute; }
        .hero-frame img { width: 100%; height: 100%; display: block; }
        .hero-frame-1 { right: 64px; top: 181px; width: 130px; height: 178px; }
        .hero-frame-2 { left: calc(50% + 188px); top: 667px; width: 176px; height: 247px; }
        .hero-frame-3 { right: 56px; top: 756px; width: 123px; height: 153px; }
        .hero-planet { position: absolute; }
        .hero-planet img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-apple { left: calc(50% + 128px); top: 201px; width: 105px; height: 101px; }
        .hero-watermelon { left: calc(50% + 520px); top: 380px; width: 150px; height: 150px; }
        .nav {
          position: absolute; top: 0; left: 0; right: 0; padding: 32px 64px;
          display: flex; align-items: center; justify-content: space-between;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 20;
        }
        .nav-brand { display: flex; align-items: center; text-decoration: none; }
        .nav-brand-logo { display: block; height: 31px; width: auto; }
        .btn-dark {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--color-dark); color: #f7f8f8;
          font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 16px;
          line-height: 1.2; letter-spacing: -0.48px; padding: 12px 24px; border-radius: 40px;
          border: none; cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: opacity 0.2s, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-dark:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-dark img { width: 16px; height: 16px; display: block; flex-shrink: 0; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .btn-dark:hover img { transform: translateX(3px); }
        .hero-content { position: absolute; left: 64px; top: 248px; width: 540px; display: flex; flex-direction: column; gap: 32px; z-index: 10; }
        .hero-headline { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 80px; line-height: 1; letter-spacing: -2.4px; color: var(--color-olive); font-style: normal; }
        .hero-headline em { font-style: italic; }
        .hero-sub { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: var(--color-olive); }
        .hero-note { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: #6e906a; }
        .hero-ctas { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .capital-section {
          position: relative; width: 100%; height: 1103px; padding: 64px 64px 120px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          overflow: hidden; background: #eff5f2;
        }
        .capital-bg { position: absolute; inset: 0; pointer-events: none; }
        .capital-bg img.landscape { position: absolute; left: 0; right: 0; top: -15%; width: 100%; height: 130%; object-fit: cover; will-change: transform; }
        .capital-bg .overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(to right,  var(--color-green-pale) 20%, rgba(232,246,231,0) 55%),
            linear-gradient(to bottom, var(--color-green-pale)  5%, rgba(232,246,231,0) 28%),
            linear-gradient(165.42deg, var(--color-green-pale) 38.61%, rgba(239,245,242,0.1) 89.9%);
        }
        .capital-quotes { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 101px; padding: 120px 20px 0; }
        .capital-quote-1, .capital-quote-2 { display: flex; flex-direction: column; gap: 24px; align-items: center; width: 100%; }
        .capital-body { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 64px; line-height: 1.2; letter-spacing: -1.92px; color: var(--color-olive); width: 100%; text-align: center; }
        .capital-accent { font-family: 'Instrument Serif', serif; font-style: normal; font-size: 120px; line-height: 1; letter-spacing: -3.6px; color: var(--color-green); white-space: nowrap; text-align: center; }
        .model-section { width: 100%; min-height: 804px; background: #f9f6f6; padding: 200px 0; display: flex; align-items: center; justify-content: center; position: relative; }
        .model-inner { display: flex; align-items: flex-start; width: 100%; color: var(--color-olive); }
        .model-label { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 72px; line-height: 1.09; flex: 0 0 50%; box-sizing: border-box; padding-left: 80px; color: var(--color-olive); }
        .model-body { font-family: 'Instrument Serif', serif; font-style: normal; font-size: 32px; line-height: 1.5; flex: 0 0 50%; box-sizing: border-box; padding-right: 80px; color: var(--color-olive); }
        .model-body p + p { margin-top: 1em; }
        .cards-section { position: relative; width: 100%; height: 1151px; background: var(--color-dark); border-radius: 64px; overflow: hidden; }
        .cards-title { position: absolute; left: 0; right: 0; top: 167px; font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: 54px; line-height: 1.09; color: #e8f6e6; text-align: center; }
        .cards-lines { position: absolute; left: 197px; top: 167px; width: 1046px; height: 944px; pointer-events: none; opacity: 0.4; }
        .cards-lines img { width: 100%; height: 100%; object-fit: fill; }
        .card { position: absolute; width: 312px; border: 1px solid #e4f3ee; border-radius: 12px; padding: 32px; display: flex; flex-direction: column; gap: 16px; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.18); }
        .card-founders { left: calc(50% - 492px); top: 367px; background: linear-gradient(to bottom, var(--color-green-pale) 65.9%, #ffd580 100%); }
        .card-investors { left: calc(50% - 156px); top: 473px; background: linear-gradient(180deg, var(--color-green-pale) 65.9%, #ffc4f6 100%); }
        .card-creators  { left: calc(50% + 180px); top: 560px; background: linear-gradient(180deg, var(--color-green-pale) 65.9%, #d7ff91 100%); }
        .card-heading { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 36px; line-height: 1.2; color: #000; }
        .card-body { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: var(--color-text); }
        .card-link { display: inline-flex; align-items: center; gap: 10px; padding: 4px 0; border-bottom: 1px solid #000; text-decoration: none; width: fit-content; transition: gap 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .card-link:hover { gap: 16px; }
        .card-link span { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 16px; line-height: 1.2; letter-spacing: -0.48px; color: #000; white-space: nowrap; }
        .card-link img { width: 16px; height: 16px; display: block; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .card-link:hover img { transform: translateX(4px); }
        .waitlist-section { width: 100%; padding: 150px 64px 150px; display: flex; flex-direction: column; align-items: center; gap: 62px; background: linear-gradient(to bottom, #fff 0%, var(--color-green-pale) 100%); overflow: hidden; }
        .waitlist-heading-block { display: flex; flex-direction: column; gap: 24px; text-align: center; align-items: center; }
        .waitlist-heading { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-size: 54px; line-height: 1.09; color: var(--color-olive); text-align: center; }
        .waitlist-sub { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: var(--color-text); }
        .waitlist-card {
          width: 688px; background: rgba(255,255,255,0.85);
          backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
          border: 1px solid #e4f3ee; border-radius: 32px; padding: 32px;
          display: flex; flex-direction: column; gap: 62px; align-items: center;
          box-shadow: 0px 19px 42px rgba(0,0,0,0.10), 0px 76px 76px rgba(0,0,0,0.09), 0px 170px 102px rgba(0,0,0,0.05), 0px 303px 121px rgba(0,0,0,0.01);
        }
        .waitlist-form-fields { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .role-selector-block { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .iam-label { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: #000; }
        .role-selector { display: flex; gap: 16px; align-items: center; }
        .role-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 32px; border: 1px solid #cacaca; background: transparent; font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: #000; cursor: pointer; white-space: nowrap; transition: background 0.2s, border-color 0.2s, color 0.2s; }
        .role-btn.active { background: var(--color-dark); border-color: #116740; color: #fff; }
        .form-fields { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .field-group { display: flex; flex-direction: column; gap: 10px; }
        .field-label { font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; color: #000; }
        .field-input, .field-textarea { border: 1px solid #cacaca; border-radius: 32px; padding: 10px 16px; background: transparent; color: #000; font-family: 'IBM Plex Mono', monospace; font-size: 16px; line-height: 1.5; letter-spacing: -0.48px; width: 100%; outline: none; transition: border-color 0.2s; }
        .field-input::placeholder, .field-textarea::placeholder { color: #b4b4b4; }
        .field-input:focus, .field-textarea:focus { border-color: var(--color-dark); }
        .field-textarea { height: 129px; resize: vertical; border-radius: 24px; }
        .sections { display: flex; flex-direction: column; align-items: flex-end; width: 100%; }
        .site-footer { width: 100%; padding: 32px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-weight: 400; font-size: 13px; letter-spacing: 0.08em; color: #888; background: var(--color-green-pale); }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .hero-apple      { animation: float 4.2s ease-in-out infinite; }
        .hero-watermelon { animation: float 5.1s ease-in-out 0.9s infinite; }
        .hero-frame-1    { animation: float 4.8s ease-in-out 0.4s infinite; }
        .hero-frame-2    { animation: float 5.4s ease-in-out 1.3s infinite; }
        .hero-frame-3    { animation: float 4.5s ease-in-out 0.7s infinite; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        @media (max-width: 1250px) {
          .cards-section { height: auto; padding: 80px 44px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .cards-lines { display: none; }
          .cards-title { position: static; transform: none; left: auto; right: auto; white-space: normal; width: 100%; text-align: center; margin-bottom: 8px; }
          .card { position: static; width: 100%; max-width: 480px; }
        }
        @media (max-width: 1100px) {
          .hero { height: auto; min-height: 1500px; background: linear-gradient(to bottom, #fcfffa 80%, #e8f6e6); }
          .hero-content { position: static; width: auto; padding: 140px 40px 60px; align-items: center; text-align: center; }
          .hero-headline { font-size: 64px; text-align: center; }
          .hero-sub, .hero-note { text-align: center; }
          .hero-ctas { flex-direction: column; align-items: center; width: 100%; }
          .hero-tree { right: auto; left: calc(50% - 40px); transform: translateX(-50%); top: 547px; width: min(720px, 100vw); }
          .hero-lines { display: block; left: calc(50% - 40px); transform: translateX(-50%); right: auto; top: 297px; width: 680px; height: 1340px; }
          .hero-art-main { display: block; left: 50%; transform: translateX(-50%); top: 660px; width: 403px; height: 537px; }
          .hero-frame-1 { display: block; left: calc(50% + 170px); top: 640px; width: 122px; height: 148px; }
          .hero-frame-2 { display: block; left: calc(50% - 320px); top: 1050px; width: 210px; height: 257px; }
          .hero-frame-3 { display: block; left: calc(50% + 140px); top: 1120px; width: 174px; height: 213px; }
          .hero-apple { display: block; left: calc(50% - 200px); top: 750px; width: 84px; height: 81px; }
          .hero-watermelon { display: block; left: calc(50% + 100px); top: 820px; width: 158px; height: 109px; }
          .capital-section { height: auto; padding: 80px 40px 100px; }
          .capital-quotes { padding: 0 20px; }
          .capital-body { font-size: 48px; }
          .capital-accent { font-size: 80px; }
          .model-section { min-height: auto; padding: 80px 40px; }
          .model-inner { flex-direction: column; gap: 40px; }
          .model-label { flex: none; padding-left: 0; }
          .model-body { flex: none; padding-right: 0; width: 60vw; font-size: 24px; }
          .waitlist-section { padding: 80px 24px 80px; }
          .waitlist-card { width: 100%; }
          .role-selector { flex-wrap: wrap; }
          .role-btn { flex: 0 0 auto; }
        }
        @media (max-width: 480px) {
          .nav { padding: 32px 19px; }
          .hero-tree { top: 647px; width: 504px; }
          .hero { min-height: 1382px; }
          .hero-lines { display: block; left: 50%; transform: translateX(-50%); top: 397px; right: auto; width: 520px; height: 1028px; }
          .hero-art-main { display: block; left: 50%; transform: translateX(-50%); top: 704px; width: 442px; height: 590px; }
          .hero-frame-1, .hero-frame-2, .hero-frame-3, .hero-apple, .hero-watermelon { display: none; }
          .hero-content { padding: 120px 35px 60px; align-items: center; text-align: center; }
          .hero-headline { font-size: 54px; line-height: 66px; letter-spacing: -1.62px; text-align: center; }
          .hero-sub, .hero-note { text-align: center; }
          .hero-ctas { flex-direction: column; align-items: center; width: 100%; }
          .capital-section { padding: 64px 24px 120px; align-items: center; }
          .capital-quotes { padding: 0; width: 100%; }
          .capital-quote-1, .capital-quote-2 { align-items: center; gap: 16px; }
          .capital-body { font-size: 44px; letter-spacing: -1.32px; text-align: center; }
          .capital-accent { font-size: 64px; letter-spacing: -1.92px; }
          .capital-quote-1 .capital-accent { text-align: left; }
          .capital-quote-2 .capital-accent { text-align: right; }
          .model-section { padding: 96px 24px; }
          .model-inner { gap: 48px; }
          .model-label { font-size: 48px; padding-left: 0; }
          .model-body { width: 100%; font-size: 32px; padding-right: 0; }
          .cards-section { padding: 96px 45px; gap: 32px; }
          .cards-title { font-size: 48px; margin-bottom: 32px; }
          .card { max-width: 312px; width: 312px; }
          .waitlist-section { padding: 150px 24px 80px; }
          .waitlist-heading { font-size: 48px; }
          .waitlist-card { width: 100%; max-width: 100%; gap: 48px; padding: 32px 24px; }
          .role-selector { gap: 8px; flex-wrap: wrap; }
          .role-btn { flex: 0 0 auto; padding: 10px 20px; }
        }
        @media (max-width: 390px) {
          .hero-frame-1 { left: 305px; }
          .hero-frame-3 { left: 288px; }
        }
      `}</style>

      <div className="btf-page">

        {/* ═══════════════════ HERO ═══════════════════════ */}
        <div className="hero">
          <div className="hero-lines" aria-hidden="true">
            <img src="/images/Lines-hero.svg" alt="" />
          </div>
          <div className="hero-tree" aria-hidden="true">
            <img src="/images/hero-tree-background.png" alt="" width="1256" height="1180" />
          </div>
          <nav className="nav">
            <a className="nav-brand" href="#">
              <img className="nav-brand-logo" src="/images/Logo-full.svg" alt="By the Fruit" width="130" height="31" />
            </a>
            <a className="btn-dark" href="#waitlist">Waitlist now</a>
          </nav>
          <div className="hero-content">
            <h1 className="hero-headline">THE FRONT DOOR TO <em>conviction</em> CAPITAL</h1>
            <p className="hero-sub">We&apos;re matching founders with aligned investors and creators.</p>
            <p className="hero-note">*Our waitlist is open.</p>
            <div className="hero-ctas">
              <a className="btn-dark" href="#waitlist">
                I&apos;m a founder
                <img src="/images/arrow-right-white.svg" alt="" width="16" height="16" />
              </a>
              <a className="btn-dark" href="#waitlist">
                I&apos;m an investor
                <img src="/images/arrow-right-white.svg" alt="" width="16" height="16" />
              </a>
            </div>
          </div>
          <div className="hero-frame hero-frame-1" aria-hidden="true">
            <img src="/images/hero-1.png" alt="" />
          </div>
          <div className="hero-art-main" aria-hidden="true">
            <img src="/images/Hero-main-3.png" alt="" width="620" height="777" />
          </div>
          <div className="hero-frame hero-frame-2" aria-hidden="true">
            <img src="/images/hero-2.png" alt="" />
          </div>
          <div className="hero-frame hero-frame-3" aria-hidden="true">
            <img src="/images/hero-3.png" alt="" />
          </div>
          <div className="hero-planet hero-apple" aria-hidden="true">
            <img src="/images/hero-apple.png" alt="" />
          </div>
          <div className="hero-planet hero-watermelon" aria-hidden="true">
            <img src="/images/hero-watermelon.png" alt="" />
          </div>
        </div>

        {/* ═══════════════════ SECTIONS ═══════════════════ */}
        <div className="sections">

          {/* Capital / Conviction */}
          <section className="capital-section" ref={capitalSectionRef}>
            <div className="capital-bg" aria-hidden="true">
              <img className="landscape" ref={parallaxImgRef} src="/images/section2-parallax.png" alt="" width="2880" height="2924" loading="lazy" />
              <div className="overlay"></div>
            </div>
            <div className="capital-quotes reveal">
              <div className="capital-quote-1">
                <p className="capital-body">Capital without conviction is just</p>
                <p className="capital-accent">MONEY</p>
              </div>
              <div className="capital-quote-2">
                <p className="capital-body">Conviction without capital is just a</p>
                <p className="capital-accent">DREAM</p>
              </div>
            </div>
          </section>

          {/* Our Model */}
          <section className="model-section">
            <div className="model-inner reveal">
              <p className="model-label">our model</p>
              <div className="model-body">
                <p>We&apos;re not starting another fund nor a firm. We&apos;re creating the front door to connect founders, investors, and content creators.</p>
                <p>Founders can get discovered and be heard. Investors can come in at smaller minimum check sizes. Creators can get a seat at the table from the beginning.</p>
                <p>We&apos;re changing how venture works. Join us.</p>
              </div>
            </div>
          </section>

          {/* Who We Serve */}
          <section className="cards-section">
            <div className="cards-lines" aria-hidden="true">
              <img src="/images/Lines-2.svg" alt="" loading="lazy" />
            </div>
            <p className="cards-title reveal">WHO WE SERVE</p>
            <div className="card card-founders reveal" style={{ transitionDelay: '0ms' }}>
              <p className="card-heading"><em>for</em> <em>Founders</em></p>
              <p className="card-body">Founders of mission-driven, faith-adjacent, or redemptive media companies who struggle to find capital from investors who share their values. By The Fruit offers them a front door into venture-style relationships without requiring them to fit the conventional VC mold.</p>
              <a className="card-link" href="#waitlist">
                <span>Waitlist as a founder</span>
                <img src="/images/arrow-right-black.svg" alt="" width="16" height="16" loading="lazy" />
              </a>
            </div>
            <div className="card card-investors reveal" style={{ transitionDelay: '100ms' }}>
              <p className="card-heading"><em>for</em> <em>Investors &amp; Donors</em></p>
              <p className="card-body">Individuals who want to put capital to work in companies they believe in either through investment or donation depending on the structure. Traditional VC excludes many through large minimum check sizes. We lower the barrier.</p>
              <a className="card-link" href="#waitlist">
                <span>Waitlist to invest</span>
                <img src="/images/arrow-right-black.svg" alt="" width="16" height="16" loading="lazy" />
              </a>
            </div>
            <div className="card card-creators reveal" style={{ transitionDelay: '200ms' }}>
              <p className="card-heading"><em>for</em> <em>Creators</em></p>
              <p className="card-body">An emerging and underserved participant in the venture ecosystem. Creators can help early-stage companies solve traction and distribution problems before they become fatal. We see creators as strategic partners.</p>
              <a className="card-link" href="#waitlist">
                <span>Waitlist to partner</span>
                <img src="/images/arrow-right-black.svg" alt="" width="16" height="16" loading="lazy" />
              </a>
            </div>
          </section>

          {/* Waitlist form */}
          <section className="waitlist-section" id="waitlist">
            <div className="waitlist-heading-block reveal">
              <h2 className="waitlist-heading">WAITLIST NOW</h2>
              <p className="waitlist-sub">Waitlist for early access to the platform.</p>
            </div>

            {submitted ? (
              <div className="waitlist-card reveal" style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: '36px', color: '#2e2e28', lineHeight: '1.2' }}>
                  You&apos;re on the list.
                </p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '15px', color: '#6e906a', lineHeight: '1.6' }}>
                  Check your inbox &mdash; we&apos;ve sent you a confirmation.<br />
                  We&apos;ll be in touch when the platform opens.
                </p>
              </div>
            ) : (
              <form className="waitlist-card reveal" id="waitlist-form" noValidate onSubmit={handleSubmit}>
                <div className="waitlist-form-fields">
                  <div className="role-selector-block">
                    <p className="iam-label">I am a...</p>
                    <div className="role-selector">
                      {['founder', 'investor', 'creator'].map(role => (
                        <button
                          key={role}
                          type="button"
                          className={'role-btn' + (selectedRole === role ? ' active' : '')}
                          onClick={() => setSelectedRole(role)}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-fields">
                    <div className="field-group">
                      <label className="field-label" htmlFor="email-input">Email address</label>
                      <input className="field-input" id="email-input" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="about-textarea">{roleConfig[selectedRole].label}</label>
                      <textarea className="field-textarea" id="about-textarea" name="about" placeholder={roleConfig[selectedRole].placeholder}></textarea>
                    </div>
                  </div>
                </div>
                {errorMsg && (
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#c0392b', textAlign: 'center', margin: '-32px 0 0' }}>
                    {errorMsg}
                  </p>
                )}
                <button className="btn-dark" type="submit" disabled={submitting}>
                  <span>{submitting ? 'Sending\u2026' : 'Submit'}</span>
                  <img src="/images/arrow-right-white.svg" alt="" width="16" height="16" />
                </button>
              </form>
            )}
          </section>

        </div>{/* /sections */}

        <footer className="site-footer">By The Fruit 2026</footer>

      </div>{/* /btf-page */}
    </>
  )
}
