# Architecture Update: Gas Fee Reduction via Hybrid On-Chain/Off-Chain Model

This document outlines the recent architectural changes made to the system to significantly reduce gas fees associated with on-chain data storage.

## 1. Overview of the New Architecture

The system has been refactored to a hybrid model that leverages both Firebase (off-chain) and the Ethereum blockchain (on-chain) for data storage and verification.

-   **Off-Chain (Firebase):** All detailed information for authorizations and pickup events is now stored exclusively in Firebase. This includes all data fields that were previously stored in the smart contract's structs.
-   **On-Chain (Smart Contract):** The `PickupSecurity.sol` smart contract now acts as a simple, gas-efficient **hash registry**. Instead of storing full data structs, it only stores `bytes32` hashes that serve as immutable, verifiable proofs of the off-chain data.

## 2. Key Changes Implemented

### 2.1. Smart Contract (`PickupSecurity.sol`)

-   **Removed Structs:** The `Authorization` and `PickupEvent` structs have been completely removed.
-   **New Mappings:** Two new mappings have been introduced to act as the hash registry:
    -   `mapping(bytes32 => bool) public registeredAuthorizations;`
    -   `mapping(bytes32 => bool) public registeredPickups;`
-   **Simplified Functions:**
    -   `createAuthorization` now only accepts a `bytes32 authHash` and the `parentWallet`.
    -   `recordPickupEvent` has been renamed to `recordPickup` and now only accepts a `bytes32 pickupHash`.
-   **Removed Getters:** All getter functions that previously returned the full data structs have been removed.

### 2.2. Backend (`lib/`)

-   **New Firebase Actions (`lib/firebase/actions.ts`):**
    -   `addAuthorizationToFirebase`: Creates a new authorization document in Firebase and returns its unique ID.
    -   `addPickupToFirebase`: Creates a new pickup log document in Firebase and returns its unique ID.
-   **Updated Hashing (`lib/blockchain/hashing.ts`):**
    -   The `createAuthorizationHash` and `createPickupEventHash` functions have been updated to include the **Firebase document ID** as a key part of the hash. This creates a strong, verifiable link between the off-chain record and its on-chain proof.
-   **Updated Contract Interaction (`lib/blockchain/contract.ts`):**
    -   The ABI has been updated to match the new smart contract.
    -   The logic for creating authorizations and recording pickups has been updated to follow the new workflow.
    -   Verification functions now check for the existence of a hash in the contract's new mappings.

## 3. New Workflow (Example: Creating an Authorization)

1.  **Write to Firebase:** The backend calls `addAuthorizationToFirebase` to store the full authorization details.
2.  **Get Firebase ID:** Firebase returns the unique document ID for the new record.
3.  **Generate Hash:** The backend calls `createAuthorizationHash`, providing the new Firebase ID and the authorization data to generate a unique `bytes32` hash.
4.  **Anchor On-Chain:** The backend calls the `createAuthorization` function on the smart contract, passing the generated hash and the parent's wallet address. The contract stores this hash in the `registeredAuthorizations` mapping.

## 4. Guidance for Frontend Integration

The frontend was **not** modified during this update. The following changes will be required to integrate with the new architecture:

-   **API Calls:** All frontend components that create authorizations or record pickups must be updated to call the new backend API endpoints that orchestrate this workflow.
-   **Data Display:** When displaying authorization or pickup data, the frontend should:
    1.  Fetch the full data object from the backend (which gets it from Firebase).
    2.  The backend will re-generate the hash and check for its existence on-chain.
    3.  The frontend should display the data along with a "Verified on Blockchain" status based on the result of the on-chain check.
-   **Update Hooks:** Any React hooks abstracting blockchain logic (e.g., `useBlockchain.ts`) must be updated to use the new functions from `lib/blockchain/contract.ts`.

This new architecture significantly reduces the cost of using the system while maintaining a high degree of security and verifiability through on-chain hash anchoring.