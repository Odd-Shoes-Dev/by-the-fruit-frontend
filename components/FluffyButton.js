import { useRouter } from 'next/router'
import styles from '../styles/FluffyButton.module.css'

/* ─── Plain button component (fluffy effect removed) ───────────────── */
export default function FluffyButton({
  label,
  color = '#E8601A',
  color2 = null,
  radius = null,
  strands = 2000,
  strandLen = 9,
  width = 200,
  height = 54,
  fontSize = 15,
  href,
  onClick,
  type,            // 'submit' | 'button' | 'reset'
  disabled = false,
  fullWidth = false,
  float = false,
  floatDelay = '0s',
  style = {},
  children,
}) {
  const router = useRouter()

  const handleClick = () => {
    if (disabled) return
    if (href) router.push(href)
    if (onClick) onClick()
  }

  const El = type ? 'button' : 'div'

  return (
    <El
      type={type}
      disabled={type ? disabled : undefined}
      onClick={type ? undefined : handleClick}
      className={[
        styles.fluffyWrap,
        float ? styles.fluffyFloat : '',
        disabled ? styles.fluffyDisabled : '',
      ].join(' ')}
      style={{
        '--float-delay': floatDelay,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: color,
        width: fullWidth ? '100%' : width,
        height: height,
        fontSize: fontSize,
        ...(fullWidth && { display: 'block' }),
        ...style,
      }}
    >
      <div className={styles.flLabel} style={{ opacity: disabled ? 0.5 : 1 }}>
        {children || label}
      </div>
    </El>
  )
}
