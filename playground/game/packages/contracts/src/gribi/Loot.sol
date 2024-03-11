// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { BaseThread } from "@gribi/src/BaseThread.sol";
import { Operation, Transaction } from "@gribi/src/Structs.sol";
import { Forest } from "@gribi/src/Forest.sol";

contract Loot is BaseThread {
    function getModuleID() public virtual override returns (uint256) {
        return uint256(keccak256(abi.encodePacked("treasure-module")));
    }
    //keyhash 3030934
    function openBox(Transaction memory transaction) external {
        require(!forest.commitmentExists(transaction.operations[0].value), "the commitment to be added already exists");
        forest.addCommitment(transaction.operations[0].value);
    }
    //keyhash 3034934
    function claimLoot(Transaction memory transaction) external {

    }
    //keyhash 309403402
    function revealLoot(Transaction memory transaction) external {

    }
}