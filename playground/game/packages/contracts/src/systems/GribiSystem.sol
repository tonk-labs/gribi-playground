// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { System } from "@latticexyz/world/src/System.sol";
import { GribiConfig } from "../codegen/index.sol";
import { Gribi } from "@gribi/src/Gribi.sol";
import { Operation, PublicInput, Proof, Transaction } from "@gribi/src/Structs.sol";
import { BaseThread, UpdateRegister } from "@gribi/src/BaseThread.sol";
import { Forest } from "@gribi/src/Forest.sol";

import { Example } from "../gribi/Example.sol"; 
import { MapSystem } from "./MapSystem.sol";


contract GribiSystem is System {
    event Log(string message);
    event LogBytes(bytes data);

    //register the other systems that implement the interface here in this contract
    constructor() {
    }

    function setGribiAddress(address gribiAddress) public {
        GribiConfig.set(gribiAddress);
    }

    function registerModules(address gribiAddress) public {
        Gribi gribi = Gribi(gribiAddress);
        BaseThread[] memory threads = new BaseThread[](1);

        //TODO: Register your module here
        threads[0] = new Example();
        gribi.registerThreads(threads);
    }

    function handleReturnValues(BaseThread thread) private {
        // ReturnStack st = thread.getReturnValue(0);
        UpdateRegister reg = thread.peekUpdates();
        bytes32 player = addressToEntityKey(address(_msgSender()));

        // this is revealCommitment
        if (reg.status == Example.Codes.CREATE_COMMITMENT) {
            //set the MUD table here for player key
            uint256 secret = abi.decode(reg.value, uint256);

            //do something with that secret
        }
        
        // If I need to use some return value I can add it here
    }

    function execute(uint256 id, bytes memory data) public {
        Gribi gribi = Gribi(address(GribiConfig.get()));
        BaseThread thread = gribi.execute(id, data);
        handleReturnValues(thread);
    }

    function execute(uint256 id, bytes memory data, Proof memory proof) public {
        Gribi gribi = Gribi(address(GribiConfig.get()));
        BaseThread thread = gribi.execute(id, data);
        handleReturnValues(thread);
    }

}