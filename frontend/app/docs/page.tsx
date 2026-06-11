'use client'

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
} from 'lucide-react'
import { DocsNav, type DocSection } from '@/components/DocsNav'
import { Accordion } from '@/components/Accordion'
import { SystemArchitecture } from '@/components/diagrams/SystemArchitecture'
import { AgreementLifecycle } from '@/components/diagrams/AgreementLifecycle'
import { TrustScoreSystem } from '@/components/diagrams/TrustScoreSystem'
import { TRUSTFLOW_ADDRESS, QUSDC_ADDRESS } from '@/lib/contracts'
import { explorerAddress } from '@/lib/chains'
import { TIERS } from '@/lib/utils'

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

const STEPS = [
  { icon: Wallet, title: 'Connect QIE Wallet', body: 'Authenticate and sign with your QIE wallet.' },
  { icon: FileText, title: 'Create milestone agreement', body: 'Define 1–10 milestones with QUSDC amounts.' },
  { icon: Share2, title: 'Share funding link', body: 'Send the public funding link to your client.' },
  { icon: CircleDollarSign, title: 'Client funds with QUSDC', body: 'Funds held in escrow on-chain.' },
  { icon: Upload, title: 'Deliver work, upload proof', body: 'Mark milestones complete with a proof URI.' },
  { icon: CheckCircle2, title: 'Client approves, payment releases', body: 'Funds released instantly minus 0.5% fee.' },
  { icon: TrendingUp, title: 'Trust scores update', body: 'Both parties gain on-chain reputation.' },
]

const QIE_CARDS = [
  { icon: Wallet, color: '#3B82F6', title: 'QIE Wallet', body: 'Authentication and transaction signing.' },
  { icon: Coins, color: '#10B981', title: 'QUSDC', body: 'Stablecoin payment rail for all escrow.' },
  { icon: BadgeCheck, color: '#534AB7', title: 'QIE Pass', body: 'Identity verification · +200 trust bonus.' },
  { icon: Globe, color: '#F59E0B', title: 'QIE Domains', body: 'Human-readable addresses (name.qie).' },
  { icon: ArrowLeftRight, color: '#D85A30', title: 'QIEDEX', body: 'Token swap integration for funding.' },
]

const KEY_FUNCTIONS = [
  'createAgreement(title, desc, client, names[], amounts[], domain)',
  'fundAgreement(id)',
  'completeMilestone(id, index, proofURI)',
  'approveMilestone(id, index)',
  'cancelAgreement(id)',
  'getTrustProfile(address)',
]

const FAQ = [
  {
    question: 'What is a Trust Score?',
    answer:
      'A Trust Score (0–1000) is an on-chain reputation derived from your completed agreements, transaction volume, QIE Pass verification, and dispute history. It maps to four tiers that unlock better financial terms.',
  },
  {
    question: 'How are payments secured?',
    answer:
      'When a client funds an agreement, QUSDC is held in escrow by the TrustFlow smart contract. Funds only release to the freelancer when the client approves a completed milestone. The contract uses OpenZeppelin SafeERC20 and ReentrancyGuard.',
  },
  {
    question: 'What happens in a dispute?',
    answer:
      'If an active agreement is cancelled, unapproved milestones are marked disputed and the remaining escrowed funds are returned to the client. A dispute is recorded on both parties’ trust profiles and reduces their scores.',
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-bold tracking-display-md text-trust-text">
      {children}
    </h2>
  )
}

