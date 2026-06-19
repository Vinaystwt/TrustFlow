const hre = require("hardhat");

const { ethers } = hre;

const DEPLOYER_ADDRESS = "0x94c188F8280cA706949CC030F69e42B5544514ac";
const LEGACY_FACTORY = "0x8E23128a5511223bE6c0d64106e2D4508C08398C";
const CURRENT_ROUTER = "0x2601a070A12749BC2ee095F17D9fbe904505C2dF";
const CURRENT_FACTORY = "0xf297CC2e3A711fEeadf54a59a8162b71189E03d7";
const WETH_ADDRESS = "0x95322ccB3fb8dDefD210805EE18662762a0bc4A2";
const WQIE_ADDRESS = "0x0087904D95BEe9E5F24dc8852804b547981A9139";
const QUSDC_ADDRESS = "0x3F43DA82eC9A4f5285F10FaF1F26EcA7319E5DA5";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external"
];

const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

const WQIE_ABI = [
  ...ERC20_ABI,
  "function withdraw(uint256 wad) external"
];

function eqAddress(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function formatUnits(amount, decimals) {
  return ethers.formatUnits(amount, decimals);
}

function getAmountOut(amountIn, reserveIn, reserveOut) {
  if (amountIn <= 0n) {
    throw new Error("Amount in must be greater than zero");
  }
  if (reserveIn <= 0n || reserveOut <= 0n) {
    throw new Error("Pair has insufficient liquidity");
  }

  const amountInWithFee = amountIn * 997n;
  return (amountInWithFee * reserveOut) / ((reserveIn * 1000n) + amountInWithFee);
}

async function getPairInfo(pairAddress, inputToken, outputToken) {
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, ethers.provider);
  const [token0, token1, reserves] = await Promise.all([
    pair.token0(),
    pair.token1(),
    pair.getReserves()
  ]);

  if (!eqAddress(token0, inputToken) && !eqAddress(token1, inputToken)) {
    throw new Error(`Input token ${inputToken} is not in pair ${pairAddress}`);
  }
  if (!eqAddress(token0, outputToken) && !eqAddress(token1, outputToken)) {
    throw new Error(`Output token ${outputToken} is not in pair ${pairAddress}`);
  }

  const inputIsToken0 = eqAddress(token0, inputToken);
  return {
    pair,
    pairAddress,
    token0,
    token1,
    reserveIn: inputIsToken0 ? reserves.reserve0 : reserves.reserve1,
    reserveOut: inputIsToken0 ? reserves.reserve1 : reserves.reserve0,
    amount0OutFor(outputAmount) {
      return eqAddress(token0, outputToken) ? outputAmount : 0n;
    },
    amount1OutFor(outputAmount) {
      return eqAddress(token1, outputToken) ? outputAmount : 0n;
    }
  };
}

