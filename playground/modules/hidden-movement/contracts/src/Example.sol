// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { BaseThread, UpdateRegister } from "@gribi/evm-rootsystem/BaseThread.sol";
import { Transaction, Operation, PublicInput } from "@gribi/evm-rootsystem/Structs.sol";
import { Forest } from "@gribi/evm-rootsystem/Forest.sol";

contract Example is BaseThread {
    enum Codes { UNSET, SAMPLE }
    constructor() {
        codes = new uint[](2);
        codes[uint(Codes.UNSET)] = 0;
        codes[uint(Codes.SAMPLE)] = 0;
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

    function revealCommitment(Transaction memory transaction) external {
        // Manually perform checks using forest

        // Set return values for linked frameworks
        // register = UpdateRegister(
        //     uint(Codes.SAMPLE),
        //     abi.encode(data)
        // );
    }
}
