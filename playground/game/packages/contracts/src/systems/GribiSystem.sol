// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { System } from "@latticexyz/world/src/System.sol";
import { GribiConfig } from "../codegen/index.sol";
import { Gribi } from "@gribi/src/Gribi.sol";
import { Operation, PublicInput, Proof, Transaction } from "@gribi/src/Structs.sol";
import { BaseThread } from "@gribi/src/BaseThread.sol";
import { Forest } from "@gribi/src/Forest.sol";

import { Loot } from "../gribi/Loot.sol"; 

contract GribiSystem is System {
    function registerModules() public {
        Gribi gribi = Gribi(GribiConfig.get());
        BaseThread[] memory threads = new BaseThread[](1);
        threads[0] = BaseThread(new Loot());
        gribi.registerThreads(threads);
    }

    //TODO two options for public inputs are...
    //1) have things in public tree, use channel to sync state between MUD and Gribi
    //2) pass along keys for MUD public values and fetch them from special Gribi:namespace table

    function call(uint256 id, bytes calldata data) public {
        Gribi gribi = Gribi(GribiConfig.get());
        //find the module
        BaseThread thread = gribi.getThread(id);

        //if the proof passes, shuffle along the inputs and ops to the function of the module
        address(thread).call(data);
    }
    function call(uint256 id, bytes calldata data, Proof calldata proof) public {
        Gribi gribi = Gribi(GribiConfig.get());
        //find the module
        BaseThread thread = gribi.getThread(id);

        //TODO:
        //if there is a proof, verify it
        //(and feed the key_hash in from the tree for function id from that module)
        //(along with roots of the module)

        //if the proof passes, shuffle along the inputs and ops to the function of the module
        address(thread).call(data);
        //the module will have access to codegen bits of MUD and ideally would want to build with those in mind
        //however, that's tough, so I think instead what we do is just have the module only use it's internal memory
        //if someone wants to integrate that internal memory into MUD they can do so easily by using some kind of hook mechanism
        //then when it comes to reading from the client, we can write a module (in long term), but in short term just read from Gribi directly (I guess prob easiest thing)
        //the alternative is having the whole fake tree live in MUD
        //...can think about those alternatives
        //TODO: implement hook mechanism
    }
}