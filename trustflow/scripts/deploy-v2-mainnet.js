const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const QUSDC_ADDRESS = process.env.QUSDC_MAINNET || "0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5";
  const PLATFORM_FEE_BPS = 50;
  const EXPECTED_DEPLOYER = "0x94c188F8280cA706949CC030F69e42B5544514ac";

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;

  if (network.chainId !== 1990n) {
    throw new Error(`Wrong network. Expected QIE mainnet chainId 1990, got ${network.chainId.toString()}`);
  }
  if (deployer.address.toLowerCase() !== EXPECTED_DEPLOYER.toLowerCase()) {
    throw new Error(`Unexpected deployer ${deployer.address}. Expected ${EXPECTED_DEPLOYER}`);
  }

  console.log("=== TRUSTFLOW V2 MAINNET DEPLOY ===");
  console.log("Network chainId:", network.chainId.toString());
  console.log("Deploying with:", deployer.address);
  console.log("QUSDC:", QUSDC_ADDRESS);
  console.log("Fee recipient:", feeRecipient);
  console.log("Platform fee bps:", PLATFORM_FEE_BPS.toString());

  const TrustFlowV2 = await ethers.getContractFactory("TrustFlowV2");
  const v2 = await TrustFlowV2.deploy(QUSDC_ADDRESS, feeRecipient, PLATFORM_FEE_BPS);
  await v2.waitForDeployment();
  const v2Address = await v2.getAddress();

  const [counter, token, fee, code] = await Promise.all([
    v2.agreementCounter(),
    v2.qusdc(),
    v2.platformFeeBps(),
    ethers.provider.getCode(v2Address)
  ]);

  if (counter !== 0n) {
    throw new Error(`Unexpected agreementCounter ${counter.toString()}`);
  }
  if (token.toLowerCase() !== QUSDC_ADDRESS.toLowerCase()) {
    throw new Error(`Unexpected QUSDC ${token}`);
  }
  if (code === "0x") {
    throw new Error("Deployment bytecode check failed");
  }

  console.log("\nVerification view calls:");
  console.log("  agreementCounter:", counter.toString());
  console.log("  qusdc:", token);
  console.log("  platformFeeBps:", fee.toString());
  console.log("  bytecode length:", code.length);

  console.log("\n=== TRUSTFLOW V2 MAINNET DEPLOYED ===");
  console.log("TrustFlowV2:", v2Address);
  console.log("QUSDC:", QUSDC_ADDRESS);
  console.log("Fee recipient:", feeRecipient);
  console.log("=====================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
