const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TrustFlow testnet contracts with:", deployer.address);

  const MockQUSDC = await ethers.getContractFactory("MockQUSDC");
  const mockQusdc = await MockQUSDC.deploy();
  await mockQusdc.waitForDeployment();
  const mockQusdcAddress = await mockQusdc.getAddress();

  const TrustFlow = await ethers.getContractFactory("TrustFlow");
  const trustFlow = await TrustFlow.deploy(mockQusdcAddress, deployer.address, 50);
  await trustFlow.waitForDeployment();
  const trustFlowAddress = await trustFlow.getAddress();

  console.log("MockQUSDC deployed to:", mockQusdcAddress);
  console.log("TrustFlow deployed to:", trustFlowAddress);
  console.log("Fee recipient:", deployer.address);
  console.log("Platform fee bps:", "50");
  console.log("Add these to your frontend .env file");
  console.log("NEXT_PUBLIC_TRUSTFLOW_ADDRESS=", trustFlowAddress);
  console.log("NEXT_PUBLIC_QUSDC_ADDRESS=", mockQusdcAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
