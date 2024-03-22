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
    const createCommitment = async (secret: Field) => {
        const salt = Utils.rng() as bigint;
        const commitment = keccak256(encodePacked(['uint256', 'uint256'], [salt, secret as bigint]));

        console.log("commitment", commitment);

        const exampleEntry: ExampleCommitmentEntry = {
            commitment,
            slot: 1,
            value: {
                salt: salt.toString(),
                secret: secret.toString()
            },
        }

        const ops = [{
            opid: 0,
            value: commitment,
            nullifier: 0,
        }];

        console.log("ops", ops);

        const tx = await Gribi.createGribiTx(
            MODULE_ID,
            "createCommitment",
            [Utils.EmptyInput()],
            ops
        );

        console.log("gribi tx", tx);

        // TODO: this is failing 
        await call(tx);

        console.log("gribi tx success")
        Vault.setEntry(Gribi.walletAddress, "example-module", exampleEntry);

        console.log("create commitment success")
    }

    const revealCommitment = async (): Promise<{ x: number, y: number }> => {
        const exampleEntry = Vault.getDataAtSlot(Gribi.walletAddress, "example-module", 1)!;

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

        console.log("reveal tx", tx);
        console.log("reveal tx vault entry", exampleEntry)

        await call(tx);
        Vault.removeEntry(Gribi.walletAddress, "example-module", exampleEntry);

        const y = parseInt(exampleEntry.value.secret) % 100;
        const x = (parseInt(exampleEntry.value.secret) - y) / 100;
        console.log("reveal commitment success", x, y);

        return { x, y };
    }

    return {
        createCommitment,
        revealCommitment
    }

}