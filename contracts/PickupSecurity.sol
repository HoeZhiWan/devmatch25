// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PickupSecurity
 * @dev Smart contract for verifiable authorization proofs and tamper-proof pickup history
 * Features:
 * - Verifiable authorization proof (hash of signature on-chain)
 * - Tamper-proof pickup history (Merkle root anchoring)
 * - Timestamping + proof verification (on-chain root + off-chain tree)
 * - Smart contract to store and validate hashes
 */
contract PickupSecurity is Ownable {
    
    // Structs
    struct Authorization {
        bytes32 authHash;           // Hash of the authorization signature
        address parentWallet;       // Parent's wallet address
        address pickupWallet;       // Pickup person's wallet address
        bytes32 studentHash;        // Hash of student ID (for privacy)
        uint256 startDate;          // Authorization start timestamp
        uint256 endDate;            // Authorization end timestamp
        uint256 createdAt;          // When authorization was created
        bool isActive;              // Whether authorization is active
        bool isVerified;            // Whether signature has been verified
    }
    
    struct PickupEvent {
        bytes32 eventHash;          // Hash of pickup event data
        bytes32 studentHash;        // Hash of student ID
        address pickupWallet;       // Pickup person's wallet
        address staffWallet;        // Staff member who verified pickup
        uint256 timestamp;          // Pickup timestamp
        bytes32 qrCodeHash;         // Hash of QR code used
        bool isVerified;            // Whether pickup was verified
    }
    
    struct MerkleBatch {
        bytes32 merkleRoot;         // Merkle root of pickup events
        uint256 batchNumber;        // Sequential batch number
        uint256 timestamp;          // When batch was anchored
        uint256 blockNumber;        // Block number when anchored
        uint256 eventCount;         // Number of events in this batch
        string ipfsHash;            // IPFS hash of off-chain data
    }
    
    // State variables
    mapping(bytes32 => Authorization) public authorizations;
    mapping(bytes32 => PickupEvent) public pickupEvents;
    mapping(uint256 => MerkleBatch) public merkleBatches;
    
    uint256 public authorizationCounter;
    uint256 public pickupEventCounter;
    uint256 public batchCounter;
    
    // Events
    event AuthorizationCreated(
        bytes32 indexed authHash,
        address indexed parentWallet,
        address indexed pickupWallet,
        bytes32 studentHash,
        uint256 startDate,
        uint256 endDate
    );
    
    event AuthorizationVerified(
        bytes32 indexed authHash,
        bool isVerified
    );
    
    event PickupEventRecorded(
        bytes32 indexed eventHash,
        bytes32 indexed studentHash,
        address indexed pickupWallet,
        uint256 timestamp
    );
    
    event MerkleBatchAnchored(
        uint256 indexed batchNumber,
        bytes32 indexed merkleRoot,
        uint256 timestamp,
        uint256 eventCount
    );
    
    event AuthorizationRevoked(
        bytes32 indexed authHash,
        address indexed parentWallet
    );
    
    // Modifiers
    modifier onlyParent(bytes32 authHash) {
        require(authorizations[authHash].parentWallet == msg.sender, "Only parent can perform this action");
        _;
    }
    
    modifier onlyActiveAuthorization(bytes32 authHash) {
        require(authorizations[authHash].isActive, "Authorization is not active");
        require(block.timestamp >= authorizations[authHash].startDate, "Authorization not yet valid");
        require(block.timestamp <= authorizations[authHash].endDate, "Authorization has expired");
        _;
    }
    
    // Constructor
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new authorization with signature hash
     * @param authHash Hash of the authorization signature
     * @param parentWallet Parent's wallet address
     * @param pickupWallet Pickup person's wallet address
     * @param studentHash Hash of student ID
     * @param startDate Authorization start timestamp
     * @param endDate Authorization end timestamp
     */
    function createAuthorization(
        bytes32 authHash,
        address parentWallet,
        address pickupWallet,
        bytes32 studentHash,
        uint256 startDate,
        uint256 endDate
    ) external {
        require(authHash != bytes32(0), "Invalid authorization hash");
        require(parentWallet != address(0), "Invalid parent wallet");
        require(pickupWallet != address(0), "Invalid pickup wallet");
        require(startDate < endDate, "Invalid date range");
        require(block.timestamp <= startDate, "Start date must be in the future");
        
        // Check if authorization already exists
        require(authorizations[authHash].authHash == bytes32(0), "Authorization already exists");
        
        authorizations[authHash] = Authorization({
            authHash: authHash,
            parentWallet: parentWallet,
            pickupWallet: pickupWallet,
            studentHash: studentHash,
            startDate: startDate,
            endDate: endDate,
            createdAt: block.timestamp,
            isActive: true,
            isVerified: false
        });
        
        authorizationCounter++;
        
        emit AuthorizationCreated(
            authHash,
            parentWallet,
            pickupWallet,
            studentHash,
            startDate,
            endDate
        );
    }
    
    /**
     * @dev Verifies an authorization signature hash
     * @param authHash Hash of the authorization to verify
     * @param isVerified Whether the signature is verified
     */
    function verifyAuthorization(bytes32 authHash, bool isVerified) external onlyOwner {
        require(authorizations[authHash].authHash != bytes32(0), "Authorization does not exist");
        
        authorizations[authHash].isVerified = isVerified;
        
        emit AuthorizationVerified(authHash, isVerified);
    }
    
    /**
     * @dev Records a pickup event with hash verification
     * @param eventHash Hash of the pickup event data
     * @param studentHash Hash of student ID
     * @param pickupWallet Pickup person's wallet
     * @param staffWallet Staff member's wallet
     * @param qrCodeHash Hash of QR code used
     */
    function recordPickupEvent(
        bytes32 eventHash,
        bytes32 studentHash,
        address pickupWallet,
        address staffWallet,
        bytes32 qrCodeHash
    ) external {
        require(eventHash != bytes32(0), "Invalid event hash");
        require(pickupWallet != address(0), "Invalid pickup wallet");
        require(staffWallet != address(0), "Invalid staff wallet");
        
        // Check if event already exists
        require(pickupEvents[eventHash].eventHash == bytes32(0), "Event already recorded");
        
        pickupEvents[eventHash] = PickupEvent({
            eventHash: eventHash,
            studentHash: studentHash,
            pickupWallet: pickupWallet,
            staffWallet: staffWallet,
            timestamp: block.timestamp,
            qrCodeHash: qrCodeHash,
            isVerified: true
        });
        
        pickupEventCounter++;
        
        emit PickupEventRecorded(
            eventHash,
            studentHash,
            pickupWallet,
            block.timestamp
        );
    }
    
    /**
     * @dev Anchors a Merkle root of pickup events
     * @param merkleRoot Merkle root of pickup events
     * @param eventCount Number of events in this batch
     * @param ipfsHash IPFS hash of off-chain data
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
     * @dev Verifies a pickup event using Merkle proof
     * @param eventHash Hash of the pickup event
     * @param batchNumber Batch number containing the event
     * @param proof Merkle proof for the event
     * @return bool Whether the proof is valid
     */
    function verifyPickupEvent(
        bytes32 eventHash,
        uint256 batchNumber,
        bytes32[] memory proof
    ) external view returns (bool) {
        require(batchNumber < batchCounter, "Batch does not exist");
        
        MerkleBatch memory batch = merkleBatches[batchNumber];
        
        return MerkleProof.verify(
            proof,
            batch.merkleRoot,
            eventHash
        );
    }
    
    /**
     * @dev Revokes an authorization (only parent can do this)
     * @param authHash Hash of the authorization to revoke
     */
    function revokeAuthorization(bytes32 authHash) external onlyParent(authHash) {
        require(authorizations[authHash].isActive, "Authorization is not active");
        
        authorizations[authHash].isActive = false;
        
        emit AuthorizationRevoked(authHash, msg.sender);
    }
    
    /**
     * @dev Gets authorization details
     * @param authHash Hash of the authorization
     * @return Authorization struct
     */
    function getAuthorization(bytes32 authHash) external view returns (Authorization memory) {
        return authorizations[authHash];
    }
    
    /**
     * @dev Gets pickup event details
     * @param eventHash Hash of the pickup event
     * @return PickupEvent struct
     */
    function getPickupEvent(bytes32 eventHash) external view returns (PickupEvent memory) {
        return pickupEvents[eventHash];
    }
    
    /**
     * @dev Gets Merkle batch details
     * @param batchNumber Batch number
     * @return MerkleBatch struct
     */
    function getMerkleBatch(uint256 batchNumber) external view returns (MerkleBatch memory) {
        return merkleBatches[batchNumber];
    }
    
    /**
     * @dev Checks if an authorization is valid for pickup
     * @param authHash Hash of the authorization
     * @param pickupWallet Pickup person's wallet
     * @param studentHash Hash of student ID
     * @return bool Whether authorization is valid
     */
    function isAuthorizationValid(
        bytes32 authHash,
        address pickupWallet,
        bytes32 studentHash
    ) external view returns (bool) {
        Authorization memory auth = authorizations[authHash];
        
        return auth.isActive &&
               auth.isVerified &&
               auth.pickupWallet == pickupWallet &&
               auth.studentHash == studentHash &&
               block.timestamp >= auth.startDate &&
               block.timestamp <= auth.endDate;
    }
    
    /**
     * @dev Gets contract statistics
     * @return uint256 Number of authorizations
     * @return uint256 Number of pickup events
     * @return uint256 Number of Merkle batches
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (authorizationCounter, pickupEventCounter, batchCounter);
    }
}
