'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  FileText,
  Share2,
  CircleDollarSign,
  Upload,
  CheckCircle2,
  TrendingUp,
  Github,
  Twitter,
  ExternalLink,
  Coins,
  BadgeCheck,
  Globe,
  ArrowLeftRight,
  ShieldCheck,
  Pencil,
} from 'lucide-react'
import { DocsNav, type DocSection } from '@/components/DocsNav'
import { Accordion } from '@/components/Accordion'
import { SearchBar } from '@/components/SearchBar'
import { CodeBlock } from '@/components/CodeBlock'
import { SystemArchitecture } from '@/components/diagrams/SystemArchitecture'
import { AgreementLifecycle } from '@/components/diagrams/AgreementLifecycle'
import { TrustScoreSystem } from '@/components/diagrams/TrustScoreSystem'
import { TRUSTFLOW_ADDRESS, QUSDC_ADDRESS } from '@/lib/contracts'
import { explorerAddress } from '@/lib/chains'
import { TIERS } from '@/lib/utils'

const EDIT_URL =
  'https://github.com/Vinaystwt/TrustFlow/edit/master/frontend/app/docs/page.tsx'

const SECTIONS: DocSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'trust-score', label: 'Trust score system' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'qie-integration', label: 'QIE integration' },
  { id: 'contracts', label: 'Smart contracts' },
  { id: 'about', label: 'About' },
  { id: 'faq', label: 'FAQ' },
]

// Searchable text per section (title + key content) for client-side filtering.
const SEARCH_INDEX: Record<string, string> = {
  overview: 'overview payfi protocol qie blockchain freelancers clients milestone payment agreements qusdc escrow trust score components tiers platform fee',
  'how-it-works': 'how it works connect qie wallet create milestone agreement share funding link client funds qusdc deliver proof approve payment releases trust scores update',
  'trust-score': 'trust score system completed agreements volume qie pass verified disputes formula tiers newcomer verified trusted elite benefits dispute window settlement',
  architecture: 'architecture frontend nextjs wagmi contracts qie ecosystem wallet domains qiedex agreement lifecycle layers',
  'qie-integration': 'qie integration wallet qusdc stablecoin pass identity domains qiedex token swap funding bonus',
  contracts: 'smart contracts address trustflow mockqusdc explorer key functions createagreement fundagreement completemilestone approvemilestone canceland gettrustprofile openzeppelin reentrancyguard safeerc20 solidity typescript',
  about: 'about built by vinay qie blockchain hackathon github twitter',
  faq: 'faq trust score payments secured dispute identity private fees platform',
}

const STEPS = [
  { icon: Wallet, title: 'Connect QIE Wallet', body: 'Authenticate and sign with your QIE wallet.' },
  { icon: FileText, title: 'Create milestone agreement', body: 'Define 1 to 10 milestones with QUSDC amounts.' },
  { icon: Share2, title: 'Share funding link', body: 'Send the public funding link to your client.' },
  { icon: CircleDollarSign, title: 'Client funds with QUSDC', body: 'Funds held in escrow on-chain.' },
  { icon: Upload, title: 'Deliver work, upload proof', body: 'Mark milestones complete with a proof URI.' },
  { icon: CheckCircle2, title: 'Client approves, payment releases', body: 'Funds released instantly minus 0.5% fee.' },
  { icon: TrendingUp, title: 'Trust scores update', body: 'Both parties gain on-chain reputation.' },
]

const QIE_CARDS = [
  { icon: Wallet, color: '#3B82F6', title: 'QIE Wallet', body: 'Authentication and transaction signing.' },
  { icon: Coins, color: '#10B981', title: 'QUSDC', body: 'Stablecoin payment rail for all escrow.' },
  { icon: BadgeCheck, color: '#534AB7', title: 'QIE Pass', body: 'Identity verification, +200 trust bonus.' },
  { icon: Globe, color: '#F59E0B', title: 'QIE Domains', body: 'Human-readable addresses (name.qie).' },
  { icon: ArrowLeftRight, color: '#D85A30', title: 'QIEDEX', body: 'Token swap integration for funding.' },
]

