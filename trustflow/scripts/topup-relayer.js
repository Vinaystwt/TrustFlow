const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  const relayer = "0xD9123f136D95010716F8D8c6C78443951233bA08";

  console.log("Sending 5 QIE to relayer...");
  const tx = await deployer.sendTransaction({
    to: relayer,
    value: ethers.parseEther("5"),
  });
  await tx.wait();

  const bal = await ethers.provider.getBalance(relayer);
  console.log("Relayer QIE after topup:", ethers.formatEther(bal));
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
