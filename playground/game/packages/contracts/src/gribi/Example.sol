// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { BaseThread, UpdateRegister } from "@gribi/src/BaseThread.sol";
import { Operation, Transaction, PublicInput } from "@gribi/src/Structs.sol";
import { Forest } from "@gribi/src/Forest.sol";

contract Example is BaseThread {

    enum Codes { UNSET, REVEAL_COMMITMENT }
    constructor() {
        codes = new uint[](2);
        codes[uint(Codes.UNSET)] = 0;
        codes[uint(Codes.REVEAL_COMMITMENT)] = 0;
        register = UpdateRegister(uint(Codes.UNSET), bytes(""));
    }

    function getModuleID() public override pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked("example-module")));
    }

    function peekUpdates() public override view returns (UpdateRegister memory) {
        return register;
    }

    function createCommitment(Transaction memory transaction) external {
        if (transaction.operations.length > 0) {
            require(!forest.nullifierExists(transaction.operations[0].value), "This commitment has been nullified");
            forest.addCommitment(transaction.operations[0].value);
        }
    }

    function updateCommitment(Transaction memory transaction) external {
        if (transaction.operations.length > 0) {
            require(!forest.nullifierExists(transaction.operations[0].value), "This commitment has been nullified");
            forest.addCommitment(transaction.operations[0].value);
            forest.addNullifier(transaction.operations[0].nullifier);
        }
    }

    function revealCommitment(Transaction memory transaction) external {
        require(transaction.inputs.length > 2, "malformed transaction");
        uint256 commitment = transaction.inputs[0].value;
        uint256 salt = transaction.inputs[1].value;
        uint256 secret = transaction.inputs[2].value;
        require(forest.commitmentExists(commitment), "This value was not properly committed to earlier!");
        uint256 hash = uint256(keccak256(abi.encodePacked([salt, secret])));
        require(hash == commitment, "The revealed commitment is incorrect");

        register = UpdateRegister(
            uint(Codes.REVEAL_COMMITMENT),
            abi.encode(secret)
        );
    }
}

