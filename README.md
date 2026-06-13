# TrustFlow

**Payments that build credit. Built on QIE Blockchain.**

[Live App](https://trustflow-qie.vercel.app) | [Smart Contracts](https://testnet.qie.digital/address/0xcD0915cb3423F6665C636d723648F78d88B81e52) | [Video Demo](#)

---

## The Problem

In Web3, every payment is zero-trust and zero-context. You cannot build a credit history, earn better terms, or prove you are a reliable counterparty. This forces 150%+ overcollateralization on DeFi loans and shuts 1.4 billion unbanked adults out of credit entirely. The root cause: most blockchains are pseudo-anonymous, so there is no way to link a real identity with a financial track record.

## The Solution

TrustFlow is a PayFi protocol where freelancers and clients create milestone-based payment agreements using QUSDC stablecoin. Every completed agreement updates both parties' on-chain Trust Score. Higher scores unlock progressively better financial terms enforced directly by the smart contract: upfront payment releases for Trusted-tier creators, auto-claim settlement for Elite-tier creators. QIE Pass supplies the identity layer that makes all of this possible.

## How It Works

1. **Connect**: Freelancer connects QIE Wallet
2. **Create**: Sets up a milestone payment agreement with the client
3. **Fund**: Client deposits QUSDC into the smart contract (Tier 2 creators get 25% released upfront)
4. **Deliver**: Freelancer completes milestones and uploads proof (Tier 3 creators start a 24h auto-claim window)
5. **Approve**: Client approves, remaining payment releases instantly
6. **Grow**: Both parties' Trust Scores increase
7. **Repeat**: Higher scores unlock better on-chain terms next time

## Trust Score System

Your Trust Score is calculated from on-chain activity:

| Input | Effect |
|-------|--------|
| Completed agreements | +100 per agreement |
| Transaction volume | +10 per $1,000 QUSDC |
| QIE Pass verified | +200 bonus |
| Disputes | -200 penalty each |

Score ranges from 0 to 1000, mapping to four tiers with real on-chain enforcement:

| Tier | Name | Score | On-Chain Terms |
|------|------|-------|----------------|
| 0 | Newcomer | 0-199 | Full escrow. Funds locked until each milestone approved. |
| 1 | Verified | 200-499 | Full escrow with 48h auto-refund if creator never delivers. |
| 2 | Trusted | 500-799 | 25% of each milestone released upfront on funding. |
| 3 | Elite | 800-1000 | Auto-claim: get paid 24h after delivery if client stays silent. |

## Architecture

TrustFlow has three layers:

- **Frontend**: Next.js 14 dApp with wagmi v2, viem, Framer Motion animations, and real-time contract reads
- **Smart Contracts**: Solidity 0.8.20 on QIE Testnet. Tier-enforced escrow engine, trust score engine, and payment processor with SafeERC20 and ReentrancyGuard
- **QIE Ecosystem**: Deep integration with 5 QIE components (see below)

## QIE Ecosystem Integration

TrustFlow integrates all five core QIE components:

| Component | How TrustFlow Uses It |
|-----------|----------------------|
| **QIE Wallet** | Primary authentication and transaction signing |
| **QUSDC** | All payments settled in QIE's native stablecoin (6 decimals) |
| **QIE Pass** | Identity verification, verified users get a +200 trust score bonus |
| **QIE Domains** | Human-readable payment addresses (pay to name.qie) |
| **QIEDEX** | Token swap integration for multi-token funding |

## Features

**Core Protocol**
- Milestone-based payment agreements with on-chain escrow
- On-chain Trust Score computed from real transaction history
- Four trust tiers with real on-chain enforced terms (not cosmetic)
- Tier 2: 25% upfront release on funding
- Tier 3: 24h auto-claim after delivery, client can dispute within window
- Two-step funding flow (QUSDC approve + deposit)
- Shareable funding links for clients
- Public trust profiles with tier badges

**Cold-Visitor Onboarding**
- In-app QUSDC faucet (one-click mint, no external site needed)
- One-click "Add QIE Testnet" network button
- Guided getting-started checklist at /start
- Solo demo mode at /demo (automated client funds and approves for you)
- One-click QUSDC token import to MetaMask

**Technical**
- Built with OpenZeppelin (ReentrancyGuard, SafeERC20, Ownable)
- 60 unit tests passing (including V2 tier enforcement tests)
- 0.5% platform fee on milestone payments
- Full event logging for on-chain receipts
- Server-side relayer for solo demo (narrow scope, rate limited)

**UX**
- Animated Trust Score Ring with tier progression
- Framer Motion page transitions and staggered card animations
- Skeleton loading states for all contract reads
- Human-readable transaction error messages
- Mobile responsive (375px+)

## Smart Contracts

| Contract | Address (QIE Testnet) |
|----------|----------------------|
| TrustFlow v1.1 | [`0xcD0915cb3423F6665C636d723648F78d88B81e52`](https://testnet.qie.digital/address/0xcD0915cb3423F6665C636d723648F78d88B81e52) |
| TrustFlow v1.0 (fallback) | [`0x9db2e380f9100793ea71413224dD7C22F97aD91B`](https://testnet.qie.digital/address/0x9db2e380f9100793ea71413224dD7C22F97aD91B) |
| MockQUSDC | [`0x1850d2a31CB8669Ba757159B638DE19Af532ba5e`](https://testnet.qie.digital/address/0x1850d2a31CB8669Ba757159B638DE19Af532ba5e) |

**Key Functions:**
- `createAgreement()`: Create a new milestone payment agreement
- `fundAgreement()`: Client deposits QUSDC into escrow (Tier 2: releases 25% upfront)
- `completeMilestone()`: Freelancer marks a milestone done with proof (Tier 3: starts 24h claim window)
- `approveMilestone()`: Client approves, releasing payment
- `claimMilestone()`: Tier 3 creator auto-claims after 24h window
- `disputeMilestone()`: Client blocks auto-claim inside the window
- `getTrustProfile()`: Read any address's trust score and tier
- `getEnforcedTerms()`: Read what on-chain terms apply to a given address

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS v3 |
| Animations | Framer Motion |
| Web3 | wagmi v2, viem, RainbowKit |
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Blockchain | QIE Testnet (Chain ID: 1983) |
| Stablecoin | QUSDC (6 decimals) |
| Fonts | Space Grotesk, Manrope, JetBrains Mono |
| Deployment | Vercel (frontend), QIE Testnet (contracts) |

## Try It Yourself

The live app is at [trustflow-qie.vercel.app](https://trustflow-qie.vercel.app). Five steps to your first agreement:

1. **Add QIE Testnet**: Click "Add QIE Testnet" on the app, or add manually:
   ```
   Network: QIE Testnet
   RPC: https://rpc1testnet.qie.digital/
   Chain ID: 1983
   Currency: QIE
   Explorer: https://testnet.qie.digital/
   QUSDC Token: 0x1850d2a31CB8669Ba757159B638DE19Af532ba5e
   ```
2. **Get testnet QIE**: Visit [qie.digital/faucet](https://www.qie.digital/faucet) for gas
3. **Get test QUSDC**: Click the faucet button in the app (mints 1,000 QUSDC)
4. **Add QUSDC to wallet**: Click "Add QUSDC to MetaMask" to see your balance
5. **Run the solo demo**: Visit [/demo](https://trustflow-qie.vercel.app/demo) for a guided full-cycle walkthrough with an automated client

Or visit [/start](https://trustflow-qie.vercel.app/start) for the interactive getting-started checklist.

## Run Locally

### Prerequisites
- Node.js 18+
- MetaMask or QIE Wallet configured for QIE Testnet

```bash
# Clone
git clone https://github.com/Vinaystwt/TrustFlow.git
cd TrustFlow

# Backend (contracts)
cd trustflow
npm install
npx hardhat compile
npx hardhat test

# Frontend
cd ../frontend
npm install
npm run dev
```

## Built By

Vinay ([@vinaystwt](https://twitter.com/vinaystwt))

Built for the QIE Blockchain Hackathon 2026.

Your payment history is your credit history. Built on QIE.