export default function DocsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <div className="flex gap-10">
        <DocsNav sections={SECTIONS} />

        <div className="min-w-0 max-w-3xl flex-1 space-y-16">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <SectionHeading>Overview</SectionHeading>
            <p className="mt-4 leading-relaxed text-trust-text-secondary">
              TrustFlow is a PayFi protocol on QIE Blockchain that lets
              freelancers and clients create milestone-based payment agreements
              in QUSDC. Funds are escrowed on-chain and released as work is
              approved. Every completed agreement raises both parties&apos;
              Trust Scores, unlocking better financial terms over time.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { v: '5', l: 'QIE components' },
                { v: '4', l: 'Trust tiers' },
                { v: '0.5%', l: 'Platform fee' },
              ].map((s) => (
                <div key={s.l} className="card p-4 text-center">
                  <p className="font-display text-2xl font-bold tracking-display-md text-trust-accent">
                    {s.v}
                  </p>
                  <p className="mt-1 text-xs text-trust-text-secondary">{s.l}</p>
                </div>
              ))}
            </div>
            <a
              href="https://github.com/vinaystwt"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-trust-accent hover:underline"
            >
              <Github size={15} /> View on GitHub
            </a>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="scroll-mt-24">
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
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-trust-accent/15 font-display text-sm font-bold text-trust-accent">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-trust-accent" />
                        <h3 className="font-display text-sm font-semibold text-trust-text">
                          {s.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-trust-text-secondary">
                        {s.body}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>

          {/* Trust score system */}
          <section id="trust-score" className="scroll-mt-24">
            <SectionHeading>Trust score system</SectionHeading>
            <div className="card mt-6 p-5">
              <TrustScoreSystem />
            </div>
            <p className="mt-5 leading-relaxed text-trust-text-secondary">
              Your score is computed on-chain:{' '}
              <span className="font-mono text-sm text-trust-text">
                (completed × 100) + (volume ÷ 1M × 10) + (QIE Pass ? 200 : 0) −
                (disputes × 200)
              </span>
              , clamped to a 0–1000 range.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-trust-border text-xs uppercase text-trust-text-dim">
                    <th className="py-2 pr-4 font-medium">Tier</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Score</th>
                    <th className="py-2 font-medium">Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((t) => (
                    <tr key={t.id} className="border-b border-trust-border/50">
                      <td className="py-2.5 pr-4 font-mono text-trust-text">{t.id}</td>
                      <td className="py-2.5 pr-4">
                        <span className="font-display font-semibold" style={{ color: t.color }}>
                          {t.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-trust-text-secondary">
                        {t.range}
                      </td>
                      <td className="py-2.5 text-trust-text-secondary">{t.benefits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="scroll-mt-24">
            <SectionHeading>Architecture</SectionHeading>
            <div className="card mt-6 p-5">
              <SystemArchitecture />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { t: 'Frontend', b: 'Next.js + wagmi reads and writes directly to the contract — no backend.' },
                { t: 'Contracts', b: 'TrustFlow escrow + trust engine, deployed on QIE Testnet.' },
                { t: 'QIE ecosystem', b: 'Wallet, QUSDC, QIE Pass, Domains and QIEDEX provide the rails.' },
              ].map((l) => (
                <div key={l.t} className="card p-4">
                  <p className="font-display text-sm font-semibold text-trust-text">{l.t}</p>
                  <p className="mt-1 text-xs text-trust-text-secondary">{l.b}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 font-display text-lg font-semibold tracking-display-md text-trust-text">
              Agreement lifecycle
            </h3>
            <div className="card mt-4 p-5">
              <AgreementLifecycle />
            </div>
          </section>

          {/* QIE integration */}
          <section id="qie-integration" className="scroll-mt-24">
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
                      <p className="font-display text-sm font-semibold text-trust-text">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-sm text-trust-text-secondary">{c.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Smart contracts */}
          <section id="contracts" className="scroll-mt-24">
            <SectionHeading>Smart contracts</SectionHeading>
            <div className="card mt-6 space-y-4 p-5">
              <div>
                <p className="text-xs uppercase text-trust-text-dim">TrustFlow</p>
                <a
                  href={explorerAddress(TRUSTFLOW_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-sm text-trust-accent hover:underline"
                >
                  {TRUSTFLOW_ADDRESS} <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
              <div>
                <p className="text-xs uppercase text-trust-text-dim">MockQUSDC</p>
                <a
                  href={explorerAddress(QUSDC_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 break-all font-mono text-sm text-trust-accent hover:underline"
                >
                  {QUSDC_ADDRESS} <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            </div>

            <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide text-trust-text-dim">
              Key functions
            </h3>
            <div className="card mt-2 p-4">
              <ul className="space-y-1.5">
                {KEY_FUNCTIONS.map((f) => (
                  <li key={f} className="break-all font-mono text-xs text-trust-text-secondary">
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-trust-progress/10 px-4 py-3 text-sm text-trust-progress">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              Secured with OpenZeppelin · ReentrancyGuard · SafeERC20
            </div>
          </section>

          {/* About */}
          <section id="about" className="scroll-mt-24">
            <SectionHeading>About</SectionHeading>
            <div className="card mt-6 p-6">
              <p className="font-display text-base font-semibold text-trust-text">
                Built by Vinay (@vinaystwt) · Deon Labs
              </p>
              <p className="mt-1 text-sm text-trust-text-secondary">
                Built for QIE Blockchain Hackathon 2026
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="https://github.com/vinaystwt"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-trust-border px-3 py-2 font-display text-xs font-semibold text-trust-text-secondary transition-colors hover:border-trust-accent/40 hover:text-trust-text"
                >
                  <Github size={14} /> GitHub
                </a>
                <a
                  href="https://twitter.com/vinaystwt"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-trust-border px-3 py-2 font-display text-xs font-semibold text-trust-text-secondary transition-colors hover:border-trust-accent/40 hover:text-trust-text"
                >
                  <Twitter size={14} /> Twitter
                </a>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24">
            <SectionHeading>FAQ</SectionHeading>
            <div className="mt-6">
              <Accordion items={FAQ} />
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
