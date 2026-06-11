# TrustFlow

**Payments that build credit. Built on QIE Blockchain.**

[Live Demo](VERCEL_URL_HERE) | [Smart Contracts](https://testnet.qie.digital/address/0x9db2e380f9100793ea71413224dD7C22F97aD91B) | [Video Demo](VIDEO_URL_HERE)

---

## The Problem

In Web3, every payment is zero-trust and zero-context. You cannot build a credit history, earn better terms, or prove you are a reliable counterparty. This forces 150%+ overcollateralization on DeFi loans and shuts 1.4 billion unbanked adults out of credit entirely. The root cause is that most blockchains are pseudo-anonymous, so there is no way to link a real identity with a financial track record.

## The Solution

TrustFlow is a PayFi protocol where freelancers and clients create milestone-based payment agreements using QUSDC stablecoin. Every completed agreement updates both parties' on-chain Trust Score. Higher scores unlock progressively better financial terms: lower escrow requirements, faster settlement, and future credit access. QIE Pass supplies the identity layer that makes all of this possible.

## How It Works

![Agreement Lifecycle](docs/lifecycle.svg)

1. **Connect**: Freelancer connects QIE Wallet
2. **Create**: Sets up a milestone payment agreement with the client
3. **Fund**: Client deposits QUSDC into the smart contract
4. **Deliver**: Freelancer completes milestones and uploads proof
5. **Approve**: Client approves, payment releases instantly
6. **Grow**: Both parties' Trust Scores increase
7. **Repeat**: Higher scores unlock better terms next time

## Trust Score System

![Trust Score System](docs/trust-score.svg)

Your Trust Score is calculated from on-chain activity:

| Input | Effect |
|-------|--------|
| Completed agreements | +100 per agreement |
| Transaction volume | +10 per $1,000 QUSDC |
| QIE Pass verified | +200 bonus |
| Disputes | -200 penalty each |

Score ranges from 0 to 1000, mapping to four tiers:

| Tier | Name | Score | What You Unlock |
|------|------|-------|-----------------|
| 0 | Newcomer | 0-199 | Escrow-only payments |
| 1 | Verified | 200-499 | Standard terms, 48h dispute window |
| 2 | Trusted | 500-799 | 24h dispute window, marketplace priority |
| 3 | Elite | 800-1000 | Instant settlement, advance payments |

## Architecture

![System Architecture](docs/architecture.svg)

TrustFlow has three layers:

- **Frontend**: Next.js 14 dApp with wagmi v2, Framer Motion animations, and real-time contract reads
- **Smart Contracts**: Solidity 0.8.20 on QIE Testnet. Agreement engine, trust score engine, and payment processor with SafeERC20 and ReentrancyGuard
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

**Core**
- Milestone-based payment agreements with on-chain escrow
- On-chain Trust Score computed from real transaction history
- Progressive tier system with unlockable financial benefits
- Two-step funding flow (QUSDC approve + deposit)
- Shareable funding links for clients
- Public trust profiles

**Technical**
- Built with OpenZeppelin (ReentrancyGuard, SafeERC20, Ownable)
- 46 unit tests passing
- 0.5% platform fee on milestone payments
- Full event logging for on-chain receipts

**UX**
- Animated Trust Score Ring with tier progression
- Framer Motion page transitions and staggered card animations
- Skeleton loading states for all contract reads
- Human-readable transaction error messages
- Mobile responsive (375px+)

## Smart Contracts

| Contract | Address (QIE Testnet) |
|----------|----------------------|
| TrustFlow | [`0x9db2e380f9100793ea71413224dD7C22F97aD91B`](https://testnet.qie.digital/address/0x9db2e380f9100793ea71413224dD7C22F97aD91B) |
| MockQUSDC | [`0x1850d2a31CB8669Ba757159B638DE19Af532ba5e`](https://testnet.qie.digital/address/0x1850d2a31CB8669Ba757159B638DE19Af532ba5e) |

**Key Functions:**
- `createAgreement()`: Create a new milestone payment agreement
- `fundAgreement()`: Client deposits QUSDC into escrow
- `completeMilestone()`: Freelancer marks a milestone done with proof
- `approveMilestone()`: Client approves, releasing payment
- `getTrustProfile()`: Read any address's trust score and tier

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

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or QIE Wallet configured for QIE Testnet

### QIE Testnet Setup
Add QIE Testnet to your wallet:
- Network: QIE Testnet
- RPC: `https://rpc1testnet.qie.digital/`
- Chain ID: 1983
- Symbol: QIE
- Explorer: `https://testnet.qie.digital/`

Get testnet QIE from: https://www.qie.digital/faucet

### Run Locally

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

## Demo

Video demo: (coming soon)

Demo walkthrough (90 seconds):

1. Priya the freelancer connects QIE Wallet. Trust Score: 0.
2. Creates a "Logo Design Package" agreement with 3 milestones ($500, $300, $200).
3. Client funds $1,000 QUSDC into the contract.
4. Priya completes Milestone 1, uploads proof.
5. Client approves. $500 QUSDC releases instantly.
6. Trust Score updates to 350. Next tier at 500.

## Built By

Vinay ([@vinaystwt](https://twitter.com/vinaystwt)) | Deon Labs

Built for the QIE Blockchain Hackathon 2026.

Your payment history is your credit history. Built on QIE.
