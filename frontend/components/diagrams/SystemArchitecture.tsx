const TITLE = '#E2E8F0'
const SUB = '#94A3B8'

function Box({
  x,
  y,
  w,
  h,
  fill,
  stroke,
  rx = 10,
}: {
  x: number
  y: number
  w: number
  h: number
  fill: string
  stroke: string
  rx?: number
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={0.5}
    />
  )
}

export function SystemArchitecture() {
  return (
    <svg
      viewBox="0 0 720 470"
      className="h-auto w-full"
      role="img"
      aria-label="System architecture diagram"
    >
      <defs>
        <marker
          id="arrow-sa"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#94A3B8" />
        </marker>
      </defs>

      {/* Top: user node */}
      <Box x={270} y={16} w={180} h={48} fill="rgba(100,116,139,0.18)" stroke="rgba(100,116,139,0.5)" />
      <text x={360} y={45} textAnchor="middle" fill={TITLE} fontSize="14" fontWeight="600" fontFamily="var(--font-display)">
        Freelancer / Client
      </text>

      {/* arrow down */}
      <line x1={360} y1={64} x2={360} y2={92} stroke="#94A3B8" strokeWidth={1.2} markerEnd="url(#arrow-sa)" />

      {/* Middle: contracts container */}
      <Box x={70} y={96} w={580} h={130} fill="rgba(83,74,183,0.15)" stroke="rgba(83,74,183,0.5)" rx={14} />
      <text x={90} y={120} fill={TITLE} fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
        TrustFlow smart contracts
      </text>

      {[
        { x: 92, label: 'Agreement engine' },
        { x: 290, label: 'Trust score engine' },
        { x: 488, label: 'Payment processor' },
      ].map((m) => (
        <g key={m.label}>
          <Box x={m.x} y={134} w={170} h={72} fill="rgba(29,158,117,0.2)" stroke="rgba(29,158,117,0.5)" />
          <text x={m.x + 85} y={175} textAnchor="middle" fill={TITLE} fontSize="12.5" fontWeight="600" fontFamily="var(--font-display)">
            {m.label}
          </text>
        </g>
      ))}

      {/* arrows from modules to bottom */}
      {[177, 375, 573].map((x, i) => (
        <line key={i} x1={x} y1={226} x2={x} y2={272} stroke="#94A3B8" strokeWidth={1.2} markerEnd="url(#arrow-sa)" />
      ))}

      {/* Bottom: QIE ecosystem container */}
      <Box x={40} y={276} w={640} h={166} fill="rgba(216,90,48,0.12)" stroke="rgba(216,90,48,0.5)" rx={14} />
      <text x={60} y={300} fill={TITLE} fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
        QIE blockchain ecosystem
      </text>

      {[
        { label: 'QIE Wallet', sub: 'Auth + signing' },
        { label: 'QUSDC', sub: 'Stablecoin rail' },
        { label: 'QIE Pass', sub: 'Identity' },
        { label: 'QIE Domains', sub: 'name.qie' },
        { label: 'QIEDEX', sub: 'Token swap' },
      ].map((c, i) => {
        const x = 56 + i * 123
        return (
          <g key={c.label}>
            <Box x={x} y={316} w={110} h={104} fill="rgba(245,158,11,0.18)" stroke="rgba(245,158,11,0.5)" />
            <text x={x + 55} y={362} textAnchor="middle" fill={TITLE} fontSize="12" fontWeight="600" fontFamily="var(--font-display)">
              {c.label}
            </text>
            <text x={x + 55} y={382} textAnchor="middle" fill={SUB} fontSize="10" fontFamily="var(--font-body)">
              {c.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
