// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RoleAuth {
    enum Role { None, Parent, Staff }

    mapping(address => Role) public roles;
    address public admin;

    constructor() {
        admin = msg.sender; // deployer is admin
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    function setRole(address user, Role role) public onlyAdmin {
        roles[user] = role;
    }

    function getRole(address user) public view returns (Role) {
        return roles[user];
    }
}
