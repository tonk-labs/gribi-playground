import { NetworkCall, Selector } from '@gribi/mud';
import { WitnessRelation } from '@gribi/types'; 
import { EVMRootSystem } from '@gribi/evm-rootsystem';
import { Vault, Utils, PrivateEntry } from '@gribi/vault';
import { 
    Commitment,
    CreateCommitment,
    CreateCommitmentReceptor,
    MODULE_ID,
    RevealCommitment,
    StoredCommitment,
    UpdateCommitment,
    UpdateCommitmentReceptor
} from 'example-gribi-module';

export type ModuleCalls = ReturnType<typeof createModuleCalls>;

export function createModuleCalls(call: NetworkCall) {

    const createCommitment = async (secret: number) => {
        const salt = Utils.rng() as bigint;
        const witness = await new CreateCommitment().bond({
            secret, 
            salt,
        });

        const entry = {
            slot: 0,
            value: witness
        }

        const signal = await new CreateCommitmentReceptor().signal(witness);
        const txs = await EVMRootSystem.createTxs([signal]);
        await Promise.all(txs.map(async (tx) => await call(tx)));
        Vault.setEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    const updateCommitment = async (newSecret: number) => {
        const salt = Utils.rng() as bigint;
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment[], StoredCommitment>>;
        const witness = await new UpdateCommitment().bond({
            relation: entry.value, 
            secret: newSecret,
            salt,
        });

        const signal = await new UpdateCommitmentReceptor().signal({
            relation: witness,
            secret: newSecret,
            salt
        });

        entry.value = witness;
        const txs = await EVMRootSystem.createTxs([signal]);
        await Promise.all(txs.map(async (tx) => await call(tx)));
        Vault.setEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    const revealCommitment = async () => {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment[], StoredCommitment>>;
        const signal = await new RevealCommitment().signal(entry.value);
        const txs = await EVMRootSystem.createTxs([signal]);
        await Promise.all(txs.map(async (tx) => await call(tx)));
        Vault.removeEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    return {
        createCommitment,
        updateCommitment,
        revealCommitment
    }
}

export class CommitSelector implements Selector {
    select(): number | null  {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment[], StoredCommitment>>;
        if (!entry) {
            return null;
        } else {
            return entry.value.witness.secret.slice(-1)[0] as number;
        }
    }
}
