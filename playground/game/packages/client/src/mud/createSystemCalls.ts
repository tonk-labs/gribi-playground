import { Has, HasValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Module, NetworkCall, Transaction } from "gribi-js";
 
export type SystemCalls = ReturnType<typeof createSystemCalls>;

import Modules from "../gribi";

export function createSystemCalls(
  { playerEntity, worldContract, waitForTransaction }: SetupNetworkResult,
  { Encounter, MapConfig, MonsterCatchAttempt, Obstruction, Player, Position }: ClientComponents
) {
  /**
   * GRIBI Stuff
   */
  const registerModules = async () => {
    // what is this address?
    const tx = await worldContract.write.registerModules(['0x5424592c50E08DF0023b3ffFdb396670643274CE']);
    await waitForTransaction(tx);
  }

  const mudCall: NetworkCall = async (transaction: Transaction) => {
    let tx;
    if (transaction.proof) {
      tx = await worldContract.write.execute([transaction.id, transaction.data, transaction.proof]);
    } else {
      tx = await worldContract.write.execute([transaction.id, transaction.data]);
    }
    await waitForTransaction(tx);
  };

  function combineGribiModuleCalls<T>(modules: Module<T>[]): T {
    return modules.map((module) => module.createModuleCalls(mudCall)).reduce((acc, value) => {
      return {
        ...acc,
        ...value
      }
    }, {} as T);
  } 

  /**
   * Here's the rest of your SystemCall Code 
   */

  const wrapPosition = (x: number, y: number) => {
    const mapConfig = getComponentValue(MapConfig, singletonEntity);
    if (!mapConfig) {
      throw new Error("mapConfig no yet loaded or initialized");
    }
    return [(x + mapConfig.width) % mapConfig.width, (y + mapConfig.height) % mapConfig.height];
  };
 
  const isObstructed = (x: number, y: number) => {
    return runQuery([Has(Obstruction), HasValue(Position, { x, y })]).size > 0;
  };
 
  const moveBy = async (deltaX: number, deltaY: number) => {
    if (!playerEntity) {
      throw new Error("no player");
    }
 
    const inEncounter = !!getComponentValue(Encounter, playerEntity);
    if (inEncounter) throw new error("cannot move during encounter");
 
    const playerPosition = getComponentValue(Position, playerEntity);
    if (!playerPosition) {
      console.warn("cannot moveBy without a player position, not yet spawned?");
      return;
    }
 
    let newX = playerPosition.x + deltaX;
    let newY = playerPosition.y + deltaY;
    [newX, newY] = wrapPosition(newX, newY);
 
    if (isObstructed(newX, newY)) throw new Error("cannot go into an obstructed space");
 
    const tx = await worldContract.write.moveBy([playerPosition.x, playerPosition.y, deltaX, deltaY]);
    await waitForTransaction(tx);
  };

  const getPlayerPosition = async () => {
    if (!playerEntity) {
      throw new Error("no player");
    }
 
    const position = getComponentValue(Position, playerEntity);
    if (!position) {
      throw new Error("no position found");
    }
 
    return position;
  };
 
  const spawn = async (x: number, y: number) => {
    if (!playerEntity) {
      throw new Error("no player");
    }
 
    const canSpawn = getComponentValue(Player, playerEntity)?.value !== true;
    if (!canSpawn) {
      throw new Error("already spawned");
    }
 
    [x, y] = wrapPosition(x, y);
 
    if (isObstructed(x, y)) {
      console.warn("cannot spawn on obstructed space");
      return;
    }
 
    const tx = await worldContract.write.spawn([x, y]);
    await waitForTransaction(tx);
  };
 
  const throwBall = async () => {
    const player = playerEntity;
    if (!player) {
      throw new Error("no player");
    }
 
    const encounter = getComponentValue(Encounter, player);
    if (!encounter) {
      throw new Error("no encounter");
    }
 
    const tx = await worldContract.write.throwBall([]);
    await waitForTransaction(tx);
 
    const catchAttempt = getComponentValue(MonsterCatchAttempt, player);
    if (!catchAttempt) {
      throw new Error("no catch attempt found");
    }
 
    return catchAttempt.result as MonsterCatchResult;
  };
 
  const fleeEncounter = async () => {
    const tx = await worldContract.write.flee([]);
    await waitForTransaction(tx);
  };
 
  // what is this struct
  return {
    registerModules,
    moveBy,
    getPlayerPosition,
    spawn,
    throwBall,
    fleeEncounter,
    ...combineGribiModuleCalls(Modules),
  };
}