const SOLIDITY_EXAMPLE = `function createAgreement(
    string calldata title,
    string calldata description,
    address client,
    string[] calldata milestoneNames,
    uint256[] calldata milestoneAmounts,
    string calldata creatorDomain
) external returns (uint256 agreementId);

function approveMilestone(uint256 agreementId, uint256 index) external;`

const ENFORCEMENT_EXAMPLE = `// Tier 2: release 25% of each milestone upfront on funding
if (creatorTier == 2) {
    uint256 upfront = (milestone.amount * TIER2_UPFRONT_BPS) / 10000;
    milestone.upfrontReleased = upfront;
    qusdc.safeTransfer(agreement.creator, upfront - fee);
}

// Tier 3: set a 24h auto-claim window on delivery
if (creatorTier == 3) {
    milestone.claimableAfter = block.timestamp + TIER3_CLAIM_WINDOW;
}

// Creator auto-claims after the window if the client stays silent
function claimMilestone(uint256 agreementId, uint256 index) external;
// Client can block auto-claim inside the window
function disputeMilestone(uint256 agreementId, uint256 index) external;`

const TS_EXAMPLE = `import { useReadContract } from 'wagmi'
import { TRUSTFLOW_ABI, TRUSTFLOW_ADDRESS } from '@/lib/contracts'

// Read any address's trust profile on-chain
const { data: profile } = useReadContract({
  abi: TRUSTFLOW_ABI,
  address: TRUSTFLOW_ADDRESS,
  functionName: 'getTrustProfile',
  args: [userAddress],
})`

const FAQ = [
  {
    question: 'What is a Trust Score?',
    answer:
      'A Trust Score (0 to 1000) is an on-chain reputation derived from your completed agreements, transaction volume, QIE Pass verification, and dispute history. It maps to four tiers that unlock better financial terms.',
  },
  {
    question: 'How are payments secured?',
    answer:
      'When a client funds an agreement, QUSDC is held in escrow by the TrustFlow smart contract. Funds only release to the freelancer when the client approves a completed milestone. The contract uses OpenZeppelin SafeERC20 and ReentrancyGuard.',
  },
  {
    question: 'What happens in a dispute?',
    answer:
      'If an active agreement is cancelled, unapproved milestones are marked disputed and the remaining escrowed funds are returned to the client. A dispute is recorded on both parties trust profiles and reduces their scores.',
  },
  {
    question: 'Is my identity private?',
    answer:
      'Your wallet address is public on-chain. QIE Pass verification proves you are a verified human without exposing personal data, and QIE Domains let you present a readable name instead of a raw address.',
  },
  {
    question: 'What fees does TrustFlow charge?',
    answer:
      'TrustFlow charges a 0.5% platform fee on each released milestone payment. The freelancer receives the milestone amount minus this fee.',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-3xl font-bold tracking-tight text-text">
      {children}
    </h2>
  )
}

function EditLink() {
  return (
    <div className="mt-6 flex justify-end">
      <a
        href={EDIT_URL}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text"
      >
        <Pencil size={12} className="transition-colors group-hover:text-brand-primary-light" />
        Edit on GitHub
      </a>
    </div>
  )
}

function DocSectionBlock({
  id,
  hidden,
  children,
}: {
  id: string
  hidden: boolean
  children: ReactNode
}) {
  if (hidden) return null
  return (
    <section id={id} className="scroll-mt-28">
      {children}
      <EditLink />
    </section>
  )
}

