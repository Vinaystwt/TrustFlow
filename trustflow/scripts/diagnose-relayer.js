/**
 * Diagnostic script: reproduce the exact relayer fund flow to find the revert reason.
 * Run: npx hardhat run scripts/diagnose-relayer.js --network qieTestnet
 */

const hre = require("hardhat");

const TRUSTFLOW_ADDRESS = "0xcD0915cb3423F6665C636d723648F78d88B81e52";
const QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";
const RELAYER_KEY = "0x0d23213c466fe2db59f6a5892775d546c76a0c22c6c791762d79b2f19437e08f";

async function main() {
  const { ethers } = hre;
  const provider = ethers.provider;

  const [deployer] = await ethers.getSigners();
  const relayer = new ethers.Wallet(RELAYER_KEY, provider);

  console.log("=== RELAYER DIAGNOSTICS ===");
  console.log("Deployer:", deployer.address);
  console.log("Relayer:", relayer.address);

  // 1. Check balances
  const relayerQIE = await provider.getBalance(relayer.address);
  console.log("\nRelayer QIE:", ethers.formatEther(relayerQIE));

  const qusdc = new ethers.Contract(QUSDC_ADDRESS, [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function mint(address,uint256)",
  ], provider);

  const relayerQUSDC = await qusdc.balanceOf(relayer.address);
  console.log("Relayer QUSDC:", ethers.formatUnits(relayerQUSDC, 6));

  const trustFlow = new ethers.Contract(TRUSTFLOW_ADDRESS, [
    "function createAgreement(string,string,address,string[],uint256[],string) returns (uint256)",
    "function fundAgreement(uint256)",
    "function getAgreement(uint256) view returns (tuple(uint256 id, address creator, address client, string title, string description, string creatorDomain, uint8 status, uint256 totalAmount, uint256 paidAmount, uint256 createdAt, uint256 completedAt, uint256 milestoneCount))",
    "function agreementCounter() view returns (uint256)",
  ], provider);

  // 2. Create a test agreement: deployer is creator, relayer is client
  console.log("\n--- Creating test agreement ---");
  const amount = ethers.parseUnits("10", 6); // 10 QUSDC, same as demo
  let agreementId;
  try {
    const createTx = await trustFlow.connect(deployer).createAgreement(
      "Diagnostic Test",
      "Testing relayer fund flow",
      relayer.address,
      ["Test Milestone"],
      [amount],
      ""
    );
    const receipt = await createTx.wait();
    agreementId = await trustFlow.agreementCounter();
    console.log("Created agreement ID:", agreementId.toString());
  } catch (e) {
    console.error("CREATE FAILED:", e.message);
    return;
  }

  // 3. Read the agreement
  const agreement = await trustFlow.getAgreement(agreementId);
  console.log("Agreement client:", agreement.client);
  console.log("Agreement status:", agreement.status, "(0=Draft, 1=Active)");
  console.log("Agreement totalAmount:", ethers.formatUnits(agreement.totalAmount, 6), "QUSDC");

  // 4. Check current allowance
  const currentAllowance = await qusdc.allowance(relayer.address, TRUSTFLOW_ADDRESS);
  console.log("Current QUSDC allowance for TrustFlow:", ethers.formatUnits(currentAllowance, 6));

  // 5. Now simulate the EXACT API route sequence
  console.log("\n--- Simulating API route fund sequence ---");

  // Step A: approve if needed (same as API route)
  if (currentAllowance < agreement.totalAmount) {
    console.log("Allowance insufficient, sending approve tx...");
    try {
      const approveTx = await qusdc.connect(relayer).approve(
        TRUSTFLOW_ADDRESS,
        ethers.MaxUint256
      );
      console.log("Approve tx hash:", approveTx.hash);
      const approveReceipt = await approveTx.wait();
      console.log("Approve tx confirmed in block:", approveReceipt.blockNumber);
    } catch (e) {
      console.error("APPROVE FAILED:", e.message);
      // Try to decode revert
      if (e.data) console.error("Revert data:", e.data);
      return;
    }
  } else {
    console.log("Allowance sufficient, skipping approve");
  }

  // Verify allowance after approve
  const newAllowance = await qusdc.allowance(relayer.address, TRUSTFLOW_ADDRESS);
  console.log("Allowance after approve:", ethers.formatUnits(newAllowance, 6));

  // Step B: fund the agreement (same as API route)
  console.log("\nCalling fundAgreement...");
  try {
    const fundTx = await trustFlow.connect(relayer).fundAgreement(agreementId);
    console.log("Fund tx hash:", fundTx.hash);
    const fundReceipt = await fundTx.wait();
    console.log("Fund tx confirmed in block:", fundReceipt.blockNumber);
    console.log("SUCCESS: Fund completed without error");
  } catch (e) {
    console.error("\n!!! FUND FAILED !!!");
    console.error("Error message:", e.message);
    if (e.reason) console.error("Revert reason:", e.reason);
    if (e.data) console.error("Revert data:", e.data);
    if (e.code) console.error("Error code:", e.code);
    // Try static call to get revert reason
    try {
      console.log("\nAttempting static call for detailed revert...");
      await trustFlow.connect(relayer).fundAgreement.staticCall(agreementId);
    } catch (staticErr) {
      console.error("Static call revert:", staticErr.message);
      if (staticErr.reason) console.error("Static call reason:", staticErr.reason);
    }
  }

  // 6. Also test: what happens if we try to fund without waiting for approve?
  // (This is the suspected bug in the viem API route)
  console.log("\n--- Testing race condition scenario ---");
  // Create another agreement
  try {
    const createTx2 = await trustFlow.connect(deployer).createAgreement(
      "Race Condition Test",
      "Testing approve-then-fund without waiting",
      relayer.address,
      ["Test"],
      [amount],
      ""
    );
    await createTx2.wait();
    const agId2 = await trustFlow.agreementCounter();
    console.log("Created agreement ID:", agId2.toString());

    // Reset allowance to 0 first to force a fresh approve
    const resetTx = await qusdc.connect(relayer).approve(TRUSTFLOW_ADDRESS, 0);
    await resetTx.wait();
    console.log("Reset allowance to 0");

    // Now do approve WITHOUT waiting, then immediately fund
    console.log("Sending approve (not waiting for receipt)...");
    const approveTx2 = await qusdc.connect(relayer).approve(TRUSTFLOW_ADDRESS, ethers.MaxUint256);
    // DO NOT WAIT - immediately try to fund
    console.log("Immediately calling fundAgreement (no wait on approve)...");
    try {
      const fundTx2 = await trustFlow.connect(relayer).fundAgreement(agId2);
      await fundTx2.wait();
      console.log("Fund succeeded even without waiting for approve (nonce ordering handled it)");
    } catch (e2) {
      console.error("Fund failed (expected - race condition):", e2.message?.slice(0, 120));
    }
    // Wait for approve to confirm
    await approveTx2.wait();
  } catch (e) {
    console.error("Race condition test error:", e.message?.slice(0, 120));
  }

  console.log("\n=== DIAGNOSTICS COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
