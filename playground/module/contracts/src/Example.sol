// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {BaseThread, UpdateRegister} from "@gribi/evm-rootsystem/BaseThread.sol";
import {Transaction, Operation, PublicInput} from "@gribi/evm-rootsystem/Structs.sol";
import {Forest} from "@gribi/evm-rootsystem/Forest.sol";


function (Transaction memory transaction) {
        require(transaction.inputs.length > 2, "malformed transaction");
        salt = transaction.inputs[0].value;
        commitment = transaction.inputs[2].value;
        secret = transaction.inputs[3].value;
        operation = transaction.operations[0];
    }

struct CommitmentTransaction {
    uint256 commitment;
    uint256 salt;
    uint256 secret;
    Operation operation;
}

function transactionToComitmentTrasaction(
    Transaction memory transaction
) pure returns (uint256, uint256, uint256) {
    return (transaction )
}

contract Example is BaseThread {
    Codes codes;

    enum Codes {
        UNSET,
        REVEAL_COMMITMENT
    }
    constructor() {
        codes = new uint[](2);
        codes[uint(Codes.UNSET)] = 1;
        codes[uint(Codes.REVEAL_COMMITMENT)] = 0;
        register = UpdateRegister(uint(Codes.UNSET), bytes(""));
    }

    function getModuleID() public pure virtual override returns (uint256) {
        return uint256(keccak256(abi.encodePacked("example-module")));
    }
    // does this need a else return?
    function parse(UpdateRegister memory ur) public pure returns (uint256) {
        if (ur.code == uint(Codes.REVEAL_COMMITMENT)) {
            return abi.decode(ur.value, (uint256));
        }
    }

    function createCommitment(Transaction memory transaction) external {
        if (transaction.operations.length > 0) {
            require(
                !forest.nullifierExists(transaction.operations[0].value),
                "This commitment has been nullified"
            );
            forest.addCommitment(transaction.operations[0].value);
        }
    }

    function updateCommitment(TransactionBase memory transaction) external {
        if (transaction.operations.length > 0) {
            require(
                !forest.nullifierExists(transaction.operations[0].value),
                "This commitment has been nullified"
            );
            forest.addCommitment(transaction.operations[0].value);
            forest.addNullifier(transaction.operations[0].nullifier);
        }
    }

    function revealCommitment(Transaction memory transaction) external {
        CommitmentTransaction commitemnt = CommitmentTransaction(transaction);
        require(transaction.inputs.length > 2, "malformed transaction");
        uint256 commitment = transaction.inputs[0].value;
        uint256 salt = transaction.inputs[1].value;
        uint256 secret = transaction.inputs[2].value;

        require(
            forest.commitmentExists(commitment.commitemnt),
            "This value was not properly committed to earlier!"
        );
        require(
            !forest.nullifierExists(commitemnt.operation.nullifier),
            "This value was not properly committed to earlier!"
        );
        forest.addNullifier(commitemnt.operation.nullifier);

        uint256 hash = uint256(keccak256(abi.encodePacked([salt, secret])));
        require(hash == commitment, "The revealed commitment is incorrect");

        register = UpdateRegister(
            uint(Codes.REVEAL_COMMITMENT),
            abi.encode(secret)
        );
    }
}
