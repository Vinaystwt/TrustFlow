const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const qusdcAddress = process.env.QUSDC_MAINNET || "0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5";
  const feeRecipient = process.env.FEE_RECIPIENT;

  if (!feeRecipient) {
    throw new Error("FEE_RECIPIENT is required for mainnet deployment");
  }

  console.log("Deploying TrustFlow mainnet contract with:", deployer.address);
  console.log("QUSDC:", qusdcAddress);
  console.log("Fee recipient:", feeRecipient);

  const TrustFlow = await ethers.getContractFactory("TrustFlow");
  const trustFlow = await TrustFlow.deploy(qusdcAddress, feeRecipient, 50);
  await trustFlow.waitForDeployment();

  console.log("TrustFlow deployed to:", await trustFlow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