async function logPair(label, pairAddress, inputToken, outputToken) {
  const info = await getPairInfo(pairAddress, inputToken, outputToken);
  console.log(`${label}: ${pairAddress}`);
  console.log("  token0:", info.token0);
  console.log("  token1:", info.token1);
  console.log("  reserveIn:", info.reserveIn.toString());
  console.log("  reserveOut:", info.reserveOut.toString());
  return info;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 1990n) {
    throw new Error(`Wrong network. Expected QIE mainnet chainId 1990, got ${network.chainId.toString()}`);
  }
  if (!eqAddress(deployer.address, DEPLOYER_ADDRESS)) {
    throw new Error(`Unexpected deployer ${deployer.address}. Expected ${DEPLOYER_ADDRESS}`);
  }

  const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, deployer);
  const wqie = new ethers.Contract(WQIE_ADDRESS, WQIE_ABI, deployer);
  const factory = new ethers.Contract(LEGACY_FACTORY, FACTORY_ABI, ethers.provider);

  const [nativeBefore, wethBalance, wethDecimals, wqieDecimals] = await Promise.all([
    ethers.provider.getBalance(deployer.address),
    weth.balanceOf(deployer.address),
    weth.decimals(),
    wqie.decimals()
  ]);

  console.log("=== QIE MAINNET WETH -> QIE SWAP ===");
  console.log("Network chainId:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Native QIE before:", ethers.formatEther(nativeBefore));
  console.log("WETH before:", formatUnits(wethBalance, wethDecimals));
  console.log("Current router:", CURRENT_ROUTER);
  console.log("Current factory:", CURRENT_FACTORY);
  console.log("Legacy factory:", LEGACY_FACTORY);

  if (wethBalance === 0n) {
    console.log("No WETH balance. Skipping swap.");
    return;
  }

  const amountIn = (wethBalance * 90n) / 100n;
  const minOutputBps = 9500n;
  console.log("WETH input (90%):", formatUnits(amountIn, wethDecimals));

  const [directPair, wethQusdcPair, qusdcWqiePair] = await Promise.all([
    factory.getPair(WETH_ADDRESS, WQIE_ADDRESS),
    factory.getPair(WETH_ADDRESS, QUSDC_ADDRESS),
    factory.getPair(QUSDC_ADDRESS, WQIE_ADDRESS)
  ]);

  console.log("Legacy WETH/WQIE pair:", directPair);
  console.log("Legacy WETH/QUSDC pair:", wethQusdcPair);
  console.log("Legacy QUSDC/WQIE pair:", qusdcWqiePair);

  if (directPair !== ZERO_ADDRESS) {
    const directInfo = await logPair("Using direct WETH/WQIE pair", directPair, WETH_ADDRESS, WQIE_ADDRESS);
    const expectedWqie = getAmountOut(amountIn, directInfo.reserveIn, directInfo.reserveOut);
    const minWqie = (expectedWqie * minOutputBps) / 10000n;

    console.log("Expected WQIE:", formatUnits(expectedWqie, wqieDecimals));
    console.log("Minimum WQIE (5% slippage):", formatUnits(minWqie, wqieDecimals));

    const wqieBefore = await wqie.balanceOf(deployer.address);
    await (await weth.transfer(directPair, amountIn)).wait();
    await (
      await directInfo.pair.connect(deployer).swap(
        directInfo.amount0OutFor(expectedWqie),
        directInfo.amount1OutFor(expectedWqie),
        deployer.address,
        "0x"
      )
    ).wait();

    const wqieAfterSwap = await wqie.balanceOf(deployer.address);
    const wqieReceived = wqieAfterSwap - wqieBefore;
    if (wqieReceived < minWqie) {
      throw new Error(`WQIE received ${wqieReceived.toString()} is below minimum ${minWqie.toString()}`);
    }

    await (await wqie.withdraw(wqieReceived)).wait();
    const nativeAfter = await ethers.provider.getBalance(deployer.address);

    console.log("WQIE received and unwrapped:", formatUnits(wqieReceived, wqieDecimals));
    console.log("Native QIE after:", ethers.formatEther(nativeAfter));
    console.log("=== SWAP COMPLETE ===");
    return;
  }

  if (wethQusdcPair === ZERO_ADDRESS || qusdcWqiePair === ZERO_ADDRESS) {
    throw new Error("No usable legacy WETH/WQIE or WETH/QUSDC/QUSDC/WQIE route found");
  }

  const firstHop = await logPair("Using first hop WETH/QUSDC", wethQusdcPair, WETH_ADDRESS, QUSDC_ADDRESS);
  const secondHop = await logPair("Using second hop QUSDC/WQIE", qusdcWqiePair, QUSDC_ADDRESS, WQIE_ADDRESS);
  const expectedQusdc = getAmountOut(amountIn, firstHop.reserveIn, firstHop.reserveOut);
  const expectedWqie = getAmountOut(expectedQusdc, secondHop.reserveIn, secondHop.reserveOut);
  const minWqie = (expectedWqie * minOutputBps) / 10000n;

  console.log("Expected QUSDC intermediate:", expectedQusdc.toString());
  console.log("Expected WQIE:", formatUnits(expectedWqie, wqieDecimals));
  console.log("Minimum WQIE (5% slippage):", formatUnits(minWqie, wqieDecimals));

  const wqieBefore = await wqie.balanceOf(deployer.address);

  console.log("Transferring WETH to first pair...");
  await (await weth.transfer(wethQusdcPair, amountIn)).wait();

  console.log("Swapping WETH -> QUSDC into second pair...");
  await (
    await firstHop.pair.connect(deployer).swap(
      firstHop.amount0OutFor(expectedQusdc),
      firstHop.amount1OutFor(expectedQusdc),
      qusdcWqiePair,
      "0x"
    )
  ).wait();

  console.log("Swapping QUSDC -> WQIE to deployer...");
  await (
    await secondHop.pair.connect(deployer).swap(
      secondHop.amount0OutFor(expectedWqie),
      secondHop.amount1OutFor(expectedWqie),
      deployer.address,
      "0x"
    )
  ).wait();

  const wqieAfterSwap = await wqie.balanceOf(deployer.address);
  const wqieReceived = wqieAfterSwap - wqieBefore;
  if (wqieReceived < minWqie) {
    throw new Error(`WQIE received ${wqieReceived.toString()} is below minimum ${minWqie.toString()}`);
  }

  console.log("Unwrapping WQIE -> native QIE...");
  await (await wqie.withdraw(wqieReceived)).wait();

  const [nativeAfter, wethAfter] = await Promise.all([
    ethers.provider.getBalance(deployer.address),
    weth.balanceOf(deployer.address)
  ]);

  console.log("WQIE received and unwrapped:", formatUnits(wqieReceived, wqieDecimals));
  console.log("Native QIE after:", ethers.formatEther(nativeAfter));
  console.log("WETH after:", formatUnits(wethAfter, wethDecimals));
  console.log("=== SWAP COMPLETE ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
