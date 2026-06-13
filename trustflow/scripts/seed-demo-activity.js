/**
 * Seed realistic demo activity on the EXISTING TrustFlowV2 + MockQUSDC
 * contracts on QIE Testnet. Uses the deployer wallet + 6 fresh wallets.
 *
 * Run: npx hardhat run scripts/seed-demo-activity.js --network qieTestnet
 */

const hre = require("hardhat");

const TRUSTFLOW_ADDRESS = "0xcD0915cb3423F6665C636d723648F78d88B81e52";
const QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";

const TRUSTFLOW_ABI = [
  "function createAgreement(string,string,address,string[],uint256[],string) returns (uint256)",
  "function fundAgreement(uint256)",
  "function completeMilestone(uint256,uint256,string)",
  "function approveMilestone(uint256,uint256)",
  "function getTrustProfile(address) view returns (tuple(uint256 completedAgreements, uint256 totalVolumeUSDC, uint256 disputeCount, bool qiePassVerified, uint256 trustScore, uint8 tier))",
  "function agreementCounter() view returns (uint256)",
  "function getAgreement(uint256) view returns (tuple(uint256 id, address creator, address client, string title, string description, string creatorDomain, uint8 status, uint256 totalAmount, uint256 paidAmount, uint256 createdAt, uint256 completedAt, uint256 milestoneCount))",
];

