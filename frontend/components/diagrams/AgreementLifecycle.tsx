const TITLE = '#E2E8F0'
const SUB = '#94A3B8'

const STEPS = [
  { title: 'Freelancer creates agreement', sub: 'Status: Draft', color: '#3B82F6' },
  { title: 'Share funding link', sub: 'Send to client', color: '#64748B' },
  { title: 'Client funds in QUSDC', sub: 'Status: Active', color: '#10B981' },
  { title: 'Freelancer delivers milestone', sub: 'Uploads proof', color: '#534AB7' },
  { title: 'Client approves', sub: 'Payment releases', color: '#10B981' },
  { title: 'Trust scores update', sub: 'Both parties', color: '#F59E0B' },
  { title: 'Agreement completed', sub: 'Status: Completed', color: '#22C55E' },
]

const W = 420
const BOX_W = 280
const BOX_H = 52
const GAP = 30
const LEFT = (W - BOX_W) / 2

export function AgreementLifecycle() {
  const totalH = STEPS.length * (BOX_H + GAP) + 10
  return (
    <svg
      viewBox={`0 0 ${W} ${totalH}`}
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Agreement lifecycle flowchart"
    >
      <defs>
        <marker id="arrow-al" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#64748B" />
        </marker>
      </defs>

      {STEPS.map((s, i) => {
        const y = 8 + i * (BOX_H + GAP)
        const isLast = i === STEPS.length - 1
        return (
          <g key={i}>
            <rect
              x={LEFT}
              y={y}
              width={BOX_W}
              height={BOX_H}
              rx={10}
              fill={`${s.color}1F`}
              stroke={`${s.color}80`}
              strokeWidth={0.5}
            />
            <circle cx={LEFT + 22} cy={y + BOX_H / 2} r={5} fill={s.color} />
            <text x={LEFT + 40} y={y + 22} fill={TITLE} fontSize="12.5" fontWeight="600" fontFamily="var(--font-display)">
              {s.title}
            </text>
            <text x={LEFT + 40} y={y + 39} fill={SUB} fontSize="10.5" fontFamily="var(--font-body)">
              {s.sub}
            </text>
            {!isLast && (
              <line
                x1={W / 2}
                y1={y + BOX_H}
                x2={W / 2}
                y2={y + BOX_H + GAP}
                stroke="#64748B"
                strokeWidth={1.2}
                markerEnd="url(#arrow-al)"
              />
            )}
          </g>
        )
      })}

      {/* loop arrow: step 6 (index 5) back to step 4 (index 3) */}
      {(() => {
        const yFrom = 8 + 5 * (BOX_H + GAP) + BOX_H / 2
        const yTo = 8 + 3 * (BOX_H + GAP) + BOX_H / 2
        const xEdge = LEFT + BOX_W
        return (
          <g>
            <path
              d={`M ${xEdge} ${yFrom} C ${xEdge + 58} ${yFrom}, ${xEdge + 58} ${yTo}, ${xEdge} ${yTo}`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              markerEnd="url(#arrow-al)"
            />
            <text
              x={xEdge + 60}
              y={(yFrom + yTo) / 2}
              fill={SUB}
              fontSize="10"
              fontFamily="var(--font-body)"
              transform={`rotate(90 ${xEdge + 60} ${(yFrom + yTo) / 2})`}
              textAnchor="middle"
            >
              More milestones?
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
