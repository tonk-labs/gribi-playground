/*
 * This file sets up all the definitions required for a MUD client.
 */
import { createSecrets } from "@gribi/mud";

import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { setupNetwork } from "./setupNetwork";

export type SetupResult = Awaited<ReturnType<typeof setup>>;


export async function setup() {
  const network = await setupNetwork();
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network, components);

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