export default function DocsPage() {
  const [query, setQuery] = useState('')

  // Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = document.getElementById('docs-search') as HTMLInputElement | null
        el?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const isHidden = (id: string) => q.length > 0 && !SEARCH_INDEX[id]?.includes(q)
  const visibleCount = useMemo(
    () => SECTIONS.filter((s) => !isHidden(s.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <div className="flex gap-10">
        <DocsNav sections={SECTIONS} />

        <div className="min-w-0 max-w-3xl flex-1">
          {/* Sticky search */}
          <div className="sticky top-16 z-30 -mx-4 mb-10 bg-bg/80 px-4 py-3 backdrop-blur-xl sm:-mx-2 sm:px-2">
            <SearchBar
              id="docs-search"
              value={query}
              onChange={setQuery}
              placeholder="Search docs…  (Cmd+K)"
              className="max-w-md"
            />
          </div>

          {q.length > 0 && visibleCount === 0 && (
            <p className="text-text-secondary">No results for “{query}”</p>
          )}

          <div className="space-y-16">
            {/* Overview */}
            <DocSectionBlock id="overview" hidden={isHidden('overview')}>
              <SectionHeading>Overview</SectionHeading>
              <p className="mt-4 text-lg leading-relaxed text-text-secondary">
                TrustFlow is a PayFi protocol on QIE Blockchain that lets
                freelancers and clients create milestone-based payment
                agreements in QUSDC. Funds are escrowed on-chain and released as
                work is approved. Every completed agreement raises both parties&apos;
                Trust Scores, unlocking better financial terms over time.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                {[
                  { v: '5', l: 'QIE components' },
                  { v: '4', l: 'Trust tiers' },
                  { v: '0.5%', l: 'Platform fee' },
                ].map((s) => (
                  <div key={s.l} className="card p-4 text-center">
                    <p className="font-display text-2xl font-bold tracking-tight gradient-text">
                      {s.v}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{s.l}</p>
                  </div>
                ))}
              </div>
              <a
                href="https://github.com/Vinaystwt/TrustFlow"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-primary-light hover:underline"
              >
                <Github size={15} /> View on GitHub
              </a>
            </DocSectionBlock>

            {/* How it works */}
            <DocSectionBlock id="how-it-works" hidden={isHidden('how-it-works')}>
              <SectionHeading>How it works</SectionHeading>
              <div className="mt-6 space-y-3">
                {STEPS.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      initial="initial"
                      whileInView="whileInView"
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="card flex items-start gap-4 p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 font-display text-sm font-bold text-brand-primary-light">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-brand-primary-light" />
                          <h3 className="font-display text-sm font-semibold text-text">
                            {s.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">{s.body}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </DocSectionBlock>

            {/* Trust score system */}
            <DocSectionBlock id="trust-score" hidden={isHidden('trust-score')}>
              <SectionHeading>Trust score system</SectionHeading>
              <div className="card mt-6 p-5">
                <TrustScoreSystem />
              </div>
              <p className="mt-5 leading-relaxed text-text-secondary">
                Your score is computed on-chain: completed agreements times 100,
                plus 10 per $1,000 of volume, plus 200 if QIE Pass verified,
                minus 200 per dispute, clamped to a 0 to 1000 range.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-text-dim">
                      <th className="py-2 pr-4 font-medium">Tier</th>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Score</th>
                      <th className="py-2 font-medium">Benefits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIERS.map((t) => (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 font-mono text-text">{t.id}</td>
                        <td className="py-2.5 pr-4">
                          <span className="font-display font-semibold" style={{ color: t.color }}>
                            {t.name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-text-secondary">{t.range}</td>
                        <td className="py-2.5 text-text-secondary">{t.benefits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-8 font-display text-lg font-semibold tracking-tight text-text">
                How tiers are enforced on-chain
              </h3>
              <p className="mt-3 leading-relaxed text-text-secondary">
                In TrustFlowV2 the tier is not cosmetic. The contract reads the
                freelancer&apos;s tier and applies different settlement rules:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li>
                  <span className="font-semibold text-text">Tier 0 / 1:</span> full
                  escrow. <code className="font-mono text-brand-primary-light">approveMilestone</code>{' '}
                  releases the full milestone amount on client approval.
                </li>
                <li>
                  <span className="font-semibold text-text">Tier 2 (Trusted):</span>{' '}
                  <code className="font-mono text-brand-primary-light">fundAgreement</code> releases
                  25% of each milestone (<code className="font-mono text-brand-primary-light">TIER2_UPFRONT_BPS</code>)
                  to the creator upfront, recorded as{' '}
                  <code className="font-mono text-brand-primary-light">upfrontReleased</code>. Approval
                  pays the remaining 75%.
                </li>
                <li>
                  <span className="font-semibold text-text">Tier 3 (Elite):</span>{' '}
                  <code className="font-mono text-brand-primary-light">completeMilestone</code> sets{' '}
                  <code className="font-mono text-brand-primary-light">claimableAfter</code> to 24h
                  out. If the client does not approve or dispute, the creator calls{' '}
                  <code className="font-mono text-brand-primary-light">claimMilestone</code> to auto-claim.
                  The client can block this with{' '}
                  <code className="font-mono text-brand-primary-light">disputeMilestone</code> inside
                  the window.
                </li>
              </ul>
              <div className="mt-5">
                <CodeBlock lang="solidity" code={ENFORCEMENT_EXAMPLE} />
              </div>
            </DocSectionBlock>

            {/* Architecture */}
            <DocSectionBlock id="architecture" hidden={isHidden('architecture')}>
              <SectionHeading>Architecture</SectionHeading>
              <div className="card mt-6 p-5">
                <SystemArchitecture />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { t: 'Frontend', b: 'Next.js + wagmi reads and writes directly to the contract, no backend.' },
                  { t: 'Contracts', b: 'TrustFlow escrow + trust engine, deployed on QIE Testnet.' },
                  { t: 'QIE ecosystem', b: 'Wallet, QUSDC, QIE Pass, Domains and QIEDEX provide the rails.' },
                ].map((l) => (
                  <div key={l.t} className="card p-4">
                    <p className="font-display text-sm font-semibold text-text">{l.t}</p>
                    <p className="mt-1 text-xs text-text-secondary">{l.b}</p>
                  </div>
                ))}
              </div>
              <h3 className="mt-8 font-display text-lg font-semibold tracking-tight text-text">
                Agreement lifecycle
              </h3>
              <div className="card mt-4 p-5">
                <AgreementLifecycle />
              </div>
            </DocSectionBlock>

            {/* QIE integration */}
            <DocSectionBlock id="qie-integration" hidden={isHidden('qie-integration')}>
              <SectionHeading>QIE integration</SectionHeading>
              <div className="mt-6 space-y-3">
                {QIE_CARDS.map((c) => {
                  const Icon = c.icon
                  return (
                    <div
                      key={c.title}
                      className="card flex items-start gap-3 border-l-4 p-4"
                      style={{ borderLeftColor: c.color }}
                    >
                      <Icon size={18} style={{ color: c.color }} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-display text-sm font-semibold text-text">{c.title}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">{c.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </DocSectionBlock>

            {/* Smart contracts */}
            <DocSectionBlock id="contracts" hidden={isHidden('contracts')}>
              <SectionHeading>Smart contracts</SectionHeading>
              <div className="card mt-6 space-y-4 p-5">
                <div>
                  <p className="text-xs uppercase text-text-dim">TrustFlow</p>
                  <a
                    href={explorerAddress(TRUSTFLOW_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-sm text-brand-primary-light hover:underline"
                  >
                    {TRUSTFLOW_ADDRESS} <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-dim">MockQUSDC</p>
                  <a
                    href={explorerAddress(QUSDC_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-sm text-brand-primary-light hover:underline"
                  >
                    {QUSDC_ADDRESS} <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              </div>

              <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide text-text-dim">
                Key functions
              </h3>
              <div className="mt-2">
                <CodeBlock lang="solidity" code={SOLIDITY_EXAMPLE} />
              </div>

              <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide text-text-dim">
                Read a trust profile from the frontend
              </h3>
              <div className="mt-2">
                <CodeBlock lang="typescript" code={TS_EXAMPLE} />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                Secured with OpenZeppelin, ReentrancyGuard, SafeERC20
              </div>
            </DocSectionBlock>

            {/* About */}
            <DocSectionBlock id="about" hidden={isHidden('about')}>
              <SectionHeading>About</SectionHeading>
              <div className="card mt-6 p-6">
                <p className="font-display text-base font-semibold text-text">
                  Built by Vinay (@vinaystwt)
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Built for QIE Blockchain Hackathon 2026
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href="https://github.com/Vinaystwt/TrustFlow"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
                  >
                    <Github size={14} /> GitHub
                  </a>
                  <a
                    href="https://twitter.com/vinaystwt"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-display text-xs font-semibold text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text"
                  >
                    <Twitter size={14} /> Twitter
                  </a>
                </div>
              </div>
            </DocSectionBlock>

            {/* FAQ */}
            <DocSectionBlock id="faq" hidden={isHidden('faq')}>
              <SectionHeading>FAQ</SectionHeading>
              <div className="mt-6">
                <Accordion items={FAQ} />
              </div>
            </DocSectionBlock>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
