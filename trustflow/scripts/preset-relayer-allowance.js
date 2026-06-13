const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const RELAYER_KEY = process.env.RELAYER_PRIVATE_KEY;
  if (!RELAYER_KEY) {
    console.error("Set RELAYER_PRIVATE_KEY env var");
    process.exit(1);
  }

  const TRUSTFLOW_V2 = "0xcD0915cb3423F6665C636d723648F78d88B81e52";
  const MOCK_QUSDC = "0x1850d2a31CB8669Ba757159B638DE19Af532ba5e";
  const MAX_UINT256 = ethers.MaxUint256;

  const provider = ethers.provider;
  const relayer = new ethers.Wallet(RELAYER_KEY, provider);

  const qusdc = new ethers.Contract(
    MOCK_QUSDC,
    ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"],
    relayer
  );

  console.log("Relayer:", relayer.address);
  const currentAllowance = await qusdc.allowance(relayer.address, TRUSTFLOW_V2);
  console.log("Current allowance:", currentAllowance.toString());

  if (currentAllowance < MAX_UINT256 / 2n) {
    console.log("Setting max allowance...");
    const tx = await qusdc.approve(TRUSTFLOW_V2, MAX_UINT256);
    await tx.wait();
    console.log("Allowance set:", tx.hash);
  } else {
    console.log("Allowance already sufficient");
  }

  const newAllowance = await qusdc.allowance(relayer.address, TRUSTFLOW_V2);
  console.log("Final allowance:", newAllowance.toString());
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
