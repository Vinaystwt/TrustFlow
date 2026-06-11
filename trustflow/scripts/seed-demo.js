const hre = require("hardhat");

async function getDemoSigners(ethers) {
  const signers = await ethers.getSigners();

  if (signers.length >= 3) {
    return signers.slice(0, 3);
  }

  const deployer = signers[0];
  const provider = ethers.provider;
  const freelancer = ethers.Wallet.createRandom().connect(provider);
  const client = ethers.Wallet.createRandom().connect(provider);
  const gasFundingAmount = ethers.parseEther("0.05");

  await (await deployer.sendTransaction({ to: freelancer.address, value: gasFundingAmount })).wait();
  await (await deployer.sendTransaction({ to: client.address, value: gasFundingAmount })).wait();

  return [deployer, freelancer, client];
}

async function createAgreement(trustFlow, freelancer, clientAddress, title, description, names, amounts, domain) {
  const tx = await trustFlow
    .connect(freelancer)
    .createAgreement(title, description, clientAddress, names, amounts, domain);
  await tx.wait();
  return trustFlow.agreementCounter();
}

async function logTrustProfile(trustFlow, label, address) {
  const profile = await trustFlow.getTrustProfile(address);
  console.log(
    `${label} trust score: ${profile.trustScore.toString()} | tier: ${profile.tier.toString()} | completed: ${profile.completedAgreements.toString()} | volume: ${profile.totalVolumeUSDC.toString()}`
  );
}

async function main() {
  const { ethers } = hre;
  const [deployer, freelancer, client] = await getDemoSigners(ethers);

  console.log("Seeding TrustFlow demo data");
  console.log("Deployer:", deployer.address);
  console.log("Freelancer:", freelancer.address);
  console.log("Client:", client.address);

  const MockQUSDC = await ethers.getContractFactory("MockQUSDC");
  const qusdc = await MockQUSDC.deploy();
  await qusdc.waitForDeployment();

  const TrustFlow = await ethers.getContractFactory("TrustFlow");
  const trustFlow = await TrustFlow.deploy(await qusdc.getAddress(), deployer.address, 50);
  await trustFlow.waitForDeployment();

  const trustFlowAddress = await trustFlow.getAddress();
  const mintAmount = ethers.parseUnits("100000", 6);

  for (const signer of [deployer, freelancer, client]) {
    await (await qusdc.mint(signer.address, mintAmount)).wait();
  }

  const agreement1Amounts = [ethers.parseUnits("500", 6), ethers.parseUnits("300", 6)];
  const agreement1Total = agreement1Amounts.reduce((sum, amount) => sum + amount, 0n);
  const agreement1Id = await createAgreement(
    trustFlow,
    freelancer,
    client.address,
    "Logo Design Package",
    "Logo design and brand asset delivery",
    ["Logo concepts", "Final brand package"],
    agreement1Amounts,
    "design"
  );

  await (await qusdc.connect(client).approve(trustFlowAddress, agreement1Total)).wait();
  await (await trustFlow.connect(client).fundAgreement(agreement1Id)).wait();
  await (await trustFlow.connect(freelancer).completeMilestone(agreement1Id, 0, "https://example.com/logo-v1.png")).wait();
  await (await trustFlow.connect(client).approveMilestone(agreement1Id, 0)).wait();

  const agreement2Amounts = [
    ethers.parseUnits("1000", 6),
    ethers.parseUnits("800", 6),
    ethers.parseUnits("700", 6)
  ];
  const agreement2Total = agreement2Amounts.reduce((sum, amount) => sum + amount, 0n);
  const agreement2Id = await createAgreement(
    trustFlow,
    freelancer,
    client.address,
    "Website Redesign",
    "Full website redesign and implementation",
    ["UX audit", "Visual redesign", "Implementation handoff"],
    agreement2Amounts,
    "web"
  );

  await (await qusdc.connect(client).approve(trustFlowAddress, agreement2Total)).wait();
  await (await trustFlow.connect(client).fundAgreement(agreement2Id)).wait();

  for (let i = 0; i < agreement2Amounts.length; i++) {
    await (await trustFlow.connect(freelancer).completeMilestone(agreement2Id, i, `https://example.com/website-proof-${i + 1}.png`)).wait();
    await (await trustFlow.connect(client).approveMilestone(agreement2Id, i)).wait();
  }

  await (await trustFlow.setQiePassVerified(freelancer.address, true)).wait();

  console.log("MockQUSDC:", await qusdc.getAddress());
  console.log("TrustFlow:", trustFlowAddress);
  await logTrustProfile(trustFlow, "Deployer", deployer.address);
  await logTrustProfile(trustFlow, "Freelancer", freelancer.address);
  await logTrustProfile(trustFlow, "Client", client.address);
  console.log("Demo data seeded successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
