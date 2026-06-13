const hre = require("hardhat");
const { ethers } = hre;

// ---------------------------------------------------------------------------
// Live V2 deployment (do not change)
// ---------------------------------------------------------------------------
const V2_ADDRESS = "0xcD0915cb3423F6665C636d723648F78d88B81e52";
const QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";

// Test client wallet (provided earlier, funded with QIE + QUSDC)
const CLIENT_KEY = "0xf3b840054f37e5c9a751d0f5d8f49e18355b17d46c2c91b2a868bd7b152d8527";

// Trust math (confirmed from TrustFlowV2._updateTrustScore):
//   base = completedAgreements*100 + (totalVolumeUSDC / 1e6) * 10
//   => $1 of approved volume = 10 points, 1 completed agreement = 100 points
// Tier 3 needs score >= 800. One $80 milestone = 800 volume + 100 completed = 900.
// Tier 2 needs 500-799. One $50 milestone = 500 volume + 100 completed = 600.
const TIER3_AMOUNT = ethers.parseUnits("80", 6);
const TIER2_AMOUNT = ethers.parseUnits("50", 6);

const MIN_GAS = ethers.parseEther("0.03");
const GAS_TOPUP = ethers.parseEther("0.05");

function parseAgreementId(v2, receipt) {
  for (const log of receipt.logs) {
    try {
      const parsed = v2.interface.parseLog(log);
      if (parsed && parsed.name === "AgreementCreated") return parsed.args.agreementId;
    } catch {
      /* not our log */
    }
  }
  throw new Error("AgreementCreated event not found");
}

// Run one full agreement cycle: create -> approve+fund -> complete -> approveMilestone.
async function runCycle(v2, qusdc, creator, client, amount, title) {
  const createTx = await v2
    .connect(creator)
    .createAgreement(title, "Demo seeding agreement", client.address, ["Deliverable"], [amount], "");
  const createReceipt = await createTx.wait();
  const id = parseAgreementId(v2, createReceipt);

  await (await qusdc.connect(client).approve(V2_ADDRESS, amount)).wait();
  await (await v2.connect(client).fundAgreement(id)).wait();
  await (await v2.connect(creator).completeMilestone(id, 0, "https://example.com/deliverable")).wait();
  await (await v2.connect(client).approveMilestone(id, 0)).wait();

  return id;
}

async function ensureGas(funder, wallet, label) {
  const bal = await ethers.provider.getBalance(wallet.address);
  if (bal < MIN_GAS) {
    console.log(`  Topping up ${label} gas (${ethers.formatEther(bal)} QIE -> +0.05)`);
    await (await funder.sendTransaction({ to: wallet.address, value: GAS_TOPUP })).wait();
  }
}

async function ensureQusdc(qusdc, wallet, needed, label) {
  const bal = await qusdc.balanceOf(wallet.address);
  if (bal < needed) {
    const mintAmount = ethers.parseUnits("10000", 6);
    console.log(`  ${label} QUSDC low (${ethers.formatUnits(bal, 6)}). Minting 10,000.`);
    await (await qusdc.connect(wallet).mint(wallet.address, mintAmount)).wait();
  }
}

async function scoreOf(v2, address) {
  const p = await v2.getTrustProfile(address);
  return { score: Number(p.trustScore), tier: Number(p.tier), completed: Number(p.completedAgreements) };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const client = new ethers.Wallet(CLIENT_KEY, ethers.provider);

  const v2 = await ethers.getContractAt("TrustFlowV2", V2_ADDRESS);
  const qusdc = await ethers.getContractAt("MockQUSDC", QUSDC_ADDRESS);

  console.log("Creator (deployer):", deployer.address);
  console.log("Client (test wallet):", client.address);

  const start = await scoreOf(v2, deployer.address);
  console.log("\nCurrent creator score:", start.score, "| tier:", start.tier, "| completed:", start.completed);

  console.log("\nPlan:");
  console.log("  Target: 800+ (Tier 3, Elite)");
  console.log("  Each $80 agreement adds ~900 points (800 volume + 100 completed)");
  console.log("  Agreements needed from score 0: 1");
  console.log("  Estimated QUSDC needed: ~$80 (Tier 3) + ~$50 (Tier 2 demo wallet) = $130");

  // Make sure both parties have gas + the client has QUSDC.
  await ensureGas(deployer, client, "client");
  await ensureQusdc(qusdc, client, ethers.parseUnits("2000", 6), "client");

  // --- Elevate deployer to Tier 3 ---
  let cur = start;
  let i = 0;
  while (cur.score < 800 && i < 4) {
    i++;
    console.log(`\nCycle ${i}: running $80 agreement (deployer creator, test client funds)...`);
    await runCycle(v2, qusdc, deployer, client, TIER3_AMOUNT, `Demo Tier3 #${i}`);
    cur = await scoreOf(v2, deployer.address);
    console.log(`  Running score: ${cur.score} (tier ${cur.tier}, ${cur.completed} completed)`);
  }

  const final = await scoreOf(v2, deployer.address);

  // --- Optional: dedicated Tier 2 demo wallet (for upfront-release demo) ---
  // The deployer jumps straight past Tier 2 to Tier 3, so a separate wallet is
  // needed to demo the 25% upfront release that only fires at exactly Tier 2.
  console.log("\nSeeding a separate Tier 2 demo wallet (for the 25% upfront-release demo)...");
  const tier2Wallet = ethers.Wallet.createRandom().connect(ethers.provider);
  await ensureGas(deployer, tier2Wallet, "tier2 wallet");
  await runCycle(v2, qusdc, tier2Wallet, client, TIER2_AMOUNT, "Demo Tier2");
  const t2 = await scoreOf(v2, tier2Wallet.address);

  console.log("\n=== TIER 3 DEMO WALLET READY ===");
  console.log("Creator wallet:", deployer.address);
  console.log("Final trust score:", final.score);
  console.log("Final tier:", final.tier, final.tier === 3 ? "(Elite)" : "");
  console.log("Completed agreements:", final.completed);
  console.log("Enforced terms now active: Tier 3 auto-claim (24h window)");
  console.log("================================");

  console.log("\n=== TIER 2 DEMO WALLET READY ===");
  console.log("Tier 2 creator wallet:", tier2Wallet.address);
  console.log("Tier 2 private key:", tier2Wallet.privateKey);
  console.log("Trust score:", t2.score, "| tier:", t2.tier, t2.tier === 2 ? "(Trusted)" : "");
  console.log("Enforced terms: 25% of each milestone released upfront on funding");
  console.log("Import this key into MetaMask to demo the upfront release.");
  console.log("================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
