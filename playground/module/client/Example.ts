import { Vault, NetworkCall, Utils, Gribi, PrivateEntry, Field } from 'gribi-js';
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
    // for x,y location this could be hash of x,y combination
    // we could add arbitrary witnesses argument and allow custom circuits to put into this module
    const createCommitment = async (secret: Field, slot: number) => {
        const salt = Utils.rng() as bigint; 
        const commitment = keccak256(encodePacked(['uint256','uint256'], [salt, secret as bigint]));

        const exampleEntry: ExampleCommitmentEntry = {
            commitment,
            slot,
            value: {
                salt: salt.toString(),
                secret: salt.toString() 
            },
        }

        const ops = [{
            opid: 0,
            value: commitment,
            nullifier: 0,
        }];

        const tx = await Gribi.createGribiTx(
            MODULE_ID,
            "createCommitment",
            [Utils.EmptyInput()],
           ops
        );

        await call(tx);
        Vault.setEntry(Gribi.walletAddress, "example-module", exampleEntry);
    }

    //assume we have a 3rd parameter here that takes a circuit
    const updateCommitment = async (newSecret: Field, slot: number) => {
        const salt = Utils.rng() as bigint; 
        const commitment = keccak256(encodePacked(['uint256','uint256'], [salt, newSecret as bigint]));

        const exampleEntry = Vault.getDataAtSlot(Gribi.walletAddress, "example-module", slot)!;
        exampleEntry.commitment = commitment;

        // this obviously is going to leak information, but all we care about is that we don't know the location
        const ops = [{
            opid: 1,
            value: commitment,
            nullifier: exampleEntry.commitment,
        }]

        const tx = await Gribi.createGribiTx(
            MODULE_ID,
            "updateCommitment",
            [Utils.EmptyInput()],
            ops
        );

        await call(tx);
        Vault.setEntry(Gribi.walletAddress, "example-module", exampleEntry);
    }

    // here it's tricky, because let's say we had committed to x,y locations
    // we need to again shuffle the x,y from the reveal back into public space
    // here we can reveal the hash of the x,y but we also need some way to pass on
    // the witness data (which, I guess is possible as long as it's a Field element)
    const revealCommitment = async (slot: number) => {
        const exampleEntry = Vault.getDataAtSlot(Gribi.walletAddress, "example-module", slot)!;

        const tx = await Gribi.createGribiTx(
            MODULE_ID,
            "revealCommitment",
            [{
                slot: 0,
                value: BigInt(exampleEntry.commitment)
            }, {
                slot: 0,
                value: BigInt(exampleEntry.value.salt)
            }, {
                slot: 0,
                value: BigInt(exampleEntry.value.secret)
            }],
            [Utils.EmptyOp()],
        );

        await call(tx);
        Vault.removeEntry(Gribi.walletAddress, "example-module", exampleEntry);
    }

    return {
        createCommitment,
        revealCommitment
    }

}