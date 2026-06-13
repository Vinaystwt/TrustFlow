const hre = require("hardhat");

async function main() {
  const MOCK_QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";
  const MINT_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 QUSDC

  const [signer] = await ethers.getSigners();
  const deployerAddress = await signer.getAddress();

  console.log("Deployer address:", deployerAddress);

  const mockQUSDC = await ethers.getContractAt("MockQUSDC", MOCK_QUSDC_ADDRESS);

  // Check current balance first
  const before = await mockQUSDC.balanceOf(deployerAddress);
  console.log("Balance before:", ethers.formatUnits(before, 6), "QUSDC");

  console.log("Minting 10,000 QUSDC to", deployerAddress);
  const tx = await mockQUSDC.mint(deployerAddress, MINT_AMOUNT);
  console.log("Transaction:", tx.hash);

  await tx.wait();
  console.log("Confirmed");

  const balance = await mockQUSDC.balanceOf(deployerAddress);
  console.log("New balance:", ethers.formatUnits(balance, 6), "QUSDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
