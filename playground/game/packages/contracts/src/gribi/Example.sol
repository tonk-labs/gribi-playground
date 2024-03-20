// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { BaseThread } from "@gribi/src/BaseThread.sol";
import { Operation, Transaction, PublicInput } from "@gribi/src/Structs.sol";
import { Forest } from "@gribi/src/Forest.sol";

contract Example is BaseThread {
    function getModuleID() public virtual override returns (uint256) {
        return uint256(keccak256(abi.encodePacked("example-module")));
    }

    function test(Transaction memory transaction) external {
        if (transaction.operations.length > 0) {
            forest.addCommitment(transaction.operations[0].value);
        }
    }

    //These are mostly for testing, you'd want to be more careful about what could be read or set from the module contract
    function writePublicInput(PublicInput memory input) external {
        forest.writePublicState(input);
    }

    function getPublicInput(uint256 slot) external view returns (PublicInput memory) {
        return forest.getPublicState(slot);
    }
}
