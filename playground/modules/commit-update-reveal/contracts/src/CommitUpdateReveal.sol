// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { BaseThread, UpdateRegister } from "@gribi/evm-rootsystem/BaseThread.sol";
import { Transaction, Operation, PublicInput } from "@gribi/evm-rootsystem/Structs.sol";
import { Forest } from "@gribi/evm-rootsystem/Forest.sol";

contract CommitUpdateReveal is BaseThread {
    enum Codes { UNSET, REVEAL_COMMITMENT }
    constructor() {
        codes = new uint[](2);
        codes[uint(Codes.UNSET)] = 0;
        codes[uint(Codes.REVEAL_COMMITMENT)] = 0;
        register = UpdateRegister(uint(Codes.UNSET), bytes(""));
    }

    function getModuleID() public virtual pure override returns (uint256) {
        return uint256(keccak256(abi.encodePacked("example-module")));
    }

    function parse(UpdateRegister memory ur) public pure returns (uint256) {
        if (ur.code == uint(Codes.REVEAL_COMMITMENT)) {
            return abi.decode(ur.value, (uint256));
        }
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
        require(!forest.nullifierExists(transaction.operations[0].nullifier), "This value was not properly committed to earlier!");
        forest.addNullifier(transaction.operations[0].nullifier);

        //TODO: actually implement 
        uint256 hash = uint256(keccak256(abi.encodePacked([salt, secret])));
        require(hash == commitment, "The revealed commitment is incorrect");

        register = UpdateRegister(
            uint(Codes.REVEAL_COMMITMENT),
            abi.encode(secret)
        );
    }
}
