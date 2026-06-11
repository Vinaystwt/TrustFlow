const TITLE = '#E2E8F0'
const SUB = '#94A3B8'

const INPUTS = [
  { label: 'Completed agreements', color: '#3B82F6' },
  { label: 'Transaction volume', color: '#3B82F6' },
  { label: 'QIE Pass verified', color: '#10B981' },
  { label: 'Disputes (penalty)', color: '#EF4444' },
]

const TIERS = [
  { name: 'Newcomer', t: 'Tier 0', benefit: 'Escrow-only', color: '#64748B' },
  { name: 'Verified', t: 'Tier 1', benefit: '48h dispute', color: '#3B82F6' },
  { name: 'Trusted', t: 'Tier 2', benefit: '24h, priority', color: '#10B981' },
  { name: 'Elite', t: 'Tier 3', benefit: 'Instant + advances', color: '#F59E0B' },
]

export function TrustScoreSystem() {
  return (
    <svg
      viewBox="0 0 720 460"
      className="h-auto w-full"
      role="img"
      aria-label="Trust score system diagram"
    >
      <defs>
        <marker id="arrow-ts" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94A3B8" />
        </marker>
      </defs>

      {/* Inputs */}
      {INPUTS.map((inp, i) => {
        const y = 24 + i * 58
        return (
          <g key={inp.label}>
            <rect x={20} y={y} width={210} height={44} rx={9} fill={`${inp.color}1F`} stroke={`${inp.color}80`} strokeWidth={0.5} />
            <circle cx={42} cy={y + 22} r={4.5} fill={inp.color} />
            <text x={56} y={y + 27} fill={TITLE} fontSize="12" fontWeight="600" fontFamily="var(--font-display)">
              {inp.label}
            </text>
            <line x1={230} y1={y + 22} x2={300} y2={156} stroke="#94A3B8" strokeWidth={1} markerEnd="url(#arrow-ts)" opacity={0.6} />
          </g>
        )
      })}

      {/* Formula box (center) */}
      <rect x={300} y={120} width={170} height={84} rx={12} fill="rgba(83,74,183,0.2)" stroke="rgba(83,74,183,0.7)" strokeWidth={0.5} />
      <text x={385} y={155} textAnchor="middle" fill={TITLE} fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
        Trust score
      </text>
      <text x={385} y={174} textAnchor="middle" fill={TITLE} fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
        formula
      </text>

      {/* arrow to output */}
      <line x1={470} y1={162} x2={540} y2={162} stroke="#94A3B8" strokeWidth={1.2} markerEnd="url(#arrow-ts)" />

      {/* Output */}
      <rect x={542} y={126} width={158} height={72} rx={12} fill="rgba(245,158,11,0.18)" stroke="rgba(245,158,11,0.7)" strokeWidth={0.5} />
      <text x={621} y={158} textAnchor="middle" fill="#F59E0B" fontSize="22" fontWeight="800" fontFamily="var(--font-display)">
        0 – 1000
      </text>
      <text x={621} y={180} textAnchor="middle" fill={SUB} fontSize="11" fontFamily="var(--font-body)">
        Trust Score
      </text>

      {/* Tier progression */}
      <text x={20} y={282} fill={SUB} fontSize="12" fontWeight="600" fontFamily="var(--font-display)">
        Tier progression
      </text>
      {TIERS.map((tier, i) => {
        const x = 20 + i * 178
        return (
          <g key={tier.name}>
            <rect x={x} y={300} width={150} height={92} rx={11} fill={`${tier.color}1F`} stroke={`${tier.color}80`} strokeWidth={0.5} />
            <text x={x + 16} y={328} fill={SUB} fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">
              {tier.t}
            </text>
            <text x={x + 16} y={350} fill={TITLE} fontSize="15" fontWeight="700" fontFamily="var(--font-display)">
              {tier.name}
            </text>
            <text x={x + 16} y={374} fill={tier.color} fontSize="11" fontFamily="var(--font-body)">
              {tier.benefit}
            </text>
            {i < TIERS.length - 1 && (
              <line x1={x + 150} y1={346} x2={x + 178} y2={346} stroke="#94A3B8" strokeWidth={1.2} markerEnd="url(#arrow-ts)" />
            )}
          </g>
        )
      })}
    </svg>
  )
}
