/*
 * This file sets up all the definitions required for a MUD client.
 */
import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { setupNetwork } from "./setupNetwork";
import { privateState } from "../gribi/state";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup() {
  const network = await setupNetwork();
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network, components);

  //Gribi stuff
  // commenting out so this isn't called over and over again
  // it really doesn't belong here
  // systemCalls.registerModules();

  return {
    privateState,
    network,
    components,
    systemCalls
  };
}
