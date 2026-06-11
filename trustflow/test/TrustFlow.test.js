const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustFlow", function () {
  const PLATFORM_FEE_BPS = 50n;
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
    Disputed: 4n
  };

  let owner;
  let creator;
  let client;
  let feeRecipient;
  let other;
  let newFeeRecipient;
  let qusdc;
  let trustFlow;

  const amount500 = ethers.parseUnits("500", 6);
  const amount300 = ethers.parseUnits("300", 6);
  const amount100 = ethers.parseUnits("100", 6);
  const initialMint = ethers.parseUnits("10000", 6);

  beforeEach(async function () {
    [owner, creator, client, feeRecipient, other, newFeeRecipient] = await ethers.getSigners();

    const MockQUSDC = await ethers.getContractFactory("MockQUSDC");
    qusdc = await MockQUSDC.deploy();
    await qusdc.waitForDeployment();

    const TrustFlow = await ethers.getContractFactory("TrustFlow");
    trustFlow = await TrustFlow.deploy(await qusdc.getAddress(), feeRecipient.address, PLATFORM_FEE_BPS);
    await trustFlow.waitForDeployment();

    for (const signer of [owner, creator, client, other]) {
      await qusdc.mint(signer.address, initialMint);
      await qusdc.connect(signer).approve(await trustFlow.getAddress(), initialMint);
    }
  });

  async function createAgreement(options = {}) {
    const milestoneNames = options.names || ["Design", "Delivery"];
    const milestoneAmounts = options.amounts || [amount500, amount300];
    const tx = await trustFlow.connect(creator).createAgreement(
      options.title || "Logo Design Package",
      options.description || "Brand identity work",
      options.client || client.address,
      milestoneNames,
      milestoneAmounts,
      options.domain || "design"
    );
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => trustFlow.interface.parseLog(log))
      .find((log) => log && log.name === "AgreementCreated");

    return event.args.agreementId;
  }

  async function createAndFundAgreement(options = {}) {
    const agreementId = await createAgreement(options);
    await trustFlow.connect(client).fundAgreement(agreementId);
    return agreementId;
  }

  async function completeAndApprove(agreementId, index = 0, proof = "ipfs://proof") {
    await trustFlow.connect(creator).completeMilestone(agreementId, index, proof);
    await trustFlow.connect(client).approveMilestone(agreementId, index);
  }

  describe("Deployment", function () {
    it("Should set correct QUSDC address", async function () {
      expect(await trustFlow.qusdc()).to.equal(await qusdc.getAddress());
    });

    it("Should set correct fee recipient", async function () {
      expect(await trustFlow.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set correct platform fee", async function () {
      expect(await trustFlow.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
    });
  });

  describe("Agreement Creation", function () {
    it("Should create an agreement with correct details", async function () {
      const agreementId = await createAgreement();
      const agreement = await trustFlow.getAgreement(agreementId);
      const firstMilestone = await trustFlow.getMilestone(agreementId, 0);

      expect(agreement.creator).to.equal(creator.address);
      expect(agreement.client).to.equal(client.address);
      expect(agreement.title).to.equal("Logo Design Package");
      expect(agreement.description).to.equal("Brand identity work");
      expect(agreement.creatorDomain).to.equal("design");
      expect(agreement.status).to.equal(Status.Draft);
      expect(agreement.totalAmount).to.equal(amount500 + amount300);
      expect(agreement.milestoneCount).to.equal(2n);
      expect(firstMilestone.name).to.equal("Design");
      expect(firstMilestone.amount).to.equal(amount500);
      expect(firstMilestone.status).to.equal(MilestoneStatus.Pending);
    });

    it("Should increment agreement counter", async function () {
      await createAgreement();
      await createAgreement({ title: "Second Agreement" });

      expect(await trustFlow.agreementCounter()).to.equal(2n);
    });

    it("Should add agreement to both users' agreement lists", async function () {
      const agreementId = await createAgreement();

      expect(await trustFlow.getUserAgreements(creator.address)).to.deep.equal([agreementId]);
      expect(await trustFlow.getUserAgreements(client.address)).to.deep.equal([agreementId]);
    });

    it("Should revert if client is zero address", async function () {
      await expect(
        createAgreement({ client: ethers.ZeroAddress })
      ).to.be.revertedWith("TrustFlow: client is zero address");
    });

    it("Should revert if client is same as creator", async function () {
      await expect(
        createAgreement({ client: creator.address })
      ).to.be.revertedWith("TrustFlow: client cannot be creator");
    });

    it("Should revert if no milestones provided", async function () {
      await expect(
        createAgreement({ names: [], amounts: [] })
      ).to.be.revertedWith("TrustFlow: invalid milestone count");
    });

    it("Should revert if milestone names and amounts length mismatch", async function () {
      await expect(
        createAgreement({ names: ["Design"], amounts: [amount500, amount300] })
      ).to.be.revertedWith("TrustFlow: milestone length mismatch");
    });
  });

  describe("Agreement Funding", function () {
    it("Should transfer QUSDC from client to contract", async function () {
      const agreementId = await createAgreement();

      await expect(() => trustFlow.connect(client).fundAgreement(agreementId))
        .to.changeTokenBalances(
          qusdc,
          [client, trustFlow],
          [-(amount500 + amount300), amount500 + amount300]
        );
    });

    it("Should set agreement status to Active", async function () {
      const agreementId = await createAndFundAgreement();

      expect((await trustFlow.getAgreement(agreementId)).status).to.equal(Status.Active);
    });

    it("Should set all milestones to Funded", async function () {
      const agreementId = await createAndFundAgreement();
      const milestones = await trustFlow.getMilestones(agreementId);

      expect(milestones[0].status).to.equal(MilestoneStatus.Funded);
      expect(milestones[1].status).to.equal(MilestoneStatus.Funded);
    });

    it("Should revert if caller is not the client", async function () {
      const agreementId = await createAgreement();

      await expect(
        trustFlow.connect(other).fundAgreement(agreementId)
      ).to.be.revertedWith("TrustFlow: caller is not client");
    });

    it("Should revert if agreement is not in Draft status", async function () {
      const agreementId = await createAndFundAgreement();

      await expect(
        trustFlow.connect(client).fundAgreement(agreementId)
      ).to.be.revertedWith("TrustFlow: agreement is not draft");
    });

    it("Should revert if client has insufficient QUSDC balance", async function () {
      const agreementId = await createAgreement({
        client: other.address,
        names: ["Large"],
        amounts: [ethers.parseUnits("20000", 6)]
      });

      await expect(
        trustFlow.connect(other).fundAgreement(agreementId)
      ).to.be.reverted;
    });

    it("Should revert if client has not approved QUSDC transfer", async function () {
      const agreementId = await createAgreement();
      await qusdc.connect(client).approve(await trustFlow.getAddress(), 0);

      await expect(
        trustFlow.connect(client).fundAgreement(agreementId)
      ).to.be.reverted;
    });
  });

  describe("Milestone Completion", function () {
    it("Should allow creator to mark milestone as completed", async function () {
      const agreementId = await createAndFundAgreement();

      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");

      expect((await trustFlow.getMilestone(agreementId, 0)).status).to.equal(MilestoneStatus.Completed);
    });

    it("Should store proof URI", async function () {
      const agreementId = await createAndFundAgreement();

      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://logo");

      expect((await trustFlow.getMilestone(agreementId, 0)).proofURI).to.equal("ipfs://logo");
    });

    it("Should set completedAt timestamp", async function () {
      const agreementId = await createAndFundAgreement();
      const tx = await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      expect((await trustFlow.getMilestone(agreementId, 0)).completedAt).to.equal(block.timestamp);
    });

    it("Should revert if caller is not creator", async function () {
      const agreementId = await createAndFundAgreement();

      await expect(
        trustFlow.connect(client).completeMilestone(agreementId, 0, "ipfs://proof")
      ).to.be.revertedWith("TrustFlow: caller is not creator");
    });

    it("Should revert if milestone is not Funded", async function () {
      const agreementId = await createAndFundAgreement();
      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");

      await expect(
        trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof-again")
      ).to.be.revertedWith("TrustFlow: milestone is not funded");
    });
  });

  describe("Milestone Approval & Payment", function () {
    it("Should transfer correct QUSDC amount to creator minus fee", async function () {
      const agreementId = await createAndFundAgreement();
      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      const fee = (amount500 * PLATFORM_FEE_BPS) / 10000n;
      const payout = amount500 - fee;

      await expect(() => trustFlow.connect(client).approveMilestone(agreementId, 0))
        .to.changeTokenBalances(qusdc, [creator, feeRecipient], [payout, fee]);
    });

    it("Should transfer fee to fee recipient", async function () {
      const agreementId = await createAndFundAgreement();
      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");
      const fee = (amount500 * PLATFORM_FEE_BPS) / 10000n;

      await trustFlow.connect(client).approveMilestone(agreementId, 0);

      expect(await qusdc.balanceOf(feeRecipient.address)).to.equal(fee);
    });

    it("Should set milestone to Approved", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId);

      expect((await trustFlow.getMilestone(agreementId, 0)).status).to.equal(MilestoneStatus.Approved);
    });

    it("Should update paidAmount on agreement", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId);

      expect((await trustFlow.getAgreement(agreementId)).paidAmount).to.equal(amount500);
    });

    it("Should update trust scores for both parties", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId);

      expect((await trustFlow.getTrustProfile(creator.address)).trustScore).to.equal(1000n);
      expect((await trustFlow.getTrustProfile(client.address)).trustScore).to.equal(1000n);
    });

    it("Should mark agreement as Completed when all milestones approved", async function () {
      const agreementId = await createAndFundAgreement();

      await completeAndApprove(agreementId, 0, "ipfs://proof-1");
      await completeAndApprove(agreementId, 1, "ipfs://proof-2");

      const agreement = await trustFlow.getAgreement(agreementId);
      expect(agreement.status).to.equal(Status.Completed);
      expect(agreement.completedAt).to.be.greaterThan(0n);
    });

    it("Should revert if caller is not client", async function () {
      const agreementId = await createAndFundAgreement();
      await trustFlow.connect(creator).completeMilestone(agreementId, 0, "ipfs://proof");

      await expect(
        trustFlow.connect(other).approveMilestone(agreementId, 0)
      ).to.be.revertedWith("TrustFlow: caller is not client");
    });

    it("Should revert if milestone is not Completed", async function () {
      const agreementId = await createAndFundAgreement();

      await expect(
        trustFlow.connect(client).approveMilestone(agreementId, 0)
      ).to.be.revertedWith("TrustFlow: milestone is not completed");
    });
  });

  describe("Trust Score", function () {
    it("Should start at 0 for new users", async function () {
      expect((await trustFlow.getTrustProfile(other.address)).trustScore).to.equal(0n);
    });

    it("Should increase after milestone approval with volume component", async function () {
      const tenQusdc = ethers.parseUnits("10", 6);
      const oneQusdc = ethers.parseUnits("1", 6);
      const agreementId = await createAndFundAgreement({
        names: ["Small", "Later"],
        amounts: [tenQusdc, oneQusdc]
      });
      await completeAndApprove(agreementId, 0);

      const expected = (tenQusdc / 1000000n) * 10n;
      expect((await trustFlow.getTrustProfile(creator.address)).trustScore).to.equal(expected);
    });

    it("Should increase completedAgreements only when full agreement completes", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId, 0);
      expect((await trustFlow.getTrustProfile(creator.address)).completedAgreements).to.equal(0n);

      await completeAndApprove(agreementId, 1);
      expect((await trustFlow.getTrustProfile(creator.address)).completedAgreements).to.equal(1n);
    });

    it("Should add verification bonus when QIE Pass is set", async function () {
      await trustFlow.setQiePassVerified(creator.address, true);

      const profile = await trustFlow.getTrustProfile(creator.address);
      expect(profile.qiePassVerified).to.equal(true);
      expect(profile.trustScore).to.equal(200n);
    });

    it("Should calculate correct tier based on score", async function () {
      await trustFlow.setQiePassVerified(creator.address, true);

      expect((await trustFlow.getTrustProfile(creator.address)).tier).to.equal(1n);
      expect(await trustFlow.getTierName(0)).to.equal("Newcomer");
      expect(await trustFlow.getTierName(1)).to.equal("Verified");
      expect(await trustFlow.getTierName(2)).to.equal("Trusted");
      expect(await trustFlow.getTierName(3)).to.equal("Elite");
    });

    it("Should penalize disputes", async function () {
      const agreementId = await createAndFundAgreement();

      await trustFlow.connect(client).cancelAgreement(agreementId);

      const profile = await trustFlow.getTrustProfile(creator.address);
      expect(profile.disputeCount).to.equal(1n);
      expect(profile.trustScore).to.equal(0n);
    });

    it("Should clamp score to max 1000", async function () {
      const agreementId = await createAndFundAgreement({
        names: ["Large"],
        amounts: [ethers.parseUnits("1000", 6)]
      });
      await completeAndApprove(agreementId, 0);
      await trustFlow.setQiePassVerified(creator.address, true);

      expect((await trustFlow.getTrustProfile(creator.address)).trustScore).to.equal(1000n);
    });
  });

  describe("Agreement Cancellation", function () {
    it("Should allow either party to cancel Draft agreements", async function () {
      const firstAgreementId = await createAgreement();
      await trustFlow.connect(creator).cancelAgreement(firstAgreementId);
      expect((await trustFlow.getAgreement(firstAgreementId)).status).to.equal(Status.Cancelled);

      const secondAgreementId = await createAgreement({ title: "Client Cancelled" });
      await trustFlow.connect(client).cancelAgreement(secondAgreementId);
      expect((await trustFlow.getAgreement(secondAgreementId)).status).to.equal(Status.Cancelled);
    });

    it("Should allow only client to cancel Active agreements", async function () {
      const agreementId = await createAndFundAgreement();

      await expect(
        trustFlow.connect(creator).cancelAgreement(agreementId)
      ).to.be.revertedWith("TrustFlow: caller is not client");
    });

    it("Should refund remaining QUSDC to client on Active cancellation", async function () {
      const agreementId = await createAndFundAgreement();
      await completeAndApprove(agreementId, 0);
      const clientBalanceBefore = await qusdc.balanceOf(client.address);

      await trustFlow.connect(client).cancelAgreement(agreementId);

      expect(await qusdc.balanceOf(client.address)).to.equal(clientBalanceBefore + amount300);
    });

    it("Should increment dispute count for both parties", async function () {
      const agreementId = await createAndFundAgreement();

      await trustFlow.connect(client).cancelAgreement(agreementId);

      expect((await trustFlow.getTrustProfile(creator.address)).disputeCount).to.equal(1n);
      expect((await trustFlow.getTrustProfile(client.address)).disputeCount).to.equal(1n);
    });

    it("Should update trust scores after cancellation", async function () {
      const tenQusdc = ethers.parseUnits("10", 6);
      const fiveQusdc = ethers.parseUnits("5", 6);
      const agreementId = await createAndFundAgreement({
        names: ["Small", "Remaining"],
        amounts: [tenQusdc, fiveQusdc]
      });
      await completeAndApprove(agreementId, 0);

      await trustFlow.connect(client).cancelAgreement(agreementId);

      expect((await trustFlow.getTrustProfile(creator.address)).trustScore).to.equal(0n);
      expect((await trustFlow.getMilestone(agreementId, 1)).status).to.equal(MilestoneStatus.Disputed);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await trustFlow.updatePlatformFee(100);

      expect(await trustFlow.platformFeeBps()).to.equal(100n);
    });

    it("Should revert if fee exceeds 500 bps", async function () {
      await expect(
        trustFlow.updatePlatformFee(501)
      ).to.be.revertedWith("TrustFlow: fee too high");
    });

    it("Should allow owner to update fee recipient", async function () {
      await trustFlow.updateFeeRecipient(newFeeRecipient.address);

      expect(await trustFlow.feeRecipient()).to.equal(newFeeRecipient.address);
    });

    it("Should allow owner to set QIE Pass verification", async function () {
      await expect(trustFlow.setQiePassVerified(creator.address, true))
        .to.emit(trustFlow, "QiePassVerified")
        .withArgs(creator.address, true);
    });
  });
});
