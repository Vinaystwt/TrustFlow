const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Existing testnet deployment (reused, not redeployed)
  const MOCK_QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";
  const V1_ADDRESS = "0x9db2e380f9100793ea71413224dD7C22F97aD91B";
  const PLATFORM_FEE_BPS = 50;

  const [deployer] = await ethers.getSigners();
  const feeRecipient = deployer.address;

  console.log("Deploying TrustFlowV2 with:", deployer.address);
  console.log("Reusing MockQUSDC at:", MOCK_QUSDC_ADDRESS);

  const TrustFlowV2 = await ethers.getContractFactory("TrustFlowV2");
  const v2 = await TrustFlowV2.deploy(MOCK_QUSDC_ADDRESS, feeRecipient, PLATFORM_FEE_BPS);
  await v2.waitForDeployment();
  const v2Address = await v2.getAddress();

  // Verify deployment with view calls
  const counter = await v2.agreementCounter();
  const fee = await v2.platformFeeBps();
  const token = await v2.qusdc();
  const upfrontBps = await v2.TIER2_UPFRONT_BPS();

  console.log("\nVerification view calls:");
  console.log("  agreementCounter:", counter.toString());
  console.log("  platformFeeBps:", fee.toString());
  console.log("  qusdc:", token);
  console.log("  TIER2_UPFRONT_BPS:", upfrontBps.toString());

  console.log("\n=== TRUSTFLOW V2 DEPLOYED ===");
  console.log("TrustFlowV2:", v2Address);
  console.log("MockQUSDC (existing):", MOCK_QUSDC_ADDRESS);
  console.log("V1 (fallback, still live):", V1_ADDRESS);
  console.log("=============================");

  console.log("\nUpdate frontend .env.local:");
  console.log("NEXT_PUBLIC_TRUSTFLOW_ADDRESS=" + v2Address);
  console.log("NEXT_PUBLIC_TRUSTFLOW_V1_FALLBACK=" + V1_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
