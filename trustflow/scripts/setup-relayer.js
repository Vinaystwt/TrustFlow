const hre = require("hardhat");
const { ethers } = hre;

const QUSDC_ADDRESS = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Generate fresh relayer wallet
  const relayer = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log("\n=== RELAYER WALLET GENERATED ===");
  console.log("Address:", relayer.address);
  console.log("Private Key:", relayer.privateKey);
  console.log("================================\n");

  // Fund with 1 QIE for gas
  console.log("Sending 1 QIE for gas...");
  const gasTx = await deployer.sendTransaction({
    to: relayer.address,
    value: ethers.parseEther("1"),
  });
  await gasTx.wait();
  console.log("  Gas funded. TX:", gasTx.hash);

  // Mint 100,000 MockQUSDC to relayer
  const qusdc = await ethers.getContractAt("MockQUSDC", QUSDC_ADDRESS);
  const mintAmount = ethers.parseUnits("100000", 6);
  console.log("Minting 100,000 QUSDC to relayer...");
  const mintTx = await qusdc.connect(deployer).mint(relayer.address, mintAmount);
  await mintTx.wait();
  console.log("  QUSDC minted. TX:", mintTx.hash);

  // Verify balances
  const qieBal = await ethers.provider.getBalance(relayer.address);
  const qusdcBal = await qusdc.balanceOf(relayer.address);
  console.log("\nRelayer balances:");
  console.log("  QIE:", ethers.formatEther(qieBal));
  console.log("  QUSDC:", ethers.formatUnits(qusdcBal, 6));

  console.log("\n=== ENVIRONMENT VARIABLES ===");
  console.log("Add these to your frontend/.env.local and Vercel:");
  console.log("");
  console.log("# Public (safe to expose)");
  console.log(`NEXT_PUBLIC_RELAYER_ADDRESS=${relayer.address}`);
  console.log("");
  console.log("# Server-side ONLY (Vercel env, NEVER committed, NEVER NEXT_PUBLIC)");
  console.log(`RELAYER_PRIVATE_KEY=${relayer.privateKey}`);
  console.log("");
  console.log("Set in Vercel via CLI:");
  console.log("  npx vercel env add RELAYER_PRIVATE_KEY production");
  console.log("  npx vercel env add NEXT_PUBLIC_RELAYER_ADDRESS production");
  console.log("=============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
