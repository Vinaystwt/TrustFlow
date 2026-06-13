const hre = require("hardhat");

async function main() {
  const MOCK_QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";
  const QIE_GAS_AMOUNT = ethers.parseEther("0.1"); // 0.1 QIE for gas
  const QUSDC_AMOUNT = ethers.parseUnits("5000", 6); // 5,000 QUSDC

  // Generate fresh wallet
  const newWallet = ethers.Wallet.createRandom();
  console.log("\n=== NEW TEST CLIENT WALLET ===");
  console.log("Address:", newWallet.address);
  console.log("Private Key:", newWallet.privateKey);
  console.log("===============================\n");
  console.log("IMPORT THIS PRIVATE KEY INTO METAMASK BEFORE PROCEEDING");
  console.log("Use this wallet as the CLIENT in the smoke test\n");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Funding from deployer:", deployerAddress);

  // Check deployer QIE balance
  const deployerQIE = await ethers.provider.getBalance(deployerAddress);
  console.log("Deployer QIE balance:", ethers.formatEther(deployerQIE), "QIE");

  // Step 1: Send QIE for gas
  console.log("Sending 0.1 QIE for gas...");
  const qieTx = await deployer.sendTransaction({
    to: newWallet.address,
    value: QIE_GAS_AMOUNT
  });
  await qieTx.wait();
  console.log("Gas sent:", qieTx.hash);

  // Step 2: Mint MockQUSDC to the new wallet
  const mockQUSDC = await ethers.getContractAt("MockQUSDC", MOCK_QUSDC_ADDRESS);
  console.log("Minting 5,000 QUSDC...");
  const mintTx = await mockQUSDC.mint(newWallet.address, QUSDC_AMOUNT);
  await mintTx.wait();
  console.log("Minted:", mintTx.hash);

  // Step 3: Verify balances
  const qieBalance = await ethers.provider.getBalance(newWallet.address);
  const qusdcBalance = await mockQUSDC.balanceOf(newWallet.address);

  console.log("\n=== TEST CLIENT FUNDED ===");
  console.log("Address:", newWallet.address);
  console.log("QIE Balance:", ethers.formatEther(qieBalance), "QIE");
  console.log("QUSDC Balance:", ethers.formatUnits(qusdcBalance, 6), "QUSDC");
  console.log("==========================");
  console.log("\nNext step: Import private key into MetaMask, then proceed with smoke test");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
