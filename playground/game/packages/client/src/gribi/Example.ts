import { PrivateEntry } from '@gribi/vault';
import { NetworkCall } from '@gribi/mud';
import { keccak256, toHex, encodePacked } from 'viem';
// import ClaimLoot from '../../../circuits/claimLoot/target/claimLoot.json';
// import RevealLoot from '../../../circuits/revealLoot/target/revealLoot.json';

const MODULE_ID = BigInt(keccak256(toHex("example-module")));

export type ModuleCalls = ReturnType<typeof createModuleCalls>;

type ExampleValue = {
    salt: string,
    secret: string 
}

interface ExampleCommitmentEntry extends PrivateEntry {
    value: ExampleValue
}

export function createModuleCalls(call: NetworkCall) {

    return {
        // createCommitment,
        // revealCommitment
    }

}