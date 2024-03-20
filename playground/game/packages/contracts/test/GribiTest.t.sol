// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Gribi } from "@gribi/src/Gribi.sol";
import { PublicInput, Operation, Transaction } from "@gribi/src/Structs.sol";
import { GribiConfig } from "../src/codegen/index.sol";


contract GribiTests is MudTest {

  function testWorldExists() public {
    uint256 codeSize;
    address addr = worldAddress;
    assembly {
      codeSize := extcodesize(addr)
    }
    assertTrue(codeSize > 0);
  }

  function testGribi() public {
    Gribi gribi = new Gribi(keccak256(abi.encodePacked("1.0.0")));
    // GribiConfig.set(address(gribi));

    IWorld(worldAddress).registerModules(address(gribi));
    IWorld(worldAddress).setGribiAddress(address(gribi));
    // // Expect task to exist that we created during PostDeploy script
    // TasksData memory task = Tasks.get("1");
    // assertEq(task.description, "Walk the dog");
    // assertEq(task.completedAt, 0);

    uint256 id = uint256(keccak256(abi.encodePacked("example-module")));
    PublicInput[] memory inputs = new PublicInput[](1);
    inputs[0] = PublicInput(0,0);
    Operation[] memory operations = new Operation[](1);
    operations[0] = Operation(0,1, 0);
    Transaction memory transaction = Transaction(
      inputs,
      operations
    );

    console.log("Creating signature");
    bytes4 signature = bytes4(keccak256(bytes(
        string(abi.encodePacked("createCommitment(((uint256,uint256)[],(uint256,uint256,uint256)[])"))
    )));

    console.log("encoding transactions");
    bytes memory params = abi.encode(transaction);
    console.log("forming the data");
    bytes memory data = bytes.concat(signature, params);


    console.log("executing the call");
    IWorld(worldAddress).execute(id, data);

    // // Expect the task to be completed after calling completeTask from our TasksSystem
    // IWorld(worldAddress).completeTask("1");
    // assertEq(Tasks.getCompletedAt("1"), block.timestamp);
  }
}