import { Vault, Module, NetworkCall, Forest, Utils, Gribi, KernelCircuit, PrivateEntry, PublicInput, Operation, Proof, Transaction } from 'gribi-js';
import { keccak256, toHex } from 'viem';
// import ClaimLoot from '../../../circuits/claimLoot/target/claimLoot.json';
// import RevealLoot from '../../../circuits/revealLoot/target/revealLoot.json';

const MODULE_ID = BigInt(keccak256(toHex("example-module")));

export type ModuleCalls = ReturnType<typeof createModuleCalls>;

export function createModuleCalls(call: NetworkCall) {
    const test = async () => {
        const ops = [{
            opid: 0,
            value: 1,
            nullifier: 0,
        }];

        const tx = await Gribi.createGribiTx(
            MODULE_ID,
            "test",
            [{ slot: 0, value: 0}],
           ops 
        );
        await call(tx);
    }

    return {
        test
    }
}