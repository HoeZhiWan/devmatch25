// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PickupSecurity
 * @dev Smart contract for verifiable authorization proofs and tamper-proof pickup history.
 * This contract uses a hybrid on-chain/off-chain model to save gas. It stores
 * only cryptographic hashes (proofs) on-chain, while the full data resides off-chain.
 */
contract PickupSecurity is Ownable {

    // --- Structs ---

    struct MerkleBatch {
        bytes32 merkleRoot;      // Merkle root of off-chain pickup event hashes
        uint256 batchNumber;     // Sequential batch number
        uint256 timestamp;       // When this batch was anchored on-chain
        uint256 blockNumber;     // Block number when this batch was anchored
        uint256 eventCount;      // Number of events included in this batch
        string ipfsHash;         // IPFS hash (or other URI) of the off-chain data
    }

    // --- State Variables ---

    // On-chain registry for authorization proofs.
    // The hash is a fingerprint of the off-chain Firebase record.
    mapping(bytes32 => bool) public registeredAuthorizations;

    // On-chain registry for pickup proofs.
    mapping(bytes32 => bool) public registeredPickups;

    // Associates an authorization hash with the parent who created it, for revocation.
    mapping(bytes32 => address) public authorizationToParent;

    // Stores Merkle batches for historical pickup verification.
    mapping(uint256 => MerkleBatch) public merkleBatches;

    // Counters for statistics.
    uint256 public authorizationCounter;
    uint256 public pickupCounter;
    uint256 public batchCounter;

    // --- Events ---

    event AuthorizationCreated(
        bytes32 indexed authHash,
        address indexed parentWallet
    );

    event AuthorizationRevoked(
        bytes32 indexed authHash,
        address indexed parentWallet
    );

    event PickupRecorded(
        bytes32 indexed pickupHash,
        address indexed staffWallet
    );

    event MerkleBatchAnchored(
        uint256 indexed batchNumber,
        bytes32 indexed merkleRoot,
        uint256 timestamp,
        uint256 eventCount
    );

    // --- Constructor ---

    constructor() Ownable(msg.sender) {}

    // --- Core Functions ---

    /**
     * @dev Creates a new authorization hash record on-chain.
     * @param authHash A unique hash representing the off-chain authorization data.
     * @param parentWallet The wallet address of the parent creating the authorization.
     */
    function createAuthorization(bytes32 authHash, address parentWallet) external {
        require(authHash != bytes32(0), "Invalid authorization hash");
        require(parentWallet != address(0), "Invalid parent wallet");
        require(!registeredAuthorizations[authHash], "Authorization already exists");

        registeredAuthorizations[authHash] = true;
        authorizationToParent[authHash] = parentWallet;
        authorizationCounter++;

        emit AuthorizationCreated(authHash, parentWallet);
    }

    /**
     * @dev Revokes an authorization. Only the parent who created it can revoke it.
     * @param authHash The hash of the authorization to revoke.
     */
    function revokeAuthorization(bytes32 authHash) external {
        require(registeredAuthorizations[authHash], "Authorization does not exist");
        require(authorizationToParent[authHash] == msg.sender, "Only the original parent can revoke this authorization");

        // Set to false instead of deleting to maintain history but mark as inactive.
        registeredAuthorizations[authHash] = false;

        emit AuthorizationRevoked(authHash, msg.sender);
    }

    /**
     * @dev Records a pickup event hash on-chain.
     * @param pickupHash A unique hash representing the off-chain pickup event.
     */
    function recordPickup(bytes32 pickupHash) external {
        require(pickupHash != bytes32(0), "Invalid pickup hash");
        require(!registeredPickups[pickupHash], "Pickup already recorded");

        registeredPickups[pickupHash] = true;
        pickupCounter++;

        emit PickupRecorded(pickupHash, msg.sender);
    }

    // --- Merkle Batch Functions ---

    /**
     * @dev Anchors a Merkle root of pickup events for efficient historical verification.
     * @param merkleRoot The Merkle root of the pickup event hashes.
     * @param eventCount The number of events included in this batch.
     * @param ipfsHash The IPFS hash or URI of the off-chain data file.
     */
    function anchorMerkleBatch(
        bytes32 merkleRoot,
        uint256 eventCount,
        string memory ipfsHash
    ) external onlyOwner {
        require(merkleRoot != bytes32(0), "Invalid Merkle root");
        require(eventCount > 0, "Invalid event count");

        merkleBatches[batchCounter] = MerkleBatch({
            merkleRoot: merkleRoot,
            batchNumber: batchCounter,
            timestamp: block.timestamp,
            blockNumber: block.number,
            eventCount: eventCount,
            ipfsHash: ipfsHash
        });

        emit MerkleBatchAnchored(
            batchCounter,
            merkleRoot,
            block.timestamp,
            eventCount
        );

        batchCounter++;
    }

    /**
     * @dev Verifies that a pickup event is part of a previously anchored Merkle batch.
     * @param eventHash The hash of the pickup event to verify.
     * @param batchNumber The batch number where the event is expected to be.
     * @param proof The Merkle proof required to verify the event's inclusion.
     * @return bool Returns true if the proof is valid, false otherwise.
     */
    function verifyPickupEvent(
        bytes32 eventHash,
        uint256 batchNumber,
        bytes32[] memory proof
    ) external view returns (bool) {
        require(batchNumber < batchCounter, "Batch does not exist");
        MerkleBatch memory batch = merkleBatches[batchNumber];
        return MerkleProof.verify(proof, batch.merkleRoot, eventHash);
    }

    // --- View Functions ---

    /**
     * @dev Gets the details of a specific Merkle batch.
     * @param batchNumber The number of the batch to retrieve.
     * @return MerkleBatch The batch details.
     */
    function getMerkleBatch(uint256 batchNumber) external view returns (MerkleBatch memory) {
        return merkleBatches[batchNumber];
    }

    /**
     * @dev Gets contract statistics.
     * @return uint256 The total number of authorizations created.
     * @return uint256 The total number of pickups recorded.
     * @return uint256 The total number of Merkle batches anchored.
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (authorizationCounter, pickupCounter, batchCounter);
    }
}
