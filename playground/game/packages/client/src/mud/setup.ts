/*
 * This file sets up all the definitions required for a MUD client.
 */
// import { createSecrets } from "gribi-mud";

import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { setupNetwork } from "./setupNetwork";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

import { Vault } from "gribi-js";

export const createSecrets = async (activeAddress: () => string) => {
  // we have the random commitment + random number
  // we have the inventory of treasure with the commitment to that treasure item
  // we have a nullifier & nonce used to eliminate that treasure item

  //Maybe here we could actually use the selectors? Since the entries kind of suck
  return { ...Vault.getModules(activeAddress()) }
}

export async function setup() {
  const network = await setupNetwork();
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network, components);

  // clean up vaults from previous runs
  console.log("Clearing storage from previous runs")
  Vault.clearStorage();
  console.log("Storage cleared")

  //Gribi stuff
  systemCalls.registerModules();
  const getWalletAddress = () => {
    return network.walletClient.account.address;
  };
  const vault = createSecrets(getWalletAddress);
  

  return {
    vault,
    network,
    components,
    systemCalls
  };
}
