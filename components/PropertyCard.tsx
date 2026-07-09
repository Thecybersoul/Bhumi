import { Property } from '@/lib/types'
import styles from './PropertyCard.module.css'

interface Props {
  property: Property
  onClick: () => void
}

const USE_COLORS: Record<string, string> = {
  Township: '#0E3B2E', Villa: '#1F7A6D', Resort: '#2E7D6B',
  Industrial: '#C2974A', Agriculture: '#8A9A5B', 'Land-banking': '#5A6E62'
}

export default function PropertyCard({ property: p, onClick }: Props) {
  const totalCr = (p.extent_acres * p.price_per_acre_cr).toFixed(1)
  const primaryUse = p.use_cases[0] || 'Land'
  const bgColor = USE_COLORS[primaryUse] || '#0E3B2E'

  return (
    <article className={styles.card} onClick={onClick}>
      {/* Thumb */}
      <div className={styles.thumb} style={{ background: `linear-gradient(150deg, ${bgColor}e0, ${bgColor}99), url(${p.img_url}) center/cover` }}>
        <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
        <div className={styles.code}>{p.code}</div>
        {p.featured && <div className={styles.featuredBadge}>Featured</div>}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.zone}>{p.zone} Bengaluru</span>
          <span className={styles.loc}>📍 {p.location}</span>
        </div>

        <h3 className={styles.title}>{p.title}</h3>

        <div className={styles.chips}>
          {p.use_cases.slice(0, 3).map(u => (
            <span key={u} className={styles.useChip}>{u}</span>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statVal}>{p.extent_acres}<small>ac</small></div>
            <div className={styles.statLbl}>Extent</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>₹{p.price_per_acre_cr}<small>Cr</small></div>
            <div className={styles.statLbl}>Per acre</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>₹{totalCr}<small>Cr</small></div>
            <div className={styles.statLbl}>Total value</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>{p.dist_airport_km}<small>km</small></div>
            <div className={styles.statLbl}>To airport</div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.priceType}>{p.price_type}</span>
          <span className={styles.cta}>View details →</span>
        </div>
      </div>
    </article>
  )
}
