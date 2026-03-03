import { useRef, useEffect, useState, useCallback } from 'react'
import styles from '../styles/VideoPlayer.module.css'

/**
 * VideoPlayer — LinkedIn-style video with:
 * - Auto-pause when scrolled out of view (IntersectionObserver)
 * - Only one video plays at a time (global singleton)
 * - Play/pause overlay
 * - Progress bar
 * - Mute toggle
 * - Duration display
 */

// Global ref: only one video plays at a time across the whole page
let currentlyPlaying = null

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef(null)

  // Set muted as a DOM property, not a JSX prop — React 19 SSR/hydration
  // treats the `muted` attribute on <video> inconsistently, which causes a
  // hydration mismatch that silently removes the component from the tree.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
    }
  }, [muted])

  // ── IntersectionObserver: auto-pause when out of view ──
  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !video.paused) {
          video.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.35 } // pause when <35% visible
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // ── Pause other videos when this one starts ──
  const play = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Pause whichever video was playing globally
    if (currentlyPlaying && currentlyPlaying !== video) {
      currentlyPlaying.pause()
    }

    video.play().then(() => {
      currentlyPlaying = video
      setPlaying(true)
    }).catch(() => {})
  }, [])

  const pause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    setPlaying(false)
    if (currentlyPlaying === video) currentlyPlaying = null
  }, [])

  const togglePlay = useCallback(() => {
    playing ? pause() : play()
  }, [playing, play, pause])

  const toggleMute = useCallback((e) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  // Progress tracking
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setCurrentTime(video.currentTime)
    setProgress((video.currentTime / video.duration) * 100)
  }, [])

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (video) setDuration(video.duration)
  }, [])

  const onEnded = useCallback(() => {
    setPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    if (currentlyPlaying === videoRef.current) currentlyPlaying = null
  }, [])

  // Seek on progress bar click
  const handleSeek = useCallback((e) => {
    e.stopPropagation()
    const video = videoRef.current
    const bar = e.currentTarget
    if (!video || !video.duration) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = pct * video.duration
    setProgress(pct * 100)
    setCurrentTime(video.currentTime)
  }, [])

  // Auto-hide controls when playing
  const showAndAutoHide = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500)
    }
  }, [playing])

  useEffect(() => {
    if (!playing) {
      setShowControls(true)
      clearTimeout(hideTimer.current)
    }
  }, [playing])

  // Cleanup global ref on unmount
  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (currentlyPlaying === video) {
        currentlyPlaying = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={styles.videoContainer}
      onClick={togglePlay}
      onMouseMove={showAndAutoHide}
      onMouseEnter={showAndAutoHide}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className={styles.video}
      />

      {/* Big play button overlay (shown when paused) */}
      {!playing && (
        <div className={styles.playOverlay}>
          <div className={styles.playBtn}>
            <svg viewBox="0 0 24 24" width={48} height={48} fill="#fff">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`${styles.controls} ${showControls ? styles.controlsVisible : ''}`}>
        {/* Progress bar */}
        <div className={styles.progressBar} onClick={handleSeek}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.controlsRow}>
          {/* Play / Pause */}
          <button className={styles.controlBtn} onClick={(e) => { e.stopPropagation(); togglePlay() }} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 24 24" width={20} height={20} fill="#fff">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width={20} height={20} fill="#fff">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>

          {/* Time */}
          <span className={styles.timeLabel}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Spacer */}
          <span style={{ flex: 1 }} />

          {/* Mute toggle */}
          <button className={styles.controlBtn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#fff" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#fff" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
