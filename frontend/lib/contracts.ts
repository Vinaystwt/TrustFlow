import { Address } from 'viem'

// TrustFlowV2 (tier-enforced terms). V1 kept as documented fallback.
export const TRUSTFLOW_ADDRESS = (process.env.NEXT_PUBLIC_TRUSTFLOW_ADDRESS ||
  '0xcD0915cb3423F6665C636d723648F78d88B81e52') as Address

// V1 fallback: tier scores are cosmetic only. Revert env var here if V2 needs rolling back.
export const TRUSTFLOW_V1_ADDRESS = (process.env.NEXT_PUBLIC_TRUSTFLOW_V1_FALLBACK ||
  '0x9db2e380f9100793ea71413224dD7C22F97aD91B') as Address

export const QUSDC_ADDRESS = (process.env.NEXT_PUBLIC_QUSDC_ADDRESS ||
  '0x1850d2a31CB8669Ba757159B638DE19Af532ba5e') as Address

export const QUSDC_DECIMALS = 6

export const TRUSTFLOW_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_qusdc",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_feeRecipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_platformFeeBps",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "AgreementCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "AgreementCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "client",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        }
      ],
      "name": "AgreementCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        }
      ],
      "name": "AgreementFunded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "milestoneIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "MilestoneApproved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "milestoneIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "MilestoneClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "milestoneIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "proofURI",
          "type": "string"
        }
      ],
      "name": "MilestoneCompleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "MilestoneDisputed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        }
      ],
      "name": "PaymentReleased",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "verified",
          "type": "bool"
        }
      ],
      "name": "QiePassVerified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "newTier",
          "type": "uint8"
        }
      ],
      "name": "TrustScoreUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "agreementId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "milestoneIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "UpfrontReleased",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "TIER1_REFUND_WINDOW",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "TIER2_UPFRONT_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "TIER3_CLAIM_WINDOW",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "agreementCounter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "agreements",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "client",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "creatorDomain",
          "type": "string"
        },
        {
          "internalType": "enum TrustFlowV2.AgreementStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "totalAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "paidAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "completedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "milestoneCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "approveMilestone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        }
      ],
      "name": "cancelAgreement",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "claimMilestone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_proofURI",
          "type": "string"
        }
      ],
      "name": "completeMilestone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "_client",
          "type": "address"
        },
        {
          "internalType": "string[]",
          "name": "_milestoneNames",
          "type": "string[]"
        },
        {
          "internalType": "uint256[]",
          "name": "_milestoneAmounts",
          "type": "uint256[]"
        },
        {
          "internalType": "string",
          "name": "_creatorDomain",
          "type": "string"
        }
      ],
      "name": "createAgreement",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "disputeMilestone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "feeRecipient",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        }
      ],
      "name": "fundAgreement",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        }
      ],
      "name": "getAgreement",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "client",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "creatorDomain",
              "type": "string"
            },
            {
              "internalType": "enum TrustFlowV2.AgreementStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "uint256",
              "name": "totalAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "paidAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "completedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "milestoneCount",
              "type": "uint256"
            }
          ],
          "internalType": "struct TrustFlowV2.Agreement",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "getEnforcedTerms",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "tier",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "tierName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "upfrontBps",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "hasAutoClaim",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "claimWindowHours",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_milestoneIndex",
          "type": "uint256"
        }
      ],
      "name": "getMilestone",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "enum TrustFlowV2.MilestoneStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "proofURI",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "completedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "approvedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "upfrontReleased",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimableAfter",
              "type": "uint256"
            }
          ],
          "internalType": "struct TrustFlowV2.Milestone",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_agreementId",
          "type": "uint256"
        }
      ],
      "name": "getMilestones",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "enum TrustFlowV2.MilestoneStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "proofURI",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "completedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "approvedAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "upfrontReleased",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimableAfter",
              "type": "uint256"
            }
          ],
          "internalType": "struct TrustFlowV2.Milestone[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_tier",
          "type": "uint8"
        }
      ],
      "name": "getTierName",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "getTrustProfile",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "completedAgreements",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalVolumeUSDC",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "disputeCount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "trustScore",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "tier",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "qiePassVerified",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "lastUpdated",
              "type": "uint256"
            }
          ],
          "internalType": "struct TrustFlowV2.TrustProfile",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "getUserAgreements",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "milestones",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "enum TrustFlowV2.MilestoneStatus",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "proofURI",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "completedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "approvedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "upfrontReleased",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "claimableAfter",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "platformFeeBps",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "qusdc",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "_verified",
          "type": "bool"
        }
      ],
      "name": "setQiePassVerified",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "trustProfiles",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "completedAgreements",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalVolumeUSDC",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "disputeCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "trustScore",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "tier",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "qiePassVerified",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "lastUpdated",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newRecipient",
          "type": "address"
        }
      ],
      "name": "updateFeeRecipient",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_newFeeBps",
          "type": "uint256"
        }
      ],
      "name": "updatePlatformFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const
