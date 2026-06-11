// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TrustFlow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum AgreementStatus {
        Draft,
        Active,
        Completed,
        Cancelled
    }

    enum MilestoneStatus {
        Pending,
        Funded,
        Completed,
        Approved,
        Disputed
    }

    struct Milestone {
        string name;
        uint256 amount;
        MilestoneStatus status;
        string proofURI;
        uint256 completedAt;
        uint256 approvedAt;
    }

    struct Agreement {
        uint256 id;
        address creator;
        address client;
        string title;
        string description;
        string creatorDomain;
        AgreementStatus status;
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 createdAt;
        uint256 completedAt;
        uint256 milestoneCount;
    }

    struct TrustProfile {
        uint256 completedAgreements;
        uint256 totalVolumeUSDC;
        uint256 disputeCount;
        uint256 trustScore;
        uint8 tier;
        bool qiePassVerified;
        uint256 lastUpdated;
    }

    IERC20 public qusdc;
    uint256 public agreementCounter;
    uint256 public platformFeeBps;
    address public feeRecipient;

    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(address => TrustProfile) public trustProfiles;
    mapping(address => uint256[]) private userAgreementIds;

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed creator,
        address indexed client,
        uint256 totalAmount,
        string title
    );
    event AgreementFunded(uint256 indexed agreementId, uint256 totalAmount);
    event MilestoneCompleted(uint256 indexed agreementId, uint256 milestoneIndex, string proofURI);
    event MilestoneApproved(uint256 indexed agreementId, uint256 milestoneIndex, uint256 amount);
    event PaymentReleased(address indexed recipient, uint256 amount, uint256 indexed agreementId);
    event TrustScoreUpdated(address indexed user, uint256 newScore, uint8 newTier);
    event AgreementCompleted(uint256 indexed agreementId);
    event AgreementCancelled(uint256 indexed agreementId);
    event QiePassVerified(address indexed user, bool verified);

    /// @notice Deploys TrustFlow with the payment token, fee recipient, and platform fee.
    constructor(address _qusdc, address _feeRecipient, uint256 _platformFeeBps) Ownable(msg.sender) {
        qusdc = IERC20(_qusdc);
        feeRecipient = _feeRecipient;
        platformFeeBps = _platformFeeBps;
    }

    /// @notice Creates a draft agreement with one to ten milestones.
    function createAgreement(
        string calldata _title,
        string calldata _description,
        address _client,
        string[] calldata _milestoneNames,
        uint256[] calldata _milestoneAmounts,
        string calldata _creatorDomain
    ) external returns (uint256) {
        require(_client != address(0), "TrustFlow: client is zero address");
        require(_client != msg.sender, "TrustFlow: client cannot be creator");
        require(_milestoneNames.length == _milestoneAmounts.length, "TrustFlow: milestone length mismatch");
        require(_milestoneNames.length > 0 && _milestoneNames.length <= 10, "TrustFlow: invalid milestone count");

        agreementCounter++;
        uint256 agreementId = agreementCounter;
        uint256 totalAmount = _storeMilestones(agreementId, _milestoneNames, _milestoneAmounts);
        require(totalAmount > 0, "TrustFlow: total amount is zero");

        Agreement storage agreement = agreements[agreementId];
        agreement.id = agreementId;
        agreement.creator = msg.sender;
        agreement.client = _client;
        agreement.title = _title;
        agreement.description = _description;
        agreement.creatorDomain = _creatorDomain;
        agreement.status = AgreementStatus.Draft;
        agreement.totalAmount = totalAmount;
        agreement.createdAt = block.timestamp;
        agreement.milestoneCount = _milestoneNames.length;

        _trackAgreementParticipants(agreementId);
        _emitAgreementCreated(agreementId);
        return agreementId;
    }

    /// @notice Funds a draft agreement and marks all milestones as funded.
    function fundAgreement(uint256 _agreementId) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.client == msg.sender, "TrustFlow: caller is not client");
        require(agreement.status == AgreementStatus.Draft, "TrustFlow: agreement is not draft");

        qusdc.safeTransferFrom(msg.sender, address(this), agreement.totalAmount);
        agreement.status = AgreementStatus.Active;

        for (uint256 i = 0; i < agreement.milestoneCount; i++) {
            milestones[_agreementId][i].status = MilestoneStatus.Funded;
        }

        emit AgreementFunded(_agreementId, agreement.totalAmount);
    }

    /// @notice Marks a funded milestone as completed with proof.
    function completeMilestone(uint256 _agreementId, uint256 _milestoneIndex, string calldata _proofURI) external {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.creator == msg.sender, "TrustFlow: caller is not creator");
        require(agreement.status == AgreementStatus.Active, "TrustFlow: agreement is not active");
        require(_milestoneIndex < agreement.milestoneCount, "TrustFlow: invalid milestone index");

        Milestone storage milestone = milestones[_agreementId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.Funded, "TrustFlow: milestone is not funded");

        milestone.status = MilestoneStatus.Completed;
        milestone.proofURI = _proofURI;
        milestone.completedAt = block.timestamp;
        emit MilestoneCompleted(_agreementId, _milestoneIndex, _proofURI);
    }

    /// @notice Approves a completed milestone and releases payment minus platform fee.
    function approveMilestone(uint256 _agreementId, uint256 _milestoneIndex) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.client == msg.sender, "TrustFlow: caller is not client");
        require(agreement.status == AgreementStatus.Active, "TrustFlow: agreement is not active");
        require(_milestoneIndex < agreement.milestoneCount, "TrustFlow: invalid milestone index");

        Milestone storage milestone = milestones[_agreementId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.Completed, "TrustFlow: milestone is not completed");

        uint256 fee = (milestone.amount * platformFeeBps) / 10000;
        uint256 payout = milestone.amount - fee;
        milestone.status = MilestoneStatus.Approved;
        milestone.approvedAt = block.timestamp;
        agreement.paidAmount += milestone.amount;

        _addVolume(agreement.creator, agreement.client, milestone.amount);
        qusdc.safeTransfer(agreement.creator, payout);
        qusdc.safeTransfer(feeRecipient, fee);

        emit MilestoneApproved(_agreementId, _milestoneIndex, milestone.amount);
        emit PaymentReleased(agreement.creator, payout, _agreementId);
        _completeAgreementIfReady(_agreementId, agreement);
        _updateTrustScore(agreement.creator);
        _updateTrustScore(agreement.client);
    }

    /// @notice Cancels a draft or active agreement according to party permissions.
    function cancelAgreement(uint256 _agreementId) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];

        if (agreement.status == AgreementStatus.Draft) {
            require(_isAgreementParty(agreement, msg.sender), "TrustFlow: caller is not party");
            agreement.status = AgreementStatus.Cancelled;
        } else if (agreement.status == AgreementStatus.Active) {
            require(agreement.client == msg.sender, "TrustFlow: caller is not client");
            _cancelActiveAgreement(_agreementId, agreement);
        } else {
            revert("TrustFlow: cannot cancel agreement");
        }

        emit AgreementCancelled(_agreementId);
    }

    /// @notice Sets QIE Pass verification status for a user.
    function setQiePassVerified(address _user, bool _verified) external onlyOwner {
        trustProfiles[_user].qiePassVerified = _verified;
        _updateTrustScore(_user);
        emit QiePassVerified(_user, _verified);
    }

    /// @notice Returns an agreement by ID.
    function getAgreement(uint256 _agreementId) external view returns (Agreement memory) {
        return agreements[_agreementId];
    }

    /// @notice Returns a milestone by agreement ID and milestone index.
    function getMilestone(uint256 _agreementId, uint256 _milestoneIndex) external view returns (Milestone memory) {
        return milestones[_agreementId][_milestoneIndex];
    }

    /// @notice Returns all milestones for an agreement.
    function getMilestones(uint256 _agreementId) external view returns (Milestone[] memory) {
        uint256 count = agreements[_agreementId].milestoneCount;
        Milestone[] memory result = new Milestone[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = milestones[_agreementId][i];
        }

        return result;
    }

    /// @notice Returns all agreement IDs associated with a user.
    function getUserAgreements(address _user) external view returns (uint256[] memory) {
        return userAgreementIds[_user];
    }

    /// @notice Returns the trust profile for a user.
    function getTrustProfile(address _user) external view returns (TrustProfile memory) {
        return trustProfiles[_user];
    }

    /// @notice Returns the display name for a trust tier.
    function getTierName(uint8 _tier) external pure returns (string memory) {
        if (_tier == 0) {
            return "Newcomer";
        }
        if (_tier == 1) {
            return "Verified";
        }
        if (_tier == 2) {
            return "Trusted";
        }
        return "Elite";
    }

    /// @notice Updates the platform fee in basis points.
    function updatePlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 500, "TrustFlow: fee too high");
        platformFeeBps = _newFeeBps;
    }

    /// @notice Updates the platform fee recipient.
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "TrustFlow: fee recipient is zero address");
        feeRecipient = _newRecipient;
    }

    function _storeMilestones(
        uint256 _agreementId,
        string[] calldata _milestoneNames,
        uint256[] calldata _milestoneAmounts
    ) internal returns (uint256 totalAmount) {
        for (uint256 i = 0; i < _milestoneNames.length; i++) {
            totalAmount += _milestoneAmounts[i];
            milestones[_agreementId][i] = Milestone({
                name: _milestoneNames[i],
                amount: _milestoneAmounts[i],
                status: MilestoneStatus.Pending,
                proofURI: "",
                completedAt: 0,
                approvedAt: 0
            });
        }
    }

    function _trackAgreementParticipants(uint256 _agreementId) internal {
        Agreement storage agreement = agreements[_agreementId];
        userAgreementIds[agreement.creator].push(_agreementId);
        userAgreementIds[agreement.client].push(_agreementId);
    }

    function _emitAgreementCreated(uint256 _agreementId) internal {
        Agreement storage agreement = agreements[_agreementId];
        emit AgreementCreated(_agreementId, agreement.creator, agreement.client, agreement.totalAmount, agreement.title);
    }

    function _addVolume(address _creator, address _client, uint256 _amount) internal {
        trustProfiles[_creator].totalVolumeUSDC += _amount;
        trustProfiles[_client].totalVolumeUSDC += _amount;
    }

    function _completeAgreementIfReady(uint256 _agreementId, Agreement storage _agreement) internal {
        for (uint256 i = 0; i < _agreement.milestoneCount; i++) {
            if (milestones[_agreementId][i].status != MilestoneStatus.Approved) {
                return;
            }
        }

        _agreement.status = AgreementStatus.Completed;
        _agreement.completedAt = block.timestamp;
        trustProfiles[_agreement.creator].completedAgreements++;
        trustProfiles[_agreement.client].completedAgreements++;
        emit AgreementCompleted(_agreementId);
    }

    function _cancelActiveAgreement(uint256 _agreementId, Agreement storage _agreement) internal {
        uint256 remainingAmount = _agreement.totalAmount - _agreement.paidAmount;

        for (uint256 i = 0; i < _agreement.milestoneCount; i++) {
            if (milestones[_agreementId][i].status != MilestoneStatus.Approved) {
                milestones[_agreementId][i].status = MilestoneStatus.Disputed;
            }
        }

        _agreement.status = AgreementStatus.Cancelled;
        trustProfiles[_agreement.creator].disputeCount++;
        trustProfiles[_agreement.client].disputeCount++;
        qusdc.safeTransfer(_agreement.client, remainingAmount);
        _updateTrustScore(_agreement.creator);
        _updateTrustScore(_agreement.client);
    }

    function _updateTrustScore(address _user) internal {
        TrustProfile storage profile = trustProfiles[_user];
        uint256 baseScore = (profile.completedAgreements * 100) + ((profile.totalVolumeUSDC / 1_000_000) * 10);
        uint256 penaltyScore = profile.disputeCount * 200;
        uint256 verificationBonus = profile.qiePassVerified ? 200 : 0;
        uint256 positiveScore = baseScore + verificationBonus;
        uint256 trustScore = penaltyScore >= positiveScore ? 0 : positiveScore - penaltyScore;

        if (trustScore > 1000) {
            trustScore = 1000;
        }

        profile.trustScore = trustScore;
        profile.tier = _calculateTier(trustScore);
        profile.lastUpdated = block.timestamp;
        emit TrustScoreUpdated(_user, trustScore, profile.tier);
    }

    function _calculateTier(uint256 _trustScore) internal pure returns (uint8) {
        if (_trustScore < 200) {
            return 0;
        }
        if (_trustScore < 500) {
            return 1;
        }
        if (_trustScore < 800) {
            return 2;
        }
        return 3;
    }

    function _isAgreementParty(Agreement storage _agreement, address _user) internal view returns (bool) {
        return _agreement.creator == _user || _agreement.client == _user;
    }
}
