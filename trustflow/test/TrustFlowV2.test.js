const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustFlowV2", function () {
  const PLATFORM_FEE_BPS = 50n;
  const TIER2_UPFRONT_BPS = 2500n;
  const CLAIM_WINDOW = 24n * 60n * 60n; // 24 hours

  const Status = {
    Draft: 0n,
    Active: 1n,
    Completed: 2n,
    Cancelled: 3n
  };
  const MilestoneStatus = {
    Pending: 0n,
    Funded: 1n,
    Completed: 2n,
    Approved: 3n,
    Disputed: 4n,
    Claimed: 5n
  };

  let owner;
  let creator;
  let client;
  let feeRecipient;
  let other;
  let newFeeRecipient;
  let qusdc;
  let v2;

  const amount500 = ethers.parseUnits("500", 6);
  const amount300 = ethers.parseUnits("300", 6);
  const amount100 = ethers.parseUnits("100", 6);
  const initialMint = ethers.parseUnits("100000", 6);

  beforeEach(async function () {
    [owner, creator, client, feeRecipient, other, newFeeRecipient] = await ethers.getSigners();

    const MockQUSDC = await ethers.getContractFactory("MockQUSDC");
    qusdc = await MockQUSDC.deploy();
    await qusdc.waitForDeployment();

    const TrustFlowV2 = await ethers.getContractFactory("TrustFlowV2");
    v2 = await TrustFlowV2.deploy(await qusdc.getAddress(), feeRecipient.address, PLATFORM_FEE_BPS);
    await v2.waitForDeployment();

    for (const signer of [owner, creator, client, other]) {
      await qusdc.mint(signer.address, initialMint);
      await qusdc.connect(signer).approve(await v2.getAddress(), initialMint);
    }
  });

  async function createAgreement(options = {}) {
    const milestoneNames = options.names || ["Design", "Delivery"];
    const milestoneAmounts = options.amounts || [amount500, amount300];
    const tx = await v2.connect(options.creatorSigner || creator).createAgreement(
      options.title || "Logo Design Package",
      options.description || "Brand identity work",
      options.client || client.address,
      milestoneNames,
      milestoneAmounts,
      options.domain || "design"
    );
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => v2.interface.parseLog(log))
      .find((log) => log && log.name === "AgreementCreated");

    return event.args.agreementId;
  }

  async function createAndFundAgreement(options = {}) {
    const agreementId = await createAgreement(options);
    await v2.connect(options.client ? options.clientSigner : client).fundAgreement(agreementId);
    return agreementId;
  }

  async function completeAndApprove(agreementId, index = 0, proof = "ipfs://proof") {
    await v2.connect(creator).completeMilestone(agreementId, index, proof);
    await v2.connect(client).approveMilestone(agreementId, index);
  }

  // Elevate `creator` to a target tier by running a full agreement with controlled volume.
  // 1 QUSDC of approved volume = 10 trust points. 1 completed agreement = 100 points.
  async function runFullAgreement(amountQusdc, clientSigner) {
    const id = await createAgreement({
      title: "Elevation",
      client: clientSigner.address,
      names: ["work"],
      amounts: [amountQusdc]
    });
    await v2.connect(clientSigner).fundAgreement(id);
    await v2.connect(creator).completeMilestone(id, 0, "ipfs://elev");
    await v2.connect(clientSigner).approveMilestone(id, 0);
    return id;
  }

  // 40 QUSDC volume (400 pts) + 1 completed agreement (100 pts) = 500 → tier 2.
  async function elevateCreatorToTier2() {
    await runFullAgreement(ethers.parseUnits("40", 6), other);
    expect((await v2.getTrustProfile(creator.address)).tier).to.equal(2n);
  }

  // 70 QUSDC volume (700 pts) + 1 completed agreement (100 pts) = 800 → tier 3.
  async function elevateCreatorToTier3() {
    await runFullAgreement(ethers.parseUnits("70", 6), other);
    expect((await v2.getTrustProfile(creator.address)).tier).to.equal(3n);
  }

  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [Number(seconds)]);
    await ethers.provider.send("evm_mine", []);
  }

  // =========================================================================
  // V1 BEHAVIOR (preserved)
  // =========================================================================

  describe("Deployment", function () {
    it("Should set correct QUSDC address", async function () {
      expect(await v2.qusdc()).to.equal(await qusdc.getAddress());
    });

    it("Should set correct fee recipient", async function () {
      expect(await v2.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set correct platform fee", async function () {
      expect(await v2.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
    });

    it("Should expose tier-enforcement constants", async function () {
      expect(await v2.TIER2_UPFRONT_BPS()).to.equal(TIER2_UPFRONT_BPS);
      expect(await v2.TIER3_CLAIM_WINDOW()).to.equal(CLAIM_WINDOW);
      expect(await v2.TIER1_REFUND_WINDOW()).to.equal(48n * 60n * 60n);
    });
  });

  describe("Agreement Creation", function () {
    it("Should create an agreement with correct details", async function () {
      const agreementId = await createAgreement();
      const agreement = await v2.getAgreement(agreementId);
      const firstMilestone = await v2.getMilestone(agreementId, 0);

      expect(agreement.creator).to.equal(creator.address);
      expect(agreement.client).to.equal(client.address);
      expect(agreement.status).to.equal(Status.Draft);
      expect(agreement.totalAmount).to.equal(amount500 + amount300);
      expect(agreement.milestoneCount).to.equal(2n);
      expect(firstMilestone.name).to.equal("Design");
      expect(firstMilestone.amount).to.equal(amount500);
      expect(firstMilestone.status).to.equal(MilestoneStatus.Pending);
      expect(firstMilestone.upfrontReleased).to.equal(0n);
      expect(firstMilestone.claimableAfter).to.equal(0n);
    });

    it("Should increment agreement counter", async function () {
      await createAgreement();
      await createAgreement({ title: "Second Agreement" });
      expect(await v2.agreementCounter()).to.equal(2n);
    });

    it("Should add agreement to both users' agreement lists", async function () {
      const agreementId = await createAgreement();
      expect(await v2.getUserAgreements(creator.address)).to.deep.equal([agreementId]);
      expect(await v2.getUserAgreements(client.address)).to.deep.equal([agreementId]);
    });

    it("Should revert if client is zero address", async function () {
      await expect(createAgreement({ client: ethers.ZeroAddress })).to.be.revertedWith(
        "TrustFlowV2: client is zero address"
      );
    });

    it("Should revert if client is same as creator", async function () {
      await expect(createAgreement({ client: creator.address })).to.be.revertedWith(
        "TrustFlowV2: client cannot be creator"
      );
    });

    it("Should revert if no milestones provided", async function () {
      await expect(createAgreement({ names: [], amounts: [] })).to.be.revertedWith(
        "TrustFlowV2: invalid milestone count"
      );
    });

    it("Should revert if milestone names and amounts length mismatch", async function () {
      await expect(createAgreement({ names: ["Design"], amounts: [amount500, amount300] })).to.be.revertedWith(
        "TrustFlowV2: milestone length mismatch"
      );
    });
  });

  describe("Agreement Funding", function () {
    it("Should transfer QUSDC from client to contract (tier 0, full escrow)", async function () {
      const agreementId = await createAgreement();
      await expect(() => v2.connect(client).fundAgreement(agreementId)).to.changeTokenBalances(
        qusdc,
        [client, v2],
        [-(amount500 + amount300), amount500 + amount300]
      );
    });

    it("Should set agreement status to Active", async function () {
      const agreementId = await createAndFundAgreement();
      expect((await v2.getAgreement(agreementId)).status).to.equal(Status.Active);
    });

    it("Should set all milestones to Funded", async function () {
      const agreementId = await createAndFundAgreement();
      const milestones = await v2.getMilestones(agreementId);
      expect(milestones[0].status).to.equal(MilestoneStatus.Funded);
      expect(milestones[1].status).to.equal(MilestoneStatus.Funded);
    });

    it("Should revert if caller is not the client", async function () {
      const agreementId = await createAgreement();
      await expect(v2.connect(other).fundAgreement(agreementId)).to.be.revertedWith(
        "TrustFlowV2: caller is not client"
      );
    });

    it("Should revert if agreement is not in Draft status", async function () {
      const agreementId = await createAndFundAgreement();
      await expect(v2.connect(client).fundAgreement(agreementId)).to.be.revertedWith(
        "TrustFlowV2: agreement is not draft"
      );
    });
  });

  describe("Milestone Completion", function () {
    it("Should allow creator to mark milestone as completed", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      expect((await v2.getMilestone(agreementId, 0)).status).to.equal(MilestoneStatus.Completed);
    });

    it("Should store proof URI and completedAt", async function () {
      const agreementId = await createAndFundAgreement();
      const tx = await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://logo");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const m = await v2.getMilestone(agreementId, 0);
      expect(m.proofURI).to.equal("ipfs://logo");
      expect(m.completedAt).to.equal(block.timestamp);
    });

    it("Should NOT set claimableAfter for tier 0 creator", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      expect((await v2.getMilestone(agreementId, 0)).claimableAfter).to.equal(0n);
    });

    it("Should revert if caller is not creator", async function () {
      const agreementId = await createAndFundAgreement();
      await expect(v2.connect(client).completeMilestone(agreementId, 0, "ipfs://proof")).to.be.revertedWith(
        "TrustFlowV2: caller is not creator"
      );
    });

    it("Should revert if milestone is not Funded", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      await expect(v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://again")).to.be.revertedWith(
        "TrustFlowV2: milestone is not funded"
      );
    });
  });

  describe("Milestone Approval & Payment (tier 0, full escrow)", function () {
    it("Should transfer correct QUSDC amount to creator minus fee", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      const fee = (amount500 * PLATFORM_FEE_BPS) / 10000n;
      const payout = amount500 - fee;
      await expect(() => v2.connect(client).approveMilestone(agreementId, 0)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [payout, fee]
      );
    });

    it("Should set milestone to Approved and update paidAmount", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId);
      expect((await v2.getMilestone(agreementId, 0)).status).to.equal(MilestoneStatus.Approved);
      expect((await v2.getAgreement(agreementId)).paidAmount).to.equal(amount500);
    });

    it("Should mark agreement as Completed when all milestones approved", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId, 0, "ipfs://proof-1");
      await completeAndApprove(agreementId, 1, "ipfs://proof-2");
      const agreement = await v2.getAgreement(agreementId);
      expect(agreement.status).to.equal(Status.Completed);
      expect(agreement.completedAt).to.be.greaterThan(0n);
    });

    it("Should revert if caller is not client", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      await expect(v2.connect(other).approveMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: caller is not client"
      );
    });

    it("Should revert if milestone is not Completed", async function () {
      const agreementId = await createAndFundAgreement();
      await expect(v2.connect(client).approveMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: milestone is not completed"
      );
    });
  });

  describe("Trust Score", function () {
    it("Should start at 0 for new users", async function () {
      expect((await v2.getTrustProfile(other.address)).trustScore).to.equal(0n);
    });

    it("Should increase after milestone approval with volume component", async function () {
      const tenQusdc = ethers.parseUnits("10", 6);
      const oneQusdc = ethers.parseUnits("1", 6);
      const agreementId = await createAndFundAgreement({ names: ["Small", "Later"], amounts: [tenQusdc, oneQusdc] });
      await completeAndApprove(agreementId, 0);
      const expected = (tenQusdc / 1000000n) * 10n;
      expect((await v2.getTrustProfile(creator.address)).trustScore).to.equal(expected);
    });

    it("Should add verification bonus when QIE Pass is set", async function () {
      await v2.setQiePassVerified(creator.address, true);
      const profile = await v2.getTrustProfile(creator.address);
      expect(profile.qiePassVerified).to.equal(true);
      expect(profile.trustScore).to.equal(200n);
    });

    it("Should penalize disputes via cancellation", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(client).cancelAgreement(agreementId);
      const profile = await v2.getTrustProfile(creator.address);
      expect(profile.disputeCount).to.equal(1n);
      expect(profile.trustScore).to.equal(0n);
    });

    it("Should clamp score to max 1000", async function () {
      const agreementId = await createAndFundAgreement({ names: ["Large"], amounts: [ethers.parseUnits("1000", 6)] });
      await completeAndApprove(agreementId, 0);
      await v2.setQiePassVerified(creator.address, true);
      expect((await v2.getTrustProfile(creator.address)).trustScore).to.equal(1000n);
    });
  });

  describe("Agreement Cancellation", function () {
    it("Should allow either party to cancel Draft agreements", async function () {
      const firstId = await createAgreement();
      await v2.connect(creator).cancelAgreement(firstId);
      expect((await v2.getAgreement(firstId)).status).to.equal(Status.Cancelled);

      const secondId = await createAgreement({ title: "Client Cancelled" });
      await v2.connect(client).cancelAgreement(secondId);
      expect((await v2.getAgreement(secondId)).status).to.equal(Status.Cancelled);
    });

    it("Should allow only client to cancel Active agreements", async function () {
      const agreementId = await createAndFundAgreement();
      await expect(v2.connect(creator).cancelAgreement(agreementId)).to.be.revertedWith(
        "TrustFlowV2: caller is not client"
      );
    });

    it("Should refund remaining QUSDC to client on Active cancellation", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId, 0);
      const before = await qusdc.balanceOf(client.address);
      await v2.connect(client).cancelAgreement(agreementId);
      expect(await qusdc.balanceOf(client.address)).to.equal(before + amount300);
    });

    it("Should increment dispute count for both parties", async function () {
      const agreementId = await createAndFundAgreement();
      await v2.connect(client).cancelAgreement(agreementId);
      expect((await v2.getTrustProfile(creator.address)).disputeCount).to.equal(1n);
      expect((await v2.getTrustProfile(client.address)).disputeCount).to.equal(1n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await v2.updatePlatformFee(100);
      expect(await v2.platformFeeBps()).to.equal(100n);
    });

    it("Should revert if fee exceeds 500 bps", async function () {
      await expect(v2.updatePlatformFee(501)).to.be.revertedWith("TrustFlowV2: fee too high");
    });

    it("Should allow owner to update fee recipient", async function () {
      await v2.updateFeeRecipient(newFeeRecipient.address);
      expect(await v2.feeRecipient()).to.equal(newFeeRecipient.address);
    });
  });

  // =========================================================================
  // V2 TIER-ENFORCEMENT MECHANICS (new)
  // =========================================================================

  describe("Tier 2 Upfront Release", function () {
    it("Should release 25% of each milestone upfront on funding", async function () {
      await elevateCreatorToTier2();
      const agreementId = await createAgreement({ names: ["A", "B"], amounts: [amount500, amount300] });

      const upfront0 = (amount500 * TIER2_UPFRONT_BPS) / 10000n; // 125 QUSDC
      const upfront1 = (amount300 * TIER2_UPFRONT_BPS) / 10000n; // 75 QUSDC
      const totalUpfront = upfront0 + upfront1;
      const fee = (totalUpfront * PLATFORM_FEE_BPS) / 10000n;
      const payout = totalUpfront - fee;

      await expect(() => v2.connect(client).fundAgreement(agreementId)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [payout, fee]
      );

      const milestones = await v2.getMilestones(agreementId);
      expect(milestones[0].upfrontReleased).to.equal(upfront0);
      expect(milestones[1].upfrontReleased).to.equal(upfront1);
    });

    it("Should emit UpfrontReleased on funding", async function () {
      await elevateCreatorToTier2();
      const agreementId = await createAgreement({ names: ["A"], amounts: [amount500] });
      const upfront0 = (amount500 * TIER2_UPFRONT_BPS) / 10000n;
      await expect(v2.connect(client).fundAgreement(agreementId))
        .to.emit(v2, "UpfrontReleased")
        .withArgs(agreementId, 0, upfront0);
    });

    it("Should release only the remaining 75% on approval", async function () {
      await elevateCreatorToTier2();
      const agreementId = await createAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(client).fundAgreement(agreementId);
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");

      const upfront = (amount500 * TIER2_UPFRONT_BPS) / 10000n;
      const remaining = amount500 - upfront;
      const fee = (remaining * PLATFORM_FEE_BPS) / 10000n;
      const payout = remaining - fee;

      await expect(() => v2.connect(client).approveMilestone(agreementId, 0)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [payout, fee]
      );
    });

    it("Should pay creator exactly milestone amount minus fee total (no double payment)", async function () {
      await elevateCreatorToTier2();
      const agreementId = await createAgreement({ names: ["A"], amounts: [amount500] });

      const creatorBefore = await qusdc.balanceOf(creator.address);
      const feeBefore = await qusdc.balanceOf(feeRecipient.address);

      await v2.connect(client).fundAgreement(agreementId);
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await v2.connect(client).approveMilestone(agreementId, 0);

      const creatorDelta = (await qusdc.balanceOf(creator.address)) - creatorBefore;
      const feeDelta = (await qusdc.balanceOf(feeRecipient.address)) - feeBefore;
      const totalFee = (amount500 * PLATFORM_FEE_BPS) / 10000n;

      expect(creatorDelta + feeDelta).to.equal(amount500);
      expect(creatorDelta).to.equal(amount500 - totalFee);
      expect((await v2.getAgreement(agreementId)).paidAmount).to.equal(amount500);
    });
  });

  describe("Tier 3 Auto-Claim", function () {
    it("Should set claimableAfter to completedAt + 24h", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      const tx = await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      expect((await v2.getMilestone(agreementId, 0)).claimableAfter).to.equal(BigInt(block.timestamp) + CLAIM_WINDOW);
    });

    it("Should NOT release upfront for tier 3 (auto-claim instead)", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAgreement({ names: ["A"], amounts: [amount500] });
      await expect(() => v2.connect(client).fundAgreement(agreementId)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [0n, 0n]
      );
      expect((await v2.getMilestone(agreementId, 0)).upfrontReleased).to.equal(0n);
    });

    it("Should revert claim before window elapses", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await expect(v2.connect(creator).claimMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: claim window not elapsed"
      );
    });

    it("Should allow creator to claim after window and release payment", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await increaseTime(CLAIM_WINDOW + 1n);

      const fee = (amount500 * PLATFORM_FEE_BPS) / 10000n;
      const payout = amount500 - fee;
      await expect(() => v2.connect(creator).claimMilestone(agreementId, 0)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [payout, fee]
      );

      expect((await v2.getMilestone(agreementId, 0)).status).to.equal(MilestoneStatus.Claimed);
      expect((await v2.getAgreement(agreementId)).paidAmount).to.equal(amount500);
    });

    it("Should emit MilestoneClaimed", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await increaseTime(CLAIM_WINDOW + 1n);
      await expect(v2.connect(creator).claimMilestone(agreementId, 0))
        .to.emit(v2, "MilestoneClaimed")
        .withArgs(agreementId, 0, amount500);
    });

    it("Should mark agreement Completed when all milestones claimed", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await increaseTime(CLAIM_WINDOW + 1n);
      await v2.connect(creator).claimMilestone(agreementId, 0);
      expect((await v2.getAgreement(agreementId)).status).to.equal(Status.Completed);
    });

    it("Should revert claim by non-creator", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await increaseTime(CLAIM_WINDOW + 1n);
      await expect(v2.connect(client).claimMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: caller is not creator"
      );
    });

    it("Should revert claim if milestone not eligible (tier 0)", async function () {
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await expect(v2.connect(creator).claimMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: not eligible for auto-claim"
      );
    });
  });

  describe("Dispute Flow", function () {
    it("Should let client dispute a completed milestone and reset claim window", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      expect((await v2.getMilestone(agreementId, 0)).claimableAfter).to.be.greaterThan(0n);

      await v2.connect(client).disputeMilestone(agreementId, 0);
      const m = await v2.getMilestone(agreementId, 0);
      expect(m.status).to.equal(MilestoneStatus.Disputed);
      expect(m.claimableAfter).to.equal(0n);
    });

    it("Should prevent auto-claim after dispute", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await v2.connect(client).disputeMilestone(agreementId, 0);
      await increaseTime(CLAIM_WINDOW + 1n);
      await expect(v2.connect(creator).claimMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: milestone not completed"
      );
    });

    it("Should increment dispute count for both parties and lower trust scores", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");

      const creatorScoreBefore = (await v2.getTrustProfile(creator.address)).trustScore;
      await v2.connect(client).disputeMilestone(agreementId, 0);

      expect((await v2.getTrustProfile(creator.address)).disputeCount).to.equal(1n);
      expect((await v2.getTrustProfile(client.address)).disputeCount).to.equal(1n);
      expect((await v2.getTrustProfile(creator.address)).trustScore).to.be.lessThan(creatorScoreBefore);
    });

    it("Should emit MilestoneDisputed", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await expect(v2.connect(client).disputeMilestone(agreementId, 0))
        .to.emit(v2, "MilestoneDisputed")
        .withArgs(agreementId, 0);
    });

    it("Should revert dispute by non-client", async function () {
      await elevateCreatorToTier3();
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      await expect(v2.connect(other).disputeMilestone(agreementId, 0)).to.be.revertedWith(
        "TrustFlowV2: caller is not client"
      );
    });
  });

  describe("Tier 0/1 Unchanged (V1 behavior preserved)", function () {
    it("Tier 0: full escrow, no upfront, no auto-claim window", async function () {
      const agreementId = await createAndFundAgreement({ names: ["A"], amounts: [amount500] });
      const mAfterFund = await v2.getMilestone(agreementId, 0);
      expect(mAfterFund.upfrontReleased).to.equal(0n);

      await v2.connect(creator).completeMilestone(agreementId, 0, "ipfs://p");
      expect((await v2.getMilestone(agreementId, 0)).claimableAfter).to.equal(0n);

      const fee = (amount500 * PLATFORM_FEE_BPS) / 10000n;
      const payout = amount500 - fee;
      await expect(() => v2.connect(client).approveMilestone(agreementId, 0)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [payout, fee]
      );
    });

    it("Tier 1: full escrow, no upfront on funding", async function () {
      // QIE pass = 200 → tier 1
      await v2.setQiePassVerified(creator.address, true);
      expect((await v2.getTrustProfile(creator.address)).tier).to.equal(1n);

      const agreementId = await createAgreement({ names: ["A"], amounts: [amount500] });
      await expect(() => v2.connect(client).fundAgreement(agreementId)).to.changeTokenBalances(
        qusdc,
        [creator, feeRecipient],
        [0n, 0n]
      );
      expect((await v2.getMilestone(agreementId, 0)).upfrontReleased).to.equal(0n);
    });
  });

  describe("getEnforcedTerms", function () {
    it("Tier 0: full escrow terms", async function () {
      const terms = await v2.getEnforcedTerms(other.address);
      expect(terms.tier).to.equal(0n);
      expect(terms.tierName).to.equal("Newcomer");
      expect(terms.upfrontBps).to.equal(0n);
      expect(terms.hasAutoClaim).to.equal(false);
      expect(terms.claimWindowHours).to.equal(0n);
    });

    it("Tier 2: 25% upfront terms", async function () {
      await elevateCreatorToTier2();
      const terms = await v2.getEnforcedTerms(creator.address);
      expect(terms.tier).to.equal(2n);
      expect(terms.tierName).to.equal("Trusted");
      expect(terms.upfrontBps).to.equal(TIER2_UPFRONT_BPS);
      expect(terms.hasAutoClaim).to.equal(false);
    });

    it("Tier 3: auto-claim terms", async function () {
      await elevateCreatorToTier3();
      const terms = await v2.getEnforcedTerms(creator.address);
      expect(terms.tier).to.equal(3n);
      expect(terms.tierName).to.equal("Elite");
      expect(terms.hasAutoClaim).to.equal(true);
      expect(terms.claimWindowHours).to.equal(24n);
    });
  });
});
