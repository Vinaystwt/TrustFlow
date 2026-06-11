# TrustFlow Backend

TrustFlow is a PayFi protocol for milestone-based freelancer agreements on QIE Blockchain. Clients fund QUSDC milestones into escrow, freelancers submit proof, clients approve completed work, and both parties build on-chain Trust Scores from completed volume, completed agreements, QIE Pass verification, and dispute history.

## Stack

- Solidity `^0.8.20`
- Hardhat
- OpenZeppelin `IERC20`, `SafeERC20`, `Ownable`, `ReentrancyGuard`
- QUSDC uses 6 decimals, so `$100 QUSDC = 100000000`

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and set:

```bash
PRIVATE_KEY=your_private_key_here
FEE_RECIPIENT=your_fee_wallet_address_here
QUSDC_MAINNET=0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5
```

## Commands

```bash
npm run compile
npm test
npm run deploy:testnet
npm run deploy:mainnet
npm run seed
```

## Networks

- QIE Testnet: chain ID `1983`, RPC `https://testnetqierpc1.digital/`
- QIE Mainnet: chain ID `5656`, RPC `https://rpc.qie.digital`
- Mainnet QUSDC: `0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5`

## Contracts

- `MockQUSDC.sol`: test token with 6 decimals and public minting.
- `TrustFlow.sol`: agreement escrow, milestone approvals, fee routing, cancellation, and Trust Score tracking.

Platform fee defaults to `50` basis points, or `0.5%`, and owner updates are capped at `500` basis points.