const QUSDC_ABI = [
  "function mint(address,uint256)",
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

// Realistic agreement templates
const AGREEMENTS = [
  {
    title: "DeFi Dashboard UI",
    desc: "Responsive dashboard for tracking yield positions",
    domain: "frontend",
    milestones: [
      ["Wireframes + component library", 800],
      ["Chart integration + live data", 1200],
      ["Mobile responsive + polish", 500],
    ],
  },
  {
    title: "Smart Contract Audit Report",
    desc: "Security review of staking contract",
    domain: "security",
    milestones: [
      ["Initial code review", 1500],
      ["Formal audit report", 2000],
    ],
  },
  {
    title: "Token Launch Landing Page",
    desc: "Marketing page with countdown and tokenomics",
    domain: "marketing",
    milestones: [
      ["Design + copy", 400],
      ["Development + animations", 600],
    ],
  },
  {
    title: "NFT Collection Art",
    desc: "10k generative PFP art with trait system",
    domain: "design",
    milestones: [
      ["Base characters + 50 traits", 1000],
      ["Generation script + metadata", 500],
      ["Rarity distribution + QA", 300],
    ],
  },
  {
    title: "DEX Integration Module",
    desc: "Swap aggregator integration for QIE tokens",
    domain: "backend",
    milestones: [
      ["Router + price feed integration", 900],
      ["Slippage protection + testing", 700],
    ],
  },
  {
    title: "Whitepaper Technical Writing",
    desc: "Protocol whitepaper with tokenomics section",
    domain: "docs",
    milestones: [["Draft whitepaper", 600], ["Final review + diagrams", 400]],
  },
  {
    title: "Mobile Wallet Integration",
    desc: "WalletConnect v2 setup for dApp",
    domain: "mobile",
    milestones: [
      ["Connection flow + session mgmt", 700],
      ["Transaction signing + deep links", 800],
    ],
  },
  {
    title: "Analytics Backend",
    desc: "Event indexer + REST API for on-chain metrics",
    domain: "backend",
    milestones: [
      ["Indexer + PostgreSQL schema", 500],
      ["API endpoints + caching", 400],
      ["Grafana dashboards", 300],
    ],
  },
  {
    title: "Community Bot Development",
    desc: "Discord + Telegram bot for project updates",
    domain: "tooling",
    milestones: [
      ["Discord bot + slash commands", 350],
      ["Telegram bot + notifications", 350],
    ],
  },
  {
    title: "Brand Identity Package",
    desc: "Logo, color system, and brand guidelines",
    domain: "design",
    milestones: [
      ["Logo concepts + moodboard", 500],
      ["Color system + typography", 300],
      ["Brand guide document", 200],
    ],
  },
  {
    title: "DAO Governance Module",
    desc: "On-chain voting with delegation support",
    domain: "contracts",
    milestones: [
      ["Governance contract + tests", 1200],
      ["Frontend voting UI", 800],
    ],
  },
  {
    title: "Staking Rewards Calculator",
    desc: "Interactive calculator widget for protocol staking",
    domain: "frontend",
    milestones: [
      ["Calculator logic + APY model", 300],
      ["UI component + chart", 400],
    ],
  },
  {
    title: "Cross-chain Bridge Testing",
    desc: "QA and test suite for bridge protocol",
    domain: "qa",
    milestones: [
      ["Test plan + environment setup", 600],
      ["Automated test suite", 900],
      ["Load testing + report", 500],
    ],
  },
  {
    title: "Protocol Documentation Site",
    desc: "Docusaurus-based docs with API reference",
    domain: "docs",
    milestones: [
      ["Site scaffold + content migration", 400],
      ["API reference generation", 350],
    ],
  },
  {
    title: "Yield Optimizer Strategy",
    desc: "Auto-compound vault strategy for LP tokens",
    domain: "defi",
    milestones: [
      ["Strategy contract + simulation", 1100],
      ["Vault UI + deposit flow", 600],
    ],
  },
];

// Which state each agreement ends in:
// 'completed' = all milestones approved
// 'partial'   = funded, some milestones done
// 'active'    = funded, no milestones done yet
// 'draft'     = created but not funded
const STATES = [
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "partial",
  "partial",
  "partial",
  "active",
  "active",
  "active",
  "draft",
  "draft",
  "draft",
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { ethers } = hre;
  const provider = ethers.provider;
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  const depBal = await provider.getBalance(deployer.address);
  console.log("Deployer QIE:", ethers.formatEther(depBal));

  if (depBal < ethers.parseEther("1.5")) {
    console.error("Deployer needs at least 1.5 QIE for seeding");
    process.exit(1);
  }

  const trustFlow = new ethers.Contract(TRUSTFLOW_ADDRESS, TRUSTFLOW_ABI, deployer);
  const qusdc = new ethers.Contract(QUSDC_ADDRESS, QUSDC_ABI, deployer);

  // Check existing state
  const startCounter = await trustFlow.agreementCounter();
  console.log("Existing agreements:", startCounter.toString());

  // Generate 6 wallets
  const wallets = [];
  for (let i = 0; i < 6; i++) {
    const w = ethers.Wallet.createRandom().connect(provider);
    wallets.push(w);
  }
  console.log(
    "Generated wallets:",
    wallets.map((w) => w.address.slice(0, 10) + "...")
  );

  // Fund wallets with gas (0.25 QIE each)
  console.log("\nFunding wallets with gas...");
  for (let i = 0; i < wallets.length; i++) {
    const tx = await deployer.sendTransaction({
      to: wallets[i].address,
      value: ethers.parseEther("0.25"),
    });
    await tx.wait();
    console.log(`  Wallet ${i}: ${wallets[i].address.slice(0, 10)}... funded 0.25 QIE`);
  }

  // Mint QUSDC for each wallet (5,000 each) + deployer top-up
  console.log("\nMinting QUSDC...");
  const mintAmt = ethers.parseUnits("5000", 6);
  for (const w of wallets) {
    const tx = await qusdc.connect(w).mint(w.address, mintAmt);
    await tx.wait();
  }
  // Top up deployer QUSDC
  const depQusdc = await qusdc.balanceOf(deployer.address);
  if (depQusdc < ethers.parseUnits("5000", 6)) {
    const tx = await qusdc.mint(deployer.address, ethers.parseUnits("10000", 6));
    await tx.wait();
  }
  console.log("  All wallets + deployer have QUSDC");

  // All actors: deployer + 6 wallets = 7
  const actors = [deployer, ...wallets];

  // Create agreements
  // Pair actors as creator/client, cycling through
  console.log("\nCreating agreements...");
  const agreementIds = [];
  const count = Math.min(AGREEMENTS.length, STATES.length);

  for (let i = 0; i < count; i++) {
    const tmpl = AGREEMENTS[i];
    const creator = actors[i % actors.length];
    const client = actors[(i + 3) % actors.length]; // offset by 3 so creator != client

    const names = tmpl.milestones.map((m) => m[0]);
    const amounts = tmpl.milestones.map((m) => ethers.parseUnits(m[1].toString(), 6));

    try {
      const tx = await trustFlow
        .connect(creator)
        .createAgreement(tmpl.title, tmpl.desc, client.address, names, amounts, tmpl.domain);
      const receipt = await tx.wait();
      const id = await trustFlow.agreementCounter();
      agreementIds.push({ id, creator, client, tmpl, state: STATES[i] });

      const totalUSD = tmpl.milestones.reduce((s, m) => s + m[1], 0);
      console.log(
        `  #${id}: "${tmpl.title}" ($${totalUSD}) [${STATES[i]}] creator=${creator.address.slice(0, 8)} client=${client.address.slice(0, 8)}`
      );
    } catch (e) {
      console.error(`  Failed to create "${tmpl.title}":`, e.message?.slice(0, 80));
    }

    // Small delay to avoid nonce issues
    await sleep(500);
  }

  // Fund, complete, approve based on target state
  console.log("\nProcessing agreement states...");
  for (const ag of agreementIds) {
    const { id, creator, client, tmpl, state } = ag;
    if (state === "draft") {
      console.log(`  #${id}: left as draft`);
      continue;
    }

    const totalAmount = tmpl.milestones.reduce(
      (s, m) => s + ethers.parseUnits(m[1].toString(), 6),
      0n
    );

    try {
      // Approve QUSDC spending
      const approveTx = await qusdc.connect(client).approve(TRUSTFLOW_ADDRESS, totalAmount);
      await approveTx.wait();

      // Fund
      const fundTx = await trustFlow.connect(client).fundAgreement(id);
      await fundTx.wait();
      console.log(`  #${id}: funded`);
      await sleep(500);

      if (state === "active") continue;

      // Complete + approve milestones
      const msCount = tmpl.milestones.length;
      const approveCount = state === "completed" ? msCount : Math.ceil(msCount / 2);

      for (let m = 0; m < approveCount; m++) {
        const completeTx = await trustFlow
          .connect(creator)
          .completeMilestone(id, m, `https://proof.trustflow.app/${id}/${m}`);
        await completeTx.wait();
        await sleep(300);

        const appMsTx = await trustFlow.connect(client).approveMilestone(id, m);
        await appMsTx.wait();
        console.log(`  #${id}: milestone ${m + 1}/${msCount} approved`);
        await sleep(300);
      }

      if (state === "partial") {
        // Complete one more milestone but don't approve (leave it pending)
        if (approveCount < msCount) {
          const completeTx = await trustFlow
            .connect(creator)
            .completeMilestone(id, approveCount, `https://proof.trustflow.app/${id}/${approveCount}`);
          await completeTx.wait();
          console.log(`  #${id}: milestone ${approveCount + 1} completed (pending approval)`);
        }
      }
    } catch (e) {
      console.error(`  #${id} processing failed:`, e.message?.slice(0, 100));
    }
  }

  // Print trust profiles for all actors
  console.log("\n--- Trust Profiles ---");
  for (let i = 0; i < actors.length; i++) {
    try {
      const p = await trustFlow.getTrustProfile(actors[i].address);
      const label = i === 0 ? "Deployer" : `Wallet ${i}`;
      console.log(
        `${label} (${actors[i].address.slice(0, 10)}): score=${p.trustScore} tier=${p.tier} completed=${p.completedAgreements} volume=$${ethers.formatUnits(p.totalVolumeUSDC, 6)}`
      );
    } catch (e) {
      // skip
    }
  }

  // Summary
  const endCounter = await trustFlow.agreementCounter();
  const created = Number(endCounter) - Number(startCounter);
  console.log(`\nSeeded ${created} new agreements.`);
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
